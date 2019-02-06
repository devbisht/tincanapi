(function (exports) {

    var
        VideoTracker = require('../../../tracker/modules/tincan_media/video_tracker').VideoTracker,
        VideoQueueTracker = require('../../../tracker/modules/tincan_media/video_queue_tracker').VideoQueueTracker,
        Statement = require('../../../builder/statement').Statement,

        mediaExtensions = require('../../../tracker/modules/tincan_media/media_extensions');

    exports.Watcher = function (videoElement) {
        var _this = this;

        // Track the video statements when the page is closed.
        new VideoQueueTracker(this);

        this.id = videoElement.attr('id');
        this.title = "- Private -";
        this.videoId =  "yt" + videoElement.attr('id');
        this.startedTime = null;
        this.parentPage = null;

        this.createStatement = function (event, start, end) {
            var event2verb = {
                onPlay: "play",
                onPaused: 'paused',
                onSkipped: "skipped",
                onComplete: "complete",
                onWatched: "watched"
            };

            var statement = new Statement,
                verb = event2verb[event],
                stats = {
                    duration: _this.duration,
                    start: start !== undefined ? start : false,
                    end: end !== undefined ? end : false
                };

            statement.setVerb(verb);

            statement.setObject({
                url: 'https://youtube.com/watch?v=' + _this.videoId,
                name: _this.title,
                typeId: 'video',
                typePath: 'media'
            });

            if (this.parentPage === null && TC.currentPage) {
                _this.parentPage = TC.currentPage;
            }
            statement.addParent(_this.parentPage);

            statement = mediaExtensions.setMediaContextExtensions(statement, verb, stats);

            return statement;
        };

        this.trackEvent = function (event, start, end) {
            var statement = _this.createStatement(event, start, end);

            statement.submit();

            var verb = statement.verb.id.split(/[\/]+/).pop();
            if (verb === "play")
                _this.startedTime = start;

            if (verb === "paused" && _this.startedTime !== null) {
                _this.trackEvent("onWatched", _this.startedTime, end);
                _this.startedTime = null;
            }
        };

        this.init = function () {
            var payload = {
                events: {
                    'onReady': function (event) {
                        var videoData = event.target.getVideoData();

                        _this.duration = event.target.getDuration();
                        _this.title = videoData.title;
                        _this.videoId = videoData.video_id;

                        _this.tracker = new VideoTracker(_this.duration * 1000, {
                            getCurrentTime: function (onDone) {
                                onDone(_this.player.getCurrentTime() * 1000);
                            },
                            events: {
                                all: function () {
                                    _this.trackEvent.apply(_this, arguments);
                                }
                            }
                        });

                        if (window.jQuery) {
                            videoElement.data('videoTracker', _this.player);
                            videoElement.trigger('videoTrackerInitialized', _this.player);
                        }
                    }
                }
            };

            _this.player = new YT.Player(videoElement.get(0), payload);

            var preloadedPlayer = videoElement.data('YT.Player');
            if (preloadedPlayer && !_this.tracker) {
                _this.player = preloadedPlayer;

                payload.events.onReady({
                    target: preloadedPlayer
                });
            }
        };

        this.init();
    };

})(module.exports);
