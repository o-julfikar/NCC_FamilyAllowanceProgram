import {encodeSafeJSON} from "./json-engine.js";
import {logout} from "./account.js";
import {SegmentedSearch} from "./SegmentedSearch.js";
import * as MP from "./ModalPopup.js";
import {Auth} from "./Authenticator.js";

const URL = new URLSearchParams(window.location.search);
let containerMain = document.getElementsByClassName("main")[0];
let tableBeneficiaries = document.getElementById("tableBeneficiaries");
let tableModerators = document.getElementById("tableModerators");
let smartSearch = document.getElementById("smartSearch");
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
let btnDownloadTSV = document.getElementById("btnDownloadTSV");
let btnDownloadCSV = document.getElementById("btnDownloadCSV");
let btnDownloadPDF = document.getElementById("btnDownloadPDF");
let btnPrint = document.getElementById("btnPrint");
let btnDashboard = document.getElementById("btnDashboard");
let btnAddModerator = document.getElementById("btnAddModerator");
let btnLoadFromTSV = document.getElementById("btnLoadFromTSV");
let btnLoadFromCSV = document.getElementById("btnLoadFromCSV");
let btnDeleteProject = document.getElementById("btnDeleteProject");
let btnAdmin = document.getElementById("btnAdmin");
let btnLogout = document.getElementById("btnLogout");
let segmentedSearch = null;
const mandatoryFields = [numWard, txtArea, txtName, numNID, telPhone, dateBirthdate, txtOccupation];
const querySuggestions = {
  "city-corporation": {
    "type": "string",
    "multivalued": true,
    "fetch": false,
    "lastFetched": null,
    "values": [
      "Barishal City Corporation",
      "Chittagong City Corporation",
      "Comilla City Corporation",
      "Dhaka North City Corporation",
      "Dhaka South City Corporation",
      "Gazipur City Corporation",
      "Narayanganj City Corporation",
      "Khulna City Corporation",
      "Mymensingh City Corporation",
      "Rajshahi City Corporation",
      "Rangpur City Corporation",
      "Sylhet City Corporation",
    ]
  },
  "ward": {
    "type": "number",
    "multivalued": true,
    "fetch": false,
    "lastFetched": null,
    "values": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  },
  "area": {
    "type": "string",
    "multivalued": true,
    "fetch": true,
    "lastFetched": null,
    "values": []
  },
  "beneficiary-name": {
    "type": "string",
    "multivalued": true,
    "fetch": true,
    "lastFetched": null,
    "values": []
  },
  "beneficiary-nid": {
    "type": "string",
    "multivalued": true,
    "fetch": true,
    "lastFetched": null,
    "values": []
  },
  "phone": {
    "type": "number",
    "multivalued": true,
    "fetch": true,
    "lastFetched": null,
    "values": []
  },
  "birthdate": {
    "type": "date",
    "multivalued": true,
    "fetch": false,
    "lastFetched": null,
    "values": []
  },
  "birthdate-before": {
    "type": "date",
    "multivalued": false,
    "fetch": false,
    "lastFetched": null,
    "values": []
  },
  "birthdate-after": {
    "type": "date",
    "multivalued": false,
    "fetch": false,
    "lastFetched": null,
    "values": []
  },
  "occupation": {
    "type": "string",
    "multivalued": true,
    "fetch": true,
    "lastFetched": null,
    "values": []
  },
  "spouse-nid": {
    "type": "number",
    "multivalued": true,
    "fetch": true,
    "lastFetched": null,
    "values": []
  },
  "parent-nid": {
    "type": "number",
    "multivalued": true,
    "fetch": true,
    "lastFetched": null,
    "values": []
  },
  "nid-matches": {
    "type": "number",
    "multivalued": true,
    "fetch": false,
    "lastFetched": null,
    "values": []
  },
  "limit": {
    "type": "number",
    "multivalued": false,
    "fetch": false,
    "lastFetched": null,
    "values": [10, 50, 100, 500, 1000]
  },
  "offset": {
    "type": "number",
    "multivalued": false,
    "fetch": false,
    "lastFetched": null,
    "values": [10, 50, 100, 500, 1000]
  },
  "clerk": {
    "type": "string",
    "multivalued": true,
    "fetch": true,
    "lastFetched": null,
    "valued": []
  }
}

