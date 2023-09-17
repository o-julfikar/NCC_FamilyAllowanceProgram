import {encodeSafeJSON} from "./json-engine.js";
import {logout} from "./account.js";
import * as MP from "./ModalPopup.js";
import {Auth} from "./Authenticator.js";

const mainContainer = document.getElementsByClassName("main")[0];
const tableProject = document.getElementById("tableProjects");
const btnLogout = document.getElementById("btnLogout");
const btnNewProject = document.getElementById("btnNewProject");
const btnAdmin = document.getElementById("btnAdmin");
const projectSection = document.getElementsByClassName("project-section")[0];
const accountSection = document.getElementsByClassName("account-section")[0];
const tableBody = tableProject.getElementsByTagName("tbody")[0];

btnAdmin.onclick = () => open("admin.html", "_self");
btnLogout.onclick = () => logout();

btnNewProject.onclick = function () {
  const newProjectWindows = MP.show("Add Project", MP.ModalContent.NONE, MP.ModalField.TEXT("Project Name"), MP.ModalButton.OK_CANCEL("Create", "Close"));
  const txtProjectName = newProjectWindows.fields["Project Name"];
  newProjectWindows.okButton.onclick = () => {
    let projectInsertRequest = new XMLHttpRequest();
    projectInsertRequest.onload = () => {
      const response = encodeSafeJSON(projectInsertRequest.responseText);

      switch (response.code) {
        case 1:
          const project = response.data;
          const projectRow = tableBody.insertRow(-1);
          const projectCell = projectRow.insertCell(0);

          projectCell.setAttribute("project_id", project.id);
          projectCell.innerHTML = project.name;
          projectRow.onclick = () => open(`project.html?id=${project.id}`, "_self");
          newProjectWindows.close();
          break;
        case 2:
          MP.show("Failed", MP.ModalContent.TEXT(response.data), MP.ModalField.NONE, MP.ModalButton.REFUSE("Close"), MP.ModalPopup.ERROR_BODY);
          break;
        default:
          MP.show("Error", MP.ModalContent.TEXT("An unknown error occurred. Please try again later."), MP.ModalField.NONE, MP.ModalButton.REFUSE("Close"), MP.ModalPopup.ERROR_BODY);
          break;
      }
    }

    const formData = new FormData();
    formData.set("method", "insertProject");
    formData.append("args[]", txtProjectName.value);

    projectInsertRequest.open("POST", `projects.php`);
    projectInsertRequest.send(formData);
  }
}

function loadProjects() {
  let projectsRequest = new XMLHttpRequest();
  projectsRequest.onload = () => {
    let response = encodeSafeJSON(projectsRequest.responseText);

    switch (response.code) {
      case 1:
        let projects = response.data;
        let tableBody = tableProject.getElementsByTagName("tbody")[0];

        for (let project of projects) {
          let projectRow = tableBody.insertRow(-1);
          let projectCell = projectRow.insertCell(0);
          projectCell.setAttribute("project_id", project.id);
          projectCell.innerHTML = project.name;
          projectRow.onclick = function () {
            open(`project.html?id=${project.id}`, "_self");
          }
        }
        break;
      case 2:
        MP.show(response.title, MP.ModalContent.TEXT(response.data), MP.ModalField.NONE, MP.ModalButton.REFUSE("Close"), MP.ModalPopup.ERROR_BODY);
        break;
      default:
        MP.show(response.title, MP.ModalContent.TEXT("An unknown error occurred. Please try again later!"), MP.ModalField.NONE, MP.ModalButton.REFUSE("Close"), MP.ModalPopup.ERROR_BODY);
        break;
    }
  }

  const formData = new FormData();
  formData.set("method", "getAllProjects");
  formData.append("args[]", "");

  projectsRequest.open("POST", "projects.php");
  projectsRequest.send(formData);
}

window.addEventListener("load", () => {
  Auth.run().success(() => {
    mainContainer.style.visibility = "visible";
    loadProjects();
  }).fail(() => {

  });
})
