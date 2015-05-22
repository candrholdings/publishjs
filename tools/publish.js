!function (async, FileSystemCache, Immutable, linq, path, Pipe, Processor) {
    'use strict';

    var DEFAULT_PROCESSORS = {
            from: require('./from')
        };

    function PublishJS(immutableOptions) {
        var that = this;

        immutableOptions = immutableOptions.withMutations(function (options) {
            options
                .set('basedir', options.get('basedir') || path.resolve('.'))
                .set('output', options.get('output') || 'publish/')
                .set('processors',
                    linq(DEFAULT_PROCESSORS).concat(options.get('processors') || {}).run()
                )
                .update('cache', function (cache) {
                    if (cache === false) {
                        return cache;
                    } else if (!cache) {
                        return new FileSystemCache();
                    } else if (typeof cache === 'string') {
                        return new FileSystemCache({ tempdir: cache });
                    } else if (cache instanceof require('./cacheprovider')) {
                        return cache;
                    } else {
                        throw new Error('cache must either be string or base from CacheProvider');
                    }
                });
        });

        that.options = immutableOptions.toJS();
        that._options = immutableOptions;
        that._nextActionID = 0;

        var actions = that._actions = {},
            processors = that.options.processors;

        Object.getOwnPropertyNames(processors).forEach(function (name) {
            var processFn = processors[name];

            if (typeof processFn !== 'function') {
                throw new Error('options.processors["' + name + '"] should be a function, instead of ' + processFn);
            }

            var processor = new Processor(processFn);

            actions[name] = function () {
                var args = [].slice.call(arguments),
                    files = args.shift() || {},
                    callback = args.pop(),
                    options = this.options;

                try {
                    processor.run(
                        name,
                        options,
                        options._pipeID + '.' + that._nextActionID++,
                        files,
                        args,
                        callback
                    );
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
                .set('_pipeID', pipeID)
                .toJS()
        );
    };

    module.exports = function (options) {
        options = Immutable.Map(options).withMutations(function (options) {
            options._nextPipeID = 0;
        });

        return new PublishJS(options);
    };
}(
    require('async'),
    require('./filesystemcache'),
    require('immutable'),
    require('async-linq'),
    require('path'),
    require('./pipe'),
    require('./processor')
);