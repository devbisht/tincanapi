(function (exports) {

    var
        helper = require('../helper');

    exports.getActor = function (account) {
        // "name": "User Name",
        // "mbox": "mailto:user.name@iminds.be",
        // "objectType": "Agent"

        var actor = {};

        if (helper.isString(account))
            account = {name: account};

        actor.name = helper.objectGet(account, 'name', 'Unknown Actor');

        var email = helper.objectGet(account, 'email');
        if (!email)
            email = helper.stringTokenize(actor.name) + '@no-email.com';

        actor.mbox = 'mailto:' + email;

        actor.objectType = helper.objectGet(account, 'objectType', 'Agent');

        return actor;
    };

    exports.getVerb = function (id, display) {
        // "id": "http://adlnet.gov/expapi/verbs/viewed"
        // "display": {
        //     "en-US": "viewed"
        // }

        if (helper.isUndefined(display))
            display = id;

        var verb = {};

        verb.id = "http://adlnet.gov/expapi/verbs/" + id;

        verb.display = {
            'en-US': display
        };

        return verb;
    };

    exports.getObject = function (entity) {
        // "id": "http://orw.iminds.be/node/12",
        // "definition": {
        //     "name": {
        //         "en-US": "Video: Create Your Research Canvas"
        //     },
        //     "type": "http://orw.iminds.be/tincan/content/type/video",
        // },
        // "objectType": "Activity"

        var object = {};

        object.id = entity.url;

        object.definition = {
            name: {
                'en-US': helper.objectGet(entity, 'name', entity.url)
            },
            type: TC.API_CUSTOM_URI + '/' + helper.objectGet(entity, 'typePath', 'content/type') + '/' + helper.objectGet(entity, 'typeId', 'page')
        };

        object.objectType = helper.objectGet(entity, 'objectType', 'Activity');

        return object;
    };

    exports.getParent = function (statement) {
        // "id": "http://orw.iminds.be/node/7",
        // "objectType": "Activity"

        var parent = {};

        parent.objectType = helper.objectGet(statement, 'objectType', 'Activity');

        if (helper.isString(statement))
            parent.id = statement;
        else if (statement.id)
            parent.id = statement.id;
        else if (statement.url)
            parent.id = statement.url;

        return parent;
    };

})(module.exports);
