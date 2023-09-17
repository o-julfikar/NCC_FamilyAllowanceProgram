<?php

  include "connect.php";
  include "auth_engine.php";
  include "query-helper.php";

  $method = "";
  $args = [];

  function insertBeneficiary($conn, $user, $projectID, $cCorp, $wardNo, $area, $name, $nid, $phone, $birthdate, $occupation, $spouseNID, $parentNID): void {
    $sqlVerifyModerator = "SELECT * FROM project_moderators WHERE Moderator_ID=$user[id] AND Project_ID=$projectID";
    if (mysqli_num_rows(mysqli_query($conn, $sqlVerifyModerator))) {
      // Moderator Verified

      // Encoding chars using URL Encoding
      list($cCorp, $wardNo, $area, $name, $nid, $phone, $birthdate, $occupation, $spouseNID, $parentNID) = encode($cCorp, $wardNo, $area, $name, $nid, $phone, $birthdate, $occupation, $spouseNID, $parentNID);

      $nidGroup = group($nid, $spouseNID, $parentNID);

      $sqlGetBeneficiary =
        "SELECT * FROM beneficiary " .
        "WHERE Project_ID = $projectID AND (NID IN ($nidGroup) OR Spouse_NID in ($nidGroup) OR Parent_NID in ($nidGroup))";

      $resultBeneficiary = mysqli_query($conn, $sqlGetBeneficiary);

      if ($rowBeneficiary = mysqli_fetch_assoc($resultBeneficiary)) {
        // Duplicate Entry
        echo createJSON(8, array_map(fn($v) => decode($v), $rowBeneficiary));
      } else {
        // New Entry

        if ($spouseNID == "NA") $spouseNID = "";
        if ($parentNID == "NA") $parentNID = "";

        $sqlInsertBeneficiary =
          "INSERT INTO beneficiary (Project_ID, NID, City_corporation, Ward_no, Area, Name, Phone, Birthdate, Occupation, Spouse_NID, Clerk_ID) " .
          "VALUES ($projectID, '$nid', '$cCorp', '$wardNo', '$area', '$name', '$phone', '$birthdate', '$occupation', '$spouseNID', $user[id])"
        ;

        if ($spouseNID != "" && $parentNID != "") {
          echo createJSON(2, "A beneficiary cannot register for both spouse and parent. Only unmarried beneficiary can add their parent's NID.");
          return;
        } else if ($spouseNID == "") {
          $sqlInsertBeneficiary =
            "INSERT INTO beneficiary (Project_ID, NID, City_corporation, Ward_no, Area, Name, Phone, Birthdate, Occupation, Parent_NID, Clerk_ID) " .
            "VALUES ($projectID, '$nid', '$cCorp', '$wardNo', '$area', '$name', '$phone', '$birthdate', '$occupation', '$parentNID', $user[id])"
          ;
        }

        if (mysqli_query($conn, $sqlInsertBeneficiary)) {
          echo createJSON(1, "Beneficiary added successfully");
        } else {
          echo createJSON(2, "An unknown error occurred while adding the beneficiary. Please try again later.");
        }
      }

    } else {
      echo createJSON(4, "You do not have access to this project.");
    }
  }

  function insertBeneficiariesFromTextFiles($conn, $user, $projectID, $offset, $limit, $inputFile, $delimiter="\t", $headerColumns=0, $headerRows=0): void {
    $percentCounter = -1;
    $sqlVerifyModerator = "SELECT * FROM project_moderators WHERE Moderator_ID=$user[id] AND Project_ID=$projectID";
    if (mysqli_num_rows(mysqli_query($conn, $sqlVerifyModerator))) {
      // Moderator Verified

      $filename = $inputFile["tmp_name"];
      $beneficiariesFile = fopen($filename, 'r');
      $beneficiariesFileSize = filesize($filename);
      $beneficiariesFileText = fread($beneficiariesFile, $beneficiariesFileSize);
      $beneficiaries = array_map(fn($line):array => explode($delimiter, $line), array_slice(explode("\n", $beneficiariesFileText), $headerRows));
      $offset = preg_match("/\d+/", $offset)? intval($offset) : 0;
      $limit = preg_match("/\d+/", $limit)? intval($limit) + 1 : 10000;

      $duplicateEntries = [];
      $duplicateCount = 0;
      $failedEntries = [];
      $failCount = 0;
      $successCount = 0;

      set_time_limit(9000);
      for ($i = $offset; $i < sizeof($beneficiaries) && $i < $offset + $limit; $i++) {

        while (intval(($i - $offset) * 100 / ($limit)) > $percentCounter) {
          $percentCounter++;
          echo ".";

          ob_flush();
          flush();
        }

        $beneficiary = $beneficiaries[$i];
        if ($headerColumns) $beneficiary = array_slice($beneficiary, $headerColumns);

        if (is_array($beneficiary) && sizeof($beneficiary) != 10) continue;
//        println(implode(", ", $beneficiary));

        list($cCorp, $wardNo, $area, $name, $nid, $phone, $birthdate, $occupation, $spouseNID, $parentNID) = encode(...$beneficiary);
//        println(implode(", ", $beneficiary));

        $nidGroup = group($nid, $spouseNID, $parentNID);

        $sqlGetBeneficiary =
          "SELECT * FROM beneficiary " .
          "WHERE Project_ID = $projectID " .
          "      AND (NID IN ($nidGroup) OR Spouse_NID in ($nidGroup) OR Parent_NID in ($nidGroup))";

        $resultBeneficiary = mysqli_query($conn, $sqlGetBeneficiary);


        // Remove NAs
        list($cCorp, $wardNo, $area, $name, $nid, $phone, $birthdate, $occupation, $spouseNID, $parentNID) = array_map(function ($v) {return $v == "NA"? "" : $v;}, array($cCorp, $wardNo, $area, $name, $nid, $phone, $birthdate, $occupation, $spouseNID, $parentNID));

        if ($rowBeneficiary = mysqli_fetch_assoc($resultBeneficiary)) {
          // Duplicate Entry
//          $duplicateEntries[] = $rowBeneficiary;
          $duplicateCount++;
        } else {
          // New Entry

          $birthdate = implode("/", array_reverse(explode("/", $birthdate)));
          $sqlInsertBeneficiary =
            "INSERT INTO beneficiary (Project_ID, NID, City_corporation, Ward_no, Area, Name, Phone, Birthdate, Occupation, Spouse_NID, Clerk_ID) " .
            "VALUES ($projectID, '$nid', '$cCorp', '$wardNo', '$area', '$name', '$phone', '$birthdate', '$occupation', '$spouseNID', $user[id])"
          ;

//          println($sqlInsertBeneficiary);

          if ($spouseNID != "" && $parentNID != "") {
//            $failedEntries[] = $beneficiary;
            $failCount++;
            continue;
          } else if ($spouseNID == "") {
            $sqlInsertBeneficiary =
              "INSERT INTO beneficiary (Project_ID, NID, City_corporation, Ward_no, Area, Name, Phone, Birthdate, Occupation, Parent_NID, Clerk_ID) " .
              "VALUES ($projectID, '$nid', '$cCorp', '$wardNo', '$area', '$name', '$phone', '$birthdate', '$occupation', '$parentNID', $user[id])"
            ;
          }

          $successCount += 1;
          try {
            if (!mysqli_query($conn, $sqlInsertBeneficiary)) {
              $successCount -= 1;
//              $failedEntries[] = $beneficiary;
              $failCount++;
            }
          } catch (Exception $ex) {
            echo $sqlGetBeneficiary, PHP_EOL;
            echo $sqlInsertBeneficiary, PHP_EOL;
          }
        }
      }

      while (100 > $percentCounter) {
        $percentCounter++;
        echo ".";

        ob_flush();
        flush();

        usleep(100);
      }

      echo createJSON(1, [
        "successCount" => $successCount,
        "duplicateCount" => $duplicateCount,
        "failCount" => $failCount
      ]);
    } else {
      echo createJSON(4, "You do not have access to this project.");
    }
  }

  function insertBeneficiariesFromTSV($conn, $user, $projectID, $offset, $limit, $inputFile): void {
    insertBeneficiariesFromTextFiles($conn, $user, $projectID, $offset, $limit, $inputFile, "\t");
  }

  function insertBeneficiariesFromCSV($conn, $user, $projectID, $offset, $limit, $inputFile): void {
    insertBeneficiariesFromTextFiles($conn, $user,$projectID, $offset, $limit, $inputFile, ",", 1, 2);
  }

  function deleteBeneficiary($conn, $user, $projectID, $beneficiaryNID): void {
//    global $beneficiaryKeys;
    $sqlVerifyModerator = "SELECT * FROM project_moderators WHERE Moderator_ID=$user[id] AND Project_ID=$projectID";
    if (mysqli_num_rows(mysqli_query($conn, $sqlVerifyModerator))) {
      // Moderator Verified
      echo createJSON(1, "Moderator Verified for " . $beneficiaryNID);
    } else {
      echo createJSON(4, "You do not have access to this project.");
    }
  }

  function loadBeneficiaries($conn, $user, $projectID, $searchKey): void {
    global $beneficiaryKeys;
    $sqlVerifyModerator = "SELECT * FROM project_moderators WHERE Moderator_ID=$user[id] AND Project_ID=$projectID";
    if (mysqli_num_rows(mysqli_query($conn, $sqlVerifyModerator))) {
      // Moderator Verified
      $searchDict = [];
      $limit = 100;
      $offset = 0;

      $sqlGetBeneficiaries =
        "SELECT ". implode(", ", $beneficiaryKeys) . " " .
        "FROM beneficiary " .
        "WHERE Project_ID = $projectID ORDER BY Created_on LIMIT $offset, $limit";// {$searchDict['LIMIT'][0]}

      if ($searchKey) {
        $searchSegments = explode("\t", $searchKey);
        $querySegments = ["Project_ID = $projectID"];
        $keyMapper = [
          "city-corporation" => "City_Corporation",
          "ward" => "Ward_no",
          "area" => "Area",
          "beneficiary-name" => "Name",
          "beneficiary-nid" => "NID",
          "phone" => "Phone",
          "birthdate" => "Birthdate",
          "birthdate-before" => "Birthdate BEFORE",
          "birthdate-after" => "Birthdate After",
          "occupation" => "Occupation",
          "spouse-nid" => "Spouse_NID",
          "parent-nid" => "Parent_NID",
          "nid-matches" => "NID in",
          "clerk" => "Clerk_ID",
        ];

        foreach ($searchSegments as $searchSegment) {
          if (!$searchSegment) continue;
          if (preg_match("/^[^:]+:[^:]+$/", $searchSegment)) {
            list($key, $value) = explode(":", $searchSegment);
            $key = trim($key);
            $tmp = [];

            if (key_exists($key, $keyMapper)) {
              foreach (explode(",", $value) as $item) {
                if (trim($item)) {
                  $tmp[] = "$keyMapper[$key] LIKE '%" . encode(trim($item))[0] . "%'";
                }
              }
              $searchDict[$keyMapper[$key]] = $tmp;
            } else if (preg_match("/^(\d+)$/", trim($value))) {
              if (strtolower($key) == "limit") $limit = trim($value);
              if (strtolower($key) == "offset") $offset =  intval(trim($value)) - 1;
            } else if ($key == "all") {
              foreach (explode(",", $value) as $item) {
                if (trim($item)) {
                  $tmp[] = encode(trim($item))[0];
                }
              }
              $searchDict[$key] = $tmp;
            }
          }
        }

        foreach ($searchDict as $key => $values) {
          if ($key == "all") {
            $tempSegments = [];
            foreach ($values as $value) {
              $tempSegments[] = "'$value' IN (" . implode(", ", $beneficiaryKeys) . ")";
            }
            $querySegments[] = "(" . implode(' OR ', $tempSegments) . ")";
          } else {
            $querySegment = " (" . implode(" OR ", $values) . ") ";
            $querySegments[] = $querySegment;
          }
        }

        $queryFilters = implode(" AND ", $querySegments);

        $sqlGetBeneficiaries =
          "SELECT ". implode(", ", $beneficiaryKeys) . " ".
          "FROM beneficiary " .
          "WHERE " . $queryFilters . " ORDER BY Created_on" .
          " LIMIT $offset, $limit";

      }

      $resultBeneficiaries = mysqli_query($conn, $sqlGetBeneficiaries);
      $beneficiaries = [];
      $rowCount = $offset + 1;

      while ($row_beneficiary = mysqli_fetch_assoc($resultBeneficiaries)) {
        $beneficiary = $row_beneficiary;

        // Decoding chars using URL Encoding
        foreach($beneficiaryKeys as $key) $beneficiary[$key] = urldecode($beneficiary[$key]);

        $beneficiaries[] = array_merge(["RowCount" => engToBanglaNumeric($rowCount++)], $beneficiary);
      }

      echo createJSON(1, $beneficiaries);

    } else {
      echo createJSON(4, "You do not have access to this project.");
    }
  }

  function updateBeneficiary($conn, $user, $projectID, $beneficiaryNID): void {
//    global $beneficiaryKeys;
    $sqlVerifyModerator = "SELECT * FROM project_moderators WHERE Moderator_ID=$user[id] AND Project_ID=$projectID";
    if (mysqli_num_rows(mysqli_query($conn, $sqlVerifyModerator))) {
      // Moderator Verified
      echo createJSON(1, "Moderator Verified for " . $beneficiaryNID);
    } else {
      echo createJSON(4, "You do not have access to this project.");
    }
  }

  function loadSuggestions($conn, $user, $projectID, $key, $searchKey): void {
    $sqlVerifyModerator = "SELECT * FROM project_moderators WHERE Moderator_ID=$user[id] AND Project_ID=$projectID";
    if (mysqli_num_rows(mysqli_query($conn, $sqlVerifyModerator))) {
      // Moderator Verified
      $keyMapper = [
        "city-corporation" => "beneficiary.City_Corporation",
        "ward" => "beneficiary.Ward_no",
        "area" => "beneficiary.Area",
        "beneficiary-name" => "beneficiary.Name",
        "beneficiary-nid" => "beneficiary.NID",
        "phone" => "beneficiary.Phone",
        "birthdate" => "beneficiary.Birthdate",
        "birthdate-before" => "Birthdate BEFORE",
        "birthdate-after" => "Birthdate After",
        "occupation" => "beneficiary.Occupation",
        "spouse-nid" => "beneficiary.Spouse_NID",
        "parent-nid" => "beneficiary.Parent_NID",
        "nid-matches" => "NID in",
        "clerk" => "Clerk_ID",
      ];
      $columnFor = [
        "city-corporation" => "beneficiary.City_Corporation",
        "ward" => "beneficiary.Ward_no",
        "area" => "beneficiary.Area",
        "beneficiary-name" => "beneficiary.Name",
        "beneficiary-nid" => "beneficiary.NID",
        "phone" => "beneficiary.Phone",
        "birthdate" => "beneficiary.Birthdate",
        "birthdate-before" => "Birthdate BEFORE",
        "birthdate-after" => "Birthdate After",
        "occupation" => "beneficiary.Occupation",
        "spouse-nid" => "beneficiary.Spouse_NID",
        "parent-nid" => "beneficiary.Parent_NID",
        "nid-matches" => "NID in",
        "clerk" => "user.Name",
      ];

      $sqlGetSuggestion = "SELECT DISTINCT($columnFor[$key]) AS '$columnFor[$key]' FROM beneficiary LEFT JOIN user on beneficiary.Clerk_ID = user.ID WHERE Project_ID = $projectID LIMIT 1000";
      if ($searchKey) {
        $sqlGetSuggestion = "SELECT DISTINCT($columnFor[$key]) AS '$columnFor[$key]' FROM beneficiary LEFT JOIN user on beneficiary.Clerk_ID = user.ID WHERE Project_ID = $projectID AND $keyMapper[$key] LIKE '%$searchKey%' ORDER BY $keyMapper[$key] LIMIT 1000";
      }

      $resultSuggestion = mysqli_query($conn, $sqlGetSuggestion);
      $suggestions = [];

      while ($rowSuggestion = mysqli_fetch_assoc($resultSuggestion)) {
        $suggestion = trim(decode($rowSuggestion[$columnFor[$key]])[0]);
        if (!in_array($suggestion, $suggestions)) {
          $suggestions[] = $suggestion;
        }
      }

      echo createJSON(1, $suggestions);
    } else {
      echo createJSON(4, "You do not have access to this project.");
    }
  }


  if (isset($conn)) {
    $authUser = authenticate();
    if ($authUser["code"] == 1) {
      $user = $authUser["data"];
      if (isset($_REQUEST["method"])) {
        $method = $_REQUEST["method"];
        if (isset($_REQUEST["args"])) {
          $args = array_merge([$conn, $user], $_REQUEST["args"]);
        }

        switch ($method) {
          case "insertBeneficiary":
            insertBeneficiary(...$args);
            break;
          case "insertBeneficiariesFromTSV":
            $txtFile = $_FILES["inputFile"];
            $args = array_merge($args, [$txtFile]);
            insertBeneficiariesFromTSV(...$args);
            break;
          case "insertBeneficiariesFromCSV":
            $txtFile = $_FILES["inputFile"];
            $args = array_merge($args, [$txtFile]);
            insertBeneficiariesFromCSV(...$args);
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
          case "loadSuggestions":
            loadSuggestions(...$args);
            break;
          default:
            break;
        }
      }
    } else {
      echo createJSON($authUser["code"], $authUser["data"]);
    }
  } else {
    echo createJSON(0, "Database connection parameters missing.");
  }
