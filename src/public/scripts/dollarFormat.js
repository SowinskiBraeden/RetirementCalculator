/** 
 * Function takes in a number and formats it to currency
 * @param {integer}
 * @returns nuber formatted in currency
 */

document.addEventListener("DOMContentLoaded", () => {
    const number = document.querySelectorAll(".planGoal");
    number.forEach(value => {
        num = parseFloat(value.textContent);
        if (num >= 999999) {
            value.textContent = "$" + (num /= 1000000) + "M";
        } else if (num > 999) {
            value.textContent = "$" + (num /= 1000) + "k";
        } else {
            return "$" + num;
        }
    });
});