let projectID = parseInt(URL.get("id"));

if (!projectID) {
  alert("Invalid project URL. Redirecting to dashboard...");
  open("dashboard.html", "_self");
}

btnAddModerator.onclick = addModerator;
btnLogout.onclick = () => logout();
btnDeleteProject.ondblclick = () => deleteProject(projectID);
btnDashboard.onclick = () => open("dashboard.html", "_self");
btnAdmin.onclick = () => open("admin.html", "_self");
btnLoadFromTSV.onclick = () => loadFromTextFiles("TSV");
btnLoadFromCSV.onclick = () => loadFromTextFiles("CSV");
btnDownloadPDF.onclick = downloadAsPDF;
btnDownloadTSV.onclick = downloadTSV;
btnDownloadCSV.onclick = downloadCSV;
btnInsert.onclick = () => {
  let listEmptyMandatoryFields = [];

  for (let field of mandatoryFields) {
    if (!field.value) {
      listEmptyMandatoryFields.push("- " + field.placeholder);
    }
  }

  if (listEmptyMandatoryFields.length) {
    MP.show("Mandatory Fields", MP.ModalContent.N_TEXTS("The following fields must not be empty:", ...listEmptyMandatoryFields), MP.ModalField.NONE, MP.ModalButton.REFUSE("Close"), MP.ModalPopup.ERROR_BODY);
  } else {
    if (!numSpouseNID.value && !numParentNID.value) {
      MP.show("Empty Fields", MP.ModalContent.TEXT("Both spouse and parent NIDs are missing. Are you sure you want to continue?"), MP.ModalField.NONE, MP.ModalButton.REFUSE_CANCEL("Continue"), MP.ModalPopup.ERROR_BODY)
        .refuseButton.onclick = () => {
        insertBeneficiary();
      }
    } else if (numSpouseNID.value && numParentNID.value) {
      MP.show("Mutually Exclusive Fields", MP.ModalContent.TEXT("Spouse's NID and parent's NID are two mutually exclusive fields. You can enter the value for either one but not both."), MP.ModalField.NONE, MP.ModalButton.REFUSE("Close"), MP.ModalPopup.ERROR_BODY);
    } else {
      if (numNID.value === numSpouseNID.value) {
        MP.show("Duplicate NID", MP.ModalContent.TEXT("Beneficiary NID and spouse's NID must not be equal. Please enter different values and try again."), MP.ModalField.NONE, MP.ModalButton.REFUSE("Close"), MP.ModalPopup.ERROR_BODY);
      } else if (numNID.value === numParentNID.value) {
        MP.show("Duplicate NID", MP.ModalContent.TEXT("Beneficiary NID and parent's NID must not be equal. Please enter different values and try again."), MP.ModalField.NONE, MP.ModalButton.REFUSE("Close"), MP.ModalPopup.ERROR_BODY);
      } else {
        insertBeneficiary();
      }
    }
  }
};

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

function loadBeneficiaries(queryString="") {
  const loadBeneficiariesRequest = new XMLHttpRequest();
  loadBeneficiariesRequest.onload = e => {
    const response = encodeSafeJSON(e.target.responseText);

    switch (response.code) {
      case 1:
        let bodyBeneficiary = tableBeneficiaries.getElementsByTagName("tbody")[0];
        bodyBeneficiary.replaceChildren();
        for (let beneficiary of response.data) {
          let rowBeneficiary = bodyBeneficiary.insertRow(-1);

          for (const [, v] of Object.entries(beneficiary)) {
            let cellBeneficiary = rowBeneficiary.insertCell(-1);
            cellBeneficiary.innerHTML = v ? v.toString() : "NA";
          }
        }
        break;
      case 2:
        break;
      default:
        break;
    }
  }

  const urlParameters = new FormData();
  urlParameters.set("method", "loadBeneficiaries");
  urlParameters.append("args[]", projectID.toString());
  urlParameters.append("args[]", queryString);

  loadBeneficiariesRequest.open("POST", "beneficiaries.php");
  loadBeneficiariesRequest.send(urlParameters);
}

