/**
 * unlockAccount removes disabled from inputs and
 * allows users to edit their profile.
 */
function unlockAccount() {
  document.getElementById("save-account").disabled = false;
  document.getElementById("email").disabled = false;
  document.getElementById("name").disabled = false;
  document.getElementById("password").disabled = false;
  document.getElementById("repassword").disabled = false;
  document.getElementById("save-account").classList.remove("cursor-not-allowed");
}

/**
 * unlocPersonal removes disabled from inputs and
 * allows users to edit their personal information.
 */
function unlockPersonal() {
  document.getElementById("save-personal").disabled = false;
  document.getElementById("dob").disabled = false;
  document.getElementById("education").disabled = false;
  document.getElementById("ms-single").disabled = false;
  document.getElementById("ms-married").disabled = false;
  document.getElementById("ms-divorced").disabled = false;
  document.getElementById("ms-widowed").disabled = false;
  document.getElementById("save-personal").classList.remove("cursor-not-allowed");
}

/**
 * lockAll makes all inputs disabled on page load
 */
function lockAll() {
  // Clear unsaved inputs on page load (refresh doesnt clear them)
  document.getElementById("account-form").reset();
  document.getElementById("personal-form").reset();

  // Account section
  document.getElementById("save-account").disabled = true;
  document.getElementById("email").disabled = true;
  document.getElementById("name").disabled = true;
  document.getElementById("password").disabled = true;
  document.getElementById("repassword").disabled = true;
  document.getElementById("save-account").classList.add("cursor-not-allowed");

  // Personal info section
  document.getElementById("save-personal").disabled = true;
  document.getElementById("dob").disabled = true;
  document.getElementById("education").disabled = true;
  document.getElementById("ms-single").disabled = true;
  document.getElementById("ms-married").disabled = true;
  document.getElementById("ms-divorced").disabled = true;
  document.getElementById("ms-widowed").disabled = true;
  document.getElementById("save-personal").classList.add("cursor-not-allowed");

}

lockAll()
