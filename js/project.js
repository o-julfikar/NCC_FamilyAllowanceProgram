import {auth} from "./auth.js";
import {encodeSafeJSON} from "./json-engine.js";
import * as MsgBox from "./popup-engine.js";
import {logout} from "./account.js";

const URL = new URLSearchParams(window.location.search);
let containerMain = document.getElementsByClassName("main")[0];
let tableBeneficiaries = document.getElementById("tableBeneficiaries");
let tableModerators = document.getElementById("tableModerators");
let txtSearch = document.getElementById("txtSearch");
let cboCityCorporation = document.getElementById("cboCityCorporation");
let numWard = document.getElementById("numWard");
let txtArea = document.getElementById("txtArea");
let txtName = document.getElementById("txtName");
let numNID = document.getElementById("numNID");
let telPhone = document.getElementById("telPhone");
let dateBirthdate = document.getElementById("dateBirthdate");
let txtOccupation = document.getElementById("txtOccupation");
let numSpouseNID = document.getElementById("numSpouseNID");
let numParentNID = document.getElementById("numParentNID");
let btnInsert = document.getElementById("btnInsert");
let btnDownloadTXT = document.getElementById("btnDownloadTXT");
let btnDownloadCSV = document.getElementById("btnDownloadCSV");
let btnDownloadPDF = document.getElementById("btnDownloadPDF");
let btnPrint = document.getElementById("btnPrint");
let btnDashboard = document.getElementById("btnDashboard");
let btnAddModerator = document.getElementById("btnAddModerator");
let btnLoadFromTxt = document.getElementById("btnLoadFromTxt");
let btnLoadFromCSV = document.getElementById("btnLoadFromCSV");
let btnDeleteProject = document.getElementById("btnDeleteProject");
let btnAdmin = document.getElementById("btnAdmin");
let btnLogout = document.getElementById("btnLogout");

let hideAllExceptClass = (className) => {
  for (let otherDivs of containerMain.children) if (otherDivs.className !== "popup-container") otherDivs.style.visibility = "hidden"
};

let projectID = parseInt(URL.get("id"));

if (!projectID) {
  alert("Invalid project URL. Redirecting to dashboard...");
  open("dashboard.html", "_self");
}

btnAddModerator.onclick = openAddModeratorPopup;
btnLogout.onclick = () => logout();
btnDeleteProject.onclick = () => deleteProject(projectID);
btnInsert.onclick = insertBeneficiary;
btnLoadFromTxt.onclick = loadFromTxt;
btnDownloadPDF.onclick = downloadAsPDF;

let createMutuallyExclusiveFields = (...fields) => {
  for (let field of fields) field.oninput = () => {
    if (field.value.trim() !== "") {
      for (let dField of fields) if (dField !== field) dField.disabled = !(dField.value = "")
    } else {
      for (let eField of fields) if (eField !== field) eField.disabled = false
    }
  }
};

createMutuallyExclusiveFields(numSpouseNID, numParentNID);

function loadBeneficiaries() {
  let loadBeneficiariesRequest = new XMLHttpRequest();
  loadBeneficiariesRequest.onload = function () {
    let response = encodeSafeJSON(this.responseText);

    switch (response.code) {
      case 1:
        let beneficiaries = response.data;
        let bodyBeneficiary = tableBeneficiaries.getElementsByTagName("tbody")[0];
        let count = 1;

        for (let beneficiary of beneficiaries) {
          let rowBeneficiary = bodyBeneficiary.insertRow(-1);
          rowBeneficiary.insertCell(-1).innerHTML = (count++).toString();

          for (const [k, v] of Object.entries(beneficiary)) {
            let cellBeneficiary = rowBeneficiary.insertCell(-1);
            cellBeneficiary.innerHTML = v ? v : "NA";
          }
        }
        break;
      default:
        MsgBox.showPopup(containerMain, "Error", "An unknown error occurred. Please try again later", MsgBox.FIELDS(), MsgBox.BUTTONS.CANCEL("OK"));
        break;
    }
  };

  loadBeneficiariesRequest.open("GET", `beneficiaries.php?method=loadBeneficiaries&args=${projectID};${txtSearch.value}`)
  loadBeneficiariesRequest.send();
}

