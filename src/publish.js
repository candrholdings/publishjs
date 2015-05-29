!function (async, FileSystemCache, format, Immutable, linq, path, Pipe, Processor) {
    'use strict';

    var DEFAULT_PROCESSORS = {
            from: require('./processors/from'),
            merge: require('./processors/merge'),
            save: require('./processors/save')
        },
        NULL_FUNCTION = function () {};

    function PublishJS(immutableOptions) {
        var that = this;

        immutableOptions = immutableOptions.withMutations(function (options) {
            options
                .set('processors',
                    linq(DEFAULT_PROCESSORS).concat(options.get('processors') || {}).run()
                )
                .update('basedir', function (basedir) {
                    return basedir ? (basedir || '').replace(/[\\\/]/g, '/') : path.resolve('.');
                })
                .update('cache', function (cache) {
                    if (cache === false) {
                        return cache;
                    } else if (!cache) {
                        return new FileSystemCache();
                    } else if (typeof cache === 'string') {
                        return new FileSystemCache({ tempdir: cache });
                    } else if (cache instanceof require('./cache')) {
                        return cache;
                    } else {
                        throw new Error('cache must either be string or base from CacheProvider');
                    }
                })
                .update('log', function (log) {
                    return log === false ? NULL_FUNCTION : (log || console.log.bind(console));
                })
                .update('output', function (output) {
                    return output ? (output || '').replace(/[\\\/]/g, '/') : 'publish/';
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

            var processor = new Processor(name, that.options, processFn);

            actions[name] = function () {
                var args = [].slice.call(arguments),
                    files = args.shift() || {},
                    callback = args.pop(),
                    options = this.options;

                try {
                    processor.run(
                        options._pipeID + '.' + that._nextActionID++ + '-' + name,
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
                that.options.log(format.log('publish', 'Build pipe "' + nameOrIndex + '" is started'));

                fn.call(that, that._createPipe(nameOrIndex), function (err, outputs) {
                    that.options.log(format.log('publish', 'Build pipe "' + nameOrIndex + '" has ' + (err ? 'failed\n\n' + err.stack : 'succeeded') + '\n'));
                    callback(err, err ? null : outputs);
                });
            };
        }).run(), function (err, outputs) {
            if (err) { return callback(err); }

            var combined = {};

            outputs.forEach(function (output) {
                Object.getOwnPropertyNames(output).forEach(function (filename) {
                    combined[filename] = output[filename];
                });
            });

            that._finalize(combined, callback);
        });
    };

    PublishJS.prototype._finalize = function (files, callback) {
        var options = this.options,
            result,
            finalizer = new Processor('__finalizer', options, function (inputs, outputs, callback) {
                Object.getOwnPropertyNames(inputs.all).forEach(function (filename) {
                    outputs[filename] = inputs.all[filename];
                });

                callback(null, outputs);
            });

        finalizer.run(
            'final',
            files,
            [],
            function (err) {
                callback(err, err ? null : result);
            }
        );
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

    // Exposing some utilities

    module.exports.util = {
        number: require('./util/number'),
        regexp: require('./util/regexp'),
        time: require('./util/time')
    };
}(
    require('async'),
    require('./caches/filesystemcache'),
    require('./util/format'),
    require('immutable'),
    require('async-linq'),
    require('path'),
    require('./util/pipe'),
    require('./processor')
);