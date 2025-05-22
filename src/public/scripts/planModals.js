document.addEventListener('DOMContentLoaded', () => {
    const openModalBtn = document.getElementById('openNewPlanModalBtn');
    const newPlanDialog = document.getElementById('newPlanDialog');
    const newPlanForm = document.getElementById('newPlanForm');
    const submitNewPlanBtn = document.getElementById('submitNewPlanBtn');
    const newPlanError = document.getElementById('newPlanError');
    const resetNewPlanFormBtn = document.getElementById('resetNewPlanFormBtn');

    let url = new URLSearchParams(window.location.search);
    let modalValue = url.get('openModal');

    if (modalValue === 'true') {
        newPlanDialog.showModal();
    }

    openModalBtn.addEventListener('click', () => {
        newPlanDialog.showModal();
        // Error reset is now handled by 'close' event, but good to clear on open too
        newPlanError.style.display = 'none'; 
        newPlanError.textContent = '';
    });

    // Handles form reset and error clearing when dialog is closed by any means (Esc, Cancel button, backdrop click, successful submit)
    newPlanDialog.addEventListener('close', () => {
        newPlanForm.reset();
        newPlanError.style.display = 'none';
        newPlanError.textContent = '';
    });

    // Close dialog if user clicks on the backdrop
    newPlanDialog.addEventListener('click', (event) => {
        if (event.target === newPlanDialog) {
            newPlanDialog.close(); // This will trigger the 'close' event listener above
        }
    });

    resetNewPlanFormBtn.addEventListener('click', () => {
        newPlanForm.reset();
        newPlanError.style.display = 'none';
        newPlanError.textContent = '';
    });

    newPlanForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        submitNewPlanBtn.disabled = true;
        submitNewPlanBtn.textContent = 'Saving...';
        newPlanError.style.display = 'none';

        const formData = new FormData(newPlanForm);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/newPlan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    newPlanDialog.close(); // This will trigger the 'close' event listener
                    window.location.reload(); // Reload to see the new plan
                } else {
                    newPlanError.textContent = result.message || 'Failed to create plan. Please try again.';
                    newPlanError.style.display = 'block';
                }
            } else {
                const errorData = await response.json();
                newPlanError.textContent = errorData.message || `Error: ${response.status} - ${response.statusText}`;
                newPlanError.style.display = 'block';
            }
        } catch (error) {
            console.error('Error submitting new plan:', error);
            newPlanError.textContent = 'An unexpected error occurred. Please try again.';
            newPlanError.style.display = 'block';
        }
        finally {
            submitNewPlanBtn.disabled = false;
            submitNewPlanBtn.textContent = 'Save Plan';
        }
    });
});