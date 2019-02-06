(function (exports) {

    var settings = {
        'endpoint': '',
        'strict_endpoint': false,
        'auth_user': false,
        'auth_password': false,

        'auto_tracking': true,
        'track_exits': false,
        'auto_tracking_youtube': true,
        'auto_tracking_vimeo': true,
        'auto_tracking_slideshare': true,

        'actor': null,
        'parent': null,
        'timestamp': null,
        'log': false
    };

    exports.get = function (key, defaultValue) {
        return settings[key] || defaultValue;
    };

    exports.set = function (key, value) {
        settings[key] = value;
    };

})(module.exports);
