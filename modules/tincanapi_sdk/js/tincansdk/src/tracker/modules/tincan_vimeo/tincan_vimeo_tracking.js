(function (exports) {

    var
        Watcher = require('./tincan_vimeo_watcher').Watcher,

        helper = require('../../../helper'),

        log = require('../../../log');

    function getTrackableVideos () {
        return jQuery('iframe[src*="vimeo.com"]').not('.tracker');
    }

    exports.start = function (videoElements) {
        if (!videoElements) {
            videoElements = getTrackableVideos();
        }

        if (!videoElements.length)
            return;

        videoElements.each(function () {
            var id = helper.getRandomId(),
                video = jQuery(this),
                src = video.attr('src');

            video.attr('id', id);

            if (src.indexOf("api=1") === -1) {
                video.attr('src', src + "?api=1&player_id=" + id);
            }

            video.addClass('tracker');

            log.write('Vimeo tracker init for ' + src);

            new Watcher(id);
        });
    };

})(module.exports);
