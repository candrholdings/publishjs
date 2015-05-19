!function () {
    'use strict';

    module.exports = function (pipe, callback) {
        pipe.basedir('./');

        pipe.from('files/')
            .merge('merged.txt')
            .saveToDir('result/')
            .run(callback);
    };
}();