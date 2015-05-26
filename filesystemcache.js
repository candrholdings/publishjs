!function (CacheProvider, fs, mkdirp, path) {
    'use strict';

    function FileSystemCache(options) {
        CacheProvider.call(this);

        this.options = options || (options = {});
        this._tempdir = path.resolve(options.tempdir || 'temp/');
    }

    require('util').inherits(FileSystemCache, CacheProvider);

    FileSystemCache.prototype._getFilename = function (name) {
        return path.resolve(this._tempdir, name);
    };

    FileSystemCache.prototype.load = function (name, callback) {
        var that = this;

        mkdirp(that._tempdir, function (err) {
            if (err) { return callback(err); }

            fs.readFile(that._getFilename(name), function (err, cache) {
                callback(err, err ? null : (cache.inputs || {}), err ? null : (cache.outputs || {}));
            });
        });
    };

    FileSystemCache.prototype.save = function (name, inputs, outputs, callback) {
        var that = this;

        mkdirp(that._tempdir, function (err) {
            if (err) { return callback(err); }

            fs.writeFile(that._getFilename(name), { inputs: inputs, outputs: outputs }, callback);
        });
    };

    module.exports = FileSystemCache;
}(
    require('./cacheprovider'),
    require('fs'),
    require('mkdirp'),
    require('path')
);