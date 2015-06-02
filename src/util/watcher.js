!function (crawl, EventEmitter) {
    'use strict';

    function Watcher(filenames, options) {
        var that = this;

        EventEmitter.call(that);

        that.filenames = filenames;

        that.options = {
            interval: options && typeof options.interval === 'number' ? options.interval : 2000
        };

        that.kick();

        that._watch = fs.watch(filenames, function () {
            that.kick();
        });
    }

    require('util').inherits(Watcher, EventEmitter);

    Watcher.prototype.kick = function () {
        that._paused = 0;
        that._scheduleNext(0);
    };

    Watcher.prototype.pause = function () {
        clearTimeout(that._next);
        that._paused = 1;
    };

    Watcher.prototype._scheduleNext = function (interval) {
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

        crawl(that.filenames, function (err, result) {
            that._busy = 0;

            if (!err) {
                that._state && !deepEqual(that._state, result) && that.emit('changed');
                that._state = result;
            }

            callback(err);
        });
    };

    Watcher.prototype.setFilenames = function (filenames) {
        that.filenames = filenames;
        that.kick();
    };

    Watcher.prototype.close = function () {
        clearTimeout(this._next);
        this._watch.close();
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
        }

        var nx = Object.getOwnPropertyNames(x),
            ny = Object.getOwnPropertyNames(y);

        if (nx.length !== ny.length) { return false; }

        return nx.every(function (name) {
            return deepEqual(x[name], y[name]);
        });
    }

    module.exports = function (filename, options) {
        return new Watcher(filename, options);
    };

    module.exports._deepEqual = deepEqual;
}(require('./crawl'), require('events').EventEmitter);