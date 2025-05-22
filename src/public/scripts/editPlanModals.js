// Basic client-side form submission handler to process JSON response
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('editPlanForm');
    const errorMessagesDiv = document.getElementById('formErrorMessages');

    // Store initial form values
    const initialValues = {
        name: form.name.value,
        retirementAge: form.retirementAge.value,
        retirementExpenses: form.retirementExpenses.value,
        retirementAssets: form.retirementAssets.value,
        retirementLiabilities: form.retirementLiabilities.value
    };

    const resetButton = document.getElementById('resetButton');
    resetButton.addEventListener('click', function() {
        form.name.value = initialValues.name;
        form.retirementAge.value = initialValues.retirementAge;
        form.retirementExpenses.value = initialValues.retirementExpenses;
        form.retirementAssets.value = initialValues.retirementAssets;
        form.retirementLiabilities.value = initialValues.retirementLiabilities;
        if (errorMessagesDiv) {
            errorMessagesDiv.style.display = 'none'; // Hide error message on reset
            errorMessagesDiv.textContent = '';
        }
    });

    if (form) {
        form.addEventListener('submit', async function(event) {
            event.preventDefault(); // Prevent traditional form submission
            errorMessagesDiv.textContent = '';
            errorMessagesDiv.style.display = 'none';

            const formData = new FormData(form);
            const data = {};
            formData.forEach((value, key) => {
                data[key] = value;
            });

            try {
                const response = await fetch(form.action, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data),
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    const actionUrl = form.action;
                    const urlParts = actionUrl.split('/');
                    const planId = urlParts[urlParts.length - 2];
                    window.location.href = `/plans/${planId}`;
                } else {
                    errorMessagesDiv.textContent = result.message || 'An error occurred while updating the plan.';
                    errorMessagesDiv.style.display = 'block';
                }
            } catch (error) {
                console.error('Error submitting form:', error);
                errorMessagesDiv.textContent = 'A network error occurred. Please try again.';
                errorMessagesDiv.style.display = 'block';
            }
        });
    }
});