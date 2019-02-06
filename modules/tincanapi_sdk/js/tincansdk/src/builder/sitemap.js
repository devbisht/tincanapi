(function (exports) {

    var helper = require('../helper'),
        config = require('../config'),
        request = require('superagent'),
        tracker = require('../tracker/core');

    function Sitemap (url) {
        var _this = this;

        this.url = url;

        if (!this.url)
            this.url = 'sitemap.xml';

        this.sitemapFetched = function (err, sitemap) {
            if (!sitemap.ok) {
                console.error('Sitemap could not be found');
                return;
            }

            _this.xml = sitemap.xhr.responseXML;

            _this.buildSitemap();
        };

        this.buildSitemap = function () {
            var nodes = _this.xml.getElementsByTagName("url"),
                activities = [],
                map = {},

                extract = function (node, name) {
                    var temp = node.getElementsByTagName(name);
                    return temp.length ? temp[0].textContent : null;
                };

            // Create a sub tree format
            for (var i = 0; i < nodes.length; i++) {
                var node = nodes[i],
                    path = extract(node, 'loc'),
                    name = extract(node, 'title'),
                    parent = extract(node, 'parent');

                if (!name)
                    name = path;

                var activity = {
                    'activity': {
                        'id': path,
                        'definition': {
                            'name': {
                                'en-US': name
                            }
                        }
                    },
                    'chapter': '',
                    'optional': false,
                    'children': [],
                    'parent': parent
                };

                activities.push(activity);

                // Store the activities index by map path, we'll need this as a lookup when
                // transforming activities to a tree.
                map[path] = i;
            }

            // Build the tree
            var node, roots = [];
            for (i = 0; i < activities.length; i++) {
                node = activities[i];
                var p = node.parent;
                delete node.parent;
                if (p)
                    activities[map[p]].children.push(node);
                else
                    roots.push(node);
            }

            _this.activities = roots;

            _this.submitMap();
        };

        this.submitMap = function () {
            tracker.sendActivityProfile('http://imindsx.be/unfiltered', 'classTree', _this.activities);
        };
    }

    Sitemap.prototype.build = function () {
        request.get(this.url).end(this.sitemapFetched);
    };

    exports.Sitemap = Sitemap;

})(module.exports);
