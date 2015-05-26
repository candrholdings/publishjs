!function (async, fs, linq, Processor, path) {
    'use strict';

    module.exports = function (inputs, outputs, dirpath, callback) {
        dirpath = path.resolve(this.options.basedir || '.', dirpath);

        var that = this,
            displayablePath = path.relative(process.cwd(), dirpath).replace(/\\/, '/');

        try {
            crawl(dirpath, function (err, outputs) {
                if (!err) {
                    var outputCount = Object.getOwnPropertyNames(outputs).length,
                        displayableOutputs = linq(outputs).toArray(function (_, filename) { return filename; }).orderBy().take(5).run();

                    that.log('Reading from ./' + displayablePath + ', got ' + outputCount + ' file(s), including ' + displayableOutputs.join(', ') + (outputCount !== displayableOutputs ? '\u2026' : ''));
                }

                callback(err, err ? null : outputs);
            });
        } catch (ex) {
            callback(ex);
        }
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
    require('./processor'),
    require('path')
);