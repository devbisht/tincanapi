/**
 * Tincan API SDK
 */
(function ($) {

    var _parent = null;

    /**
     * Resolves a page link to the node URL.
     * If the page URL cannot be resolved, or when it is not set trackable, this function will return false.
     */
    function linkToNodeUrl (page) {
        if (!drupalSettings.tincanapi || !drupalSettings.tincanapi.trackable)
            return false;

        if (drupalSettings.tincanapi.aliases && drupalSettings.tincanapi.aliases[page])
            page = drupalSettings.tincanapi.aliases[page];

        if (drupalSettings.tincanapi.trackable[page])
            return page;

        return false;
    }

    /**
     * Submits a viewed statement for the given URL.
     */
    function trackUrl (url, options) {
        var resolved = linkToNodeUrl(url);

        if (!resolved)
            return false;

        TINCAN.currentPage = resolved;

        var payload = {
            url: resolved
        };

        if (options && options.parent)
            payload.parent = options.parent;

        TINCAN.submitStatement(payload);

        setTimeout(function () {
            trackMediaOnPage();
        });

        return true;
    }

    /**
     * Gets the page parent node ID.
     */
    function parentNodeId() {
        var queryString = window.location.search;

        if (!queryString)
            return false;

        queryString = decodeURIComponent(queryString);

        var result = /parent\[0\]=([^&]{1,})/i.exec(queryString);

        if (!result)
            return false;

        var id = result[1];
        return id ? id : false;
    }

    /**
     * Set the media tracking options,
     * decides whether YouTube and/or Vimeo should be tracked.
     */
    function trackMediaOnPage() {
        var options = null;

        if (drupalSettings.tincanapi && drupalSettings.tincanapi.settings) {
            var trackable = drupalSettings.tincanapi.settings.media_tracking_types;

            if (trackable instanceof Array) {
                options = {};
                for (var i = 0; i < trackable.length; i++) {
                    options[trackable[i]] = true;
                }
            }
        }

        TINCAN.trackMediaOnPage(options);
    }

    /**
     * Tincan SDK ready.
     */
    $(document).bind('tincanReady', function () {
        var options = {};

        var parentId = parentNodeId();
        if (parentId)
            options.parent = Drupal.absoluteUrl('/') + 'node/' + parentId;

        trackUrl(TINCAN.currentPage, options);
    });

    Drupal.behaviors.tincanapi = {
        attach: function () {
            if (!$('#modalContent').length)
                return;

            var parent = TINCAN.currentPage;
            _parent = null;

            var tracked = trackUrl(drupalSettings.tincanapi.modalPage, {
                parent: parent
            });

            /*
             * Only when the statement is tracked, we set the parent. Any other behavior in CToolsDetachBehaviors such as
             * editing or adding content through a modal should not trigger "registerPageLeave".
             */
            if (tracked) {
                _parent = parent;

                $('iframe').one('videoTrackerInitialized', function (event, player) {
                    player.playVideo();
                });
            }
        }
    };

    $(document).bind("CToolsDetachBehaviors", function() {
        if (!_parent)
            return;

        TINCAN.currentPage = _parent;
        _parent = null;

        TINCAN.registerPageLeave();
    });

    $(window).bind('onpopstate', function (event, data) {
        var url = window.location.href;

        TINCAN.registerPageLeave();

        trackUrl(url);

        $('iframe').each(function () {
            var player = $(this).data('videoTracker');
            if (player)
                player.pauseVideo();
        });
    });

    $(document).ready(function () {
        if (!window.TINCAN) {
            console.log('Tincan SDK not loaded, cannot bootstrap.');
            return;
        }

        TINCAN.bootstrap();
    });

})(jQuery, Drupal, drupalSettings);
