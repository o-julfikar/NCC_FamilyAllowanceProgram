import {auth} from "./auth.js";

function logout(successLocation="index.html", failLocation="", objectsToAppearIfSuccess=[], objectsToDisappearIfSuccess=[], objectsToAppearIfFail=[], objectsToDisappearIfFail=[]) {
    let logoutRequest = new XMLHttpRequest();
    logoutRequest.onload = function () {
      auth(successLocation, failLocation, objectsToAppearIfSuccess, objectsToDisappearIfSuccess, objectsToAppearIfFail, objectsToDisappearIfFail);
    };

    logoutRequest.open("GET", "logout.php");
    logoutRequest.send();
}

export {logout};
