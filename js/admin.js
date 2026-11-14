const client = window.supabaseClient;

const loginPanel = document.getElementById("loginPanel");
const dashboard = document.getElementById("dashboard");
const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");
const adminStatus = document.getElementById("adminStatus");
const appForm = document.getElementById("appForm");
const appMessage = document.getElementById("appMessage");
const appsContainer = document.getElementById("adminApps");
const saveBtn = document.getElementById("saveBtn");
const cancelEdit = document.getElementById("cancelEdit");

const iconInput = document.getElementById("appIcon");
const iconPreviewBox = document.getElementById("iconPreviewBox");
const iconPreview = document.getElementById("iconPreview");
const iconPreviewMessage = document.getElementById("iconPreviewMessage");

function isValidWebUrl(value) {
    if (!value) return true;
    try {
        const url = new URL(value);
        return url.protocol === "https:" || url.protocol === "http:";
    } catch {
        return false;
    }
}

function updateIconPreview() {
    const value = iconInput.value.trim();

    if (!value) {
        iconPreviewBox.hidden = true;
        return;
    }

    if (!isValidWebUrl(value)) {
        iconPreviewBox.hidden = false;
        iconPreview.removeAttribute("src");
        iconPreviewMessage.textContent = "Enter a valid HTTP or HTTPS image URL.";
        return;
    }

    iconPreviewBox.hidden = false;
    iconPreviewMessage.textContent = "Loading preview...";

    iconPreview.onload = () => {
        iconPreviewMessage.textContent = "Image preview loaded.";
    };

    iconPreview.onerror = () => {
        iconPreviewMessage.textContent = "Image could not be loaded. Check the URL.";
    };

    iconPreview.src = value;
}

iconInput.addEventListener("input", updateIconPreview);


function showLogin(message = "Login with your authorized admin account.") {
    loginPanel.hidden = false;
    dashboard.hidden = true;
    loginMessage.textContent = message;
}

function showDashboard() {
    loginPanel.hidden = true;
    dashboard.hidden = false;
}

async function verifyAdmin() {
    if (!client) {
        showLogin("Supabase client is not available. Check your connection.");
        return;
    }

    const { data: sessionData, error: sessionError } =
        await client.auth.getSession();

    if (sessionError || !sessionData.session) {
        showLogin();
        return;
    }

    const user = sessionData.session.user;

    const { data: roleData, error: roleError } = await client
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

    if (roleError || !roleData || roleData.role !== "admin") {
        await client.auth.signOut();
        showLogin("This account does not have admin access.");
        return;
    }

    showDashboard();
    adminStatus.textContent = "Logged in as authorized admin: " + user.email;
    await loadApps();
}

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    loginMessage.textContent = "Signing in...";

    const email = document.getElementById("adminEmail").value.trim();
    const password = document.getElementById("adminPassword").value;

    const { error } = await client.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        loginMessage.textContent = "Login failed: " + error.message;
        return;
    }

    await verifyAdmin();
});

document.getElementById("logoutBtn").addEventListener("click", async () => {
    await client.auth.signOut();
    appForm.reset();
    showLogin("You have logged out.");
});

async function loadApps() {
    appsContainer.textContent = "Loading apps...";

    const { data, error } = await client
        .from("apps")
        .select("id,name,category,version,description,icon_url,download_url,screenshots")
        .order("created_at", { ascending: false });

    if (error) {
        appsContainer.textContent = "Could not load apps: " + error.message;
        return;
    }

    appsContainer.replaceChildren();

    if (!data.length) {
        appsContainer.textContent = "No apps added yet.";
        return;
    }

    data.forEach((app) => {
        const card = document.createElement("div");
        card.className = "admin-app-item";

        const title = document.createElement("h3");
        title.textContent = app.name;

        const details = document.createElement("p");
        details.textContent =
            (app.category || "Uncategorized") + " • Version " +
            (app.version || "Not specified");

        const edit = document.createElement("button");
        edit.type = "button";
        edit.className = "admin-secondary";
        edit.textContent = "Edit";
        edit.addEventListener("click", () => editApp(app));

        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "admin-secondary";
        remove.textContent = "Delete";
        remove.addEventListener("click", () => deleteApp(app.id, app.name));

        card.append(title, details, edit, remove);
        appsContainer.appendChild(card);
    });
}

function editApp(app) {
    document.getElementById("appId").value = app.id;
    document.getElementById("appName").value = app.name || "";
    document.getElementById("appCategory").value = app.category || "";
    document.getElementById("appVersion").value = app.version || "";
    document.getElementById("appIcon").value = app.icon_url || "";
    document.getElementById("appDescription").value = app.description || "";
    document.getElementById("downloadLink").value = app.download_url || "";
    document.getElementById("appScreenshots").value =
        (app.screenshots || []).join("\n");
    updateIconPreview();

    document.getElementById("formTitle").textContent = "Edit App";
    saveBtn.textContent = "Update App";
    cancelEdit.hidden = false;
    appMessage.textContent = "Editing: " + app.name;
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetAppForm() {
    appForm.reset();
    document.getElementById("appId").value = "";
    iconPreviewBox.hidden = true;
    iconPreview.removeAttribute("src");
    document.getElementById("formTitle").textContent = "Add New App";
    saveBtn.textContent = "Save App";
    cancelEdit.hidden = true;
}

cancelEdit.addEventListener("click", resetAppForm);

appForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    saveBtn.disabled = true;
    appMessage.textContent = "Saving app...";

    const appId = document.getElementById("appId").value;

    const appData = {
        name: document.getElementById("appName").value.trim(),
        category: document.getElementById("appCategory").value,
        version: document.getElementById("appVersion").value.trim(),
        icon_url: document.getElementById("appIcon").value.trim() || null,
        description: document.getElementById("appDescription").value.trim(),
        download_url: document.getElementById("downloadLink").value.trim() || null,
        screenshots: document.getElementById("appScreenshots").value
            .split("\n")
            .map(url => url.trim())
            .filter(Boolean)
    };

    if (!appData.name || !appData.category) {
        appMessage.textContent = "App name and category are required.";
        saveBtn.disabled = false;
        return;
    }

    if (
        !isValidWebUrl(appData.icon_url) ||
        !isValidWebUrl(appData.download_url) ||
        !appData.screenshots.every(isValidWebUrl)
    ) {
        appMessage.textContent = "Please enter valid HTTP or HTTPS URLs.";
        saveBtn.disabled = false;
        return;
    }

    let result;

    if (appId) {
        result = await client.from("apps").update(appData).eq("id", appId);
    } else {
        result = await client.from("apps").insert(appData);
    }

    saveBtn.disabled = false;

    if (result.error) {
        appMessage.textContent = "Save failed: " + result.error.message;
        return;
    }

    appMessage.textContent = appId ? "App updated successfully." : "App added successfully.";
    resetAppForm();
    await loadApps();
});

async function deleteApp(id, name) {
    if (!confirm("Delete " + name + "?")) return;

    const { error } = await client.from("apps").delete().eq("id", id);

    if (error) {
        appMessage.textContent = "Delete failed: " + error.message;
        return;
    }

    appMessage.textContent = "App deleted successfully.";
    await loadApps();
}

verifyAdmin();
