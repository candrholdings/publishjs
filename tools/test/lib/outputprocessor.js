!function (linq, Processor) {
    'use strict';

    function OutputProcessor() {
        Processor.apply(this, arguments);
    }

    require('util').inherits(OutputProcessor, Processor);

    OutputProcessor.prototype._loadCache = function (callback) { callback(null, {}, {}); };
    OutputProcessor.prototype._saveCache = function (inputs, outputs, callback) { callback(); };

    OutputProcessor.prototype.run = function (inputs, outputs, outputCallback, callback) {
        outputCallback(linq(inputs.all).select(function (entry) { return entry.buffer; }).run());
        callback(null, outputs);
    };

    module.exports = OutputProcessor;
}(
    require('async-linq'),
    require('../../processor')
);