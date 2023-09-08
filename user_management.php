<?php

  include "connect.php";
  include "auth_engine.php";

  if (isset($conn)) {
    $auth_value = authenticate();

    if ($auth_value["code"] == 1) {
      $user = $auth_value["data"];

      // Check if the user is admin
      if ($user["role"] == 0) {
        $approve = $_REQUEST["approve"] == "1";
        $anticipating_user_name = $_REQUEST["user_name"];
        $anticipating_user_id = $_REQUEST["user_id"];

        if (updateUserStatus($conn, $anticipating_user_id, $approve)) {
          echo json_encode(array(
            "code" => 1,
            "data" => "$anticipating_user_name has been " . $approve? 'activated' : 'disabled' . " successfully"
          ));
        } else {
          echo json_encode(array(
            "code" => 2,
            "data" => "An unknown error occurred while " . $approve? "activating" : "deactivating" . " $anticipating_user_name's status. Please try again later."
          ));
        }
      } else {
        echo json_encode(array(
          "code" => 4,
          "data" => "Unauthorized access denied!"
        ));
      }
    } else {
      echo json_encode(array(
        "code" => 2,
        "data" => $auth_value["data"]
      ));
    }
  } else {
    echo json_encode(array(
      "code" => 3,
      "data" => "Unknown error occurred!"
    ));
  }

  function updateUserStatus($conn, $user_id, $approve) {
    $approve = $approve? 1 : -1;

    $sql_approve_user =
      "UPDATE user " .
      "SET Status=$approve " .
      "WHERE ID=$user_id";

    return mysqli_query($conn, $sql_approve_user);
  }
