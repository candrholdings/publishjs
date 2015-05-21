!function (Processor, linq, number, path, BufferAppender) {
    'use strict';

    function Merge() {
        Processor.call(this);
    }

    require('util').inherits(Merge, Processor);

    Merge.prototype.run = function (inputs, outputs, outputFilename, callback) {
        if (arguments.length === 3) {
            outputFilename = null;
            callback = arguments[2];
        }

        if (!linq(inputs.newOrChanged).count().run()) { return callback(); }

        var inputMap = sortAndSplitIntoMap(inputs.all),
            sorted;

        rankFilesInplace(inputMap);

        sorted = linq(flattenRecursive(inputMap))
            .toArray(function (entry, filename) { return { filename: filename, entry: entry }; })
            .where(function (kvp) {
                return kvp.entry.rank !== false;
            })
            .run()
            .sort(compareRank);

        if (sorted.length === 0) {
            this.log('Nothing to merge');

            return callback(null, {});
        }

        if (!outputFilename) {
            outputFilename = linq(sorted).first(function (kvp) { return !isDirective(kvp.filename); }).run() || 'unnamed';
            outputFilename = path.join(path.dirname(outputFilename) + 'merge-' + path.basename(outputFilename));
        }

        var merged = new BufferAppender(sorted.map(function (kvp) { return kvp.entry.buffer; })).join('\n'),
            outputs = {};

        this.log(sorted.map(function (kvp) { return kvp.filename; }).join('+ \n') + '\n= ' + outputFilename + ' (' + number.bytes(merged.length) + ')');

        outputs[outputFilename] = { buffer: merged };

        callback(null, outputs);
    };

    function isDirective(filename) {
        return /([\/\\]|^).merge$/.test(filename);
    }

    function walkFileMapBreadth(root, walker) {
        var next = [root],
            walking,
            filenames;

        while (next.length) {
            filenames = [];
            walking = next.pop();

            linq(walking)
                .select(function (entry, filename) {
                    if (/\/$/.test(filename)) {
                        next.push(entry);
                    } else {
                        filenames.push(filename);
                    }
                })
                .run();

            filenames
                .sort()
                .map(function (filename) {
                    return walking[filename];
                })
                .forEach(walker);
        }
    }

    function sortAndSplitIntoMap(inputs) {
        var inputMap = {};

        linq(inputs)
            .select(function (entry, filename) {
                var map = inputMap,
                    segments = filename.split('/'),
                    lastSegment = segments.pop();

                segments.forEach(function (segment) {
                    segment += '/';
                    map = map[segment] || (map[segment] = {});
                });

                map[lastSegment] = entry;
            })
            .run();

        // assign "unrank"

        var unrank = 0;

        walkFileMapBreadth(inputMap, function (file) {
            file.unrank = ++unrank;
        });

        return inputMap;
    }

    function parseDirectiveLine(line) {
        line = line.replace(/(^\s*)|(\s*$)/g, '');

        var result = {
            operator: line[0]
        };

        line = line.substr(1);

        var regexp = /^\/(.*?)\/$/.exec(line);

        if (regexp) {
            result.pattern = new RegExp(regexp[1]);
        } else {
            result.pattern = new RegExp(
                '^' +
                replacePatterns(
                    line,
                    [
                        /\./,
                        /(\/)/,
                        /\*/
                    ],
                    [
                        '\\.',
                        '(?:\\/)',
                        '.*?'
                    ]
                ) +
                '$'
            );
        }

        return result;
    }

    function replacePatterns(input, patterns, replaces) {
        var lastIndex = 0,
            outputs = [{
                processed: 0,
                text: input
            }],
            found;

        do {
            found = 0;

            outputs.every(function (output, index) {
                if (output.processed) {
                    return true;
                }

                patterns.every(function (pattern, patternIndex) {
                    var text = output.text,
                        match = pattern.exec(text),
                        matchIndex,
                        matchLength;

                    if (!match) { return true; }

                    found = 1;
                    matchIndex = match.index;
                    matchLength = match[0].length;

                    var before = text.substr(0, matchIndex),
                        changed = match[0],
                        after = text.substr(matchIndex + matchLength),
                        spliceArgs = [index, 1];

                    before && spliceArgs.push({ processed: 0, text: before });
                    spliceArgs.push({ processed: 1, text: changed.replace(pattern, replaces[patternIndex]) });
                    after && spliceArgs.push({ processed: 0, text: after });

                    outputs.splice.apply(outputs, spliceArgs);

                    return false;
                });

                if (!found) {
                    output.processed = 1;
                }

                return !found;
            });
        } while (found);

        return outputs.map(function (output) { return output.text; }).join('');
    }

    function flattenRecursive(map, prefix, newMap) {
        prefix = prefix || '';

        return Object.getOwnPropertyNames(map).sort().reduce(function (newMap, name) {
            var file = map[name];

            if (name[name.length - 1] === '/') {
                flattenRecursive(file, prefix + name, newMap);
            } else {
                newMap[prefix + name] = file;
            }

            return newMap;
        }, newMap || {});
    }

    function rankFilesInplace(map, rank) {
        rank = rank || 0;

        var flatten = flattenRecursive(map);

        Object.getOwnPropertyNames(map).sort().forEach(function (name) {
            var file = map[name];

            if (name === '.merge') {
                var mergeRank = file.rank || [];

                file.rank = false;

                file.buffer.toString().split('\n').forEach(function (line, lineNumber) {
                    if (!line) { return; }

                    var directive = parseDirectiveLine(line),
                        directiveOperator = directive.operator,
                        directivePattern = directive.pattern;

                    if (directiveOperator !== '+' && directiveOperator !== '-') {
                        console.log('Unknown operator "' + directiveOperator + '" specified in ' + file.path + ':' + (lineNumber + 1));

                        throw new Error('unknown operator');
                    }

                    var found;

                    Object.getOwnPropertyNames(flatten).sort().forEach(function (name) {
                        if (directivePattern.test(name)) {
                            var file = flatten[name];

                            if (file.rank) {
                                console.log('Warning, file ' + file.path + ' is already defined in another .merge file, file order is overwritten');
                            }

                            switch (directiveOperator) {
                            case '+':
                                file.rank = mergeRank.slice();
                                file.rank.splice(Infinity, 0, ++rank);
                                break;

                            case '-':
                                file.rank = false;
                                break;
                            }

                            found = 1;
                        }
                    });

                    if (!found) {
                        if (directivePattern) {
                            console.log('Merge   : Cannot find any files named like ' + directivePattern);
                        } else {
                            console.log('Merge   : Cannot find any files named "' + directiveExact + '"');
                        }
                    }
                });
            } else if (name[name.length - 1] === '/') {
                // is directory
                rank = rankFilesInplace(file, rank);
            }
        });

        return rank;
    }

    function compareRank(x, y) {
        var rx = x && x.rank,
            ry = y && y.rank;

        if (rx && ry) {
            for (var i = 0, nrx, nry, length = Math.min(rx.length, ry.length); i < length; i++) {
                nrx = rx[i];
                nry = ry[i];

                if (nrx > nry) {
                    return 1;
                } else if (nrx < nry) {
                    return -1;
                }
            }

            if (rx.length < ry.length) {
                return 1;
            } else if (rx.length > ry.length) {
                return -1;
            } else {
                return 0;
            }
        } else if (rx) {
            return -1;
        } else if (ry) {
            return 1;
        } else {
            x = x.unrank;
            y = y.unrank;

            return x > y ? 1 : x < y ? -1 : 0;
        }
    }

    module.exports = Merge;

    // Functions exposed for unit testing
    Merge._sortAndSplitIntoMap = sortAndSplitIntoMap;
    Merge._replacePatterns = replacePatterns;
    Merge._flattenRecursive = flattenRecursive;
    Merge._rankFilesInplace = rankFilesInplace;
    Merge._parseDirectiveLine = parseDirectiveLine;
    Merge._compareRank = compareRank;
}(
    require('./processor'),
    require('async-linq'),
    require('./number'),
    require('path'),
    require('./bufferappender')
);