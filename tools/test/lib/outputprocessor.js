!function (linq, Processor) {
    'use strict';

    function OutputProcessor() {
        Processor.apply(this, arguments);
    }

    require('util').inherits(OutputProcessor, Processor);

    OutputProcessor.prototype.run = function (inputs, outputs, fileSystem, callback) {
        Object.getOwnPropertyNames(inputs.all).forEach(function (filename) {
            fileSystem[filename] = inputs.all[filename].buffer;
        });

        callback(null, outputs);
    };

    module.exports = OutputProcessor;
}(
    require('async-linq'),
    require('../../processor')
);