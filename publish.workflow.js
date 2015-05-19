/*jshint forin:true, noarg:true, noempty:true, eqeqeq:true, evil:false, bitwise:false, strict:true, undef:true, curly:true, devel:true, indent:4, maxerr:50, expr:true, loopfunc:true, onevar:false, multistr:true, node:true */

!function () {
    'use strict';

    var jshintOptions = {
            bitwise: false,
            browser: true,
            curly: true,
            devel: true,
            eqeqeq: true,
            evil: false,
            expr: true,
            forin: true,
            indent: 4,
            jquery: true,
            loopfunc: true,
            maxerr: 50, 
            multistr: true,
            noarg: true,
            noempty: true,
            onevar: false,
            strict: true,
            undef: true
        },
        path = require('path'),
        pathDirname = path.dirname,
        pathJoin = path.join,
        basedir = pathJoin(pathDirname(module.filename), 'publish/'),
        publishPath = function (path) {
            return pathJoin(basedir, path);
        };

    module.exports = function (pipe, callback) {
        pipe.basedir('./');
        pipe.liveReloadRoot('./publish/');

        require('./tools/node_modules/async').series({
            css: function (callback) {
                pipe.from([
                    pipe.from('css/')
                        .merge()
                        .cssmin(),
                    pipe.from('css.min/')
                        .merge(),
                    pipe.from('less/')
                        .merge()
                        .less()
                        .cssmin()
                ])
                .merge()
                .saveToFile(publishPath('css/all.css'))
                .run(callback);
            },
            'css.lib': function (callback) {
                pipe.from('css.lib/')
                    .merge()
                    .saveToFile(publishPath('css/lib.css'))
                    .run(callback);
            },
            fonts: function (callback) {
                pipe.from('fonts/')
                    .saveToDir(publishPath('fonts/'))
                    .run(callback);
            },
            js: function (callback) {
                pipe.from([
                    pipe.from('js/')
                        .jshint({
                            options: jshintOptions,
                            skip: [/\.merge$/i]
                        })
                        .merge()
                        .uglify(),
                    pipe.from('ts/')
                        .typescript({ output: 'typescript.js' })
                        .uglify()
                ])
                .merge()
                .saveToFile(publishPath('js/all.js'))
                .run(callback);
            },
            'js.lib': function (callback) {
                pipe.from('js.lib/')
                    .merge()
                    .saveToFile(publishPath('js/lib.js'))
                    .run(callback);
            },
            html: function (callback) {
                pipe.from('html/')
                    .assemble()
                    .less()
                    .jsx()
                    .jshint({ options: jshintOptions, type: 'html' })
                    .minhtml()
                    .saveToDir(publishPath('/'))
                    .run(callback);
            },
            json: function (callback) {
                pipe.from('json/samples.json')
                    .saveToDir(publishPath('json/'))
                    .run(callback);
            },
            img: function (callback) {
                pipe.from([
                        pipe.from('img/')
                            .crush(),
                        pipe.from('img.min/')
                    ])
                    .saveToDir(publishPath('img/'))
                    .run(callback);
            }
        }, function (err, results) {
            require('os').type() === 'Windows_NT' && require('child_process').spawn('playsound.exe', [err ? 'error.wav' : 'ok.wav'], { cwd: 'tools' });

            callback && callback(err, err ? null : results);
        });
    };
}();