!function (crypto, fs, linq, path) {
    'use strict';

    function Processor(options, sessionID) {
        this._options = options;
        this._sessionID = sessionID;
    }

    Processor.isPlainObject = function (obj) {
        return {}.toString.call(obj) === '[object Object]';
    };

    Processor.validFileEntry = function (fileEntry) {
        return (
            Processor.isPlainObject(fileEntry) &&
            Object.getOwnPropertyNames(fileEntry).sort().join(',') === 'content,md5' &&
            typeof fileEntry.content === 'string' &&
            typeof fileEntry.md5 === 'string'
        );
    };

    Processor.prototype._getCachePath = function () {
        return path.resolve(that._options.temp, that._sessionID);
    };

    Processor.prototype._loadCache = function (callback) {
        fs.readFile(this._getCachePath(), function (err, cache) {
            callback(err, err ? null : (cache.inputs || {}), err ? null : (cache.outputs || {}));
        });
    };

    Processor.prototype._saveCache = function (inputs, outputs, callback) {
        fs.writeFile(this._getCachePath(), { inputs: inputs, outputs: outputs }, callback);
    };

    Processor.prototype._init = function (files, callback) {
        var that = this;

        if ({}.toString.call(files) !== '[object Object]') {
            callback(new Error('files not a plain object'));
        } else if (!linq(files).all(Processor.validFileEntry).run()) {
            callback(new Error('One or more entry in files is invalid'));
        }

        that._inputs = files;

        this._loadCache(function (err, inputCache, outputCache) {
            if (err) { return callback(err); }

            var anyFilesDeleted = linq(inputCache).any(function (_, filename) { return !files[filename]; }).run();

            if (anyFilesDeleted) {
                // If there are any files deleted, we will need to mark all files as changed and re-run the whole processor

                that.newOrChangedFiles = files;
                that._outputs = {};
            } else {
                // If there are only new or changed files, we will re-use the outputs from cache
                // Processors will decide if they want to rerun on existing files

                that.newOrChangedFiles = linq(files).where(function (entry, filename) {
                    var cached = inputCache[filename];

                    return !cached || cached.md5 !== entry.md5;
                }).run();

                that._outputs = outputCache;
            }

            that.unchangedFiles = linq(files).except(that.newOrChangedFiles).run();

            callback();
        });
    };

    Processor.prototype._flush = function (callback) {
        var inputs = linq(this._inputs).select(function (input) {
                return { md5: input.md5 };
            }).run();

        this._saveCache(inputs, this._outputs, callback);
    };

    Processor.prototype.run = function (callback) {
        if (!this._inputs) { return callback(new Error('Processor cache is not initialized yet')); }
    };

    Processor.prototype.write = function (filename, content) {
        if (typeof content === 'string') {
            content = new Buffer(content);
        } else if (!(content instanceof Buffer)) {
            throw new Error('content must be either String or Buffer');
        }

        var md5 = crypto.createHash('md5');

        md5.update(content);

        this._outputs[filename] = {
            content: content.toString('base64'),
            md5: md5.digest('hex')
        };
    };

    module.exports = Processor;
}(
    require('crypto'),
    require('fs'),
    require('async-linq'),
    require('path')
);