(function (exports) {

    exports.buildExtensionsMap = function (verb) {
        switch (verb) {
            case 'play':
                return ['start', 'duration'];
            case 'paused':
            case 'complete':
                return ['end', 'duration'];
            case 'skipped':
            case 'watched':
                return ['start', 'end', 'duration'];
        };

        return [];
    };

    exports.setMediaContextExtensions = function (statement, verb, stats) {
        var map = exports.buildExtensionsMap(verb);

        for (var i in map) {
            var extension = map[i],
                uri = false;

            if (stats[extension] !== false) {
                var value = exports.toISO8601Duration(stats[extension]);

                if ('duration' === extension) {
                    uri = 'length';
                } else if ('start' === extension) {
                    uri = 'starting-point';
                } else if ('end' === extension) {
                    if (!stats['start'] || (stats['start'] !== value))
                        uri = 'ending-point';
                }
            }

            if (uri)
                statement.setExtension(TC.API_CUSTOM_URI + '/' + uri, value);
        }

        return statement;
    };

    exports.toISO8601Duration = function (seconds) {
        var times = {
            D: Math.floor(seconds / 86400),
            H: Math.floor((seconds % 86400) / 3600),
            M: Math.floor(((seconds % 86400) % 3600) / 60),
            S: ((seconds % 86400) % 3600) % 60,
        };

        var output = 'P',
            time = false,
            index = 0;

        for (var name in times) {
            var unit = parseInt(times[name]);

            if (unit > 0) {
                if (!time && index > 0) {
                    time = true;
                    output += 'T';
                }

                output += unit + name;
            }

            index++;
        }

        if ('P' === output)
            output += 'T0S';

        return output;
    };

})(module.exports);
