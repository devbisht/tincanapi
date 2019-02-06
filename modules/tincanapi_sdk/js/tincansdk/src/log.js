(function (exports) {

    var enabled = false;
    exports.enable = function () {
        enabled = true;

        exports.write('log enabled');
    };

    exports.write = function () {
        if (!enabled)
            return;

        Array.prototype.unshift.call(arguments, '[tincan]');
        var i = -1, l = arguments.length, args = [], fn = 'console.log(args)';
        while (++i < l)
            args.push('args['+i+']');
        fn = new Function('args', fn.replace(/args/, args.join(',')));
        fn(arguments);
    };

})(module.exports);
