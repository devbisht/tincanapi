<?php

/**
 * @file
 * Vimeo example - Template file.
 */
?>
<html>
    <head>
        <title>An awesome video</title>
    </head>
    <body>
        <a href="./">Back to index</a>
        <br />

        <iframe src="https://player.vimeo.com/video/136184703" width="500" height="281" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>

        <?php include 'includes/sdk.php'; ?>
    </body>
</html>
