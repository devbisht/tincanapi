(function (exports) {

    var config = require('../../config'),
        helper = require('../../helper'),
        date = require('../../date'),
        log = require('../../log'),

        Statement = require('../../builder/statement').Statement,

        mediaExtensions = require('./tincan_media/media_extensions'),

        queue = require('./tincan_queue'),

        self = {};

    self.history = [];

    function registerStartOfSession (statement) {
        self.history.push({
            start: helper.unixTimestamp(),
            statement: statement
        });
    }

    exports.trackEvent = function (options) {
        if (!options)
            options = {};

        var statement = new Statement,
            currentUrl = TINCAN.currentPage;

        statement.setVerb(options.verb ? options.verb : 'viewed');

        statement.setObject({
            url: options.url || currentUrl,
            name: options.name || document.title || currentUrl
        });

        statement.useNowAsTimestamp();

        var parent = config.get('parent');
        if (parent)
            statement.addParent(parent);

        if (options.parent)
            statement.addParent(options.parent);

        statement.submit();

        registerStartOfSession(statement);

        var verb = statement.getVerb();
        if (verb.id.indexOf('/viewed') > -1) {
            var obj = statement.getObject();
            TINCAN.currentPage = obj.id;
        }
    };

    exports.registerPageLeave = function (options) {
        if (!options)
            options = {};

        if (!config.get('track_exits'))
            return;

        /*
         * If a window is unloaded, we will close all the statements that are present in history,
         * if not, eg, when TINCAN.registerPageLeave (see main.js) is called manually, we will only submit the last
         * statement in the history.
         */
        var history = []; // Copy, get rid of the ref
        for (var key in self.history) history.push(self.history[key]);

        if (options.sendImmediately)
            history = [history[history.length - 1]];

        for (var i = 0; i < history.length; i++) {
            self.history.pop();

            var stub = history[i];

            if (!stub || (stub && (!stub.start || !stub.statement)))
                continue;

            var start = stub.start, statement = stub.statement,
                now = helper.unixTimestamp();

            var elapsed = now - start,
                ts = date.moment(statement.getTimestamp()).add(elapsed, 'ms').utcOffset(0).format();

            if (elapsed) {
                // Create the exited statement and push it to the queue.
                statement.setVerb('exited');
                statement.setTimestamp(ts);

                statement.setExtension(TC.API_CUSTOM_URI + '/duration', mediaExtensions.toISO8601Duration(parseInt(elapsed / 1000)));

                var inactivity = inactivityStatus(start, now, options.sendImmediately);
                statement.setExtension(TC.API_CUSTOM_URI + '/inactivity', inactivity);

                queue.addToQueue(statement);
            }
        }

        if (options.sendImmediately) {
            // When the page is not reloaded, send the queue immediately.
            queue.sendQueue();
        }
    };

    window.addEventListener("unload", function (event) {
        exports.registerPageLeave({
            sendImmediately: false
        });
    }, false);

    exports.start = function (options) {
        // The date stamp can come from an external source too, thus we can not do it in sync
        date.requestTime(function () {
            exports.trackEvent(options);
        });
    };

    // Tracking activity
    self.activity = [];
    self.activityIgnoreActive = false;

    function logActivityChange (type) {
        var time = helper.unixTimestamp();

        // The log message below could get spammy.
        // log.write('activity changed: ' + type + ' (' + time + ')');

        self.activity.push({
            type: type,
            time: time
        });
    }

    window.addEventListener("focus", function () {
        if (self.activityIgnoreActive) {
            self.activityIgnoreActive = false;
            return;
        }

        logActivityChange('active');
    });

    window.addEventListener("blur", function () {
        if (document.activeElement && document.activeElement.tagName === 'IFRAME') {
            self.activityIgnoreActive = true;
            return;
        }

        logActivityChange('dead');
    });

    function inactivityStatus (start, now, sendImmediately) {
        if (!now)
            now = helper.unixTimestamp();

        if (!sendImmediately)
            self.activity.pop();

        self.activity.unshift({type: 'active', time: start});
        self.activity.push({type: 'active', time: now});

        var total = now - start,
            deads = 0;

        if (!total)
            return 0;

        for (var i = 1; i < self.activity.length; i++) {
            var prev = self.activity[i - 1].time,
                current = self.activity[i];

            if (current.type === 'dead')
                deads += current.time - prev;
        }

        return deads / total;
    };

})(module.exports);
