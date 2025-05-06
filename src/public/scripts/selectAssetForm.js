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

resetRadio();
