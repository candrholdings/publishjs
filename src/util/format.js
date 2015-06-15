!function (time) {
    'use strict';

    var LOG_FACILITY_MAXLEN = 12,
        TIME_LOG_MAXLEN = 8,
        lastLog;

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
            str.unshift(padding);
        }

        return str.join('');
    }

    function shortTimeHumanize(value) {
        return time.humanize(value)
            .replace(/a second/, '1 s')
            .replace(/seconds/, 's')
            .replace(/a minute/, '1 m')
            .replace(/minutes/, 'm')
            .replace(/an hour/, '1 h')
            .replace(/hours/, 'h')
            .replace(/a day/, '1 d')
            .replace(/days/, 'd')
            .replace(/a week/, '1 w')
            .replace(/weeks/, 'w');
    }

    function log(facility, message) {
        var now = Date.now(),
            since = pad(shortTimeHumanize(lastLog ? now - lastLog : 0), TIME_LOG_MAXLEN, ' '),
            lineMax = process.stdout.columns - TIME_LOG_MAXLEN - LOG_FACILITY_MAXLEN - 7,
            lines = message.split('\n').reduce(function (lines, line) {
                breakLines(line, lineMax).forEach(function (line) {
                    lines.push(line);
                });

                return lines;
            }, []);

        lastLog = now;

        return lines.map(function (line, index) {
            return index ? line ? indent('', TIME_LOG_MAXLEN) + ' | ' + indent('', LOG_FACILITY_MAXLEN) + ' | ' + indent(line, 0) : pad('', process.stdout.columns - 1, '-') : (since + ' | ' + pad(facility, LOG_FACILITY_MAXLEN) + ' | ' + line);
        }).join('\n');
    }

    function breakLines(line, max) {
        var lines = [],
            fragment,
            i;

        while (line.length > max) {
            for (i = max - 1; i >= 0; i--) {
                if (/\s/.test(line.charAt(i)) || !i) {
                    if (!i) { i = max; }

                    lines.push(trim(line.substr(0, i)));
                    line = trim(line.substr(i));

                    break;
                }
            }
        }

        line && lines.push(trim(line));

        return lines;
    }

    function trim(str) {
        return str.replace(/(^\s+)|(\s+$)/, '');
    }

    module.exports = {
        indent: indent,
        pad: pad,
        log: log,
        breakLines: breakLines
    };
}(require('./time'));