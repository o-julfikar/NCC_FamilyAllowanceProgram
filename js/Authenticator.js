import {encodeSafeJSON} from "./json-engine.js";
import * as MP from "./ModalPopup.js";

class Auth {
  constructor() {
    this.verifiedEvent = new CustomEvent("authorized");
    this.failedEvent = new CustomEvent("unauthorized")
    this.authListener = document.createElement("div");

    this.authListener.addEventListener("unauthorized", () => {
      if (!Auth.atHome()) open("index.html", "_self");
    })
  }

  success(handler) {
    this.authListener.addEventListener("authorized", handler);
    return this;
  }

  fail(handler) {
    this.authListener.addEventListener("unauthorized", handler);
    return this;
  }

  static atHome() {
    let url = window.location.pathname.split("/");

    if (url.length) {
      url = url[url.length - 1];
      if (url.startsWith("index.html")) return true;
    }

    return false;
  }

  static run() {
    let i = 0, _i = 1;
    const authInstance = new Auth();
    const loadingElement = document.createElement("p");
    const loadingInterval = setInterval(() => {
      loadingElement.innerHTML = "Please wait" + ".".repeat(i) + "&nbsp".repeat(3 - i);
      i = i + _i;
      _i *= i % 3? 1 : -1;
    }, 100);

    loadingElement.style.fontFamily = "monospace";
    loadingElement.style.fontSize = "18px";
    loadingElement.style.textAlign = "center";

    const loadingWindow = MP.show("Authenticating...", MP.ModalContent.CUSTOM(loadingElement), MP.ModalField.NONE, MP.ModalButton.NONE)
      .then(() => {
        clearInterval(loadingInterval);
      });

    let authRequest = new XMLHttpRequest();
    authRequest.onload = () => {
      let response = encodeSafeJSON(authRequest.responseText);

      switch (response.code) {
        case 1:
          loadingWindow.close();
          authInstance.authListener.dispatchEvent(authInstance.verifiedEvent);
          break;
        case -2: // Account Inactive
          if (this.atHome()) MP.show(response.title, MP.ModalContent.TEXT(response.data), MP.ModalField.NONE, MP.ModalButton.NONE, MP.ModalPopup.ERROR_BODY);
          authInstance.authListener.dispatchEvent(authInstance.failedEvent);
          break;
        case -3: // Session Expired
          MP.show(response.title, MP.ModalContent.TEXT(response.data), MP.ModalField.NONE, MP.ModalButton.REFUSE("Close"), MP.ModalPopup.ERROR_BODY)
            .then(() => {
              loadingWindow.close();
              authInstance.authListener.dispatchEvent(authInstance.failedEvent);
            })
          break;
        /* FALLTHROUGH */
        default:
          loadingWindow.close();
          authInstance.authListener.dispatchEvent(authInstance.failedEvent);
          break;
      }

      if (response.code !== 1) {
        console.log(response.data);
      }
    };

    authRequest.open("POST", "auth.php");
    authRequest.send();

    return authInstance;
  }

}

export {Auth};
