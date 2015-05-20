!function (linq, MockProcessor) {
    'use strict';

    function OutputProcessor() {
        MockProcessor.apply(this, arguments);
    }

    require('util').inherits(OutputProcessor, MockProcessor);

    OutputProcessor.prototype.run = function (inputs, outputs, fileSystem, callback) {
        Object.getOwnPropertyNames(inputs.all).forEach(function (filename) {
            fileSystem[filename] = inputs.all[filename].buffer;
        });

        callback(null, outputs);
    };

    module.exports = OutputProcessor;
}(
    require('async-linq'),
    require('./mockprocessor')
);