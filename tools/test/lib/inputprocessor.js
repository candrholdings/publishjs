!function (linq) {
    'use strict';

    module.exports = function (inputs, outputs, files, callback) {
        callback(null, linq(files).select(function (bufferOrString) {
            return typeof bufferOrString === 'string' ? new Buffer(bufferOrString) : bufferOrString;
        }).run());
    };
}(
    require('async-linq')
);