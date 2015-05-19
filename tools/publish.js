!function (linq, path, pipe) {
    'use strict';

    var DEFAULT_PLUGINS = {
        from: require('./from')
    };

    function PublishJS(options) {
        options.basedir || (options.basedir = path.resolve('.');
        options.output || (options.output = 'publish/');
        options.temp || (options.temp = 'temp/');
        options.plugins = linq(DEFAULT_PLUGINS).concat(options.plugins || {});

        var actions = {};

        Object.getOwnPropertyNames(options.plugins).forEach(function (name, module) {
            actions[name] = function () {
            };
        });

        options.pipe = pipe();
    }

    module.exports = function (options) {
        return new PublishJS(options || {});
    };
}(
    require('async-linq'),
    require('path'),
    require('./pipe')
);