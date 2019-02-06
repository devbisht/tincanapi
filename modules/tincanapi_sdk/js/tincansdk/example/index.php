<?php

/**
 * @file
 * Index - Template file.
 */

if (substr($_SERVER['REQUEST_URI'], -1) !== '/') {
  header('Location: ' . "//$_SERVER[HTTP_HOST]$_SERVER[REQUEST_URI]/");
}
?>

<html>
    <head>
        <title>Home page</title>
    </head>
    <body>
        <a href="list.php">Go to list</a>
        <br />
        <a href="youtube.php">YouTube video</a>
        <br />
        <a href="vimeo.php">Vimeo video</a>

        <?php include 'includes/sdk.php'; ?>
    </body>
</html>
