!function (crawl, EventEmitter, fs) {
    'use strict';

    function Watcher(filenames, options) {
        var that = this;

        EventEmitter.call(that);

        that.filenames = {}.toString.call(filenames) === '[object Array]' ? filenames : [filenames];

        options = that.options = {
            basedir: options && typeof options.basedir === 'string' ? options.basedir : '.',
            fswatch: options && typeof options.fswatch === 'boolean' ? options.fswatch : true,
            interval: options && typeof options.interval === 'number' ? options.interval : 2000
        };

        that.kick();

        if (options.fswatch !== false) {
            that._watch = fs.watch(filenames, function () {
                that.kick();
            });
        }
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

            callback(err);
        });
    };

    Watcher.prototype.setFilenames = function (filenames) {
        this.filenames = filenames;
        this.kick();
    };

    Watcher.prototype.close = function () {
        var that = this;

        that._paused = 1;
        clearTimeout(that._next);
        that._watch && that._watch.close();
    };

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
}(require('./crawl'), require('events').EventEmitter, require('fs'));