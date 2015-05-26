!function (async, fs, linq, mkdirp, path) {
    'use strict';

    module.exports = function (inputs, outputs, dirpath, callback) {
        var options = this.options,
            isDir = /\/$/.test(dirpath);

        if (!isDir && linq(outputs).count().run() > 1) {
            return callback(new Error('Cannot save multiple outputs to a single file, consider append / to the output path'));
        }

        linq(inputs.all).async.select(function (entry, filename, callback) {
            filename = isDir ? path.resolve(options.output, dirpath, filename) : path.resolve(options.output, dirpath);

            mkdirp(path.dirname(filename), function (err) {
                if (err) { return callback(err); }

                fs.writeFile(filename, entry.buffer, callback);
            });
        }).run(function (err) {
            callback(err, {});
        });
    };
}(
    require('async'),
    require('fs'),
    require('async-linq'),
    require('mkdirp'),
    require('path')
);