function loadModerators() {
  let loadModeratorsRequest = new XMLHttpRequest();
  loadModeratorsRequest.onload = function () {
    let response = encodeSafeJSON(this.responseText);

    switch (response.code) {
      case 1:
        let moderators = response.data;

        tableModerators.getElementsByTagName("th")[0].innerHTML = `Moderators (of ${response.title})`;

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

          pModeratorName.innerHTML = moderators[i]["name"];
          btnDeleteModerator.innerHTML = "Delete";
          btnDeleteModerator.setAttribute("deny", "");
          btnDeleteModerator.setAttribute("type", "submit");
          btnDeleteModerator.setAttribute("user-id", moderators[i]["id"]);
          btnDeleteModerator.setAttribute("title", "এই প্রজেক্ট থেকে এই ব্যক্তির মডারেটর অ্যাক্সেস প্রত্যাহার করতে এখানে ডাবল-ক্লিক করুন৷ দয়া করে মনে রাখবেন যে এই ক্রিয়াটি শুধুমাত্র ১ জনের বেশি মডারেটর থাকলেই করা সম্ভব হবে৷ অধিকন্তু, মডারেটররা প্রজেক্টের মালিকদের কাছ থেকে মডারেটর অ্যাক্সেস প্রত্যাহার করতে পারবে না। সর্বশেষ, যদি কোনো প্রজেক্টের মালিক নিজেকে সরিয়ে নিতে সফল হন, মালিকানা মডারেটর তালিকা থেকে যেকোনো সদস্যের কাছে হস্তান্তর করা হবে।");

          btnDeleteModerator.ondblclick = () => {
            deleteModerator(bodyModerators, rowModerator, moderators[i]["id"]);
          };
        }
        break;
      case 2:
        MP.show("Error", MP.ModalContent.TEXT(response.data), MP.ModalField.NONE, MP.ModalButton.REFUSE("Close"), MP.ModalPopup.ERROR_BODY);
        break;
      case 3:
        MP.show("Unauthorized", MP.ModalContent.TEXT(response.data), MP.ModalField.NONE, MP.ModalButton.REFUSE("Open Dashboard"), MP.ModalPopup.ERROR_BODY)
          .then(
            () => open("dashboard.html", "_self")
          );
        break;
      default:
        MP.show("Error", MP.ModalContent.TEXT("An unknown error occurred. Please try again later!"), MP.ModalField.NONE, MP.ModalButton.REFUSE("Close"), MP.ModalPopup.ERROR_BODY);
        break;
    }
  }

  const formData = new FormData();
  formData.set("method", "loadModerators");
  formData.append("args[]", projectID.toString());

  loadModeratorsRequest.open("POST", `projects.php`);
  loadModeratorsRequest.send(formData);
}

