<?php

  include "connect.php";
  include "query-helper.php";

  session_start();

  function createSessionQuery($userID, $sessionKey): string {
    return
      "INSERT INTO session (user_id, session_key, created_on, duration) " .
      "VALUES ($userID, '$sessionKey', CURRENT_TIMESTAMP, 90)";
  }

  function login($email, $password, $sendReport = false): int {
    global $conn, $sql_get_user;
    if (isset($conn)) {
      $result_user = mysqli_query($conn, $sql_get_user);

      if (mysqli_num_rows($result_user) > 0) {
        $row = mysqli_fetch_assoc($result_user);

        if ($password === $row['Password']) {
          $name = $row["Name"];
          $user_id = $row["ID"];

          $session_key = md5($name . $email . date("h:i:s a MMMM DD, YYYY"));
          mysqli_query($conn, createSessionQuery($user_id, $session_key));

          $sql_get_session = "SELECT * FROM session WHERE user_id=$user_id";
          $result_session = mysqli_query($conn, $sql_get_session);

          $selected_session = null;
          $session_duration = 0;

          while ($session_row = mysqli_fetch_assoc($result_session)) {
            $current_session_duration = strtotime($session_row['created_on']);
            $current_session_duration = strtotime("+ $session_row[duration] days", $current_session_duration);

            if ($current_session_duration > $session_duration) {
              $session_duration = $current_session_duration;
              $selected_session = $session_row['session_key'];
            }
          }

          if (isset($selected_session)) {
            $_SESSION["session_key"] = $session_key;
            $_SESSION["user_id"] = $user_id;
            if ($sendReport) return 1;
            else sendResponse(1, "Success");
          } else {
            sendResponse(2, "Failed to create session");
          }
        } else {
          sendResponse(-1, "Incorrect email or password", "Invalid Login");
        }
      } else {
        sendResponse(0, "User does not exist");
      }
    } else {
      sendResponse(520, "Unknown error occurred.");
    }
    return 0;
  }

  function register($name, $email, $password): void {
    global $conn, $sql_get_user;
    $result_user = mysqli_query($conn, $sql_get_user);
    if (mysqli_num_rows($result_user) > 0) {
      sendResponse(12, "User already exist. Please login!");
    } else {
      if (strlen($name) > 0 && filter_var($email, FILTER_VALIDATE_EMAIL) && strlen($password) > 6) {
        $sql_insert_user =
          "INSERT INTO user (Name, Email, Password, Role, Status) " .
          " VALUES ('$name', '$email', '$password', 1, 0)";

        if (mysqli_query($conn, $sql_insert_user)) {
          switch (login($email, $password)) {
            case 1:
              sendResponse(1, "Success");
              break;
            default:
              sendResponse(12, "Registration was successful but could not start your session. Please try again later!", "Session Error");
              break;
          }
        } else {
          sendResponse(2, "Failed to create your account. Please try again later!");
        }
      } else {
        sendResponse(2, "Please make sure you have entered valid information and try again. If error persist, please check your internet connection.");
      }
    }
  }

  if (isset($_POST["submit"])) {
    if (isset($_POST["email"]) && isset($_POST["password"])) {
      $email = $_REQUEST["email"];
      $password = $_REQUEST["password"];
      $sql_get_user = "SELECT * FROM user WHERE Email='$email'";

      // Hashing the password
      $password = md5($password . $email);

      if (isset($_POST["method"])) {
        $method = $_POST["method"];

        switch ($method) {
          case "login":
            login($email, $password);
            break;
          case "register":
            if (isset($_POST["name"])) {
              $name = $_POST["name"];
              register($name, $email, $password);
            } else {
              sendResponse(2, "Name parameter missing.");
            }
            break;
          default:
            sendResponse(2, "Method not supported!");
        }
      }
    } else {
      sendResponse(2, "Email and/ or password is/ are missing.");
    }
  } else {
    openURL("index.html");
  }




