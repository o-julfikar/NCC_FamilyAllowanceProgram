import {Auth} from "./Authenticator.js";

function logout() {
    let logoutRequest = new XMLHttpRequest();
    logoutRequest.onload = function () {
      Auth.run();
    };

    logoutRequest.open("GET", "logout.php");
    logoutRequest.send();
}

export {logout};