function addModerator() {
  const addModeratorWindow = MP.show("Add Moderator", MP.ModalContent.NONE, MP.ModalField.EMAIL("Moderator Email"), MP.ModalButton.OK_CANCEL("Confirm"));
  const moderatorEmailField = addModeratorWindow.fields["Moderator Email"];
  addModeratorWindow.okButton.onclick = () => {
    let addModeratorRequest = new XMLHttpRequest();
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

          addModeratorWindow.close();
          break;
        case 2:
          MP.show("Error", MP.ModalContent.TEXT(response.data), MP.ModalField.NONE, MP.ModalButton.REFUSE("Close"), MP.ModalPopup.ERROR_BODY);
          break;
        case 3:
          MP.show("Unauthorized", MP.ModalContent.TEXT(response.data), MP.ModalField.NONE, MP.ModalButton.REFUSE("Close"), MP.ModalPopup.ERROR_BODY)
            .then(
              () => open("dashboard.html", "_self")
            );
          break;
        default:
          MP.show("Error", MP.ModalContent.TEXT("An unknown error occurred while adding the moderator. Please try again later!"), MP.ModalField.NONE, MP.ModalButton.REFUSE("Close"), MP.ModalPopup.ERROR_BODY);
          break;
      }
    };

    const formData = new FormData();
    formData.set("method", "addModerator");
    formData.append("args[]", projectID.toString());
    formData.append("args[]", moderatorEmailField.value);
    addModeratorRequest.open("POST", "projects.php");
    addModeratorRequest.send(formData);
  }
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
        MP.show("Success", MP.ModalContent.TEXT(response.data), MP.ModalField.NONE, MP.ModalButton.OK("Open Dashboard"), MP.ModalPopup.SUCCESS_BODY)
          .then(
            () => open("dashboard.html", "_self")
          );
        break;
      case 2:
        MP.show("Error", MP.ModalContent.TEXT(response.data), MP.ModalField.NONE, MP.ModalButton.REFUSE("Close"), MP.ModalPopup.ERROR_BODY);
        break;
      default:
        MP.show("Error", MP.ModalContent.TEXT("An unknown error occurred while adding the moderator. Please try again later!"), MP.ModalField.NONE, MP.ModalButton.REFUSE("Close"), MP.ModalPopup.ERROR_BODY);
        break;
    }
  };

  const formData = new FormData();
  formData.set("method", "deleteModerator");
  formData.append("args[]", projectID.toString());
  formData.append("args[]", moderatorID.toString());

  deleteModeratorRequest.open("POST", `projects.php`);
  deleteModeratorRequest.send(formData);
}

function deleteProject(projectID) {
  let deleteProjectRequest = new XMLHttpRequest();
  deleteProjectRequest.onload = function () {
    let response = encodeSafeJSON(this.responseText);

    switch (response.code) {
      case 1:
        MP.show("Project Deleted", MP.ModalContent.TEXT("Project deleted successfully. Redirecting to Dashboard..."), MP.ModalField.NONE, MP.ModalButton.OK("Open Dashboard"), MP.ModalPopup.ERROR_BODY)
          .then(
            () => open("dashboard.html", "_self")
          );
        break;
      case 2:
        MP.show("Error", MP.ModalContent.TEXT(response.data), MP.ModalField.NONE, MP.ModalButton.REFUSE("Close"), MP.ModalPopup.ERROR_BODY);
        break;
      case 4:
        MP.show("Error", MP.ModalContent.TEXT(response.data), MP.ModalField.NONE, MP.ModalButton.REFUSE("Close"), MP.ModalPopup.ERROR_BODY)
          .then(
            () => open("dashboard.html", "_self")
          );
        break;
      case 6:
        MP.show("Unauthorized", MP.ModalContent.TEXT(response.data), MP.ModalField.NONE, MP.ModalButton.REFUSE("Close"), MP.ModalPopup.ERROR_BODY);
        break;
      default:
        MP.show("Error", MP.ModalContent.TEXT("An unknown error occurred while deleting the project. Please try again later!"), MP.ModalField.NONE, MP.ModalButton.REFUSE("Close"), MP.ModalPopup.ERROR_BODY);
        break;
    }
  };

  MP.show("Delete Project", MP.ModalContent.TEXT("This will permanently delete the project and its data. This action cannot be undone. Do you want to continue?"), MP.ModalField.NONE, MP.ModalButton.REFUSE_CANCEL("Delete"), MP.ModalPopup.ERROR_BODY)
    .refuseButton.addEventListener("click", () => {
      const formData = new FormData();
      formData.set("method", "deleteProject");
      formData.append("args[]", projectID.toString());

    deleteProjectRequest.open("POST", `projects.php`);
    deleteProjectRequest.send(formData);
  });
}

