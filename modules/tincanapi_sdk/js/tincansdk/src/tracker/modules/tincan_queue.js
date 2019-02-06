(function (exports) {

    var helper = require('../../helper'),

        tracker = require('../core'),

        Statement = require('../../builder/statement').Statement;

    exports.addToQueue = function (statement) {
        // When adding to queue, we need to keep the current statement.
        statement.useNowAsTimestamp();

        helper.localStore.push('queue', statement.asObject());
    };

    exports.sendQueue = function () {
        var entries = helper.localStore.pull('queue');

        if (!entries)
            return;

        if (Object.prototype.toString.call(entries) !== '[object Array]')
            return;

        for (var i in entries) {
            var entry = entries[i];

            var statement = new Statement;
            statement.setFromObject(entry);

            statement.submit();
        }
    };

})(module.exports);
