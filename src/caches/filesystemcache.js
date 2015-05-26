!function (Cache, fs, linq, mkdirp, path) {
    'use strict';

    function FileSystemCache(options) {
        Cache.call(this);

        this.options = options || (options = {});
        this._tempdir = path.resolve(options.tempdir || 'temp/');
    }

    require('util').inherits(FileSystemCache, Cache);

    FileSystemCache.prototype._getFilename = function (name) {
        return path.resolve(this._tempdir, name);
    };

    FileSystemCache.prototype.load = function (name, callback) {
        var that = this;

        mkdirp(that._tempdir, function (err) {
            if (err) { return callback(err); }

            fs.readFile(that._getFilename(name), function (err, cache) {
                if (!err) {
                    try {
                        cache = JSON.parse(cache);
                    } catch (ex) {
                        return callback(null, {}, {});
                    }

                    callback(
                        null,
                        cache.inputs,
                        linq(cache.outputs)
                            .select(function (output) {
                                return {
                                    buffer: new Buffer(output.buffer, 'base64'),
                                    md5: output.md5
                                };
                            })
                            .run()
                    );
                } else if (err.code === 'ENOENT') {
                    callback(null, {}, {});
                } else {
                    callback(err);
                }
            });
        });
    };

    FileSystemCache.prototype.save = function (name, inputs, outputs, callback) {
        var that = this;

        mkdirp(that._tempdir, function (err) {
            if (err) { return callback(err); }

            var cache = {
                    inputs: linq(inputs).select(function (input) {
                        return { md5: input.md5 };
                    }).run(),
                    outputs: linq(outputs).select(function (output) {
                        return {
                            buffer: output.buffer.toString('base64'),
                            md5: output.md5
                        };
                    }).run()
                };

            fs.writeFile(that._getFilename(name), JSON.stringify(cache, null, 2), callback);
        });
    };

    module.exports = function (options) {
        return new FileSystemCache(options);
    };

    module.exports.FileSystemCache = FileSystemCache;
}(
    require('../cache'),
    require('fs'),
    require('async-linq'),
    require('mkdirp'),
    require('path')
);