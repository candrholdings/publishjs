!function (async, fs, linq, Processor, path) {
    'use strict';

    function FromProcessor() {
        Processor.apply(this, arguments);
    }

    require('util').inherits(FromProcessor, Processor);

    FromProcessor.prototype.run = function (inputs, outputs, dirpath, callback) {
        try {
            crawl(path.resolve(this.options.basedir || '.', dirpath), callback);
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
                        return path.join(dir, filename);
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

    module.exports = FromProcessor;
}(
    require('async'),
    require('fs'),
    require('async-linq'),
    require('./processor'),
    require('path')
);