(function (exports) {

    var core = require('./core'),
        tracker = require('../tracker/core'),
        helper = require('../helper'),
        config = require('../config'),
        date = require('../date'),
        log = require('../log');

    function Statement () {
        this.verb = null;
        this.object = null;
        this.context = null;
        this.actor = null;
        this.id = false;
        this.timestamp = false;
        this.callback = null;
        this.result = null;

        // If we got an actor set in the config, use that actor as the default one.
        // On load, a hash is computed and used as the current actor.
        var tempActor = config.get('actor');
        this.setActor(tempActor ? tempActor : {});

        this.buildContextActivities = function () {
            if (!this.context)
                this.context = {};

            if (!this.context.contextActivities)
                this.context.contextActivities = {};
        };

        this.buildExtensions = function () {
            if (!this.context)
                this.context = {};

            if (!this.context.extensions)
                this.context.extensions = {};
        };

        this.responseCommand = function (cmd, ignore) {
            var _this = this;

            // If the server sends us back that we need to request a new time sync
            if (cmd === 'sync_time') {
                if (ignore) {
                    log.write('got response "sync_time" for the second time, ignore');
                    return false;
                }

                date.reset();
                date.requestTime(function () {
                    _this.useNowAsTimestamp();
                    _this.submit(_this.callback, true /* ignore response */);
                });

                return true;
            }

            return false;
        };
    }

    Statement.prototype.setVerb = function (id, display) {
        this.verb = core.getVerb(id, display);
    };

    Statement.prototype.getVerb = function () {
        return this.verb;
    };

    Statement.prototype.setActor = function (account) {
        this.actor = core.getActor(account);
    };

    Statement.prototype.getActor = function () {
        return this.actor;
    };

    Statement.prototype.setObject = function (entity, raw) {
        this.object = raw ? entity : core.getObject(entity);
    };

    Statement.prototype.getObject = function () {
        return this.object;
    };

    Statement.prototype.setResult = function (result) {
        this.result = result;
    };

    Statement.prototype.getResult = function () {
        return this.result;
    }

    Statement.prototype.useNowAsTimestamp = function () {
        this.setTimestamp();
    };

    Statement.prototype.setTimestamp = function (timestamp) {
        if (!timestamp)
            timestamp = date.now().format();

        this.timestamp = timestamp;
    };

    Statement.prototype.getTimestamp = function () {
        return this.timestamp;
    };

    Statement.prototype.addGroup = function (group) {
        this.buildContextActivities();

        if (!this.context.contextActivities.grouping)
            this.context.contextActivities.grouping = [];

        this.context.contextActivities.grouping.push(group);
    };

    Statement.prototype.addParent = function (statement) {
        this.buildContextActivities();

        if (!this.context.contextActivities.parent)
            this.context.contextActivities.parent = [];

        var formatted = core.getParent(statement);

        // This is just a precaution as a current id can never be it's own parent.
        if (formatted && formatted.id) {
            if (this.object && this.object.id !== formatted.id)
                this.context.contextActivities.parent.push(formatted);
        }
    };

    Statement.prototype.setExtension = function (name, value) {
        this.buildExtensions();

        this.context.extensions[name] = value;
    };

    Statement.prototype.asObject = function () {
        var statement = {
            actor: this.actor,
            verb: this.verb
        };

        if (config.get('actor') === 'hidden')
            delete statement.actor;

        if (this.object)
            statement.object = this.object;

        if (this.context)
            statement.context = this.context;

        if (this.id)
            statement.id = this.id;

        if (this.timestamp)
            statement.timestamp = this.timestamp;

        if (this.result) {
            statement.result = this.result;
        }

        return statement;
    };

    Statement.prototype.setFromObject = function (object) {
        if (object.actor) {
            this.actor = object.actor;
        }
        if (object.verb) {
            this.verb = object.verb;
        }
        if (object.object) {
            this.object = object.object;
        }
        if (object.context) {
            this.context = object.context;
        }
        if (object.id) {
            this.id = object.id;
        }
        if (object.timestamp) {
            this.timestamp = object.timestamp;
        }
        if (object.result) {
            this.result = object.result;
        }
    };

    Statement.prototype.v = function (path, defaultValue) {
        return helper.objectGet(this, path, defaultValue);
    };

    Statement.prototype.submit = function (callback, ignore_response) {
        var _this = this;

        var v =  _this.v('actor.name') + ' ' + _this.v('verb.display.en-US') + ' ' +  _this.v('object.id'); // _this.v('object.definition.name.en-US')
        log.write(v);

        if (window.jQuery) {
            jQuery(document).trigger('sendingXApiStatement', this);
        }

        tracker.sendStatement(this.asObject(), function (err, resp) {
            if (err) {
                _this.useNowAsTimestamp();
                tracker.storeStatementTemporary(_this);
                return;
            }

            _this.callback = callback;

            var response = helper.jsonParse(resp.text);
            if (typeof response === "string")
                if (_this.responseCommand(response, ignore_response))
                    return;

            if (callback)
                callback();
        });
    };

    Statement.prototype.tick = function (callback) {
        tracker.tickStatement(this.asObject(), function (err, resp) {
            callback();
        });
    };

    exports.Statement = Statement;

})(module.exports);
