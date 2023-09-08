import {encodeSafeJSON} from "./json-engine.js";

function auth(failLocation, successLocation, objectsToAppearIfSuccess, objectsToDisappearIfSuccess, objectsToAppearIfFail, objectsToDisappearIfFail) {
  let authRequest = new XMLHttpRequest();
  authRequest.onload = function () {
    let response = encodeSafeJSON(this.responseText);

    if (response.code === 1) {
      for (let i = 0; i < objectsToAppearIfSuccess.length; i++) objectsToAppearIfSuccess[i].style.visibility = 'visible';
      for (let i = 0; i < objectsToAppearIfSuccess.length; i++) objectsToAppearIfSuccess[i].style.display = 'flex';
      for (let i = 0; i < objectsToDisappearIfSuccess.length; i++) objectsToDisappearIfSuccess[i].style.visibility = "hidden";
    } else {
      for (let i = 0; i < objectsToAppearIfFail.length; i++) objectsToAppearIfFail[i].style.visibility = 'visible';
      for (let i = 0; i < objectsToDisappearIfFail.length; i++) objectsToDisappearIfFail[i].style.visibility = "hidden";
    }

    if (response.code === 1 && successLocation) {
      open(successLocation, "_self");
    } else if (response.code === 2) {
      // alert(response.data);
      console.log(response.data);
    }

    if (response.code !== 1 && failLocation) {
      open(failLocation, "_self");
    }


  };
  authRequest.open("GET", "auth.php");
  authRequest.send();
}

export {auth};
