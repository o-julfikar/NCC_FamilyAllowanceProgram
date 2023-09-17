import {Auth} from "./Authenticator.js";
import * as MP from "./ModalPopup.js";
import {encodeSafeJSON} from "./json-engine.js";

let mainContainer = document.getElementsByClassName("main")[0];
let txtEmail = document.getElementById("txtEmail");
let txtPassword = document.getElementById("txtPass");
let txtName = document.getElementById("txtName");
let txtConfirm = document.getElementById("txtConfirmPassword");
let btnLogin = document.getElementById("btnLogin");
let loginContainer = document.getElementsByClassName("login-container")[0];
const accountRequest = new XMLHttpRequest();

btnLogin.onclick = login;

accountRequest.onload = () => {
  const response = encodeSafeJSON(accountRequest.responseText);
  switch (response.code) {
    case 0:
      txtName.hidden = false;
      txtConfirm.hidden = false;
      btnLogin.innerHTML = "Register";
      break;
    case 1:
      open("dashboard.html", "_self");
      break;
    case 12:
      txtName.hidden = true;
      txtConfirm.hidden = true;
      btnLogin.innerHTML = "Login";
      /* FALLTHROUGH */
    case -1:
    case 2:
      MP.show(response.title, MP.ModalContent.TEXT(response.data), MP.ModalField.NONE, MP.ModalButton.REFUSE("Close"), MP.ModalPopup.ERROR_BODY);
      break;
    default:
      MP.show("Error", MP.ModalContent.TEXT("An unknown error occurred. Please try again later!"), MP.ModalField.NONE, MP.ModalButton.REFUSE("Try again"), MP.ModalPopup.ERROR_BODY);
      break;
  }
};

function login() {
  const mandatoryFields = [txtEmail, txtPassword];
  const emptyFields = [];

  for (let field of mandatoryFields) if (!field.hidden && !field.value) emptyFields.push("- " + field.placeholder);

  if (emptyFields.length) {
    MP.show(
      "Mandatory Fields",
      MP.ModalContent.N_TEXTS("The following fields must not be empty:", ...emptyFields),
      MP.ModalField.NONE,
      MP.ModalButton.REFUSE("Close"),
      MP.ModalPopup.ERROR_BODY);
  } else {
    if (btnLogin.innerHTML === "Login") {
      const loginData = new FormData();
      loginData.set("email", txtEmail.value);
      loginData.set("password", txtPassword.value);
      loginData.set("method", "login");
      loginData.set("submit", "");
      accountRequest.open("POST", "login.php");
      accountRequest.send(loginData);
    } else if (btnLogin.innerHTML === "Register") {
      const registerData = new FormData();
      registerData.set("name", txtName.value);
      registerData.set("email", txtEmail.value);
      registerData.set("password", txtPassword.value);
      registerData.set("method", "register");
      registerData.set("submit", "");
      accountRequest.open("POST", "login.php");

      if (txtPassword.value !== txtConfirm.value) {
        const mismatchPasswordDialogue = MP.show(
          "Passwords Mismatched",
          MP.ModalContent.SINGLE_ROW_TABLE(
            ...Object.entries({"Password": txtPassword.value, "Confirm Password": txtConfirm.value})
              .map(([header, cell]) => MP.ModalContent.SINGLE_ROW_TABLE_COLUMN(header, cell))),
          MP.ModalField.NONE,
          MP.ModalButton.OK_REFUSE_CANCEL("Register (using First Password)", "Register (using Confirm Password)"),
          MP.ModalPopup.ERROR_BODY);

        mismatchPasswordDialogue.okButton.addEventListener("click", () => {
          // Register with first password
          accountRequest.send(registerData);
        });

        mismatchPasswordDialogue.refuseButton.addEventListener("click", () => {
          // Register with confirm password
          registerData.set("password", txtConfirm.value);
          accountRequest.send(registerData);
        });
      } else {
        accountRequest.send(registerData);
      }
    } else {
      MP.show("Forbidden", MP.ModalContent.TEXT("Modifications are not allowed"), MP.ModalField.NONE, MP.ModalButton.REFUSE("Close"), MP.ModalPopup.ERROR_BODY);
    }
  }
}

window.addEventListener("load", () => {
  Auth.run().success(() => {
    open("dashboard.html", "_self");
  }).fail(() => {
    mainContainer.style.visibility = "visible";
  });
})
