/**
 * editPlan redirect
 * @param {string} planId
 */
function editPlan(planId) {
    if (planId) {
        window.location.href = `/plans/${planId}/edit`;
    } else {
        console.error('editPlan called without a planId');
        alert('Cannot edit plan: Plan ID is missing.');
    }
}

/**
 * deletePlan handler
 * @param {string} planId
 */
async function deletePlan(planId) {
    if (!planId) {
        console.error('deletePlan called without a planId');
        alert('Cannot delete plan: Plan ID is missing.');
        return;
    }

    if (confirm('Are you sure you want to delete this plan? This action cannot be undone.')) {
        try {
            const response = await fetch(`/plans/${planId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (response.ok && result.success) {
                alert('Plan deleted successfully.');
                window.location.href = '/plans'; // Redirect to the plans list page
            } else {
                alert(`Failed to delete plan: ${result.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error deleting plan:', error);
            alert('An error occurred while trying to delete the plan. Please check the console for details and ensure the server is running.');
        }
    }
}
