(function (exports) {

    var _this = this,

        serviceWorker = navigator.serviceWorker,

        serviceController = null;

    function AppCacheNoon () {}
    AppCacheNoon.prototype.on = function () {};
    AppCacheNoon.prototype.start = function () {};

    if (!serviceWorker) {
        exports.AppCache = AppCacheNoon;
        return undefined;
    }

    function AppCache () {

        this.events = [];
        this.workerReady = false;

        // Does a check if the worker is loaded, if not,
        // loads the Service Worker object and sets the correct controller.
        this.loadServiceWorker = function () {
            var root = this;

            this.registerEventHandlers();

            if (!serviceWorker.controller) {
                serviceWorker.register('appCache.worker.js', {scope: './'})
                    .then(function (registration) {
                        serviceController = registration.installing || serviceWorker.controller;

                        root.logMessage('ServiceWorker successfully registered');
                        root.triggerEvent('ready');
                    })
                    .catch(function (err) {
                        root.logMessage('ServiceWorker registration failed', err);
                    });
            } else {
                serviceController = serviceWorker.controller;

                root.triggerEvent('ready');
            }
        };

        this.triggerEvent = function (name, params) {
            if (!params)
                params = [];

            for (var eventIndex in this.events) {
                var eventHandler = this.events[eventIndex];

                if (eventHandler.name === name)
                    eventHandler.callback.apply(this, params);
            }
        };

        this.sendToWorker = function (key, data) {
            if (!serviceController)
                return this.triggerError("Sending a message to ServiceWorker failed because serviceController is not initialized. Did you call appCache.start()?");

            var promise = function (resolve, reject) {
                var messageChannel = new MessageChannel();

                messageChannel.port1.onmessage = function (event) {
                    if (event.data.error)
                        reject(event.data.error);
                    else
                        resolve(event.data);
                };

                var payload = [
                    messageChannel.port2
                ];

                serviceController.postMessage({
                    key: key,
                    data: data
                }, payload);
            };

            return new Promise(promise);
        };

        this.logMessage = function () {
            var i = -1,
                args = [],
                fn = 'console.log(args)';

            while (++i < arguments.length)
                args.push('args[' + i + ']');

            fn = new Function('args', fn.replace(/args/,args.join(',')));
            fn(arguments);
        };

        this.triggerError = function (exception) {
            console.error(exception);
        };

        this.registerEventHandlers = function () {
            serviceWorker.addEventListener('message', _this.onServiceWorkerMessage);
        };

        this.onServiceWorkerMessage = function (event) {
            _this.triggerEvent(event.key, event.value);
        };

    }

    AppCache.prototype.on = function (name, callback) {
        var eventHandler = {
            name: name,
            callback: callback
        };

        this.events.push(eventHandler);
    };

    AppCache.prototype.start = function () {
        this.loadServiceWorker();
    };

    AppCache.prototype.addContent = function (links) {
        this.sendToWorker('addContent', links);
    };

    AppCache.prototype.setSettings = function (settings) {
        this.sendToWorker('setSettings', settings);
    };

    AppCache.prototype.command = function (command, data, callback) {
        if (data instanceof Function) {
            callback = data;
            data = null;
        }

        this.sendToWorker(command, data).then(callback);
    };

    exports.AppCache = AppCache;

})(module.exports);
