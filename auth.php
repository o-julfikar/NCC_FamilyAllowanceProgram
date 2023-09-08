<?php

  include "connect.php";
  include "auth_engine.php";

  echo json_encode(authenticate());
