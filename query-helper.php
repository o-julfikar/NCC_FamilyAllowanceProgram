<?php

  $beneficiaryKeys = ["City_corporation", "Ward_no", "Area", "Name", "NID", "Phone", "Birthdate", "Occupation", "Spouse_NID", "Parent_NID"];//

  function encode(...$args): array {
    for ($i = 0; $i < sizeof($args); $i++) $args[$i] = urlencode($args[$i]);

    return $args;
  }

  function decode(...$args): array {
    for ($i = 0; $i < sizeof($args); $i++) $args[$i] = urldecode($args[$i]);

    return $args;
  }

  function group(...$args): string {
    $validArgs = [];
    foreach ($args as $arg) if ($arg && $arg != "NA") $validArgs[] = "'$arg'";

    return implode(", ", $validArgs);
  }

  function clearDir($directoryPath, $timeLimit): bool {

    $currentTimestamp = time();

    if ($handle = opendir($directoryPath)) {
      while ($file = readdir($handle)) {
        $filePath = $directoryPath . $file;

        if (is_file($filePath)) {
          $fileCreationTimestamp = filemtime($filePath);
          $timeDifference = $currentTimestamp - $fileCreationTimestamp;

          if ($timeDifference >= $timeLimit * 60) {
            unlink($filePath);
            return true;
          }
        }
      }
      closedir($handle);
    }

    return false;
  }

  function createJSON($returnCode, $returnData): string {
    return json_encode(array("code" => $returnCode, "data" => $returnData));
  }

  function getBeneficiaryTableHeader(): string {
    $headerNames = [['১', 'ক্রঃ নং'], ['২', 'সিটি কর্পোরেশন'], ['৩', 'ওয়ার্ড নম্বর'], ['৪', 'বাড়ী বা মহল্লা'], ['৫', 'উপকারভোগীর নাম'], ['৬', 'এনআইডি নম্বর'], ['৭', 'মোবাইল নম্বর'], ['৮', 'জন্ম তারিখ (যদি থাকে)'], ['৯', 'পেশা'], ['১০', 'স্বামী বা স্ত্রীর এনআইডি'], ['১১', 'অবিবাহিত হলে পিতার এনআইডি']];
    $widths = [4, 10, 6, 10, 10, 10, 10, 10, 10, 10, 10];
    $i = 0;

    $nameHTML = "";
    $numHTML = "";


    foreach ($headerNames as list($headerNumber, $headerName)) {
      $nameHTML .= "<th style='font-family: kalpurush; font-size: 15px; width: $widths[$i]%; color: black;'>$headerName</th>";
      $numHTML .= "<th style='font-family: kalpurush; font-size: 15px; width: $widths[$i]%;'>$headerNumber</th>";
      $i++;
    }

    return "<thead><tr>$nameHTML</tr><tr>$numHTML</tr></thead>";
  }

  function engToBanglaNumeric($number): string {
    $number = strval($number);
    $mapper = [
      '0' => '০',
      '1' => '১',
      '2' => '২',
      '3' => '৩',
      '4' => '৪',
      '5' => '৫',
      '6' => '৬',
      '7' => '৭',
      '8' => '৮',
      '9' => '৯',
    ];

    $bngNumber = "";

    foreach (str_split($number) as $digit) $bngNumber .= $mapper[$digit];

    return $bngNumber;
  }

  function getMapValues($map, $keys): array {
    $values = [];

    foreach ($keys as $key) if (array_key_exists($key, $map)) $values[] = $map[$key]; else $values[] = "NA";

    return $values;
  }
