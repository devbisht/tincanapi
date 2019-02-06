(function (exports) {

    var vimeoTracker = require('../tincan_vimeo/tincan_vimeo_tracking'),

        youtubeTracker = require('../tincan_youtube/tincan_youtube_tracking');

    exports.trackMedia = function (elements) {
        elements.each(function () {
            var el = jQuery(this),
                src = el.attr('src');

            if (!src) {
                return;
            }

            if (el.hasClass('tracker')) {
                return;
            }

            if (src.indexOf('youtube.com') !== -1) {
                youtubeTracker.start(el);
            } else if (src.indexOf('vimeo.com') !== -1) {
                vimeoTracker.start(el);
            }
        });
    };

})(module.exports);