function insertBeneficiary() {
  const insertBeneficiaryRequest = new XMLHttpRequest();
  insertBeneficiaryRequest.onload = () => {
    const response = encodeSafeJSON(insertBeneficiaryRequest.responseText);

    switch (response.code) {
      case 1:
        const row = tableBeneficiaries.getElementsByTagName("tbody")[0].insertRow(0);
        for (let cellData of [
          {value: "-"}, cboCityCorporation, numWard, txtArea, txtName, numNID, telPhone,
          dateBirthdate, txtOccupation, numSpouseNID, numParentNID]) {
          row.insertCell(-1).innerHTML = cellData.value;
        }
        numWard.focus();
        break;
      case 2:
        MP.show("Insertion Failed", MP.ModalContent.TEXT(response.data), MP.ModalField.NONE, MP.ModalButton.REFUSE("Close"), MP.ModalPopup.ERROR_BODY);
        break;
      case 4:
        MP.show("Unauthorized", MP.ModalContent.TEXT(response.data), MP.ModalField.NONE, MP.ModalButton.REFUSE("Open Dashboard"), MP.ModalPopup.ERROR_BODY)
          .then(
            () => open("dashboard.html", "_self")
          );
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

        MP.show("Duplicate Entry", [new MP.ModalContent(duplicateEntryDiv)], MP.ModalField.NONE, MP.ModalButton.REFUSE("Close"), MP.ModalPopup.ERROR_BODY);
        break;
      default:
        MP.show("ERROR", MP.ModalContent.TEXT("An unknown error occurred. Please try again later!"), MP.ModalField.NONE, MP.ModalButton.REFUSE("Close"), MP.ModalPopup.ERROR_BODY);
        break;
    }
  };

  const formData = new FormData();
  formData.set("method", "insertBeneficiary");
  formData.append("args[]", projectID.toString());
  formData.append("args[]", cboCityCorporation.value);
  formData.append("args[]", numWard.value);
  formData.append("args[]", txtArea.value);
  formData.append("args[]", txtName.value);
  formData.append("args[]", numNID.value);
  formData.append("args[]", telPhone.value);
  formData.append("args[]", dateBirthdate.value);
  formData.append("args[]", txtOccupation.value);
  formData.append("args[]", numSpouseNID.value);
  formData.append("args[]", numParentNID.value);

  insertBeneficiaryRequest.open("POST", `beneficiaries.php`);
  insertBeneficiaryRequest.send(formData);
}

function loadFromTextFiles(delimiterType="TSV") {
  const insertOptions = MP.show(`Insert from ${delimiterType}`, MP.ModalContent.NONE, MP.ModalField.N_TEXT_FIELDS("Offset", "Limit"), MP.ModalButton.OK_CANCEL("UPLOAD", "CLOSE"));
  insertOptions.okButton.onclick = () => {
    const fileInput = document.createElement("input");
    const buttonInput = document.createElement("input");
    const offsetField = insertOptions.fields["Offset"];
    const limitField = insertOptions.fields["Limit"];
    const okButtonHTML = insertOptions.okButton.innerHTML;

    fileInput.type = "file";
    buttonInput.type = "submit";

    fileInput.onchange = (e) => {
      const insertAllBeneficiariesRequest = new XMLHttpRequest();

      insertAllBeneficiariesRequest.onload = e => {
        insertOptions.okButton.innerHTML = okButtonHTML;
        insertOptions.okButton.style.backgroundImage = "unset";
        insertOptions.okButton.onclick = okButtonClick;
        insertOptions.cancelButton.classList.remove("fade-out-hide");

        let rawResponse = e.target.responseText;
        let i = -1;
        while (i < rawResponse.length && rawResponse[++i] === ".") {}

        const response = encodeSafeJSON(e.target.responseText.substring(i));

        switch (response.code) {
          case 1:
            let dataTable = MP.ModalContent.SINGLE_ROW_TABLE(
              ...Object.entries(response.data).map(
                ([key, value]) => MP.ModalContent.SINGLE_ROW_TABLE_COLUMN(key,  value)));

            setTimeout(() => MP.show("Success", dataTable, MP.ModalField.NONE, MP.ModalButton.OK_BUTTON, MP.ModalPopup.SUCCESS_BODY)
              .then(() => {
                loadBeneficiaries();
                offsetField.value = parseInt(`0${offsetField.value}`) + parseInt(`0${limitField.value}`);
              }), 300);
            break;
          default:
            MP.show("Error", MP.ModalContent.TEXT(JSON.stringify(response.data)), MP.ModalField.NONE, MP.ModalButton.REFUSE("OK"), MP.ModalPopup.ERROR_BODY);
            break;
        }
      }

      insertAllBeneficiariesRequest.onprogress = (e) => {
        insertOptions.okButton.onclick = () => MP.show("Please Wait", MP.ModalContent.N_TEXTS("Your file is being uploaded..."), MP.ModalField.NONE, MP.ModalButton.OK("Close"), MP.ModalPopup.SUCCESS_BODY);
        if (e.loaded <= 100) {
          insertOptions.okButton.innerHTML = `${e.loaded}%`;
          insertOptions.okButton.style.backgroundImage = `linear-gradient(to right, rgba(100, 255, 100, 1), ${e.loaded}%, white)`;
          insertOptions.cancelButton.classList.add("fade-out-hide");
        }
      }

      const formData = new FormData();
      formData.set("method", `insertBeneficiariesFrom${delimiterType}`);
      formData.append("inputFile", e.target.files[0]);
      formData.append("args[]", projectID.toString());
      formData.append("args[]", offsetField.value);
      formData.append("args[]", limitField.value);

      insertAllBeneficiariesRequest.open("POST", `beneficiaries.php`);
      insertAllBeneficiariesRequest.send(formData);
    }

    fileInput.click();
  }
  const okButtonClick = insertOptions.okButton.onclick;
}

