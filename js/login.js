import {auth} from "./auth.js";
import * as MsgBox from "./popup-engine.js";

let containerMain = document.getElementsByClassName("main")[0];
let txtEmail = document.getElementById("txtEmail");
let txtPassword = document.getElementById("txtPass");
let txtName = document.getElementById("txtName");
let txtConfirm = document.getElementById("txtConfirmPassword");
let btnLogin = document.getElementById("btnLogin");
let loginContainer = document.getElementsByClassName("login-container")[0];


function login() {
  if (btnLogin.innerHTML === "Login") {
    let loginRequest = new XMLHttpRequest();
    loginRequest.onload = function () {
      let response = this.responseText;

      if (response === "-1") {
        // alert("Incorrect email or password.");
        MsgBox.showPopup(containerMain, "Invalid Login", "Incorrect email or password.", MsgBox.FIELDS(), MsgBox.BUTTONS.CANCEL("Try Again!"));
      } else if (response === "0") {
        txtName.hidden = false;
        txtConfirm.hidden = false;
        btnLogin.innerHTML = "Register";
      } else if (response === "1") {
        open("./dashboard.html", "_self");
      } else {
        alert("An unknown error occurred. Please try again later!");
      }
    };

    loginRequest.open(
      "GET", "login.php?" +
      "email=" + txtEmail.value +
      "&password=" + txtPassword.value
    );

    loginRequest.send();
  } else if (btnLogin.innerHTML === "Register") {

    if (txtPassword.value !== txtConfirm.value) {
      alert("Passwords do not match!");
      return;
    }

    let registerRequest = new XMLHttpRequest();
    registerRequest.onload = function () {
      let response = this.responseText;
      console.log(response);
      if (response === "-1") {
        txtName.value = "";
        txtConfirm.value = "";
        txtName.hidden = true;
        txtConfirm.hidden = true;
        btnLogin.innerHTML = "Login";
        alert("User already exists. Please login!");
      } else if (response === "0") {
        alert("Registration failed! Please check the validation of entered information and try again!");
      } else if (response === "1") {
        open("./dashboard.html", "_self");
      } else {
        alert("An unknown error occurred. Please try again later!");
      }
    };

    registerRequest.open(
      "GET", "register.php?" +
      "name=" + txtName.value +
      "&email=" + txtEmail.value +
      "&password=" + txtPassword.value
    )

    registerRequest.send();
  } else {
    alert("Modifications are not allowed!");
  }
}

btnLogin.onclick = login;
auth("", "dashboard.html", [], [], [loginContainer], []);
