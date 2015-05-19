!function (Processor) {
    'use strict';

    function InputProcessor() {
        Processor.apply(this, arguments);
    }

    require('util').inherits(InputProcessor, Processor);

    InputProcessor.prototype._loadCache = function (callback) {
        callback(null, {}, {});
    };

    InputProcessor.prototype._saveCache = function (inputs, outputs, callback) {
        callback();
    };

    InputProcessor.prototype.run = function (inputs, outputs, files, callback) {
        callback(null, files);
    };

    module.exports = InputProcessor;
}(
    require('../../processor')
);