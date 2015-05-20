!function (Processor, linq) {
    'use strict';

    function InputProcessor() {
        Processor.apply(this, arguments);
    }

    require('util').inherits(InputProcessor, Processor);

    InputProcessor.prototype.run = function (inputs, outputs, files, callback) {
        callback(null, linq(files).select(function (bufferOrString) {
            return typeof bufferOrString === 'string' ? new Buffer(bufferOrString) : bufferOrString;
        }).run());
    };

    module.exports = InputProcessor;
}(
    require('../../processor'),
    require('async-linq')
);