<?php

  include "connect.php";
  include "auth_engine.php";

  $method = $args = "";

  if (isset($conn)) {
    $authUser = authenticate();
    if ($authUser["code"] == 1) {
      $user = $authUser["data"];
      if (isset($_REQUEST["method"])) {
        $method = $_REQUEST["method"];
        if (isset($_REQUEST["args"])) {
          $args = array_merge(array($conn, $user), explode(";", $_REQUEST["args"]));
        }

        switch ($method) {
          case "insertBeneficiary":
            insertBeneficiary(...$args);
            break;
          case "insertBeneficiariesFromTXT":
            $txtFile = $_FILES["inputFile"];
            $args = array_merge($args, array($txtFile));
            insertBeneficiariesFromTXT(...$args);
            break;
          case "deleteBeneficiary":
            deleteBeneficiary(...$args);
            break;
          case "loadBeneficiaries":
            loadBeneficiaries(...$args);
            break;
          case "updateBeneficiary":
            updateBeneficiary(...$args);
            break;
          default:
            break;
        }
      }
    } else {
      echo json_encode($authUser);
    }
  } else {
    echo json_encode(array(
      "code" => 0,
      "data" => "Database connection parameters missing."
    ));
  }

  function insertBeneficiary($conn, $user, $projectID, $cCorp, $wardNo, $area, $name, $nid, $phone, $birthdate, $occupation, $spouseNID, $parentNID) {
    $sqlVerifyModerator = "SELECT * FROM project_moderators WHERE Moderator_ID=$user[id] AND Project_ID=$projectID";
    if (mysqli_num_rows(mysqli_query($conn, $sqlVerifyModerator))) {
      // Moderator Verified
      $nidArray = [];
      foreach (array($nid, $spouseNID, $parentNID) as $_nid) if ($_nid && $_nid != "NA") $nidArray[] = $_nid;
      $nidGroup = implode(", ", $nidArray);

      $sqlGetBeneficiary =
        "SELECT * FROM beneficiary " .
        "WHERE Project_ID = $projectID AND (NID IN ($nidGroup) OR Spouse_NID in ($nidGroup) OR Parent_NID in ($nidGroup))";

      $resultBeneficiary = mysqli_query($conn, $sqlGetBeneficiary);

      if ($rowBeneficiary = mysqli_fetch_assoc($resultBeneficiary)) {
        // Duplicate Entry
        echo json_encode(array(
          "code" => 8, # Duplicate entry
          "data" => $rowBeneficiary
        ));
      } else {
        // New Entry

        if ($spouseNID == "NA") $spouseNID = "";
        if ($parentNID == "NA") $parentNID = "";

        $sqlInsertBeneficiary =
          "INSERT INTO beneficiary (Project_ID, NID, City_corporation, Ward_no, Area, Name, Phone, Birthdate, Occupation, Spouse_NID, Clerk_ID) " .
          "VALUES ($projectID, '$nid', '$cCorp', $wardNo, '$area', '$name', '$phone', '$birthdate', '$occupation', '$spouseNID', $user[id])"
        ;

        if ($spouseNID != "" && $parentNID != "") {
          echo json_encode(array(
            "code" => 2,
            "data" => "A beneficiary cannot register for both spouse and parent. Only unmarried beneficiary can add their parent's NID."
          ));
          return;
        } else if ($spouseNID == "") {
          $sqlInsertBeneficiary =
            "INSERT INTO beneficiary (Project_ID, NID, City_corporation, Ward_no, Area, Name, Phone, Birthdate, Occupation, Parent_NID, Clerk_ID) " .
            "VALUES ($projectID, '$nid', '$cCorp', $wardNo, '$area', '$name', '$phone', '$birthdate', '$occupation', '$parentNID', $user[id])"
          ;
        }

        if (mysqli_query($conn, $sqlInsertBeneficiary)) {
          echo json_encode(array(
            "code" => 1,
            "data" => "Beneficiary added successfully"
          ));
        } else {
          echo json_encode(array(
            "code" => 2,
            "data" => "An unknown error occurred while adding the beneficiary. Please try again later."
          ));
        }
      }

    } else {
      echo json_encode(array(
        "code" => 4,
        "data" => "You do not have access to this project."
      ));
    }
  }
  function insertBeneficiariesFromTXT($conn, $user, $projectID, $inputFile) {
    $filename = $inputFile["tmp_name"];
    $beneficiariesFile = fopen($filename, 'r');
    $beneficiariesFileSize = filesize($filename);
    $beneficiariesFileText = fread($beneficiariesFile, $beneficiariesFileSize);
    $beneficiaries = explode("\n", $beneficiariesFileText);
    for ($i = 0; $i < sizeof($beneficiaries); $i++) $beneficiaries[$i] = explode("\t", $beneficiaries[$i]);

    $sqlVerifyModerator = "SELECT * FROM project_moderators WHERE Moderator_ID=$user[id] AND Project_ID=$projectID";
    if (mysqli_num_rows(mysqli_query($conn, $sqlVerifyModerator))) {
      // Moderator Verified
      $duplicateEntries = [];
      $failedEntries = [];
      $successCount = 0;

      set_time_limit(9000);
      foreach ($beneficiaries as $beneficiary) {
        list($cCorp, $wardNo, $area, $name, $nid, $phone, $birthdate, $occupation, $spouseNID, $parentNID) = $beneficiary;
        $nidArray = [];
        foreach (array($nid, $spouseNID, $parentNID) as $_nid) if ($_nid && $_nid != "NA") $nidArray[] = $_nid;
        $nidGroup = implode(", ", $nidArray);

        $sqlGetBeneficiary =
          "SELECT * FROM beneficiary " .
          "WHERE Project_ID = $projectID " .
          "      AND (NID IN ($nidGroup) OR Spouse_NID in ($nidGroup) OR Parent_NID in ($nidGroup))";

        $resultBeneficiary = mysqli_query($conn, $sqlGetBeneficiary);

        // Remove NAs
        list($cCorp, $wardNo, $area, $name, $nid, $phone, $birthdate, $occupation, $spouseNID, $parentNID) = array_map(function ($v) {return $v == "NA"? "" : $v;}, array($cCorp, $wardNo, $area, $name, $nid, $phone, $birthdate, $occupation, $spouseNID, $parentNID));

        if ($rowBeneficiary = mysqli_fetch_assoc($resultBeneficiary)) {
          // Duplicate Entry
          $duplicateEntries[] = $rowBeneficiary;
        } else {
          // New Entry

          $birthdate = implode("/", array_reverse(explode("/", $birthdate)));
          $sqlInsertBeneficiary =
            "INSERT INTO beneficiary (Project_ID, NID, City_corporation, Ward_no, Area, Name, Phone, Birthdate, Occupation, Spouse_NID, Clerk_ID) " .
            "VALUES ($projectID, '$nid', '$cCorp', $wardNo, '$area', '$name', '$phone', '$birthdate', '$occupation', '$spouseNID', $user[id])"
          ;

          if ($spouseNID != "" && $parentNID != "") {
            $failedEntries[] = $beneficiary;
            continue;
          } else if ($spouseNID == "") {
            $sqlInsertBeneficiary =
              "INSERT INTO beneficiary (Project_ID, NID, City_corporation, Ward_no, Area, Name, Phone, Birthdate, Occupation, Parent_NID, Clerk_ID) " .
              "VALUES ($projectID, '$nid', '$cCorp', $wardNo, '$area', '$name', '$phone', '$birthdate', '$occupation', '$parentNID', $user[id])"
            ;
          }

          $successCount += 1;
          try {
            if (!mysqli_query($conn, $sqlInsertBeneficiary)) {
              $successCount -= 1;
              $failedEntries[] = $beneficiary;
            }
          } catch (Exception $e) {
            echo $sqlGetBeneficiary, PHP_EOL;
            echo $sqlInsertBeneficiary, PHP_EOL;
          }
        }
      }
      echo json_encode(array(
        "code" => 1,
        "data" => array(
          "successCount" => $successCount,
          "duplicateEntries" => $duplicateEntries,
          "failedEntries" => $failedEntries
        )
      ));
    } else {
      echo json_encode(array(
        "code" => 4,
        "data" => "You do not have access to this project."
      ));
    }
  }

  function deleteBeneficiary($conn, $user, $projectID, $beneficiaryNID) {
    $sqlVerifyModerator = "SELECT * FROM project_moderators WHERE Moderator_ID=$user[id] AND Project_ID=$projectID";
    if (mysqli_num_rows(mysqli_query($conn, $sqlVerifyModerator))) {
      // Moderator Verified

    } else {
      echo json_encode(array(
        "code" => 4,
        "data" => "You do not have access to this project."
      ));
    }
  }

  function loadBeneficiaries($conn, $user, $projectID, $searchKey) {
    $sqlVerifyModerator = "SELECT * FROM project_moderators WHERE Moderator_ID=$user[id] AND Project_ID=$projectID";
    if (mysqli_num_rows(mysqli_query($conn, $sqlVerifyModerator))) {
      // Moderator Verified
      $sqlGetBeneficiaries = "SELECT City_corporation, Ward_no, Area, Name, NID, Phone, Birthdate, Occupation, Spouse_NID, Parent_NID FROM beneficiary WHERE Project_ID = $projectID ORDER BY Created_on ASC LIMIT 100";
      if ($searchKey) $sqlGetBeneficiaries = "SELECT * FROM beneficiary WHERE Project_ID = $projectID AND $searchKey IN (Spouse_NID, NID, Name, Created_on, Area, Birthdate, City_corporation, Clerk_ID, Occupation, Parent_NID, Phone, Ward_no) LIMIT 100";

      $resultBeneficiaries = mysqli_query($conn, $sqlGetBeneficiaries);
      $beneficiaries = [];

      while ($row_beneficiary = mysqli_fetch_assoc($resultBeneficiaries)) {
        $beneficiaries[] = $row_beneficiary;
      }

      echo json_encode(array(
        "code" => 1,
        "data" => $beneficiaries
      ));

    } else {
      echo json_encode(array(
        "code" => 4,
        "data" => "You do not have access to this project."
      ));
    }
  }

  function updateBeneficiary($conn, $user, $projectID, $beneficiaryNID) {
    $sqlVerifyModerator = "SELECT * FROM project_moderators WHERE Moderator_ID=$user[id] AND Project_ID=$projectID";
    if (mysqli_num_rows(mysqli_query($conn, $sqlVerifyModerator))) {
      // Moderator Verified

    } else {
      echo json_encode(array(
        "code" => 4,
        "data" => "You do not have access to this project."
      ));
    }
  }
