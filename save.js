!function (async, fs, linq, mkdirp, path) {
    'use strict';

    module.exports = function (inputs, outputs, dirpath, callback) {
        var that = this,
            options = that.options,
            isDir = /\/$/.test(dirpath);

        if (!isDir && linq(outputs).count().run() > 1) {
            return callback(new Error('Cannot save multiple outputs to a single file, consider append / to the output path'));
        }

        dirpath = path.resolve(options.output, dirpath);

        linq(inputs.newOrChanged).async.select(function (entry, filename, callback) {
            filename = isDir ? path.resolve(dirpath, filename) : dirpath;

            mkdirp(path.dirname(filename), function (err) {
                if (err) { return callback(err); }

                fs.writeFile(filename, entry.buffer, callback);
            });
        }).run(function (err) {
            !err && that.log('Saving to ' + dirpath + '\n' + Object.getOwnPropertyNames(inputs.newOrChanged).map(indent).join('\n'));
            callback(err, {});
        });
    };

    function indent(str) { return '  ' + str; }
}(
    require('async'),
    require('fs'),
    require('async-linq'),
    require('mkdirp'),
    require('path')
);