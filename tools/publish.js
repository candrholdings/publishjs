!function (async, Immutable, linq, path, Pipe, Processor) {
    'use strict';

    var DEFAULT_PROCESSORS = {
            // from: require('./from')
        };

    function PublishJS(immutableOptions) {
        immutableOptions = immutableOptions.withMutations(function (options) {
            options
                .set('basedir', options.get('basedir') || path.resolve('.'))
                .set('output', options.get('output') || 'publish/')
                .set('temp', options.get('temp') || 'temp/')
                .set('processors',
                    linq(DEFAULT_PROCESSORS).concat(options.get('processors') || {}).run()
                );
        });

        this.options = immutableOptions.toJS();
        this._options = immutableOptions;

        var actions = this._actions = {},
            processors = this.options.processors;

        Object.getOwnPropertyNames(processors).forEach(function (name) {
            var CustomProcessor = processors[name];

            if (typeof CustomProcessor !== 'function') {
                throw new Error('options.processors["' + name + '"] should be a function, instead of ' + CustomProcessor);
            }

            actions[name] = function () {
                var args = [].slice.call(arguments),
                    files = args.shift() || {},
                    callback = args.pop(),
                    options = this.options,
                    processor = new CustomProcessor(options, options.pipeID + '.' + options.actionID++, name);

                if (!(processor instanceof Processor)) {
                    return callback(new Error('options.processors["' + name + '"] must subclass Processor'));
                }

                try {
                    processor._run(files, args, callback);
                } catch (ex) {
                    callback(ex);
                }
            };
        });
    }

    PublishJS.prototype.build = function (tasks, callback) {
        var that = this;

        if (typeof tasks === 'function') {
            tasks = [tasks];
        }

        async.series(linq(tasks).toArray(function (fn, nameOrIndex) {
            return function (callback) {
                fn.call(that, that._createPipe(nameOrIndex), callback);
            };
        }).run(), callback);
    };

    PublishJS.prototype._createPipe = function (pipeID) {
        return new Pipe(
            this._actions,
            this._options
                .set('actionID', 0)
                .set('pipeID', pipeID)
                .toJS()
        );
    };

    module.exports = function (options) {
        options = Immutable.Map(options).withMutations(function (options) {
            options._nextActionID = 0;
            options._nextPipeID = 0;
        });

        return new PublishJS(options);
    };
}(
    require('async'),
    require('immutable'),
    require('async-linq'),
    require('path'),
    require('./pipe'),
    require('./processor')
);