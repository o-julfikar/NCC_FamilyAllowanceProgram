import {auth} from "./auth.js";
import {encodeSafeJSON} from "./json-engine.js";

let main = document.getElementsByClassName("main")[0];
let btnLogout = document.getElementById("btnLogout");
let tableContainer = document.getElementsByClassName("table-container")[0];
let projectTable = tableContainer.getElementsByTagName("table")[0].getElementsByTagName("tbody")[0];

auth("index.html", "", [], [], [], []);

let userRequest = new XMLHttpRequest();
userRequest.onload = function () {
  let response = encodeSafeJSON(this.responseText);

  switch (response.code) {
    case 1:
      main.style.display = "flex";
      let data = response.data;
      console.log(response);

      for (let i = 0; i < data.length; i++) {
        let row_data =
          `
              <div class="user-info">
                <h3>${data[i].Name}</h3>
                <p>${data[i].Email}</p>
              </div>
              <div class="action-container">
                <button approve type="submit" user_id="${data[i].ID}" class="anticipating-user-approve-button">Approve</button>
                <button deny type="submit" user_id="${data[i].ID}" class="anticipating-user-decline-button">Decline</button>
              </div>
          `;
        let trow = projectTable.insertRow(-1);
        let cell1 = trow.insertCell(0);
        cell1.innerHTML = row_data;
      }
      let userRows = projectTable.getElementsByTagName("tr");

      for (let i = 0; i < userRows.length; i++) {
        let approveButton = userRows[i].getElementsByClassName("anticipating-user-approve-button")[0];
        let declineButton = userRows[i].getElementsByClassName("anticipating-user-decline-button")[0];

        approveButton.onclick = function () {
          let approveRequest = new XMLHttpRequest();
          approveRequest.onload = function () {
            let approvalResponse = JSON.parse(this.responseText);
            let data = approvalResponse.data;

            switch (approvalResponse.code) {
              case 1:
                projectTable.deleteRow(i);
                break;
              case 2:
                alert(data);
                break;
              case 4:
                alert(data);
                open("index.html", "_self");
                break;
              default:
                alert("An unknown error occurred. Please try again later!")
                break
            }
          }

          approveRequest.open("GET", "user_management.php?" +
            `user_id=${approveButton.getAttribute("user_id")}` +
            `&user_name=${userRows[i].getElementsByTagName("h3")[0]}` +
            `&approve=1`
          )
          approveRequest.send();
        };

        declineButton.onclick = function () {
          let declineRequest = new XMLHttpRequest();
          declineRequest.onload = function () {
            let approvalResponse = JSON.parse(this.responseText);
            let data = approvalResponse.data;

            switch (approvalResponse.code) {
              case 1:
                projectTable.deleteRow(i);
                break;
              case 2:
                alert(data);
                break;
              case 4:
                alert(data);
                open("index.html", "_self");
                break;
              default:
                alert("An unknown error occurred. Please try again later!")
                break
            }
          }

          declineRequest.open("GET", "user_management.php?" +
            `user_id=${declineButton.getAttribute("user_id")}` +
            `&user_name=${userRows[i].getElementsByTagName("h3")[0]}` +
            `&approve=0`
          )
          declineRequest.send();
        }
      }

      break;
    case 2:
      alert(response.data);
      open("index.html", "_self");
      break;
    default:
      alert("Unknown error occurred!");
      break;
  }

}

userRequest.open("GET", "admin.php");
userRequest.send();

btnLogout.onclick = function () {
  let logoutRequest = new XMLHttpRequest();
  logoutRequest.onload = function () {
    auth("index.html", "", [main], [], [], []);
  };

  logoutRequest.open("GET", "logout.php");
  logoutRequest.send();
};