function loadModerators() {
  let loadModeratorsRequest = new XMLHttpRequest();
  loadModeratorsRequest.onload = function () {
    let response = encodeSafeJSON(this.responseText);

    switch (response.code) {
      case 1:
        let moderators = response.data;

        let bodyModerators = tableModerators.getElementsByTagName("tbody")[0];
        for (let i = 0; i < moderators.length; i++) {
          let rowModerator = bodyModerators.insertRow(-1);
          let cellModerator = rowModerator.insertCell(0);
          let divModeratorRow = document.createElement("div");
          let pModeratorName = document.createElement("p");
          let btnDeleteModerator = document.createElement("button");

          cellModerator.appendChild(divModeratorRow);

          divModeratorRow.className = "moderator-row";
          divModeratorRow.appendChild(pModeratorName);
          divModeratorRow.appendChild(btnDeleteModerator);

          pModeratorName.innerHTML = moderators[i].name;
          btnDeleteModerator.innerHTML = "Delete";
          btnDeleteModerator.setAttribute("deny", "");
          btnDeleteModerator.setAttribute("type", "submit");
          btnDeleteModerator.setAttribute("user-id", moderators[i].id);

          btnDeleteModerator.onclick = () => {
            deleteModerator(bodyModerators, rowModerator, moderators[i].id);
          };
        }
        break;
      case 2:
        MsgBox.showPopup(containerMain, "Error", response.data, MsgBox.FIELDS(), MsgBox.BUTTONS.CANCEL("Close"));
        break;
      case 3:
        // MsgBox.showPopup(containerMain, "Unauthorized", response.data, MsgBox.FIELDS(), MsgBox.BUTTONS.CANCEL("Close"));
        alert(response.data);
        open("dashboard.html", "_self");
        break;
      default:
        MsgBox.showPopup(containerMain, "Error", "An unknown error occurred", MsgBox.FIELDS(), MsgBox.BUTTONS.CANCEL("Close"));
        break;
    }
  }

  loadModeratorsRequest.open("GET", `projects.php?method=loadModerators&args=${projectID}`);
  loadModeratorsRequest.send();
}

function openAddModeratorPopup() {
  MsgBox.showPopup(containerMain, "Add Moderator", "", MsgBox.FIELDS(MsgBox.INPUT("email", "Moderator Email")), MsgBox.BUTTONS.OK("Confirm", addModerator))
}

function addModerator(moderatorEmail) {
  let addModeratorRequest = new XMLHttpRequest();
  let success = false;
  addModeratorRequest.onload = function () {
    let response = encodeSafeJSON(this.responseText);

    switch (response.code) {
      case 1:
        let moderator = response.data;
        let bodyModerators = tableModerators.getElementsByTagName("tbody")[0];
        let rowModerator = bodyModerators.insertRow(-1);
        let cellModerator = rowModerator.insertCell(0);
        let divModeratorRow = document.createElement("div");
        let pModeratorName = document.createElement("p");
        let btnDeleteModerator = document.createElement("button");

        cellModerator.appendChild(divModeratorRow);

        divModeratorRow.className = "moderator-row";
        divModeratorRow.appendChild(pModeratorName);
        divModeratorRow.appendChild(btnDeleteModerator);

        pModeratorName.innerHTML = moderator.name;
        btnDeleteModerator.innerHTML = "Delete";
        btnDeleteModerator.setAttribute("deny", "");
        btnDeleteModerator.setAttribute("type", "submit");
        btnDeleteModerator.setAttribute("user-id", moderator.id);

        btnDeleteModerator.onclick = () => {
          deleteModerator(bodyModerators, rowModerator, moderator.id);
        };

        success = true;
        break;
      case 2:
        MsgBox.showPopup(containerMain, "Error", response.data, MsgBox.FIELDS(), MsgBox.BUTTONS.CANCEL("OK"));
        break;
      case 3:
        hideAllExceptClass("pop-container");
        MsgBox.showPopup(containerMain, "Unauthorized", response.data, MsgBox.FIELDS(), MsgBox.BUTTONS.CANCEL("Close"));
        setTimeout(() => open("dashboard.html", "_self"), 3000);
        break;
      default:
        MsgBox.showPopup(containerMain, "Error", "An unknown error occurred while adding the moderator. Please try again later!", MsgBox.FIELDS(), MsgBox.BUTTONS.CANCEL("Try Again"));
        break;
    }
  };

  addModeratorRequest.open("GET", `projects.php?method=addModerator&args=${projectID};${moderatorEmail}`, false);
  addModeratorRequest.send();

  return success;
}

