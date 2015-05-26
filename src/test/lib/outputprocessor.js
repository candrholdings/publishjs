!function (linq, Processor) {
    'use strict';

    module.exports = function (inputs, outputs, fileSystem, callback) {
        Object.getOwnPropertyNames(inputs.all).forEach(function (filename) {
            fileSystem[filename] = inputs.all[filename];
        });

        callback(null, inputs.all);
    };
}(
    require('async-linq'),
    require('../../processor')
);