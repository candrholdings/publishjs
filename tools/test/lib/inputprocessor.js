!function (MockProcessor, linq) {
    'use strict';

    function InputProcessor() {
        MockProcessor.apply(this, arguments);
    }

    require('util').inherits(InputProcessor, MockProcessor);

    InputProcessor.prototype.run = function (inputs, outputs, files, callback) {
        callback(null, linq(files).select(function (bufferOrString) {
            return typeof bufferOrString === 'string' ? new Buffer(bufferOrString) : bufferOrString;
        }).run());
    };

    module.exports = InputProcessor;
}(
    require('./mockprocessor'),
    require('async-linq')
);