!function (async, path) {
    'use strict';

    var PublishJS = require('./tools/publish')({ 
            basedir: path.dirname(module.filename),
            output: 'publish/'
        }),
        pipe = PublishJS.pipe;

    async.waterfall([
        function (callback) {
            pipe.from('css/')
                .saveToDir('css/')
                .run(callback);
        }
    ], function (err) {
    });
}(
    require('async'),
    require('path')
);