!function (async, fs, linq, Processor, path) {
    'use strict';

    module.exports = function (inputs, outputs, dirpaths, callback) {
        var that = this;

        if ({}.toString.call(dirpaths) !== '[object Array]') {
            dirpaths = [dirpaths];
        }

        dirpaths.forEach(function (dirpath, index) {
            if (typeof dirpath === 'string') {
                dirpaths.splice(index, 1, path.resolve(that.options.basedir || '.', dirpath));
            }
        });

        var results = [];

        linq(dirpaths).async.select(function (dirpath, index, callback) {
            if (typeof dirpath === 'string') {
                var displayablePath = path.relative(process.cwd(), dirpath).replace(/\\/, '/');

                try {
                    crawl(dirpath, function (err, outputs) {
                        if (!err) {
                            var outputCount = Object.getOwnPropertyNames(outputs).length,
                                displayableOutputs = linq(outputs).toArray(function (_, filename) { return filename; }).orderBy().take(5).run();

                            that.log('Reading from ./' + displayablePath + ', got ' + outputCount + ' file(s), including ' + displayableOutputs.join(', ') + (outputCount !== displayableOutputs.length ? '\u2026' : ''));

                            results.push(outputs);
                        }

                        callback(err);
                    });
                } catch (ex) {
                    callback(ex);
                }
            } else {
                dirpath.run(function (err, result) {
                    if (!err) {
                        var massaged = {};

                        Object.getOwnPropertyNames(result).forEach(function (filename) {
                            massaged[filename] = result[filename].buffer;
                        });

                        results.push(massaged);
                    }

                    callback(err);
                });
            }
        }).run(function (err) {
            if (err) { return callback(err); }

            var combined = {};

            results.forEach(function (result) {
                Object.getOwnPropertyNames(result).forEach(function (filename) {
                    if (combined[filename]) {
                        that.log('Warning, ' + filename + ' has been loaded twice, will overwrite');
                    }

                    combined[filename] = result[filename];
                });
            });

            callback(null, combined);
        });
    };

    function crawl(basedir, callback) {
        var dirs = ['./'],
            result = {};

        async.whilst(
            function () { return dirs.length; },
            function (callback) {
                var dir = dirs.pop();

                fs.readdir(path.resolve(basedir, dir), function (err, files) {
                    if (err) { return callback(err); }

                    files = linq(files).toDictionary(function (filename) {
                        return path.join(dir, filename).replace(/\\/g, '/');
                    }).run();

                    linq(files)
                        .async
                        .select(function (_, filename, callback) {
                            fs.stat(path.resolve(basedir, filename), callback);
                        })
                        .run(function (err, statsmap) {
                            if (err) { return callback(err); }

                            Object.getOwnPropertyNames(statsmap).forEach(function (filename) {
                                var stat = statsmap[filename];

                                if (stat.isFile()) {
                                    result[filename] = 0;
                                } else if (stat.isDirectory()) {
                                    dirs.push(filename);
                                }
                            });

                            callback();
                        });
                });
            },
            function (err) {
                if (err) { return callback(err); }

                linq(result).async.select(function (_, filename, callback) {
                    fs.readFile(path.resolve(basedir, filename), callback);
                }).run(callback);
            }
        );
    }
}(
    require('async'),
    require('fs'),
    require('async-linq'),
    require('../processor'),
    require('path')
);