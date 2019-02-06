(function (exports) {

    var
        Watcher = require('./tincan_youtube_watcher').Watcher,

        helper = require('../../../helper'),

        log = require('../../../log'),

        included = false;

    function getTrackableVideos () {
        return jQuery('iframe[src*="youtube.com"]').not('.tracker');
    }

    function bindTrackableVideos (videoElements) {
        if (typeof window.YT === "undefined")
            return;

        if (typeof YT.Player === "undefined")
            return;

        videoElements.each(function () {
            var id = helper.getRandomId(),
                video = jQuery(this);

            video.attr('id', id);

            // We need to load the video with the correct SRC
            var src = video.attr('src'),
                srcIsChanged = false;

            if (src.indexOf("enablejsapi=1") === -1) {
                var match = src.match(/^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/);
                if (match && match[2].length == 11) {
                    src = 'https://www.youtube.com/embed/' + match[2] + '?enablejsapi=1';
                    srcIsChanged = true;
                }
            }

            if (src.indexOf("origin=") === -1) {
                src += '&origin=' + encodeURIComponent(TINCAN.baseUrl);
                srcIsChanged = true;
            }

            if (srcIsChanged) {
                video.attr('src', src);
            }

            // Mark the video as processed
            video.addClass('tracker');

            log.write('Youtube tracker init for ' + src);

            new Watcher(video);
        });
    }

    exports.start = function (videoElements) {
        if (!videoElements) {
            videoElements = getTrackableVideos();
        }

        if (!videoElements.length)
            return;

        if (!included) {
            var tag = document.createElement('script');
            tag.src = "//www.youtube.com/iframe_api";
            var firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

            window.onYouTubeIframeAPIReady = function() {
                jQuery(document).ready(function () {
                    bindTrackableVideos(videoElements);
                });
            };

            included = true;
        } else {
            bindTrackableVideos(videoElements);
        }
    };

})(module.exports);
