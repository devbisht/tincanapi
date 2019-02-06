(function (exports) {

    var config = require('../config'),
        request = require('superagent'),
        helper = require('../helper');

    function tincanResponse (response) {
        // General response handler is required
    }

    function tincanSend (action, method, data, callback) {
        var endpoint = config.get('endpoint'),
            user = config.get('auth_user'),
            password = config.get('auth_password');

        if (!callback)
            callback = tincanResponse;

        // Sanitize endpoint.
        if (endpoint) {
            endpoint = endpoint.trim();
            if (endpoint.substring(endpoint.length - 1) == '/')
                endpoint = endpoint.substring(0, endpoint.length - 1);
        }

        // Sanitize action.
        action = action.trim();
        if (action.substring(0, 1) == "/")
            action = action.substring(1, action.length);

        var req = null,
            url = endpoint + '/' + action;

        // Check if we have a strict endpoint set.
        var strict_endpoint = config.get('strict_endpoint');
        if (strict_endpoint)
            url = strict_endpoint;

        if (method === "POST")
            req = request.post(url);
        else if (method === "PUT")
            req = request.put(url);

        req
            .set('Content-Type', 'application/json')
            .set('X-Experience-API-Version', '1.0.0');

        if (user && password)
            req.auth(user, password);

        req
            .send(data)
            .end(callback);
    }

    function sendStatement (data, callback) {
        tincanSend('statements', 'POST', data, callback);
    }

    function tickStatement (data, callback) {
        var id = data.id,
            url = 'statementTick';

        delete data.id;

        url += '?statementId=' + id;

        tincanSend(url, 'PUT', data, callback);
    }

    function sendActivityProfile (activityId, profileId, data) {
        var payload = {
            activityId: activityId,
            profileId: profileId,
            content: data
        };

        tincanSend('activities/profile', 'POST', payload);
    }

    function storeStatementTemporary (statement) {
        helper.localStore.push('temp_statements', statement.asObject());
    }

    function sendTemporaryStored() {
        var statements = helper.localStore.pull('temp_statements');

        if (statements instanceof Array) {
            for (var i = 0; i < statements.length; i++) {
                statement = statements[i];
                sendStatement(statement);
            }
        }
    }

    exports.sendStatement = sendStatement;
    exports.tickStatement = tickStatement;
    exports.sendActivityProfile = sendActivityProfile;
    exports.storeStatementTemporary = storeStatementTemporary;
    exports.sendTemporaryStored = sendTemporaryStored;

})(module.exports);
