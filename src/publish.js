!function (async, crawl, EventEmitter, FileSystemCache, format, Immutable, linq, path, Pipe, Processor, watch) {
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
                })
                .update('pipes', function (pipes) {
                    if (!pipes) { throw new Error('pipes must be defined in options'); }

                    if (typeof pipes === 'function') {
                        pipes = [pipes];
                    }

                    return {}.toString.call(pipes) === '[object Array]' ? Immutable.List(pipes) : Immutable.Map(pipes);
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
                        function (err, outputs, watching) {
                            watching.forEach(function (filename) {
                                that._watching[filename] = 1;
                            });

                            callback(err, outputs);
                        }
                    );
                } catch (ex) {
                    callback(ex);
                }
            };
        });
    }

    require('util').inherits(PublishJS, EventEmitter);

    PublishJS.prototype.build = function (callback) {
        var that = this,
            pipes = that._options.get('pipes').toJS();

        that._watching = {};

        async.series(linq(pipes).toArray(function (fn, nameOrIndex) {
            return function (callback) {
                that.options.log(format.log('publish', 'Build pipe "' + nameOrIndex + '" is started'));

                var pipeContext = that._createPipe(nameOrIndex);

                fn.call(that, pipeContext, function (err, outputs) {
                    that.options.log(format.log('publish', 'Build pipe "' + nameOrIndex + '" has ' + (err ? 'failed\n\n' + err.stack : 'succeeded') + '\n'));

                    callback(err, err ? null : outputs);
                });
            };
        }).run(), function (err, outputs) {
            if (err) {
                that.emit('error', err);
                return callback && callback.call(that, err);
            }

            async.series([function (callback) {
                that._watcher ? that._watcher.setFilenames(Object.getOwnPropertyNames(that._watching), callback) : callback();
            }], function (err) {
                var combined = {};

                outputs.forEach(function (output) {
                    Object.getOwnPropertyNames(output).forEach(function (filename) {
                        combined[filename] = output[filename];
                    });
                });

                that._finalize(combined, function (err, result) {
                    if (err) {
                        that.emit('error', err);
                        callback && callback.call(that, err);
                    } else {
                        that.emit('build', result);
                        callback && callback.call(that, null, result);
                    }
                });
            });
        });

        return that;
    };

    PublishJS.prototype._finalize = function (files, callback) {
        var options = this.options,
            result,
            finalizer = new Processor('__finalizer', options, function (inputs, outputs, callback) {
                Object.getOwnPropertyNames(inputs.all).forEach(function (filename) {
                    outputs[filename] = inputs.all[filename];
                });

                result = inputs;

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

    PublishJS.prototype.watch = function (handler) {
        var that = this;

        if (that._watcher) {
            that._watcher.close();
            that._watcher = null;
        }

        if (handler !== false) {
            that._watcher = watch([], { basedir: that.options.basedir}).on('change', function (changes) {
                if (handler) {
                    handler.call(that, changes);
                } else {
                    that.build();
                }
            });
        }

        return that;
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
    require('./util/crawl'),
    require('events').EventEmitter,
    require('./caches/filesystemcache'),
    require('./util/format'),
    require('immutable'),
    require('async-linq'),
    require('path'),
    require('./util/pipe'),
    require('./processor'),
    require('./util/watch')
);