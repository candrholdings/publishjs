!function (fs, path) {
    'use strict';

    function Plugin(options, sessionID) {
        this._options = options;
        this._sessionID = sessionID;
    }

    Plugin.prototype.init = function (callback) {
        fs.readFile(path.resolve(this._options.temp, this._sessionID), function (err, data) {
            if (err) { return callback(err); }

            this.files = data.inputs;
            this.unchangedFiles = data.inputs;

            this._outputs = data.outputs;
        });
    };

    Plugin.prototype.copyUnchanged = function () {
    };

    Plugin.prototype.write = function (filename, content) {
    };

    module.exports = Plugin;
}(
    require('fs'),
    require('path')
);