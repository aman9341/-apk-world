const params = new URLSearchParams(window.location.search);
const appId = params.get("id");
const client = window.supabaseClient;

async function loadAppDetails() {
    const name = document.getElementById("appName");
    const description = document.getElementById("appDescription");

    if (!client || !appId) {
        name.textContent = "App not found";
        description.textContent = "App details could not be loaded.";
        return;
    }

    const { data: app, error } = await client
        .from("apps")
        .select("*")
        .eq("id", appId)
        .single();

    if (error || !app) {
        console.error("Details loading error:", error);
        name.textContent = "App not found";
        description.textContent = "This app could not be found.";
        return;
    }

    document.title = app.name + " | MOD APK WORLD";
    name.textContent = app.name;

    const iconBox = document.getElementById("appIcon");
    iconBox.innerHTML = "";

    if (app.icon_url && /^https?:\/\//i.test(app.icon_url)) {
        const img = document.createElement("img");
        img.src = app.icon_url;
        img.alt = app.name + " icon";
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.objectFit = "cover";
        img.style.borderRadius = "inherit";
        iconBox.appendChild(img);
    } else {
        iconBox.textContent = "APP";
    }
    document.getElementById("appCategory").textContent = app.category || "Other";
    document.getElementById("appRating").textContent = "★ " + (app.rating || "N/A");
    description.textContent = app.description || "No description available.";
    document.getElementById("appVersion").textContent =
        "Version: " + (app.version || "N/A");

    const gallery = document.getElementById("appScreenshotsGallery");
    gallery.replaceChildren();

    (app.screenshots || []).forEach((url) => {
        if (!/^https?:\/\//i.test(url)) return;

        const img = document.createElement("img");
        img.src = url;
        img.alt = app.name + " screenshot";
        img.loading = "lazy";
        gallery.appendChild(img);
    });

    if (!gallery.children.length) {
        gallery.textContent = "No screenshots available.";
    }

    const button = document.getElementById("downloadButton");

    if (app.download_url) {
        button.href = app.download_url;
        button.target = "_blank";
        button.rel = "noopener noreferrer";
        button.textContent = "Open Download Link";
        button.classList.remove("disabled");
        button.removeAttribute("aria-disabled");
    } else {
        button.removeAttribute("href");
        button.textContent = "No download link available";
        button.classList.add("disabled");
        button.setAttribute("aria-disabled", "true");
    }
}

loadAppDetails();
