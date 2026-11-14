const client = window.supabaseClient;

const appsList = document.getElementById("appsList");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const categoryButtons = document.querySelectorAll(".category-list button");

let apps = [];
let selectedCategory = "All";

function displayApps(list) {
    appsList.innerHTML = "";

    if (!list.length) {
        appsList.innerHTML = '<p class="loading">No apps found.</p>';
        return;
    }

    list.forEach(app => {
        const card = document.createElement("div");
        card.className = "app-card";

        const iconBox = document.createElement("div");
        iconBox.className = "app-icon";

        if (app.icon_url) {
            const img = document.createElement("img");
            img.src = app.icon_url;
            img.alt = app.name;
            img.style.width = "100%";
            img.style.height = "100%";
            img.style.objectFit = "cover";
            iconBox.appendChild(img);
        } else {
            iconBox.textContent = "APP";
        }

        const info = document.createElement("div");
        info.className = "app-info";

        const title = document.createElement("h4");
        title.textContent = app.name;

        const category = document.createElement("p");
        category.textContent =
            (app.category || "Other") + " • Version " + (app.version || "N/A");

        const rating = document.createElement("p");
        rating.textContent = "★ " + (app.rating || "N/A");

        const details = document.createElement("button");
        details.className = "details-btn";
        details.textContent = "Details";

        details.addEventListener("click", () => {
            window.location.href =
                "details.html?id=" + encodeURIComponent(app.id);
        });

        info.append(title, category, rating);
        card.append(iconBox, info, details);
        appsList.appendChild(card);
    });
}

function filterApps() {
    const query = searchInput.value.toLowerCase().trim();

    const filtered = apps.filter(app => {
        const name = (app.name || "").toLowerCase();
        const category = (app.category || "").toLowerCase();

        return (
            (name.includes(query) || category.includes(query)) &&
            (selectedCategory === "All" || app.category === selectedCategory)
        );
    });

    displayApps(filtered);
}

async function loadApps() {
    if (!client) {
        appsList.textContent = "Database connection not available.";
        return;
    }

    appsList.innerHTML = '<p class="loading">Loading apps...</p>';

    const { data, error } = await client
        .from("apps")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Apps loading error:", error);
        appsList.textContent = "Could not load apps. Please try again.";
        return;
    }

    apps = data || [];
    filterApps();
}

if (searchBtn) searchBtn.addEventListener("click", filterApps);
if (searchInput) searchInput.addEventListener("input", filterApps);

categoryButtons.forEach(button => {
    button.addEventListener("click", () => {
        selectedCategory = button.textContent.trim();
        categoryButtons.forEach(btn => btn.classList.remove("active"));
        button.classList.add("active");
        filterApps();
    });
});

loadApps();
