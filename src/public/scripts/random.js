document.addEventListener("DOMContentLoaded", () => {
    const number = document.querySelectorAll(".planGoal");
    number.forEach(value => {
        num = parseFloat(value.textContent);
        if (num >= 999999) {
            value.textContent = (num /= 1000000).toFixed(2) + "M";
            console.log(value.textContent);
        } else if (num > 999) {
            value.textContent = (num /= 1000).toFixed(2) + "K";
        } else {
            return num;
        }
    });
});

