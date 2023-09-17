<?php

  include "query-helper.php";

//
//  include "query-helper.php";
//
////  @ini_set('output_buffering','Off');
////  ob_start();
////  ob_implicit_flush(true);
//  // Your processing logic here
//
//  for ($i = 0; $i < 30; $i++) {
//    // Simulate some processing
//    usleep(100000); // Sleep for 100 milliseconds
//    echo ".";
//    ob_flush();
//    flush();
//  }
//


//  for($i = 1; $i <= 5; $i++) {
//    ob_end_clean();
//    ob_start();
//
//    header("progress: $i");
////    echo $i;
//
//    ob_flush();
//    flush();
//
//    sleep(1);

//  }
//
//  echo implode(", ", $_POST) . "\n";
//  echo implode(", ", $_REQUEST) . "\n";
//  echo file_get_contents("php://input") . "\n";


  $postData = file_get_contents("php://input");

// Parse the raw POST data into an array.
  parse_str($postData, $parsedData);

  if (isset($parsedData['fruit'])) {
    $fruits = $parsedData['fruit'];

    // $fruits is now an array containing the values sent for 'fruit'.

    // You can loop through the array or perform any other processing.
    foreach ($fruits as $fruit) {
      echo $fruit . "<br>";
    }
  } else {
    echo "No fruit data received.";
  }
