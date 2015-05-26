!function (assert, BufferAppender) {
    'use strict';

    require('vows').describe('Test BufferAppender').addBatch({
        'When joining two buffers': {
            topic: function () {
                var builder = new BufferAppender();

                builder.push(new Buffer('ABC'));
                builder.push(new Buffer('DEF'));

                this.callback(null, builder.join());
            },

            'should returns a concatenated buffer': function (topic) {
                assert(topic instanceof Buffer);
                assert.equal(topic.toString(), 'ABCDEF');
            }
        },

        'When joining two buffers with constructor': {
            topic: new BufferAppender([new Buffer('ABC'), new Buffer('DEF')]).join(),

            'should returns a concatenated buffer': function (topic) {
                assert(topic instanceof Buffer);
                assert.equal(topic.toString(), 'ABCDEF');
            }
        },

        'When building with non-buffer': {
            topic: function () {
                var builder = new BufferAppender();

                try {
                    builder.push(0);
                } catch (ex) {
                    return this.callback(null, ex);
                }

                this.callback(new Error('exception not thrown'));
            },

            'should throws exception': function (topic) {
                assert(topic instanceof Error);
            }
        },

        'When joining buffer with a delimiter': {
            topic: function () {
                var builder = new BufferAppender();

                builder.push(new Buffer('ABC'));
                builder.push(new Buffer('DEF'));
                builder.push(new Buffer('XYZ'));

                this.callback(null, builder.join(new Buffer('\n')));
            },

            'should returns a concatenated and delimited buffer': function (topic) {
                assert(topic instanceof Buffer);
                assert.equal(topic.toString(), 'ABC\nDEF\nXYZ');
            }
        },

        'When joining buffer with a string delimiter': {
            topic: function () {
                var builder = new BufferAppender();

                builder.push(new Buffer('ABC'));
                builder.push(new Buffer('DEF'));
                builder.push(new Buffer('XYZ'));

                this.callback(null, builder.join('\n'));
            },

            'should returns a concatenated and delimited buffer': function (topic) {
                assert(topic instanceof Buffer);
                assert.equal(topic.toString(), 'ABC\nDEF\nXYZ');
            }
        },

        'When joining buffer with a non-Buffer delimiter': {
            topic: function () {
                var builder = new BufferAppender();

                builder.push(new Buffer('ABC'));
                builder.push(new Buffer('DEF'));
                builder.push(new Buffer('XYZ'));

                try {
                    builder.join(true);
                } catch (ex) {
                    return this.callback(null, ex);
                }

                this.callback(new Error('exception not thrown'));
            },

            'should throws exception': function (topic) {
                assert(topic instanceof Error);
            }
        }
    }).export(module);
}(require('assert'), require('../bufferappender'));