function downloadAsPDF() {
  const downloadOptions = MP.show("Download as PDF", MP.ModalContent.NONE, MP.ModalField.N_TEXT_FIELDS("Offset", "Limit"), MP.ModalButton.OK_CANCEL("Download", "Cancel"));
  const offsetField = downloadOptions.fields["Offset"];
  const limitField = downloadOptions.fields["Limit"];

  downloadOptions.okButton.onclick = () => {
    let downloadPDFRequest = new XMLHttpRequest();
    downloadPDFRequest.responseType = "blob";

    downloadPDFRequest.onload = function () {
      if (this.status === 200) {
        if (this.response.type === "application/pdf") {
          const downloadLink = document.createElement("a");
          const blobPDF = this.response;
          const urlPDF = window.URL.createObjectURL(blobPDF);
          // const filename = downloadPDFRequest.getResponseHeader("Content-Disposition").split(";")[1].split("=")[1].trim().slice(1, -1);

          downloadLink.setAttribute("href", urlPDF);
          downloadLink.setAttribute("target", "_blank");
          // downloadLink.setAttribute("download", filename);
          downloadLink.click();
          downloadOptions.close();
        } else {
          let fileReader = new FileReader();
          fileReader.onload = function (e) {
            let response = encodeSafeJSON(e.target.result);

            switch (response.code) {
              case 1:
                const downloadLink = document.createElement("a");

                downloadLink.setAttribute("href", response.data);
                downloadLink.setAttribute("target", "_blank");
                // downloadLink.setAttribute("download", filename);
                downloadLink.click();
                downloadOptions.close();
                break;
              case 2:
                MP.show("Error", MP.ModalContent.TEXT(response.data), MP.ModalField.NONE, MP.ModalButton.REFUSE("Close"), MP.ModalPopup.ERROR_BODY);
                break;
              default:
                MP.show("Error", MP.ModalContent.TEXT("An unknown error occurred. Please try again later"), MP.ModalField.NONE, MP.ModalButton.REFUSE("Close"), MP.ModalPopup.ERROR_BODY);
                break;
            }
          }
          fileReader.readAsText(this.response);
        }
      }
    }

    let requestFrom = new FormData();
    requestFrom.set("method", "downloadPDF");
    requestFrom.append("args[]", projectID.toString());
    requestFrom.append("args[]", offsetField.value);
    requestFrom.append("args[]", limitField.value);
    requestFrom.append("submit", "submit");

    downloadPDFRequest.open("POST", "project-export.php");
    downloadPDFRequest.send(requestFrom);
  }
}

