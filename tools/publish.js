!function (async, linq, path, Pipe, Processor) {
    'use strict';

    var DEFAULT_PROCESSORS = {
        // from: require('./from')
    };

    function PublishJS(options) {
        options.basedir || (options.basedir = path.resolve('.'));
        options.output || (options.output = 'publish/');
        options.temp || (options.temp = 'temp/');
        options.processors = linq(DEFAULT_PROCESSORS).concat(options.processors || {}).run();

        var actions = {};

        Object.getOwnPropertyNames(options.processors).forEach(function (name) {
            var CustomProcessor = options.processors[name];

            if (typeof CustomProcessor !== 'function') {
                throw new Error('options.processors["' + name + '"] should be a function, instead of ' + CustomProcessor);
            }

            actions[name] = function () {
                var args = [].slice.call(arguments),
                    files = args.shift() || {},
                    callback = args.pop(),
                    processor = new CustomProcessor(options, '0', name);

                if (!(processor instanceof Processor)) {
                    return callback(new Error('options.processors["' + name + '"] must subclass Processor'));
                }

                processor._run(files, args, callback);
            };
        });

        this.pipe = new Pipe(actions, options);
    }

    module.exports = function (options) {
        return new PublishJS(options || {});
    };
}(
    require('async'),
    require('async-linq'),
    require('path'),
    require('./pipe'),
    require('./processor')
);