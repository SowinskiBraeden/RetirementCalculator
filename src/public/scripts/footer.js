const factButton = document.getElementById("factButton");
const factMenu = document.getElementById("factMenu");
const factInput = document.getElementById("factInput");
const factSubmitButton = document.getElementById("factSubmitButton");

factButton.addEventListener("click", () => {
    factMenu.classList.toggle("hidden");
});
factSubmitButton.addEventListener("click", () => {
    fetch("/fact", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            fact: factInput.value,
        }),
    })
    .then(response => response.json())
    .then(data => {
        Swal.fire('Here is a fact!', data.fact, 'success');
    })
    .catch(error => {
        console.error("Error fetching fact:", error);
        Swal.fire('Error fetching fact', 'Please try again later', 'error');
    });
});

document.addEventListener("DOMContentLoaded", () => {
    const drawer = document.getElementById("drawer-navigation");
    const toggle = document.getElementById("drawer-toggle");

    function openDrawer() {
        drawer.classList.remove("translate-x-full");

        // Add backdrop
        const backdrop = document.createElement("div");
        backdrop.className = "fixed inset-0 bg-gray-900/50 z-30 drawer-backdrop";
        document.body.appendChild(backdrop);

        // Optional: prevent scroll
        document.body.classList.add("overflow-hidden");

        backdrop.addEventListener("click", closeDrawer);
    }

    function closeDrawer() {
        drawer.classList.add("translate-x-full");

        const backdrop = document.querySelector(".drawer-backdrop");
        if (backdrop) backdrop.remove();

        document.body.classList.remove("overflow-hidden");
    }

    toggle.addEventListener("click", openDrawer);

    // Also close on X button if needed
    const closeBtn = drawer.querySelector("[data-drawer-hide]");
    if (closeBtn) {
        closeBtn.addEventListener("click", closeDrawer);
    }
});