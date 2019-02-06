(function (exports) {

    var moment = require('moment'),
        config = require('./config'),
        helper = require('./helper'),
        log = require('./log'),

        request = require('superagent');

    var storage = 'timediff.1';

    function getTimeDiff (def) {
        var diff = helper.localStore.get(storage);
        if (!def) def = null;
        return diff ? diff : def;
    }

    function storeDiffFromDate (date) {
        diff = moment().diff(date, 'seconds');
        log.write('timediff of ' + diff);
        helper.localStore.stock(storage, diff);
    }

    function zeroPad (num, places) {
        var zero = places - num.toString().length + 1;
        return Array(+(zero > 0 && zero)).join("0") + num;
    }

    exports.now = function () {
        var diff = getTimeDiff(0),
            method = (diff < 0) ? 'add' : 'subtract';

        diff = Math.abs(diff);
        return moment()[method](diff, 'seconds').utcOffset(0);
    };

    exports.fetchTimeDifference = function (fetchedFn) {
        var diff = helper.localStore.get(storage),
            date = config.get('timestamp');

        if (typeof diff !== 'undefined' && diff !== null)
            return fetchedFn();

        // Do we have a date set in the config?
        if (date) {
            storeDiffFromDate(date);
            return fetchedFn();
        }

        // No date is set, nor is the diff calculated, fetch it from http://date.jsontest.com/
        request.get('http://date.jsontest.com').end(function (err, resp) {
            if (resp && resp.body) {
                var ms = resp.body.milliseconds_since_epoch;

                if (resp.body.status !== 'ok')
                    return;

                var str = '';
                str += resp.body.year + '-' + zeroPad(resp.body.month, 2) + '-' + zeroPad(resp.body.day, 2);
                str += 'T';
                str += resp.body.hours + ':' + zeroPad(resp.body.minutes, 2) + ':' + zeroPad(resp.body.seconds, 2);

                if (typeof str === 'undefined')
                    return;

                storeDiffFromDate(moment.utc(str));
                fetchedFn();
            }
        });

        // Fetch from LL, not enabled at the moment
        // var endpoint = config.get('endpoint'),
        //     url = endpoint.match(/^(([a-z]+:)?(\/\/)?[^\/]+\/).*$/)[1];

        // request.get(url + 'api/timestamp').end(function (err, resp) {
        //     var ts = resp.body.body;
        //     if (resp.ok && ts) {
        //         storeDiffFromDate(ts);
        //         fetchedFn();
        //     }
        // });
    };

    exports.reset = function () {
        helper.localStore.pull(storage);
    };

    exports.requestTime = function (callback) {
        exports.fetchTimeDifference(function () {
            callback();
        });
    };

    exports.moment = moment;

})(module.exports);
