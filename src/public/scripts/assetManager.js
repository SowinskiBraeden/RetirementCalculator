const assetForms = [
    "create-other-asset-form",
    "create-saving-asset-form",
    "create-stock-asset-form"
];

/**
 * selectAssetForm changes which form is displayed
 * to create specified assets.
 * @param {string} assetFormId
 */
function selectAssetForm(assetFormId) {
    for (let i = 0; i < assetForms.length; i++) {
        if (assetForms[i] == assetFormId) {
            document.getElementById(assetFormId).style.display = "block";
        } else {
            document.getElementById(assetForms[i]).style.display = "none";
        }
    }
}

/**
 * resetRadio to default to other asset type.
 */
function resetRadio() {
    document.getElementById("asset-other").checked = true;
    document.getElementById("asset-saving").checked = false;
    document.getElementById("asset-stock").checked = false;
}

const assetKeys = {
    other: [
        "name",
        "value",
        "description",
        "purchaseDate",
    ],
    saving: [
        "name",
        "value",
    ],
    stock: [
        "ticker",
        "price",
        "quantity",
        "purchaseDate",
    ],
}

/**
 * lockAsset prevents edits to asset view modal
 * @param {string} assetId
 */
function lockAsset(assetId) {
    document.getElementById(`${assetId}-form`).reset();

    const type = document.getElementById(`type-${assetId}`).value;

    assetKeys[type].forEach((key) => {
        document.getElementById(`${key}-${assetId}`).disabled = true;
    });

    document.getElementById(`save-${assetId}`).disabled = true;
    document.getElementById(`save-${assetId}`).classList.remove("cursor-pointer");
    document.getElementById(`save-${assetId}`).classList.add("cursor-not-allowed");

    document.getElementById(`edit-${assetId}`).innerHTML = "Edit";
    document.getElementById(`edit-${assetId}`).onclick = () => { unlockAsset(assetId) };
}

/**
 * unlockAsset allows edits to asset view modal
 * @param {string} assetId
 */
function unlockAsset(assetId) {
    const type = document.getElementById(`type-${assetId}`).value;

    assetKeys[type].forEach((key) => {
        document.getElementById(`${key}-${assetId}`).disabled = false;
    });

    document.getElementById(`save-${assetId}`).disabled = false;
    document.getElementById(`save-${assetId}`).classList.remove("cursor-not-allowed");
    document.getElementById(`save-${assetId}`).classList.add("cursor-pointer");

    document.getElementById(`edit-${assetId}`).innerHTML = "Cancel changes";
    document.getElementById(`edit-${assetId}`).onclick = () => { lockAsset(assetId) };
}

resetRadio();
