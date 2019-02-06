(function (window, undefined) {

    var
        Statement = require('./builder/statement').Statement,
        Fingerprint = require('fingerprintjs2'),
        Sitemap = require('./builder/sitemap').Sitemap,
        AppCache = require('./appCache').AppCache,

        config = require('./config'),
        helper = require('./helper'),
        date = require('./date'),
        log = require('./log'),
        tracker = require('./tracker/core'),
        queue = require('./tracker/modules/tincan_queue'),

        mediaTracking = require('./tracker/modules/tincan_media/media_tracker'),
        statementTracking = require('./tracker/modules/tincan_auto_tracking'),
        youtubeTracking = require('./tracker/modules/tincan_youtube/tincan_youtube_tracking'),
        vimeoTracking = require('./tracker/modules/tincan_vimeo/tincan_vimeo_tracking'),
        slideshareTracking = require('./tracker/modules/tincan_slideshare/tincan_slideshare_tracking');

    // Check if jQuery is present, we need the selector library.
    if (typeof window.jQuery === "undefined") {
        console.log('TINCAN: jQuery must be included in order to use the SDK.');
        return;
    }

    // Create a global object where we expose our logic.
    window.TINCAN = window.TC = base = {};

    // Allow a statement to be made outside of our scope.
    base.Statement = Statement;

    // AppCache too
    base.appCache = new AppCache;

    // Load state
    base.sdkLoaded = false;

    /*
     * Calling TINCAN.disableAutoTracking on initialize will disable all tracking possibilities,
     * which will allow the developer to implement custom Tincan tracking.
     */
    base.disableAutoTracking = function () {
        config.set('auto_tracking', false);
        config.set('auto_tracking_youtube', false);
        config.set('auto_tracking_vimeo', false);
        config.set('auto_tracking_slideshare', false);
    };

    base.disableVideo = function () {
        config.set('auto_tracking_youtube', false);
        config.set('auto_tracking_vimeo', false);
    };

    base.disablePage = function () {
        config.set('auto_tracking', false);
    };

    base.setOption = function (key, value) {
        config.set(key, value);
    };

    /*
     * Send sitemap
     */
    base.submitSitemap = function (url) {
        var sitemap = new Sitemap(url);
        sitemap.build();
    };

    base.submitStatement = function (options) {
        statementTracking.start(options);
    };

    base.registerPageLeave = function () {
        statementTracking.registerPageLeave({
            sendImmediately: true
        });
    };

    base.trackMediaOnPage = function (options) {
        if (!options || options.youtube) {
            youtubeTracking.start();
        }
        if (!options || options.vimeo) {
            vimeoTracking.start();
        }
        if (!options || options.slideshare) {
            slideshareTracking.start();
        }
    };

    /*
     * Init is only a valid call when we execute this from tincanAsyncInit, as config variables must be set as
     * early as possible.
     */
    base.init = function (configValues) {
        if (!helper.isObject(configValues))
            return;

        for (var key in configValues)
            config.set(key, configValues[key]);
    };

    base.currentPage = helper.currentUrl();
    base.baseUrl = helper.baseUrl();

    base.API_CUSTOM_URI = 'http://orw.iminds.be/tincan';

    // Allow SDK to setup custom media tracking.
    base.trackMedia = mediaTracking.trackMedia;

    /*
     * Request a fingerprint based on browser settings and variables. This is an attempt to identify the user as
     * uniquely as possible.
     */
    if (config.get('actor') === null) {
        new Fingerprint().get(function (hash) {
            config.set('actor', {name: hash});

            initSDK();
        });
    } else {
        initSDK();
    }

    function initSDK() {
        // Call our global initializer and allow developers to set their own settings in here by calling TC.init
        if (window.tincanAsyncInit)
            window.tincanAsyncInit();
        else
            return;

        if (base.sdkLoaded)
            return;

        if (config.get('log'))
            log.enable();

        if (config.get('offline'))
            base.appCache.start();

        // Send previous statements in queue.
        queue.sendQueue();

        // Setup auto tracking below.
        if (config.get('auto_tracking'))
            statementTracking.start();

        if (config.get('auto_tracking_youtube'))
            youtubeTracking.start();

        if (config.get('auto_tracking_vimeo'))
            vimeoTracking.start();

        if (config.get('auto_tracking_slideshare'))
            slideshareTracking.start();

        if (window.jQuery) {
            jQuery(document).trigger('tincanReady');
        }

        base.sdkLoaded = true;

        // Statements with wrong timestamps are temporary stored. Try and resend them.
        tracker.sendTemporaryStored();
    }

    base.bootstrap = initSDK;

    if (window.jQuery) {
        jQuery(document).trigger('tincanLoading');
    }

})(window);
