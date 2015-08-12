!function (time) {
    'use strict';

    var LOG_FACILITY_MAXLEN = 12,
        TIME_LOG_MAXLEN = 9,
        lastLog;

    function indent(str, count) {
        var indentation = [];

        while (count-- > 0) {
            indentation.push(' ');
        }

        return indentation.join('') + str;
    }

    function padLeft(str, count, padding) {
        count -= str.length;
        str = [str];
        padding || (padding = ' ');

        while (count-- > 0) {
            str.unshift(padding);
        }

        return str.join('');
    }

    function padRight(str, count, padding) {
        count -= str.length;
        str = [str];
        padding || (padding = ' ');

        while (count-- > 0) {
            str.push(padding);
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
            since = padLeft('+' + shortTimeHumanize(lastLog ? now - lastLog : 0), TIME_LOG_MAXLEN, ' '),
            lineMax = process.stdout.columns - TIME_LOG_MAXLEN - LOG_FACILITY_MAXLEN - 7,
            lines = message.split('\n').reduce(function (lines, line) {
                breakLines(line, lineMax).forEach(function (line) {
                    lines.push(line);
                });

                return lines;
            }, []);

        lastLog = now;

        return lines.map(function (line, index) {
            return index ? !line && lines.length === index + 1 ? padLeft('', process.stdout.columns - 1, '-') : indent('', TIME_LOG_MAXLEN) + ' | ' + indent('', LOG_FACILITY_MAXLEN) + ' | ' + indent(line, 0) : (since + ' | ' + padLeft(facility, LOG_FACILITY_MAXLEN) + ' | ' + line);
        }).join('\n');
    }

    function breakLines(line, max) {
        var output = [],
            currLine = [],
            words = line.split(' '),
            word,
            brokenWord,
            lineLength,
            pattern = /\u001b\[.*?[A-Za-z]/g;

        while (words.length) {
            word = words.shift();

            currLine.push(word);

            var lineLength = currLine.map(function (word) {
                return word.replace(pattern, '');
            }).join(' ').length;

            if (lineLength > max) {
                currLine.pop();

                if (currLine.length) {
                    output.push(currLine);
                    currLine = [];
                    words.unshift(word);
                } else {
                    brokenWord = breakWord(word, max);
                    output.push([brokenWord]);
                    words.unshift(word.substr(brokenWord.length));
                }
            }
        }

        currLine.length && output.push(currLine);

        return output.map(function (line) {
            return line.join(' ');
        });
    }

    function breakWord(word, max) {
        var pattern = /^\u001b\[.*?[A-Za-z]/,
            match,
            letters = [],
            left = max,
            index = 0;

        while (left > 0) {
            match = pattern.exec(word.substr(index));

            if (match) {
                letters.push(match[0]);
                index += match[0].length;
            } else {
                letters.push(word.charAt(index));
                index++;
                left--;
            }
        }

        return letters.join('');
    }

    function trim(str) {
        return str.replace(/(^\s+)|(\s+$)/, '');
    }

    module.exports = {
        indent: indent,
        padLeft: padLeft,
        padRight: padRight,
        log: log,
        breakLines: breakLines,
        breakWord: breakWord
    };
}(require('./time'));