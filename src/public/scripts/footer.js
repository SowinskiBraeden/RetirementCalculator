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