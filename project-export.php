<?php

  require 'vendor/autoload.php';

  use Mpdf\Config\ConfigVariables;
  use Mpdf\Config\FontVariables;
  use Mpdf\Mpdf;

  include "connect.php";
  include "auth_engine.php";

  // Help: https://mpdf.github.io/fonts-languages/fonts-in-mpdf-7-x.html
  function getBanglaMPDF()
  {
    $header1 = "নারায়ণগঞ্জ সিটি কর্পোরেশন"; // Medium Size;
    $header2 = "নারায়ণগঞ্জ"; // Small Size;
    $header3 = "ফ্যামিলি কার্ডধারী পরিবারের তালিক"; // Large Size;

    $defaultConfig = (new ConfigVariables())->getDefaults();
    $fontDirs = $defaultConfig["fontDir"];

    $defaultFontConfig = (new FontVariables())->getDefaults();
    $fontData = $defaultFontConfig["fontdata"];

    $mpdf = new Mpdf([
      "fontDir" => array_merge($fontDirs, ["fonts/",]),
      "fontdata" => $fontData + [
          "bangla" => [
            "R" => "Bangla.ttf",
            "useOTL" => 0xFF,
          ],
          "kalpurush" => [
            "R" => "kalpurush.ttf",
            "useOTL" => 0xFF,
          ],
          "bensen" => [
            "R" => "BesSenHandwriting.ttf",
            "useOTL" => 0xFF,
          ],
        ],
      "default_font" => "bensen",
//      "default_font-style" => "B",
      "format" => "A4",
      "orientation" => "L",
    ]);

    $headerArray = [
      "C" => [
        "content" =>
          "<div class='pdf-header-container'>" .
          "<h4>$header1</h4>" .
          "<h3>$header2</h3>" .
          "<h2>$header3</h2>" .
          "</div>",
        "font-size" => 10,
        "font-style" => "R",
        "font-family" => "bensen",
        "color" => "rgba(0, 0, 0, 1)",

      ],
      "line" => 1,
    ];

    $mpdf->SetHeader($headerArray, 'O');

    $mpdf->AddPage();
    $mpdf->AddPage();
    $mpdf->AddPage();
    $mpdf->AddPage();

    return $mpdf;
  }


  function downloadPDF($projectID)
  {
    global $conn, $user;
    $sqlGetProject = "SELECT * FROM project WHERE ID=$projectID";

    if ($rowProject = mysqli_fetch_assoc(mysqli_query($conn, $sqlGetProject))) {
      $sqlVerifyModerator = "SELECT * FROM project_moderators WHERE Moderator_ID=$user[id] AND Project_ID=$projectID";

      if (mysqli_num_rows(mysqli_query($conn, $sqlVerifyModerator))) {

        $pdf = getBanglaMPDF();

        try {

//          $pdf -> WriteHTML("<h1>নারায়ণগঞ্জ সিটি কর্পোরেশন</h1>");

          $output = $pdf->Output("", "S");

          header('Content-Type: application/pdf');
          header('Content-Disposition: attachment; filename="' . $rowProject["Name"] . " - Downloaded by $user[name] on " . date("F d, Y") . '"'); // Display the PDF in the browser

          echo $output;
        } catch (Exception $ex) {
          echo createErrorMsg(2, $ex->getMessage());
        }
      } else {
        echo createErrorMsg(2, "You do not have access to this project.");
      }
    } else {
      echo createErrorMsg(2, "Project does not exist");
    }
  }

  function createErrorMsg($errorCode, $errorMsg)
  {
    return json_encode(array("code" => $errorCode, "data" => $errorMsg));
  }

  if (isset($conn)) {
    $authUser = authenticate();
    if ($authUser["code"] == 1) {
      $user = $authUser["data"];
      if (isset($_POST["submit"])) {
        $method = $args = "";
        if (isset($_POST["method"])) $method = $_POST["method"];
        if (isset($_POST["method"])) $args = explode(";", $_POST["args"]);

        switch ($method) {
          case "downloadPDF":
            downloadPDF(...$args);
            break;
          default:
            echo json_encode(array(
              "code" => 502,
              "data" => "Unknown error occurred"
            ));
            break;
        }
      }
    } else {
      echo json_encode($authUser);
    }
  } else {
    echo json_encode(array(
      "code" => 2,
      "data" => "Database connection parameters missing."
    ));
  }


  //  $pdf = new eZ_PDF("L", "mm", "A4", true, "UTF-8", false);
  //
  //  $pdf -> SetCreator("Mohammad Zulfikar");
  //  $pdf -> setAuthor($user["name"]);
  //  $pdf -> setTitle($rowProject["Name"] . " - Downloaded on " . date("F d, Y"));
  //  $pdf -> setSubject("City Corporation Allowance Beneficiaries Data");
  //
  //  // Set font
  ////        $pdf -> setFont("times", "B", 12);
  //
  //  // Add a page
  //  $pdf -> AddPage();
  //
  //  // Add content to the PDF
  ////        $pdf -> Cell(0, 15, "Hello JAVA!", 0, 1, "C");
  //
  //  $xyz = $pdf -> Output("", "S");
  //  header('Content-Type: application/pdf');
  //  header('Content-Disposition: attachment; filename="' . $rowProject["Name"] . " - Downloaded by $user[name] on " . date("F d, Y") . '"'); // Display the PDF in the browser
  //  echo $xyz;
