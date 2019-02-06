(function ($) {

    if (!window.H5P) {
        return;
    }

    H5P.externalDispatcher.on('xAPI', function (event) {
        var statement = new TINCAN.Statement;
        statement.setFromObject(event.data.statement);

        statement.submit();
    });

    // H5P only sends a play statement when a quiz inside a video is started. This code hooks in when a statement is sent,
    // and sends an additional started statement.
    var convertedPlayStatements = [];

    $(document).bind('sendingXApiStatement', function (event, statement) {
        if (statement.verb.display['en-US'] === 'play') {
            if (convertedPlayStatements[statement.object.id] === undefined) {
                convertedPlayStatements[statement.object.id] = true;

                var statement = new TINCAN.Statement;
                statement.setVerb('started');
                statement.setObject({url: TINCAN.currentPage});
                statement.submit();
            }
        }
    });

    /**
     * Sets a tracker for h5p YouTube videos.
     */
    function trackYouTubeVideo (el) {
        var videoElement = $(el.contentDocument).find('.h5p-youtube iframe');
        if (!videoElement.length) {
            return;
        }

        var player = el.contentWindow.YT.get(videoElement.attr('id'));
        if (!player) {
            return;
        }

        videoElement.data('YT.Player', player);

        // On slower devices, the video cannot be fully loaded yet. Subscribe to the "ready" event
        // to make sure the video is ready to be tracked.
        if (!player.getVideoData) {
            el.contentWindow.H5P.instances[0].video.on('ready', function () {
                TINCAN.trackMedia(videoElement);
            });
        } else {
            TINCAN.trackMedia(videoElement);
        }
    }

    $(document).ready(function () {
        $('.h5p-iframe').each(function () {
            $(this).load(function () {
                trackYouTubeVideo(this);
            });
        });
    });
})(jQuery);
