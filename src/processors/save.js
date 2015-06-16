!function (async, fs, linq, mkdirp, number, path, time) {
    'use strict';

    module.exports = function (inputs, outputs, dirpath, options, callback) {
        var that = this,
            outputdir = that.options.output,
            isDir = /\/$/.test(dirpath),
            startTime = Date.now(),
            totalSize = 0;

        if (arguments.length < 5) {
            callback = arguments[arguments.length - 1];
        }

        if (arguments.length === 3) {
            dirpath = '.';
            options = null;
        } else if (arguments.length === 4) {
            if (typeof dirpath === 'string') {
                options = null;
            } else {
                options = arguments[2];
                dirpath = '.';
            }
        }

        options || (options = {});
        options.purge = options.purge !== false;

        if (!isDir && linq(inputs.all).count().run() > 1) {
            return callback(new Error('Cannot save multiple outputs to a single file, consider append / to the output path'));
        }

        outputs = {};

        // Delete orphaned files from output
        async.series([
            function (callback) {
                linq(inputs.deleted).async.select(function (filename, _, callback) {
                    var outputFilename = isDir ? path.join(dirpath, filename).replace(/\\/g, '/') : dirpath;

                    fs.unlink(path.resolve(outputdir, outputFilename), function (err) {
                        callback(err && err.code !== 'ENOENT' ? err : null);
                    });
                }, null).run(callback);
            },
            function (callback) {
                linq(inputs.newOrChanged).async.select(function (entry, filename, callback) {
                    var outputFilename = isDir ? path.join(dirpath, filename).replace(/\\/g, '/') : dirpath,
                        fullname = path.resolve(outputdir, outputFilename);

                    outputs[outputFilename] = entry;
                    totalSize += entry.length;

                    mkdirp(path.dirname(fullname), function (err) {
                        err ? callback(err) : fs.writeFile(fullname, entry, callback);
                    });
                }, null).run(callback);
            }
        ], function (err) {
            if (err) { return callback(err); }

            var numAll = Object.getOwnPropertyNames(inputs.all).length,
                numNewOrChanged = Object.getOwnPropertyNames(inputs.newOrChanged).length,
                displayPath = path.relative(process.cwd(), dirpath).replace(/\\/g, '/'),
                displayableFiles = linq(inputs.newOrChanged).toArray(function (_, filename) { return filename; }).orderBy().take(5).run(),
                elapsed = Date.now() - startTime;

            if (numAll && !numNewOrChanged) {
                that.log('Nothing to save to ./' + displayPath + ' because all ' + numAll + ' file(s) were unchanged');
            } else if (!numAll) {
                that.log('Nothing to save to ./' + displayPath + ' because no input files');
            } else {
                that.log([
                    'Saving ',
                    numNewOrChanged,
                    ' new or changed file(s) to ./',
                    displayPath,
                    ', including ',
                    displayableFiles.join(', '),
                    displayableFiles.length !== numAll ? '\u2026' : '',
                    ', took ',
                    time.humanize(elapsed),
                    ' (',
                    number.bytes(totalSize / elapsed * 1000),
                    '/s, total ',
                    number.bytes(totalSize),
                    ')'
                ].join(''));
            }

            inputs.deleted.length && that.log('Purged ' + inputs.deleted.length + ' file(s) from disk');

            callback(null, outputs);
        });
    };
}(
    require('async'),
    require('fs'),
    require('async-linq'),
    require('mkdirp'),
    require('../util/number'),
    require('path'),
    require('../util/time')
);