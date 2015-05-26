!function () {
    'use strict';

    function BufferAppender(buffers) {
        this._buffers = buffers || (buffers = []);
        this._numBytes = buffers.reduce(function (numBytes, buffer) {
            return numBytes + buffer.length;
        }, 0);
    }

    BufferAppender.prototype.push = function (buffer) {
        if (!(buffer instanceof Buffer)) { throw new Error('BufferAppender.push can only accept Buffer'); }

        this._buffers.push(buffer);
        this._numBytes += buffer.length;
    };

    BufferAppender.prototype.join = function (delimiter) {
        var buffers = this._buffers.slice(),
            numBytes = this._numBytes;

        if (delimiter) {
            if (typeof delimiter === 'string') {
                delimiter = new Buffer(delimiter);
            }

            if (!(delimiter instanceof Buffer)) { throw new Error('delimiter must be a Buffer'); }

            numBytes += delimiter.length * (buffers.length - 1);

            for (var i = buffers.length - 1; i > 0; i--) {
                buffers.splice(i, 0, delimiter);
            }
        }

        return Buffer.concat(buffers, numBytes);
    };

    module.exports = BufferAppender;
}();