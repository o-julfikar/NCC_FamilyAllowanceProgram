<?php

  include "connect.php";
  session_start();

  function authenticate() {
    global $conn;
    if (isset($conn) && isset($_SESSION["session_key"]) && isset($_SESSION["user_id"])) {
      $user_id = $_SESSION["user_id"];
      $session_key = $_SESSION["session_key"];

      $sql_get_session = "SELECT * FROM session WHERE user_id=$user_id AND session_key='$session_key'";

      $result_session = mysqli_query($conn, $sql_get_session);

      if ($session_row = mysqli_fetch_assoc($result_session)) {
        $session_expiry = strtotime($session_row['created_on']);
        $session_expiry = strtotime("+ $session_row[duration] days", $session_expiry);
        $current_time = time();

        if ($session_expiry > $current_time) {
          $sql_get_user = "SELECT ID, Name, Role, Status FROM user WHERE ID=$user_id";
          $result_user = mysqli_query($conn, $sql_get_user);

          if ($user_row = mysqli_fetch_assoc($result_user)) {
            if ($user_row['Status'] > 0) {
              return (array(
                "code" => 1,
                "data" => array(
                  "id" => $user_row["ID"],
                  "name" => $user_row["Name"],
                  "role" => $user_row["Role"],
                  "status" => $user_row["Status"]
                )
              ));
            } else {
              return (array(
                "code" => 2,
                "data" => "Your account is not activated. Please try again later!"
              ));
            }
          }
        } else {
          return (array(
            "code" => 2,
            "data" => "Session expired"
          ));
        }
      }
    }
    return (array(
      "code" => 0,
      "data" => null
    ));
  }
