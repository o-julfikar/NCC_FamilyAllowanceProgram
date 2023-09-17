<?php

  include "connect.php";
  include "auth_engine.php";

  $methodName = "";
  $args = [];

  function getAllProjects(): void {
    global $conn;
    if (isset($conn)) {

      $authUser = authenticate();

      if ($authUser["code"] == 1) {
        $user = $authUser["data"];

        $sqlGetProjects =
          "SELECT project.ID AS id, project.Name AS name, project.Created_on AS created_on " .
          "FROM project " .
          "INNER JOIN project_moderators pm ON project.ID = pm.Project_ID " .
          "WHERE pm.Moderator_ID=$user[id] " .
          "ORDER BY project.Created_on ASC";
        $resultProjects = mysqli_query($conn, $sqlGetProjects);
        $projects = [];

        while ($rowProjects = mysqli_fetch_assoc($resultProjects)) {
          $projects[] = $rowProjects;
        }

        echo json_encode(array(
          "code" => 1,
          "data" => $projects
        ));

      } else {
        echo json_encode(array(
          "code" => 10,
          "data" => $authUser["data"]
        ));
      }
    } else {
      echo json_encode(array(
        "code" => 502,
        "data" => "An unknown error occurred. Please try again later!"
      ));
    }
  }

  function insertProject($projectName): void {
    global $conn;
    if (isset($conn)) {

      $authUser = authenticate();

      if ($authUser["code"] == 1) {
        $user = $authUser["data"];

        $sqlInsertProject =
          "INSERT INTO project (Name, Created_on, Owner_ID) " .
          "VALUES ('$projectName', CURRENT_TIMESTAMP, $user[id])";

        if (mysqli_query($conn, $sqlInsertProject)) {

          $sqlGetProject = "SELECT * FROM project WHERE Name='$projectName' AND Owner_ID=$user[id]";
          $resultProject = mysqli_query($conn, $sqlGetProject);

          if (mysqli_num_rows($resultProject)) {
            $project = mysqli_fetch_assoc($resultProject);
            $projectID = $project["ID"];

            $sqlInsertModerator =
              "INSERT INTO project_moderators (Moderator_ID, Project_ID) " .
              "VALUES ($user[id], $projectID)";

            if (mysqli_query($conn, $sqlInsertModerator)) {
              echo json_encode(array(
                "code" => 1,
                "data" => array(
                  "id" => $projectID,
                  "name" => $projectName
                )
              ));
            } else {
              echo json_encode(array(
                "code" => 2,
                "data" => "$projectName has been created successfully. However, you have limited access to the project. Please contact administrators."
              ));
            }
            return;
          }
        }
        echo json_encode(array(
          "code" => 2,
          "data" => "Failed to create the project $projectName. Please try with a different name or try again later!"
        ));
      } else {
        echo json_encode(array(
          "code" => 10,
          "data" => $authUser["data"]
        ));
      }
    } else {
      echo json_encode(array(
        "code" => 502,
        "data" => "An unknown error occurred. Please try again later!"
      ));
    }
  }

  function loadModerators($projectID): void {
    global $conn;
    if (isset($conn)) {

      $authUser = authenticate();

      if ($authUser["code"] == 1) {
        $user = $authUser["data"];
        $is_moderator = false;

        $sqlGetModerators =
          "SELECT project.Name as title, moderator.ID AS id, moderator.Name AS name FROM project_moderators " .
          "INNER JOIN user moderator ON moderator.ID = project_moderators.Moderator_ID " .
          "INNER JOIN project ON project.ID = project_moderators.Project_ID " .
          "WHERE project_id=$projectID";
        $resultModerators = mysqli_query($conn, $sqlGetModerators);
        $projectTitle = "";
        $moderators = [];

        while ($row_moderator = mysqli_fetch_assoc($resultModerators)) {
          $moderators[] = $row_moderator;
          $projectTitle = $row_moderator["title"];
          $is_moderator |= $user["id"] == $row_moderator["id"];
        }

        if ($is_moderator) {
          echo json_encode(array(
            "code" => 1,
            "data" => $moderators,
            "title" => $projectTitle,
          ));
        } else {
          echo json_encode(array(
            "code" => 3,
            "data" => "You do not have access to this project. Please contact the project moderators if you know them."
          ));
        }

      } else {
        echo json_encode(array(
          "code" => 10,
          "data" => $authUser["data"]
        ));
      }
    } else {
      echo json_encode(array(
        "code" => 502,
        "data" => "An unknown error occurred. Please try again later!"
      ));
    }
  }

  function addModerator($projectID, $moderatorEmail): void {
    global $conn;
    if (isset($conn)) {

      $authUser = authenticate();

      if ($authUser["code"] == 1) {
        $user = $authUser["data"];

        $sqlVerifyModerator =
          "SELECT * FROM project_moderators " .
          "WHERE Project_ID=$projectID AND Moderator_ID=$user[id]";
        $resultVerifyModerator = mysqli_query($conn, $sqlVerifyModerator);

        if (mysqli_num_rows($resultVerifyModerator) > 0) {
          $sqlGetModerator = "SELECT * FROM user WHERE Email='$moderatorEmail'";

          if (($row_moderator = mysqli_fetch_assoc(mysqli_query($conn, $sqlGetModerator))) && $row_moderator["Status"] > 0) {
            $sqlInsertModerator = "INSERT INTO project_moderators (Moderator_ID, Project_ID) VALUES ($row_moderator[ID], $projectID)";

            if (mysqli_query($conn, $sqlInsertModerator)) {
              echo json_encode(array(
                "code" => 1,
                "data" => array(
                  "id" => $row_moderator["ID"],
                  "name" => $row_moderator["Name"]
                )
              ));
            } else {
              echo json_encode(array(
                "code" => 2,
                "data" => "At attempt to add $row_moderator[Name] to this project failed."
              ));
            }
          } else {
            echo json_encode(array(
              "code" => 2,
              "data" => "At attempt to add the moderator to this project failed. Moderator either has not been registered or activated."
            ));
          }
        } else {
          echo json_encode(array(
            "code" => 3,
            "data" => "You do not have access to this project. Please contact the project moderators if you know them."
          ));
        }

      } else {
        echo json_encode(array(
          "code" => 10,
          "data" => $authUser["data"]
        ));
      }
    } else {
      echo json_encode(array(
        "code" => 502,
        "data" => "An unknown error occurred. Please try again later!"
      ));
    }
  }

  function deleteModerator($projectID, $moderatorID): void {
    global $conn;
    if (isset($conn)) {

      $authUser = authenticate();

      if ($authUser["code"] == 1) {
        $user = $authUser["data"];

        $sqlGetProject = "SELECT * FROM project WHERE ID=$projectID";
        $resultProject = mysqli_query($conn, $sqlGetProject);

        if ($rowProject = mysqli_fetch_assoc($resultProject)) {
          if ($rowProject["Owner_ID"] == $user["id"]) {
            if ($moderatorID == $user["id"]) {
              $sqlGetModerators =
                "SELECT Moderator_ID AS moderator_id, moderator.Name as name FROM project_moderators " .
                "INNER JOIN user moderator ON moderator.ID = project_moderators.Moderator_ID " .
                "WHERE Project_ID=$projectID AND Moderator_ID != $user[id] AND moderator.Status > 0 " .
                "LIMIT 1";
              $resultModerators = mysqli_query($conn, $sqlGetModerators);
              $moderators = [];

              while ($rowModerators = mysqli_fetch_assoc($resultModerators)) {
                $moderators[] = $rowModerators;
              }

              // Implement ownership transfer to the most striving clerks
              if (count($moderators) > 0) {
                // Transferring ownership to the first moderator
                $sqlUpdateOwner = "UPDATE project SET Owner_ID=" . $moderators[0]['moderator_id'] . " WHERE ID=$projectID";
                if (mysqli_query($conn, $sqlUpdateOwner)) {
                  $sqlDeleteModerator = "DELETE FROM project_moderators WHERE Project_ID=$projectID AND Moderator_ID=$moderatorID";
                  if (mysqli_query($conn, $sqlDeleteModerator)) {
                    echo json_encode(array(
                      "code" => 3,
                      "data" => "You have been removed from the project successfully. Transferred the ownership to " . $moderators[0]['name']
                    ));
                  } else {
                    echo json_encode(array(
                      "code" => 2,
                      "data" => "Transferred the ownership to " . $moderators[0]['name'] . ". However, could not remove you from the moderators list at the moment. Please try again later!"
                    ));
                  }
                } else {
                  echo json_encode(array(
                    "code" => 2,
                    "data" => "Failed to transfer the ownership to " . $moderators[0]['name'] . ". Hence, you could not be removed from the moderators list. Add more moderators and try again or delete the project."
                  ));
                }
              } else {
                echo json_encode(array(
                  "code" => 2,
                  "data" => "There are no moderators available to transfer the ownership of this project. Please add moderator(s) and try again or delete the project."
                ));
              }
            } else {
              $sqlDeleteModerator = "DELETE FROM project_moderators WHERE Project_ID=$projectID AND Moderator_ID=$moderatorID";
              if (mysqli_query($conn, $sqlDeleteModerator)) {
                echo json_encode(array(
                  "code" => 1,
                  "data" => "Moderator removed successfully."
                ));
              } else {
                echo json_encode(array(
                  "code" => 2,
                  "data" => "Failed to remove the moderator. Please try again later!"
                ));
              }
            }
          } else if($rowProject["Owner_ID"] == $moderatorID) {
            echo json_encode(array(
              "code" => 2,
              "data" => "Only projects owner(s) can remove project owner(s) from the moderators list. Moderators cannot remove project owners."
            ));
          } else {
            $sqlVerifyModerator =
              "SELECT * FROM project_moderators " .
              "WHERE Project_ID=$projectID AND Moderator_ID=$user[id]";
            $resultVerifyModerator = mysqli_query($conn, $sqlVerifyModerator);

            if (mysqli_num_rows($resultVerifyModerator) > 0) {
              $sqlDeleteModerator = "DELETE FROM project_moderators WHERE Project_ID=$projectID AND Moderator_ID=$moderatorID";
              if (mysqli_query($conn, $sqlDeleteModerator)) {
                if ($moderatorID == $user["id"]) {
                  echo json_encode(array(
                    "code" => 3,
                    "data" => "You have been removed from the project successfully."
                  ));
                } else {
                  echo json_encode(array(
                    "code" => 1,
                    "data" => "Moderator removed successfully."
                  ));
                }
              } else {
                echo json_encode(array(
                  "code" => 2,
                  "data" => "Failed to remove the moderator. Please try again later!"
                ));
              }
            } else {
              echo json_encode(array(
                "code" => 2,
                "data" => "You do not have access to this project. Please contact the project moderators if you know them."
              ));
            }
          }
        } else {
          echo json_encode(array(
            "code" => 4,
            "data" => "Project could not be found."
          ));
        }
      } else {
        echo json_encode(array(
          "code" => 10,
          "data" => $authUser["data"]
        ));
      }
    } else {
      echo json_encode(array(
        "code" => 502,
        "data" => "An unknown error occurred. Please try again later!"
      ));
    }
  }

  function deleteProject($projectID): void {
    global $conn;
    if (isset($conn)) {

      $authUser = authenticate();

      if ($authUser["code"] == 1) {
        $user = $authUser["data"];

        $sqlGetProject = "SELECT * FROM project WHERE ID=$projectID";
        $resultProject = mysqli_query($conn, $sqlGetProject);

        if (mysqli_num_rows($resultProject)) {
          $project = mysqli_fetch_assoc($resultProject);

          if ($project["Owner_ID"] == $user["id"]) {
            $sqlDeleteProject = "DELETE FROM project WHERE ID=$projectID";

            if (mysqli_query($conn, $sqlDeleteProject)) {
              echo json_encode(array(
                "code" => 1,
                "data" => "Project deleted successfully."
              ));
            } else {
              echo json_encode(array(
                "code" => 2,
                "data" => "Despite your ownership to the project, you cannot delete the project at the moment. Please try again later."
              ));
            }
          } else {
            echo json_encode(array(
              "code" => 6,
              "data" => "You are not authorized. Only project owners can delete projects."
            ));
          }
        } else {
          echo json_encode(array(
            "code" => 4,
            "data" => "Project not found."
          ));
        }

      } else {
        echo json_encode(array(
          "code" => 10,
          "data" => $authUser["data"]
        ));
      }
    } else {
      echo json_encode(array(
        "code" => 502,
        "data" => "An unknown error occurred. Please try again later!"
      ));
    }
  }

  if (isset($_REQUEST["method"])) {
    $methodName = $_REQUEST["method"];
    if (isset($_REQUEST["args"])) {
      $args = $_REQUEST["args"];
    }

    switch ($methodName) {
      case "getAllProjects":
        getAllProjects();
        break;
      case "insertProject":
        insertProject(...$args);
        break;
      case "loadModerators":
        loadModerators(...$args);
        break;
      case "addModerator":
        addModerator(...$args);
        break;
      case "deleteModerator":
        deleteModerator(...$args);
        break;
      case "deleteProject":
        deleteProject(...$args);
        break;
      default:
        break;
    }
  }
