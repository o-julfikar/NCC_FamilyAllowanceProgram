<?php

  include "connect.php";

  session_start();

  $email = $_REQUEST["email"];
  $password = $_REQUEST["password"];

  // Hashing the password
  $password = md5($password.$email);

  $sql_get_user = "SELECT * FROM user WHERE Email='$email'";



  if (isset($conn)) {
    $result_user = mysqli_query($conn, $sql_get_user);

    if (mysqli_num_rows($result_user) > 0) {
      $row = mysqli_fetch_assoc($result_user);

      if ($password === $row['Password']) {
        $name = $row["Name"];
        $user_id = $row["ID"];

        $session_key = md5($name . $email . date("h:i:s a MMMM DD, YYYY"));

        $sql_insert_session =
          "INSERT INTO session (user_id, session_key, created_on, duration) " .
          "VALUES ($user_id, '$session_key', CURRENT_TIMESTAMP, 90)";

        mysqli_query($conn, $sql_insert_session);

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
          echo "1"; // Success
        } else {
          echo "420";
        }
      } else {
        echo "-1"; // Incorrect Password
      }
    } else {
      echo "0"; // User does not exit
    }
  } else {
    echo "520";
  }
