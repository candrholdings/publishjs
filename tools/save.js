!function (async, fs, linq, mkdirp, path) {
    'use strict';

    module.exports = function (inputs, outputs, dirpath, callback) {
        if (!/\/$/.test(dirpath) && linq(outputs).count().run() > 1) {
            return callback(new Error('Cannot save to file'));
        }

        var options = this.options;

        linq(inputs.all).async.select(function (entry, filename, callback) {
            filename = path.resolve(options.output, dirpath, filename);

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