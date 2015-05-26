!function (async, fs, linq, Processor, path) {
    'use strict';

    module.exports = function (inputs, outputs, dirpath, callback) {
        dirpath = path.resolve(this.options.basedir || '.', dirpath);

        var that = this;

        try {
            crawl(dirpath, function (err, outputs) {
                !err && that.log('Reading from ' + dirpath + '\n' + Object.getOwnPropertyNames(outputs).map(function (n) { return '  ' + n; } ).sort().join('\n'));

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