!function (linq, Processor) {
    'use strict';

    module.exports = function (inputs, outputs, fileSystem, callback) {
        Object.getOwnPropertyNames(inputs.all).forEach(function (filename) {
            fileSystem[filename] = inputs.all[filename].buffer;
        });

        callback(null, linq(inputs.all).select(function (entry) {
            return entry.buffer;
        }).run());
    };
}(
    require('async-linq'),
    require('../../processor')
);