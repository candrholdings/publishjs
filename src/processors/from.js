!function (async, fs, linq, number, Processor, path, time) {
    'use strict';

    module.exports = function (inputs, outputs, dirpaths, callback) {
        var that = this;

        if ({}.toString.call(dirpaths) !== '[object Array]') {
            dirpaths = [dirpaths];
        }

        dirpaths.forEach(function (dirpath, index) {
            if (typeof dirpath === 'string') {
                that.watch(dirpath);
                dirpaths.splice(index, 1, path.resolve(that.options.basedir || '.', dirpath));
            }
        });

        var results = [];

        linq(dirpaths).async.select(function (dirpath, index, callback) {
            if (typeof dirpath === 'string') {
                var displayablePath = path.relative(process.cwd(), dirpath).replace(/\\/, '/'),
                    startTime = Date.now();

                try {
                    crawl(dirpath, function (err, outputs) {
                        if (!err) {
                            var elapsed = Date.now() - startTime,
                                outputCount = Object.getOwnPropertyNames(outputs).length,
                                displayableOutputs = linq(outputs).toArray(function (_, filename) { return filename; }).orderBy().take(5).run(),
                                totalSize = linq(outputs).sum(function (buffer) { return buffer.length; }).run();

                            that.log([
                                'Reading from ./',
                                displayablePath,
                                ', got ',
                                outputCount,
                                ' file(s), including ',
                                displayableOutputs.join(', '),
                                (outputCount !== displayableOutputs.length ? '\u2026' : ''),
                                ', took ',
                                time.humanize(elapsed),
                                ' (',
                                number.bytes(totalSize / elapsed * 1e3),
                                '/s)'
                            ].join(''));

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
        var pendings = ['./'],
            result = {};

        async.whilst(
            function () { return pendings.length; },
            function (callback) {
                var pending = pendings.pop(),
                    fullname = path.resolve(basedir, pending);

                fs.stat(fullname, (err, stat) => {
                    if (stat.isFile()) {
                        result[pending] = 0;
                        callback();
                    } else {
                        fs.readdir(fullname, (err, files) => {
                            if (err) { return callback(err); }

                            files.forEach(file => {
                                pendings.push(path.join(pending, file).replace(/\\/g, '/'));
                            });

                            callback();
                        });
                    }
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
    require('../util/number'),
    require('../processor'),
    require('path'),
    require('../util/time')
);