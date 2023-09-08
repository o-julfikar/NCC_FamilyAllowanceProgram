import {auth} from "./auth.js";
import {encodeSafeJSON} from "./json-engine.js";
import {logout} from "./account.js";

let tableProject = document.getElementById("tableProjects");
let newProjectContainer = document.getElementsByClassName("new-project-container")[0];
let btnLogout = document.getElementById("btnLogout");
let btnNewProject = document.getElementById("btnNewProject");
let btnAdmin = document.getElementById("btnAdmin");
let btnClose = document.getElementById("btnClose");
let btnCreate = document.getElementById("btnCreate");
let projectSection = document.getElementsByClassName("project-section")[0];
let accountSection = document.getElementsByClassName("account-section")[0];
let txtProjectName = document.getElementById("txtProjectName");

btnAdmin.addEventListener('click', () => {
  window.location = "admin.html";
})

btnNewProject.onclick = function () {
  newProjectContainer.classList.add("open-popup");
}

btnClose.onclick = function () {
  newProjectContainer.classList.remove("open-popup");
}

btnCreate.onclick = function () {
  createProject(txtProjectName.value);
  btnClose.click();
}

btnLogout.onclick = () => {logout("index.html", "", [projectSection, accountSection])}

function loadProjects() {
  let projectsRequest = new XMLHttpRequest();
  projectsRequest.onload = function () {
    let response = JSON.parse(this.responseText);

    switch (response.code) {
      case 1:
        let projects = response.data;
        let tableBody = tableProject.getElementsByTagName("tbody")[0];

        for (let i = 0; i < projects.length; i++) {
          let projectRow = tableBody.insertRow(-1);
          let projectCell = projectRow.insertCell(0);
          projectCell.setAttribute("projectid", projects[i].id);
          projectCell.innerHTML = projects[i].name;
          projectRow.onclick = function () {
            open(`project.html?id=${projects[i].id}`, "_self");
          }
        }
        break;
      case 2:
        alert(response.data);
        break;
      default:
        alert("An unknown error occurred. Please try again later!");
        break;
    }
  }

  projectsRequest.open("GET", "projects.php?method=getAllProjects");
  projectsRequest.send();
}

function createProject(projectName) {
  let projectInsertRequest = new XMLHttpRequest();
  projectInsertRequest.onload = function () {
    let response = encodeSafeJSON(this.responseText);

    switch (response.code) {
      case 1:
        let project = response.data;
        let tableBody = tableProject.getElementsByTagName("tbody")[0];
        let projectRow = tableBody.insertRow(-1);
        let projectCell = projectRow.insertCell(0);

        projectCell.setAttribute("projectid", project.id);
        projectCell.innerHTML = project.name;
        projectRow.onclick = function () {
          open(`project.html?id=${project.id}`, "_self");
        }
        break;
      case 2:
        alert(response.data);
        break;
      default:
        alert("An unknown error occurred. Please try again later!");
        break;
    }
  }

  projectInsertRequest.open("GET", `projects.php?method=insertProject&args=${projectName}`)
  projectInsertRequest.send();
}

Array.from(tableProject.getElementsByTagName("tbody")[0].getElementsByTagName("tr")).forEach((row, index) => {
  row.addEventListener('click', () => {
    window.location = "project.html";
  });
});

auth("index.html", "", [projectSection, accountSection], [], [], []);
loadProjects();
