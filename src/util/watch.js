!function (async, crawl, EventEmitter, fs, path) {
    'use strict';

    function Watcher(filenames, options) {
        var that = this;

        EventEmitter.call(that);

        options = that.options = {
            basedir: options && typeof options.basedir === 'string' ? options.basedir : '.',
            fswatch: options && typeof options.fswatch === 'boolean' ? options.fswatch : true,
            interval: options && typeof options.interval === 'number' ? options.interval : 2000
        };

        that.setFilenames(filenames);
    }

    require('util').inherits(Watcher, EventEmitter);

    Watcher.prototype.kick = function () {
        this._paused = 0;
        this._scheduleNext(0);
    };

    Watcher.prototype.pause = function () {
        clearTimeout(this._next);
        this._paused = 1;
    };

    Watcher.prototype._scheduleNext = function (interval) {
        var that = this;

        if (that._busy || that._paused) { return; }

        clearTimeout(that._next);

        that._next = setTimeout(function () {
            clearTimeout(that._next);

            try {
                that._doOnce(function () {
                    that._scheduleNext(that.options.interval);
                });
            } catch (ex) {
                that._scheduleNext(that.options.interval);
            }
        }, interval);
    };

    Watcher.prototype._doOnce = function (callback) {
        var that = this;

        if (!that.filenames || !that.filenames.length) {
            if (that._setFilenamesCallback) {
                that._setFilenamesCallback();
                that._setFilenamesCallback = 0;
            }

            return callback();
        }

        that._busy = 1;

        crawl(that.filenames, { basedir: that.options.basedir }, function (err, result) {
            that._busy = 0;

            if (!err) {
                if (that._state) {
                    var changes = diff(that._state, result);

                    typeof changes !== 'undefined' && that.emit('change', Object.getOwnPropertyNames(changes).sort());
                } else {
                    that.emit('init');
                }

                that._state = result;
            }

            if (that._setFilenamesCallback) {
                that._setFilenamesCallback();
                that._setFilenamesCallback = 0;
            }

            callback(err);
        });
    };

    Watcher.prototype.setFilenames = function (filenames, callback) {
        var that = this;

        if (that._setFilenamesCallback) {
            that._setFilenamesCallback(new Error('obsoleted'));
            that._setFilenamesCallback = 0;
        }

        if (that._fswatchers) {
            that._fswatchers.forEach(function (fswatcher) {
                fswatcher.close();
            });

            that._fswatchers = 0;
        }

        if (!filenames) {
            that.filenames = [];
        } else {
            that.filenames = {}.toString.call(filenames) === '[object Array]' ? filenames : [filenames];
        }

        if (that.options.fswatch !== false) {
            watchAll(
                that.filenames, 
                function () {
                    !that._paused && that.kick();
                }, 
                function (err, watchers) {
                    if (err) { return callback(err); }

                    that._fswatchers = watchers;
                    that._setFilenamesCallback = callback;
                    that.kick();
                }
            );
        } else {
            that.kick();
        }
    };

    Watcher.prototype.close = function () {
        var that = this;

        that._paused = 1;

        that._fswatchers &&　that._fswatchers.forEach(function (fswatcher) {
            fswatcher.close();
        });

        that._fswatchers = 0;

        clearTimeout(that._next);

        that._watch && that._watch.close();
    };

    function watchAll(filenames, changed, callback) {
        var watchers = [],
            pendings = filenames.slice();

        async.whilst(
            function () { return pendings.length; },
            function (callback) {
                var currfilename = pendings.pop();

                fs.stat(currfilename, function (err, stat) {
                    (stat.isDirectory() || stat.isFile()) && watchers.push(fs.watch(currfilename, changed));

                    if (stat.isDirectory()) {
                        watchers.push(fs.watch(currfilename, changed));

                        fs.readdir(currfilename, function (err, filenames) {
                            !err && filenames.forEach(function (filename) {
                                pendings.push(path.join(currfilename, filename));
                            });

                            callback(err);
                        });
                    } else {
                        callback();
                    }
                });
            },
            function (err) {
                err && watchers.forEach(function (watcher) {
                    watcher.close();
                });

                callback(err, err ? null : watchers);
            }
        );
    }

    function deepEqual(x, y) {
        var tx = typeof x,
            ty = typeof y;

        if (tx !== ty) {
            return false;
        } else if (tx === 'boolean' || tx === 'number' || tx === 'string' || tx === 'function' || tx === 'undefined') {
            return x === y;
        } else if (x instanceof Date) {
            return y instanceof Date && x.getTime() === y.getTime();
        } else if ({}.toString.call(x) === '[object Array]') {
            if ({}.toString.call(x) !== '[object Array]' || x.length !== y.length) {
                return false;
            }

            return x.every(function (xx, index) {
                return deepEqual(xx, y[index]);
            });
        }

        var nx = Object.getOwnPropertyNames(x),
            ny = Object.getOwnPropertyNames(y);

        if (nx.length !== ny.length) { return false; }

        return nx.every(function (name) {
            return deepEqual(x[name], y[name]);
        });
    }

    function diff(x, y) {
        var tx = typeof x,
            ty = typeof y;

        if (tx !== ty) {
            return y;
        } else if (tx === 'boolean' || tx === 'number' || tx === 'string' || tx === 'function' || tx === 'undefined') {
            return x === y ? undefined : y;
        } else if (x instanceof Date) {
            return y instanceof Date && x.getTime() === y.getTime() ? undefined : y;
        } else if ({}.toString.call(x) === '[object Array]') {
            return deepEqual(x, y) ? undefined : y;
        }

        var nx = Object.getOwnPropertyNames(x),
            ny = Object.getOwnPropertyNames(y),
            changed,
            diff = {};

        nx.forEach(function (name) {
            if (!~ny.indexOf(name)) {
                diff[name] = undefined;
                changed = 1;
            }
        });

        ny.forEach(function (name) {
            var xx = x[name],
                yy = y[name];

            if (!xx || !deepEqual(xx, yy)) {
                diff[name] = yy;
                changed = 1;
            }
        });

        return changed ? diff : undefined;
    }

    module.exports = function (filename, options) {
        return new Watcher(filename, options);
    };

    module.exports._deepEqual = deepEqual;
    module.exports._diff = diff;
}(
    require('async'),
    require('./crawl'),
    require('events').EventEmitter,
    require('fs'),
    require('path')
);