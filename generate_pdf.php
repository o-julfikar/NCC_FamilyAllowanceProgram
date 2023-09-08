<?php
  require('vendor/tecnickcom/tcpdf/tcpdf.php');

  // Create a new TCPDF instance
  $pdf = new TCPDF("L", "in", "A4", true, 'UTF-8', false);

  // ... Set up the PDF content ...
  $pdf -> Cell(0, 10, "Hello Python!", 0, 1, "C");


  // Generate the PDF content as a string
  $pdfContent = $pdf->Output('', 'S'); // 'S' parameter returns the PDF content as a string

  // Encode the PDF content as base64
  $pdfContentBase64 = base64_encode($pdfContent);

  // Create an associative array to hold the PDF content and other data
  $data = array(
    'pdf_content' => $pdfContentBase64,
    'other_data' => 'Your other data goes here'
  );

  // Encode the data as JSON and send it as the response
  header('Content-Type: application/json');
  echo json_encode($data);
  exit;
?>