function downloadTextFile(fileType) {
  const downloadOptions = MP.show(`Download as ${fileType}`, MP.ModalContent.NONE, MP.ModalField.N_TEXT_FIELDS("Offset", "Limit"), MP.ModalButton.OK_CANCEL("Download", "Cancel"));
  const offsetField = downloadOptions.fields["Offset"];
  const limitField = downloadOptions.fields["Limit"];

  downloadOptions.okButton.onclick = () => {
    let downloadFileRequest = new XMLHttpRequest();
    downloadFileRequest.onload = function () {
      let response = encodeSafeJSON(this.responseText);
      let data = response.data;

      switch (response.code) {
        case 1:
          let downloadLink = document.createElement("a");
          // const filename = this.getResponseHeader("Content-Disposition").split(";")[1].split("=")[1].trim().slice(1, -1);

          downloadLink.setAttribute("href", data.url);
          downloadLink.setAttribute("target", "_blank");
          // downloadLink.setAttribute("download", data.filename);
          downloadLink.click();
          downloadOptions.close();
          break;
        case 2:
          MP.show("Error", MP.ModalContent.TEXT(response.data), MP.ModalField.NONE, MP.ModalButton.REFUSE("Close"), MP.ModalPopup.ERROR_BODY);
          break;
        default:
          MP.show("Error", MP.ModalContent.TEXT("An unknown error occurred. Please try again later."), MP.ModalField.NONE, MP.ModalButton.REFUSE("Close"), MP.ModalPopup.ERROR_BODY);
          break;
      }
    }

    let formData = new FormData();
    formData.set("method", `download${fileType}`);
    formData.append("args[]", projectID.toString());
    formData.append("args[]", offsetField.value);
    formData.append("args[]", limitField.value);
    formData.append("submit", "submit");

    downloadFileRequest.open("POST", "project-export.php");
    downloadFileRequest.send(formData);
  }
}

function downloadTSV() {
  downloadTextFile("TSV");
}

function downloadCSV() {
  downloadTextFile("CSV");
}

window.onload = () => {
  Auth.run().success(() => {
    containerMain.style.visibility = "visible";
    loadModerators();
    loadBeneficiaries();

    segmentedSearch = new SegmentedSearch(window, smartSearch, querySuggestions, 60000);

    segmentedSearch.searchContainer.addEventListener("search", () => {
      let queryString = smartSearch.getAttribute("queryString");
      if (queryString || true) {
        loadBeneficiaries(queryString);
      }
    });

    const suggestionFetcher = (queue, suggestion) => {
      const _suggestion = suggestion;
      let loadSuggestionData = new XMLHttpRequest();
      loadSuggestionData.onload = () => {
        const response = encodeSafeJSON(loadSuggestionData.responseText);

        switch (response.code) {
          case 1:
            _suggestion.param.values = [...new Set(response.data.sort())];
            segmentedSearch.suggestionFetchLog[_suggestion.key] = segmentedSearch.now();
            segmentedSearch.suggestionUpdated(suggestion.key, suggestion.param);

            if (queue.length) suggestionFetcher(queue, queue.pop());
            break;
          case 2:
            break;
          default:
            break;
        }
      }

      const urlParameters = new FormData();
      urlParameters.set("method", "loadSuggestions");
      urlParameters.append("args[]", projectID.toString());
      urlParameters.append("args[]", _suggestion.key);
      urlParameters.append("args[]", suggestion.searchKey);

      loadSuggestionData.open("POST", "beneficiaries.php");
      loadSuggestionData.send(urlParameters);
    }

    segmentedSearch.suggestionContainer.addEventListener("fetch_suggestions", (e) => {
      if (e.detail.suggestions.length) suggestionFetcher(e.detail.suggestions, e.detail.suggestions.pop());
    });

    segmentedSearch.afterEffects();

    for (let field of mandatoryFields) {
      field.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          let emptyField = null;
          for (let _field of mandatoryFields) {
            if (!_field.value) {
              emptyField = _field;
              break;
            }
          }
          if (emptyField) {
            emptyField.focus();
          } else {
            btnInsert.click();
          }
        }
      })
    }
  }).fail(() => {

  });


}

