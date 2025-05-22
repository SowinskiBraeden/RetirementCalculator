const ObjectId = require('mongodb').ObjectId;

async function calculatePlanProgress(plans, assets, userId) {
    if (!plans || typeof plans.retirementAssets === 'undefined') {
        console.error("Invalid plan document provided to calculatePlanProgress:", plans);
        return 0;
    }
    if (!assets || typeof assets.find !== 'function') {
        console.error("Invalid assetsCollection provided to calculatePlanProgress");
        return 0;
    }

    try {
        const userAssets = await assets.find({ userId: new ObjectId(userId) }).toArray();
        const totalUserAssetValue = await calculateTotalAssetValue(userAssets);
        let percentage = 0;

        if (plans.retirementAssets > 0) {
            percentage = (totalUserAssetValue / plans.retirementAssets) * 100;
        }
        return percentage;
    } catch (err) {
        console.error("Error in calculatePlanProgress:", err);
        return 0;
    }
}

async function updatePlanProgressInDB(planId, percentage, plans) {
    if (!plans || typeof plans.updateOne !== 'function') {
        console.error("Error with the plans collection");
        return;
    }
    if (typeof percentage !== 'number' || isNaN(percentage)) {
        console.error(`Error with the percentage: ${percentage}`);
        return;
    }

    try {
        await plans.updateOne({ _id: new ObjectId(planId) }, { $set: { progress: parseFloat(percentage.toFixed(2)) } });
    } catch (err) {
        console.error("Error in updatePlanProgressInDB:", err);
    }
}

async function calculateTotalAssetValue(assets) {
    if (!assets || typeof assets.find !== 'function') {
        console.error("Error with the assets collection");
        return;
    }
    try {
        let totalAssetValue = 0;
        for (const asset of assets) {
            if(asset.icon == "Motorcycle" || asset.icon == "Car"){
                today = new Date();
                asset.year = new Date(asset.year).getFullYear();
                let age = today.getFullYear() - asset.year;
                let value = asset.value * Math.pow(0.85, age);
                if (value < 1000) {
                    value = 1000;
                }
                totalAssetValue += value;
            } else {
            totalAssetValue += asset.value;
            }
        }
        return totalAssetValue;
    } catch (err) {
        console.error("Error in calculateTotalAssetValue:", err);
        return 0;
    }
}


async function calculateProgress(plan, assets, users, userId) {
    if (!plan || typeof plan !== 'object') {
        console.error("Error with the plan");
        return;
    }
    if (!assets || typeof assets.find !== 'function') {
        console.error("Error with the assets collection");
        return;
    }
    if (!users || typeof users.findOne !== 'function') {
        console.error("Error with the users collection");
        return;
    }
    if (!userId) {
        console.error("No user ID provided");
        return;
    }

    try {
        const userAssets = await assets.find({ userId: new ObjectId(userId) }).toArray();
        const totalUserAssetValue = await calculateTotalAssetValue(userAssets);
        const totalUserPlanValue = plan.retirementAssets;
    
        
        const userDoc = await users.findOne({ _id: new ObjectId(userId) });

        if (!userDoc || !userDoc.dob) {
            console.error("[calculateProgress] User document or DOB not found for userId:", userId);
            // Ensure a structured return even on error to avoid undefined.progress issues
            return { monthlyInvestment: NaN, totalCostOfRetirement: NaN, monthsUntilRetirement: NaN, yearsRetired: NaN, yearsUntilRetirement: NaN, percentage: NaN }; 
        }
        const userDob = new Date(userDoc.dob);

        if (isNaN(userDob.getTime())) {
            console.error("[calculateProgress] userDob is an invalid date. Aborting calculation.");
            return { monthlyInvestment: NaN, totalCostOfRetirement: NaN, monthsUntilRetirement: NaN, yearsRetired: NaN, yearsUntilRetirement: NaN, percentage: NaN };
        }

        const today = new Date();
        const userUnalivedBy = new Date(userDob);
        userUnalivedBy.setFullYear(userUnalivedBy.getFullYear() + 90);
        const yearOfRetirement = userDob.getFullYear() + plan.retirementAge;
        const monthsUntilRetirement = (yearOfRetirement - today.getFullYear()) * 12;
        const yearsRetired = userUnalivedBy.getFullYear() - yearOfRetirement;
        
        const totalCostOfRetirement = ((plan.retirementExpenses + plan.retirementLiabilities) * 12) * yearsRetired;
        
        const monthlyInvestment = (totalUserPlanValue - totalUserAssetValue + totalCostOfRetirement) / monthsUntilRetirement;
        
        const percentageCalculated = (totalUserAssetValue / (totalUserPlanValue + totalCostOfRetirement)) * 100;
        
        const progress = {};

        progress.monthlyInvestment = Math.round(monthlyInvestment);
        progress.totalCostOfRetirement = totalCostOfRetirement;
        progress.monthsUntilRetirement = monthsUntilRetirement;
        progress.yearsRetired = yearsRetired;
        progress.yearsUntilRetirement = (yearOfRetirement - today.getFullYear());
        progress.percentage = percentageCalculated;
        
        return progress;

    } catch (err) {
        console.error("Error in calculateProgress:", err);
        // Ensure a structured return even on error to avoid undefined.progress issues
        return { monthlyInvestment: NaN, totalCostOfRetirement: NaN, monthsUntilRetirement: NaN, yearsRetired: NaN, yearsUntilRetirement: NaN, percentage: NaN }; 
    }
}

async function updateProgress(plans, assets, users, userId) {
                const userPlansFromDB = await plans.find({ userId: new ObjectId(userId) }).toArray();
    
                for (const plan of userPlansFromDB) {
                    const progress = await calculateProgress(plan, assets, users, userId);
                    await updatePlanProgressInDB(plan._id, progress.percentage, plans);
                }
    
                const updatedUserPlans = await plans.find({ userId: new ObjectId(userId) }).toArray();
                return updatedUserPlans;
            }



module.exports = { calculatePlanProgress, updatePlanProgressInDB, calculateTotalAssetValue, calculateProgress, updateProgress};