<?php

  include "connect.php";
  include "auth_engine.php";

  if (isset($conn)) {
    $auth_value = authenticate();

    if ($auth_value["code"] == 1) {
      $user = $auth_value["data"];

      // Check if the user is admin
      if ($user["role"] == 0) {
        $sql_get_anticipating_users = "SELECT ID, Name, Email, Role, Status FROM user WHERE Status=0";
        $result_anticipating_users = mysqli_query($conn, $sql_get_anticipating_users);
        $anticipating_users = [];

        while ($anticipating_users_row = mysqli_fetch_assoc($result_anticipating_users)) {
          $anticipating_users[] = $anticipating_users_row;
        }

        echo json_encode(array(
          "code" => 1,
          "data" => $anticipating_users
        ));
      } else {
        echo json_encode(array(
          "code" => 2,
          "data" => "Unauthorized access denied!"
        ));
      }
    } else {
      echo json_encode(array(
        "code" => 2,
        "data" => "Unauthorized access denied!"
      ));
    }
  } else {
    echo json_encode(array(
      "code" => 3,
      "data" => "Unknown error occurred!"
    ));
  }
