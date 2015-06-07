!function () {
    'use strict';

    module.exports = function (inputs, outputs, callback) {
        Object.getOwnPropertyNames(inputs.newOrChanged).forEach(function (filename) {
            outputs[filename] = inputs.newOrChanged[filename];
        });

        callback(null, outputs);
    };
}();