function deleteModerator(bodyModerators, rowModerator, moderatorID) {
  let deleteModeratorRequest = new XMLHttpRequest();
  deleteModeratorRequest.onload = function () {
    let response = encodeSafeJSON(this.responseText);

    switch (response.code) {
      case 1:
        bodyModerators.removeChild(rowModerator);
        break;
      case 3:
        bodyModerators.removeChild(rowModerator);
        MsgBox.showPopup(containerMain, "Success", response.data, MsgBox.FIELDS(), MsgBox.BUTTONS.OK("Close"));
        setTimeout(() => open("dashboard.html", "_self"), 3000);
        break;
      case 2:
        MsgBox.showPopup(containerMain, "Error", response.data, MsgBox.FIELDS(), MsgBox.BUTTONS.CANCEL("Close"));
        break;
      default:
        MsgBox.showPopup(containerMain, "Error", "An unknown error occurred while deleting the moderator. Please try again later!", MsgBox.FIELDS(), MsgBox.BUTTONS.CANCEL("Close"));
        break;
    }
  };

  deleteModeratorRequest.open("GET", `projects.php?method=deleteModerator&args=${projectID};${moderatorID}`);
  deleteModeratorRequest.send();
}

function deleteProject(projectID) {
  let deleteProjectRequest = new XMLHttpRequest();
  deleteProjectRequest.onload = function () {
    let response = encodeSafeJSON(this.responseText);

    switch (response.code) {
      case 1:
        hideAllExceptClass("pop-container");
        MsgBox.showPopup(containerMain, "Project Deleted", "Project deleted successfully. Redirecting to Dashboard...", MsgBox.FIELDS(), MsgBox.BUTTONS.OK("Close"));
        setTimeout(() => open("dashboard.html", "_self"), 3000);
        break;
      case 2:
        MsgBox.showPopup(containerMain, "Error", response.data, MsgBox.FIELDS(), MsgBox.BUTTONS.CANCEL("Close"));
        break;
      case 4:
        hideAllExceptClass("pop-container");
        MsgBox.showPopup(containerMain, "Error", response.data, MsgBox.FIELDS(), MsgBox.BUTTONS.CANCEL("Close"));
        setTimeout(() => open("dashboard.html", "_self"), 3000);
        break;
      case 6:
        MsgBox.showPopup(containerMain, "Unauthorized", response.data, MsgBox.FIELDS(), MsgBox.BUTTONS.CANCEL("Close"));
        break;
      default:
        MsgBox.showPopup(containerMain, "Error", "An unknown error occurred while deleting the project. Please try again later!", MsgBox.FIELDS(), MsgBox.BUTTONS.CANCEL("Close"));
        break;
    }
  };

  deleteProjectRequest.open("GET", `projects.php?method=deleteProject&args=${projectID}`);
  deleteProjectRequest.send();
}

function insertBeneficiary() {
  let hasEmptyMandatoryFields = false;
  let listEmptyMandatoryFields = [];

  for (let field of [numWard, txtArea, txtName, numNID, telPhone, dateBirthdate, txtOccupation]) {
    if (!field.value) {
      hasEmptyMandatoryFields = true;
      listEmptyMandatoryFields.push("- " + field.placeholder);
    }
  }

  if (hasEmptyMandatoryFields) {
    MsgBox.showPopup(containerMain, "Mandatory Fields", "The following fields must not be empty:<br>" + listEmptyMandatoryFields.join("<br>"), MsgBox.FIELDS(), MsgBox.BUTTONS.CANCEL("OK"), null, true);
    return;
  }

  if (!numSpouseNID.value && !numParentNID.value) {
    // No action required now.
  } else if (numSpouseNID.value && numParentNID.value) {
    MsgBox.showPopup(containerMain, "Mutually Exclusive Fields", "Spouse's NID and parent's NID are two mutually exclusive fields. You can enter the value for either one but not both.", MsgBox.FIELDS(), MsgBox.BUTTONS.CANCEL("OK"), null, true);
    return;
  }

  if (numNID.value === numSpouseNID.value) {
    MsgBox.showPopup(containerMain, "Duplicate NID", "Beneficiary NID and spouse NID must not be equal. Please enter different values and try again.", MsgBox.FIELDS(), MsgBox.BUTTONS.CANCEL("OK"), null, true);
    return;
  } else if (numNID.value === numParentNID.value) {
    MsgBox.showPopup(containerMain, "Duplicate NID", "Beneficiary NID and parent's NID must not be equal. Please enter different values and try again.", MsgBox.FIELDS(), MsgBox.BUTTONS.CANCEL("OK"), null, true);
    return;
  }

  let insertBeneficiaryRequest = new XMLHttpRequest();
  insertBeneficiaryRequest.onload = function () {
    let response = encodeSafeJSON(this.responseText);

    switch (response.code) {
      case 1:
        break;
      case 2:
        MsgBox.showPopup(containerMain, "Insertion Failed", response.data, MsgBox.FIELDS(), MsgBox.BUTTONS.CANCEL("OK"));
        break;
      case 4:
        hideAllExceptClass("popup-container");
        MsgBox.showPopup(containerMain);
        setTimeout(() => open("dashboard.html", "_self"));
        break;
      case 8:
        let originalEntry = response.data;
        let duplicateEntryDiv = document.createElement("div");

        for (let [k, v] of Object.entries(originalEntry)) {
          let rowElement = document.createElement("div");
          let keyElement = document.createElement("h3");
          let valueElement = document.createElement("h4");

          rowElement.style.display = "flex";
          rowElement.style.flexDirection = "row";
          keyElement.style.width = "100%";
          valueElement.style.width = "100%";
          keyElement.style.margin = "5px 0";
          valueElement.style.margin = "5px 0";

          rowElement.appendChild(keyElement);
          rowElement.appendChild(valueElement);
          duplicateEntryDiv.appendChild(rowElement);

          keyElement.innerHTML = k;
          valueElement.innerHTML = v;

        }

        duplicateEntryDiv.style.display = "flex";
        duplicateEntryDiv.style.flexDirection = "column";

        MsgBox.showPopup(containerMain, "Duplicate Entry", null, MsgBox.FIELDS(), MsgBox.BUTTONS.CANCEL("OK"), duplicateEntryDiv, true);
        break;
      default:
        MsgBox.showPopup(containerMain, "Error", "An unknown error occurred. Please try again later.", MsgBox.FIELDS(), MsgBox.BUTTONS.CANCEL("OK"));
        break;
    }
  };

  insertBeneficiaryRequest.open("GET", `beneficiaries.php?method=insertBeneficiary` +
    `&args=${projectID};${cboCityCorporation.value};${numWard.value};` +
    `${txtArea.value};${txtName.value};${numNID.value};${telPhone.value};` +
    `${dateBirthdate.value};${txtOccupation.value};${numSpouseNID.value};${numParentNID.value}`
  );
  insertBeneficiaryRequest.send();
}

