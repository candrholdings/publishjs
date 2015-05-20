!function (CacheProvider, fs, path) {
    'use strict';

    function FileSystemCache(options) {
        CacheProvider.call(this);

        this.options = options || {};
    }

    require('util').inherits(FileSystemCache, CacheProvider);

    FileSystemCache.prototype._getFilename = function (name) {
        return path.resolve(this.options.tempdir || 'temp/', name);
    };

    FileSystemCache.prototype.load = function (name, callback) {
        fs.readFile(this._getFilename(name), function (err, cache) {
            callback(err, err ? null : (cache.inputs || {}), err ? null : (cache.outputs || {}));
        });
    };

    FileSystemCache.prototype.save = function (name, inputs, outputs, callback) {
        fs.writeFile(this._getFilename(name), { inputs: inputs, outputs: outputs }, callback);
    };

    module.exports = FileSystemCache;
}(
    require('./cacheprovider'),
    require('fs'),
    require('path')
);