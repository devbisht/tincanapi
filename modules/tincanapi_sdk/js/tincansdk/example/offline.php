<html>
    <head>
        <title>Home page</title>
    </head>
    <body>
        Hello

        <script src="https://ajax.googleapis.com/ajax/libs/jquery/1.12.0/jquery.min.js"></script>
        <script>
            window.tincanAsyncInit = function () {
                // Initialize with keys
                TC.init({
                    endpoint: 'http://localhost:8000/data/xAPI',
                    auth_user: '15e7045a18cb6de3d0922cdb992592d18ab701c9',
                    auth_password: 'c58ed681bb0d3a4b74f52da4cb4dfca3b0c44ddc',
                });

                // Use these settings with offline set to true
                TC.setOption('log', true);
                TC.setOption('offline', true);

                // Disable autotracking for now
                TC.disableAutoTracking();

                // Setup the appCache
                var appCache = TC.appCache;
                appCache.on('ready', function () {
                    // At this point, we have a connection with our web worker
                    appCache.addContent(['offline.php']);

                    // Request the cache keys that are currently present in our webworker
                    appCache.command('requestCacheKeys', function (cacheKeys) {
                        console.log(cacheKeys);
                    });

                    // Get the settings for this webworker
                    appCache.command('getSettings', function (settings) {
                        console.log(settings);
                    });
                });
            };

            !function(a,b,c){
                var d,e=a.getElementsByTagName(b)[0];
                a.getElementById(c)||(d=a.createElement(b),d.id=c,
                d.src="//localhost:8000/packages/iminds/tincansdk/dist/tincansdk.js",
                e.parentNode.insertBefore(d,e))
            }(document,"script","tincansdk");
        </script>
    </body>
</html>
