<?php

/**
 * @file
 * Settings example - Template file.
 */
?>
<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.12.0/jquery.min.js"></script>
<script>
    window.tincanAsyncInit = function () {
        TC.init({
            endpoint: 'http://localhost:8000/data/xAPI',
            auth_user: '15e7045a18cb6de3d0922cdb992592d18ab701c9',
            auth_password: 'c58ed681bb0d3a4b74f52da4cb4dfca3b0c44ddc',

            // actor: {
            //     name: 'Nikos',
            //     email: 'nikos@website.com'
            // }
        });

        // TC.disableAutoTracking();

        // TC.setOption('timestamp', "<?php echo date('Y-m-d\TH:i:s.uP'); ?>");
        // TC.setOption('parent', 'https://google.com');
        // TC.setOption('actor', 'Matthias');
        TC.setOption('log', true);
    };

    !function(a,b,c){
        var d,e=a.getElementsByTagName(b)[0];
        a.getElementById(c)||(d=a.createElement(b),d.id=c,
        d.src="//localhost:8000/packages/iminds/tincansdk/dist/tincansdk.js",
        e.parentNode.insertBefore(d,e))
    }(document,"script","tincansdk");
</script>
