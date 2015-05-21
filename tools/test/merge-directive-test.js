!function (assert, Merge, linq) {
    'use strict';

    require('vows').describe('Test merging directives').addBatch({
        'When excluding a file': {
            topic: runMerge({
                '/.merge': '-3',
                '/1': '123',
                '/2': '456',
                '/3': '789'
            }, 'merged'),

            'should exclude the specified file': function (topic) {
                assert.equal(topic, '123\n456');
            }
        },

        'When excluding everything': {
            topic: runMerge({
                '/.merge': '-*',
                '/1': '123',
                '/2': '456',
                '/3': '789'
            }, 'merged'),

            'should output nothing': function (topic) {
                assert(!topic);
            }
        },

        'When using multiple directives': {
            topic: runMerge({
                '/.merge': '-3.js',
                '/1.js': '123',
                '/2.js': '456',
                '/3.js': '789',
                '/abc/.merge': '+3.js\n-2.js',
                '/abc/1.js': 'abc',
                '/abc/2.js': 'def',
                '/abc/3.js': 'xyz'
            }, 'merged'),

            'should output nothing': function (topic) {
                assert('123456xyzabc', topic);
            }
        }
    }).export(module);

    function runMerge(inputs, outputFilename) {
        return function () {
            var callback = this.callback;

            inputs = linq(inputs).select(function (content) { return { buffer: new Buffer(content) }; }).run();

            Merge.prototype.run({ all: inputs, newOrChanged: inputs }, {}, outputFilename, function (err, outputs) {
                if (err) { return callback(err); }

                outputs = linq(outputs).toArray(function (value) { return value; }).run();

                if (outputs.length > 1) { return callback(new Error('more than one merged output')); }

                callback(null, outputs[0] && outputs[0].buffer.toString());
            });
        };
    }
}(require('assert'), require('../merge'), require('async-linq'));