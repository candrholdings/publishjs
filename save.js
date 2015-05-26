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
            if (!err) {
                var allCount = Object.getOwnPropertyNames(inputs.all).length,
                    displayPath = path.relative(process.cwd(), dirpath).replace(/\\/g, '/'),
                    displayableFiles = linq(inputs.newOrChanged).toArray(function (_, filename) { return filename; }).orderBy().take(5).run();

                if (allCount && !Object.getOwnPropertyNames(inputs.newOrChanged).length) {
                    that.log('No new changes to save to ./' + displayPath + ' because all ' + allCount + ' file(s) were unchanged');
                } else if (!allCount) {
                    that.log('No files to save to ./' + displayPath);
                } else {
                    that.log('Saving changed files to ./' + displayPath + ', including ' + displayableFiles.join(', ') + (displayableFiles.length !== allCount ? '\u2026' : ''));
                }
            }

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