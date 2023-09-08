<?php

  include "connect.php";

  session_start();

  $name = $_REQUEST['name'];
  $email = $_REQUEST['email'];
  $password = $_REQUEST['password'];

  // Hashing the password
  $password = md5($password.$email);

  if (isset($conn) && strlen($name) > 0 && filter_var($email, FILTER_VALIDATE_EMAIL) && strlen($password) > 6) {
    $sql_get_user = "SELECT * FROM user WHERE Email='$email'";
    $result_user = mysqli_query($conn, $sql_get_user);

    if (mysqli_num_rows($result_user) > 0) {
      echo "-1";
    } else {

      $sql_insert_user =
        "INSERT INTO user (Name, Email, Password, Role, Status) " .
        " VALUES ('$name', '$email', '$password', 1, 0)";

      mysqli_query($conn, $sql_insert_user);

      $result_user = mysqli_query($conn, $sql_get_user);

      if (mysqli_num_rows($result_user) > 0) {
        $row = mysqli_fetch_assoc($result_user);
        $user_id = $row['ID'];

        $session_key = md5($name . $email . date("MMMM DD, YYYY"));

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
          $_SESSION['session_key'] = $session_key;
          $_SESSION['user_id'] = $user_id;

          echo "1";
        }
      } else {
        echo "0";
      }
    }

    return;
  }

  echo "502";
