<?php
  require "vendor/tecnickcom/tcpdf/tcpdf.php";

  class X extends TCPDF {

    public function Header()
    {
      $pdf = $this;

      $banglaFont = TCPDF_FONTS::addTTFfont("fonts/kalpurush ANSI.ttf", "TrueType", "", 32);

      // Converter Name: Unicode to ANSI (ASCII)
      // Converter Help: https://okkhor52.com/converter/UnicodeToANSIV1.html
      $pdf->setFont($banglaFont, "", 12);
      $this -> Cell(0, 10, "bvivqYMÄ wmwU K‡c©v‡ikb", 0, 1, "C", false, "", 0, true, "T", "C");

      $this -> setFontSize(10);
      $this -> Cell(0, 5, "bvivqYMÄ", 0, 1, "C", false, "", 0, true, "T", "C");

      $this->setFontSize(14);
      $this -> Cell(0, 8, "d¨vwgwj KvW©avix cwiev‡ii ZvwjK", 0, 1, "C", false, "", 0, true, "T", "C");
    }
  }

  // Create a new TCPDF instance
  $pdf = new X("L", PDF_UNIT, "A4", true, 'UTF-8');

//  $banglaFont = TCPDF_FONTS::addTTFfont("fonts/Bangla.ttf", "TrueType", "", 32);

//  $pdf -> setFont($banglaFont, "", 12);

  // ... Set up the PDF content ...
//  $pdf -> Cell(0, 15, "Hello Python!", 0, 1, "C");


  // Generate the PDF content as a string
  $pdfContent = $pdf->Output('', 'S'); // 'S' parameter returns the PDF content as a string

  // Encode the data as JSON and send it as the response
  header('Content-Type: application/json');
  echo $pdfContent;
  exit;
