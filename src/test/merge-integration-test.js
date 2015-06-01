!function (assert, linq) {
    'use strict';

    require('vows').describe('Merge integration tet').addBatch({
        'When using multiple directives': {
            topic: function () {
                var callback = this.callback,
                    topic = {};

                require('../publish')({
                    cache: false,
                    log: false,
                    processors: {
                        inputs: require('./lib/inputprocessor'),
                        outputs: require('./lib/outputprocessor')
                    },
                    pipes: [function (pipe, callback) {
                        pipe.inputs({
                                '/.merge': '-3.js',
                                '/1.js': '123',
                                '/2.js': '456',
                                '/3.js': '789',
                                '/abc/.merge': '+3.js\n-2.js',
                                '/abc/1.js': 'abc',
                                '/abc/2.js': 'def',
                                '/abc/3.js': 'xyz'
                            })
                            .merge('merged')
                            .run(callback);
                    }]
                }).build(function (err) {
                    callback(err, err ? null : topic);
                });
            },

            'should output nothing': function (topic) {
                assert('123456xyzabc', topic);
            }
        }
    }).export(module);
}(require('assert'), require('async-linq'));