function loadFromTxt() {
  let fileInput = document.createElement("input");
  let buttonInput = document.createElement("input");

  fileInput.type = "file";
  buttonInput.type = "submit";

  fileInput.onchange = (e) => {
    let insertAllBeneficiariesRequest = new XMLHttpRequest();

    insertAllBeneficiariesRequest.onreadystatechange = function () {
      if (insertAllBeneficiariesRequest.readyState === 4 && insertAllBeneficiariesRequest.onreadystatechange === 200) {
        console.log("File uploaded");
      }
    }

    insertAllBeneficiariesRequest.onload = function () {
      console.log(this.responseText);
    }


    insertAllBeneficiariesRequest.open("POST", `beneficiaries.php?method=insertBeneficiariesFromTXT&args=${projectID}`);

    const fileForm = new FormData();
    fileForm.append("inputFile", e.target.files[0]);

    insertAllBeneficiariesRequest.send(fileForm);
  }

  fileInput.click();
}

function downloadAsPDF() {
  let downloadPDFRequest = new XMLHttpRequest();
  downloadPDFRequest.responseType = "blob";

  downloadPDFRequest.onload = function () {
    if (this.status === 200) {
      if (this.response.type === "application/pdf") {
        const downloadLink = document.createElement("a");
        const blobPDF = this.response;
        const urlPDF = window.URL.createObjectURL(blobPDF);
        const filename = downloadPDFRequest.getResponseHeader("Content-Disposition").split(";")[1].split("=")[1].trim().slice(1, -1);

        downloadLink.setAttribute("href", urlPDF);
        downloadLink.setAttribute("target", "_blank");
        // downloadLink.setAttribute("download", filename);
        downloadLink.click();
      } else {
        let fileReader = new FileReader();
        fileReader.onload = function (e) {
          let response = encodeSafeJSON(e.target.result);

          switch (response.code) {
            case 2:
              MsgBox.showPopup(containerMain, "Error", response.data, MsgBox.FIELDS(), MsgBox.BUTTONS.CANCEL("OK"));
              break;
            default:
              MsgBox.showPopup(containerMain, "Error", "An unknown error occurred. Please try again later", MsgBox.FIELDS(), MsgBox.BUTTONS.CANCEL("OK"));
              break;
          }
        }
        fileReader.readAsText(this.response);
      }
    }
  }

  let requestFrom = new FormData();
  requestFrom.append("method", "downloadPDF");
  requestFrom.append("args", projectID.toString());
  requestFrom.append("submit", "submit");

  downloadPDFRequest.open("POST", "project-export.php");
  downloadPDFRequest.send(requestFrom);
}

loadModerators();
loadBeneficiaries();
auth("index.html", "", [containerMain], [], [], []);


