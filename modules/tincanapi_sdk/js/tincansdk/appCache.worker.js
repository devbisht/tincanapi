/*
 * This file must be placed in the root folder where the SDK is loaded.
 */

var cacheName = 'exampleCachev1',

    cacheList = [
        'appCache.js'
    ],

    settings = {
        active: true,
        type: 'connectionFirst'
    },

    originalSettings = null;

self.addEventListener('install', function (event) {
    originalSettings = settings.clone();

    event.waitUntil(
        caches.open(cacheName).then(function (cache) {
            return cache.addAll(cacheList);
        })
    );
});

self.addEventListener('fetch', function (event) {
    if (!settings.active)
        return;

    var fetchOptions = {
        mode: 'no-cors',
        credentials: 'include'
    };

    switch (settings.type) {
        case "cacheOnly":
            event.respondWith(
                caches.match(event.request).then(function (response) {
                    return response;
                })
            );

            break;

        case "cacheFirst":
            event.respondWith(
                caches.match(event.request).then(function (response) {
                    return response || fetch(event.request.url, fetchOptions);
                })
            );

            break;

        case "connectionFirst":
            event.respondWith(
                fetch(event.request.url, fetchOptions)
                .then(function (response) {
                    if (!response || response.status !== 200 || response.type !== 'basic')
                        return response;

                    var responseToCache = response.clone();

                    caches.open(cacheName)
                        .then(function (cache) {
                            cache.put(event.request, responseToCache);
                        });

                    return response;
                })
                .catch(function () {
                    return caches.match(event.request).then(function (response) {
                        return response;
                    });
                })
            );

            break;
    }
});

self.addEventListener('message', function (event) {
    switch (event.data.key) {
        case 'addContent':
            caches.open(cacheName).then(function (cache) {
                cache.addAll(event.data.data);
            });

            break;

        case 'setSettings':
            settings.extend(event.data.data);
            break;

        case 'getSettings':
            event.ports[0].postMessage(settings);
            break;

        case 'resetSettings':
            settings = originalSettings.clone();
            break;

        case 'clearContent':
            clearCache();
            break;

        case 'requestCacheKeys':
            requestCacheKeys(event);
            break;
    }
});

function clearCache () {
    caches.open(cacheName).then(function (cache) {
        cache.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames.map(function (cacheName) {
                    return cache.delete(cacheName);
                })
            );
        });
    });
}

function requestCacheKeys (event) {
    caches.open(cacheName).then(function (cache) {
        cache.keys()
            .then(function (requests) {
                var urls = requests.map(function (request) {
                    return request.url;
                });

                return urls.sort();
            })
            .then(function (urls) {
                event.ports[0].postMessage(urls);
            });
    });
}

if (!Cache.prototype.addAll) {
    Cache.prototype.addAll = function addAll(requests) {
        var cache = this;

        // Since DOMExceptions are not constructable:
        function NetworkError(message) {
            this.name = 'NetworkError';
            this.code = 19;
            this.message = message;
        }
        NetworkError.prototype = Object.create(Error.prototype);

        return Promise.resolve().then(function() {
            if (arguments.length < 1) throw new TypeError();

            // Simulate sequence<(Request or USVString)> binding:
            var sequence = [];

            requests = requests.map(function(request) {
                if (request instanceof Request) {
                    return request;
                }
                else {
                    return String(request); // may throw TypeError
                }
            });

            return Promise.all(
                requests.map(function(request) {
                    if (typeof request === 'string') {
                        request = new Request(request);
                    }

                    var scheme = new URL(request.url).protocol;

                    if (scheme !== 'http:' && scheme !== 'https:') {
                        throw new NetworkError("Invalid scheme");
                    }

                    return fetch(request.clone(), {mode: 'no-cors'});
                })
            );
        }).then(function(responses) {
            return Promise.all(
                responses.map(function(response, i) {
                    return cache.put(requests[i], response);
                })
            );
        }).then(function() {
            return undefined;
        });
    };
}

if (!Object.prototype.extend) {
    Object.prototype.extend = function(obj) {
       for (var i in obj) {
          if (obj.hasOwnProperty(i)) {
             this[i] = obj[i];
          }
       }
    };
}

if (!Object.prototype.clone) {
    Object.prototype.clone = function () {
        return JSON.parse(JSON.stringify(this));
    };
}
