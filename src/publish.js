!function (async, crawl, crypto, EventEmitter, FileSystemCache, format, Immutable, linq, path, Pipe, Processor, time, watch) {
    'use strict';

    var DEFAULT_PROCESSORS = {
            from: require('./processors/from'),
            merge: require('./processors/merge'),
            noop: require('./processors/noop'),
            save: require('./processors/save')
        },
        NULL_FUNCTION = function () {};

    function PublishJS(immutableOptions) {
        var that = this;

        EventEmitter.call(that);

        // Should not quit on error even no listener attached to "error" event
        that.on('error', NULL_FUNCTION);

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
                })
                .update('mixins', function (mixins) {
                    if (!mixins) {
                        mixins = [];
                    }

                    return mixins;
                })
                .update('watch', function (watch) {
                    if (watch && typeof watch !== 'function') {
                        watch = function () {
                            this.build();
                        };
                    }

                    return watch;
                });
        });

        that.options = immutableOptions.toJS();
        that._options = immutableOptions;
        that._nextActionID = 0;

        var actions = that._actions = {},
            processors = that.options.processors;

        Object.getOwnPropertyNames(processors).forEach(function (name) {
            var processFn = processors[name];

            while (processFn && typeof processFn === 'string') {
                processFn = processors[processFn];
            }

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
                            !err && watching.forEach(function (filename) {
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

        that.options.mixins.forEach(function (mixin) {
            mixin && Object.getOwnPropertyNames(mixin).forEach(function (name) {
                if (name === 'onbuild') {
                    that.on('build', mixin[name].bind(that));
                } else if (name === 'onmix') {
                    mixin.onmix.call(that);
                } else {
                    that[name] = mixin[name];
                }
            });
        });

        if (that.options.watch) {
            that._watcher = watch([], { basedir: that.options.basedir }).on('change', function (changes) {
                that.options.watch.call(that, changes);
            });
        }
    }

    require('util').inherits(PublishJS, EventEmitter);

    PublishJS.prototype.log = function (facility, message) {
        if (arguments.length === 1) {
            message = arguments[0];
            facility = 'publish';
        }

        this.options.log(format.log(facility, message));
    };

    PublishJS.prototype.build = function (callback) {
        var that = this,
            startTime = Date.now(),
            pipes = that._options.get('pipes').toJS(),
            cacheKey = '';

        that._nextActionID = 0;

        if (that.options.cacheKey) {
            cacheKey = md5(JSON.stringify(that.options.cacheKey)).substr(0, 6);
            that.log('Build started with cache key "' + cacheKey + '"\n');
            cacheKey += '.';
        } else {
            that.log('Build started\n');
        }

        that._watching = {};

        async.series(linq(pipes).toArray(function (fn, nameOrIndex) {
            return function (callback) {
                that.log('publish', 'Build pipe "' + nameOrIndex + '" is started');

                var pipeContext = that._createPipe(cacheKey + nameOrIndex);

                fn.call(that, pipeContext, function (err, outputs) {
                    that.log('publish', 'Build pipe "' + nameOrIndex + '" has ' + (err ? 'failed' : 'succeeded') + '\n');

                    callback(err, err ? null : outputs);
                });
            };
        }).run(), function (err, outputs) {
            if (err) {
                that.log('Build failed due to "' + err.message + '"');
                that.emit('error', err);

                that._watcher && that.log('publish', 'Watching for new changes');

                return callback && callback.call(that, err);
            }

            that.log('Build completed successfully, took ' + time.humanize(Date.now() - startTime));

            async.series([function (callback) {
                if (that._watcher) {
                    that._watcher.setFilenames(Object.getOwnPropertyNames(that._watching), callback);
                    that.log('publish', 'Watching for new changes');
                } else {
                    callback();
                }
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

    PublishJS.prototype.unwatch = function () {
        var that = this;

        if (that._watcher) {
            that._watcher.close();
            that._watcher = null;
        }

        return that;
    };

    module.exports = function (options) {
        return new PublishJS(Immutable.Map(options));
    };

    // Exposing some utilities

    module.exports.util = {
        number: require('./util/number'),
        regexp: require('./util/regexp'),
        time: time
    };

    module.exports.md5 = md5;

    function md5(str) {
        var md5 = crypto.createHash('md5');

        md5.update(str);

        return md5.digest('hex');
    }
}(
    require('async'),
    require('./util/crawl'),
    require('crypto'),
    require('events').EventEmitter,
    require('./caches/filesystemcache'),
    require('./util/format'),
    require('immutable'),
    require('async-linq'),
    require('path'),
    require('./util/pipe'),
    require('./processor'),
    require('./util/time'),
    require('./util/watch')
);