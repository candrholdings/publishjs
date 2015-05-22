!function (linq, Processor) {
    'use strict';

    module.exports = function (inputs, outputs, fileSystem, callback) {
        Object.getOwnPropertyNames(inputs.all).forEach(function (filename) {
            fileSystem[filename] = inputs.all[filename].buffer;
        });

        callback(null, outputs);
    };
}(
    require('async-linq'),
    require('../../processor')
);