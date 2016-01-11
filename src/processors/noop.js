!function () {
    'use strict';

    module.exports = function (inputs) {
        arguments[arguments.length - 1](null, inputs.all);
    };
}();