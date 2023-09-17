import {encodeSafeJSON} from "./json-engine.js";
import {Auth} from "./Authenticator.js";
import * as MP from "./ModalPopup.js";

const main = document.getElementsByClassName("main")[0];
const btnLogout = document.getElementById("btnLogout");
const tableContainer = document.getElementsByClassName("table-container")[0];
const projectTable = tableContainer.getElementsByTagName("table")[0].getElementsByTagName("tbody")[0];
const userRequest = new XMLHttpRequest();
const refreshList = (code, data, i) => {
  switch (code) {
    case 1:
      projectTable.deleteRow(i);
      break;
    case 2:
      MP.show("Error", MP.ModalContent.TEXT(data), MP.ModalField.NONE, MP.ModalButton.REFUSE("Close"), MP.ModalPopup.ERROR_BODY);
      break;
    case 4:
      MP.show("Unauthorized", MP.ModalContent.TEXT(data), MP.ModalField.NONE, MP.ModalButton.REFUSE("Login"), MP.ModalPopup.ERROR_BODY)
        .then(() => {
          open("index.html", "_self");
        });
      break;
    default:
      MP.show("Error", MP.ModalContent.TEXT("An unknown error occurred. Please try again later!"), MP.ModalField.NONE, MP.ModalButton.REFUSE("Close"), MP.ModalPopup.ERROR_BODY);
      break
  }
}

userRequest.onload = function () {
  let response = encodeSafeJSON(this.responseText);

  switch (response.code) {
    case 1:
      let data = response.data;
      for (let i = 0; i < data.length; i++) {
        let trow = projectTable.insertRow(-1);
        let cell = trow.insertCell(-1);
        const userInfoDiv = document.createElement("div");
        const userName = document.createElement("h3");
        const userEmail = document.createElement("p");
        const actionContainer = document.createElement("div");
        const approveButton = document.createElement("button");
        const declineButton = document.createElement("button");

        userInfoDiv.classList.add("user-info");
        actionContainer.classList.add("action-container");
        approveButton.classList.add("anticipating-user-approve-button");
        declineButton.classList.add("anticipating-user-decline-button");

        userName.innerHTML = data[i]["Name"];
        userEmail.innerHTML = data[i]["Email"];
        approveButton.innerHTML = "Approve";
        declineButton.innerHTML = "Decline";

        approveButton.type = "submit";
        declineButton.type = "submit";

        approveButton.setAttribute("approve", "");
        approveButton.setAttribute("user_id", data[i]["ID"]);
        declineButton.setAttribute("deny", "");
        declineButton.setAttribute("user_id", data[i]["ID"]);

        userInfoDiv.append(userName);
        userInfoDiv.append(userEmail);
        actionContainer.append(approveButton);
        actionContainer.append(declineButton);

        cell.append(userInfoDiv);
        cell.append(actionContainer);
      }

      let userRows = projectTable.getElementsByTagName("tr");

      for (let i = 0; i < userRows.length; i++) {
        let approveButton = userRows[i].getElementsByClassName("anticipating-user-approve-button")[0];
        let declineButton = userRows[i].getElementsByClassName("anticipating-user-decline-button")[0];

        approveButton.onclick = function () {
          let approveRequest = new XMLHttpRequest();
          approveRequest.onload = () => {
            let approvalResponse = JSON.parse(approveRequest.responseText);
            refreshList(approvalResponse.code, approvalResponse.data, i);
          }

          const formData = new FormData();
          formData.set("user_id", approveButton.getAttribute("user_id"));
          formData.set("user_name", userRows[i].getElementsByTagName("h3")[0].innerHTML);
          formData.set("approve", "1");

          approveRequest.open("POST", "user_management.php");
          approveRequest.send(formData);
        };

        declineButton.onclick = function () {
          let declineRequest = new XMLHttpRequest();
          declineRequest.onload = () => {
            let declineResponse = JSON.parse(declineRequest.responseText);
            refreshList(declineResponse.code, declineResponse.data, i);
          }

          const formData = new FormData();
          formData.set("user_id", approveButton.getAttribute("user_id"));
          formData.set("user_name", userRows[i].getElementsByTagName("h3")[0].innerHTML);
          formData.set("approve", "0");

          declineRequest.open("POST", "user_management.php");
          declineRequest.send(formData);
        }
      }

      break;
    case 2:
      MP.show("Unauthorized", MP.ModalContent.TEXT(response.data), MP.ModalField.NONE, MP.ModalButton.REFUSE("Login"), MP.ModalPopup.ERROR_BODY)
        .then(() => {
          open("index.html", "_self");
        });
      break;
    default:
      MP.show("Error", MP.ModalContent.TEXT("An unknown error occurred while fetching anticipating users' list. Please try again later!"), MP.ModalField.NONE, MP.ModalButton.REFUSE("Close"), MP.ModalPopup.ERROR_BODY);
      break;
  }

}

btnLogout.onclick = function () {
  let logoutRequest = new XMLHttpRequest();
  logoutRequest.onload = function () {
    Auth.run().fail(() => {
      open("index.html", "_self");
    });
  };

  logoutRequest.open("GET", "logout.php");
  logoutRequest.send();
};

window.addEventListener("load", () => {
  Auth.run().success(() => {
    main.style.visibility = "visible";
    userRequest.open("POST", "admin.php");
    userRequest.send();
  }).fail(() => {

  });
});
