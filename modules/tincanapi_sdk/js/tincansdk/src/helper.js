(function (exports) {

    exports.objectGet = function (obj, dotPath, defaultValue) {
        if (!exports.isObject(obj))
            return defaultValue;

        var possible = dotPath.split('.').reduce(function (obj, i) {
            return obj[i];
        }, obj);

        return possible === undefined ? defaultValue : possible;
    };

    exports.stringTokenize = function (str) {
        str = str.replace(/ /g, '.');
        return str.toLowerCase();
    };

    exports.isUndefined = function (value) {
        return typeof value === "undefined";
    };

    exports.isObject = function (value) {
        return value === Object(value);
    };

    exports.isString = function (str) {
        return !!(typeof str === 'string');
    };

    exports.currentUrl = function () {
        var path = location.pathname;

        if (path === '/index.php')
            path = '/';

        var url = [location.protocol, '//', location.host, path].join('');

        return url;
    };

    exports.baseUrl = function () {
        return location.protocol + '//' + location.host;
    };

    exports.getRandomId = function (prefix) {
        var id = '',
            min = 97,
            max = 122;

        for (var i = 0; i < 10; i++) {
            var random = Math.floor(Math.random() * (max - min + 1)) + min;
            id += String.fromCharCode(random);
        }

        if (!prefix)
            prefix = 'id';

        return prefix + '-' + id;
    };

    exports.unixTimestamp = function () {
        return (new Date).getTime();
    };

    exports.guid = function () {
        if (window.name)
            return window.name;

        window.name = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        });

        return exports.guid();
    };

    function LocalStore () {
        this.supported = function () {
            return (typeof Storage !== void(0));
        };

        this.store = !this.supported() ?
            {
                setItem: function (key, value) {},
                getItem: function (key) {}
            } : window.localStorage;
    }

    LocalStore.prototype.push = function (name, value) {
        var bag = this.store.getItem(name);
        bag = this.jsonParse(bag);

        if (Object.prototype.toString.call(bag) !== '[object Array]')
            bag = [];

        bag.push(value);

        this.store.setItem(name, JSON.stringify(bag));
    };

    LocalStore.prototype.pull = function (name) {
        var bag = this.store.getItem(name);
        bag = this.jsonParse(bag);

        this.store.removeItem(name);

        return bag;
    };

    LocalStore.prototype.jsonParse = function (str) {
        try {
            return JSON.parse(str);
        } catch (e) {
            return {};
        }
    };

    LocalStore.prototype.set = function (name, key, value) {
        var bag = this.store.getItem(name);
        bag = this.jsonParse(bag);

        if (!bag) bag = {};

        bag[key] = value;

        this.store.setItem(name, JSON.stringify(bag));
    };

    LocalStore.prototype.stock = function (key, value) {
        this.store.setItem(key, value);
    };

    LocalStore.prototype.get = function (key) {
        var bag = this.store.getItem(key);
        bag = this.jsonParse(bag);
        return bag;
    };

    exports.localStore = new LocalStore;
    exports.jsonParse = exports.localStore.jsonParse;

})(module.exports);
