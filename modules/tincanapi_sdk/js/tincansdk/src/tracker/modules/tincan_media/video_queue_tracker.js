(function (exports) {

    var
        queue = require('./../tincan_queue');

    exports.VideoQueueTracker = function (watcher) {
        var _this = this;

        this.registerPageLeave = function () {
            if (watcher.startedTime === null) {
                return;
            }

            // Sends a paused statement.
            var pausedStatement = watcher.createStatement('onPaused', watcher.startedTime, watcher.tracker.currentTime);
            queue.addToQueue(pausedStatement);

            // Sends a watched statement.
            var watchedStatement = watcher.createStatement('onWatched', watcher.startedTime, watcher.tracker.currentTime);
            queue.addToQueue(watchedStatement);
        };

        window.addEventListener('unload', function (event) {
            _this.registerPageLeave();
        }, false);
    };

})(module.exports);
