!function () {
    'use strict';

    var LOG_FACILITY_MAXLEN = 12;

    function indent(str, count) {
        var indentation = [];

        while (count-- > 0) {
            indentation.push(' ');
        }

        return indentation.join('') + str;
    }

    function pad(str, count, padding) {
        count -= str.length;
        str = [str];
        padding || (padding = ' ');

        while (count-- > 0) {
            str.push(padding);
        }

        return str.join('');
    }

    function log(facility, message) {
        return message.split('\n').map(function (line, index) {
            return index ? indent(line, LOG_FACILITY_MAXLEN + 2) : (pad(facility, LOG_FACILITY_MAXLEN) + ': ' + line);
        }).join('\n');
    }

    module.exports = {
        indent: indent,
        pad: pad,
        log: log
    };
}();