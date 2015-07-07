!function (Processor, linq, number, path, replaceMultiple, BufferAppender) {
    'use strict';

    module.exports = function (inputs, outputs, outputFilename, callback) {
        if (arguments.length === 3) {
            outputFilename = null;
            callback = arguments[2];
        }

        // If there is a single file added, changed, or deleted, we will need to redo the merge
        if (!inputs.deleted.length && !Object.getOwnPropertyNames(inputs.newOrChanged).length) {
            this.log('No new, changed, or deleted files, reusing cached output');
            return callback(null, outputs);
        }

        var inputMap = sortAndSplitIntoMap(inputs.all),
            sorted;

        rankFilesInplace(inputMap, 0, this.log);

        sorted = linq(flattenRecursive(inputMap))
            .toArray(function (entry, filename) {
                return {
                    filename: filename,
                    buffer: entry.buffer,
                    rank: entry.rank,
                    unrank: entry.unrank
                };
            })
            .where(function (kvp) {
                return kvp.rank !== false;
            })
            .run()
            .sort(compareRank);

        if (sorted.length === 0) {
            this.log('Nothing to merge');

            return callback(null, outputs);
        }

        if (!outputFilename) {
            var firstFileIndex = linq(sorted).first(function (kvp) { return !isDirective(kvp.filename); }).run();

            outputFilename = typeof firstFileIndex === 'number' ? sorted[firstFileIndex].filename : 'unnamed';
            outputFilename = path.join(path.dirname(outputFilename), 'merge-' + path.basename(outputFilename));
        }

        var merged = new BufferAppender(sorted.map(function (kvp) { return kvp.buffer; })).join('\n'),
            outputs = {};

        this.log([
            sorted.map(function (kvp) {
                return kvp.filename + ' (' + number.bytes(kvp.buffer.length) + ')';
            }).join('\n+ '),
            '\n= ',
            outputFilename,
            ' (',
            number.bytes(merged.length),
            ')'
        ].join(''));

        outputs[outputFilename] = merged;

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

                map[lastSegment] = {
                    buffer: entry
                };
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
                replaceMultiple(
                    line,
                    [
                        [/\./, '\\.'],
                        [/(\/)/, '(?:\\/)'],
                        [/\*/, '.*?']
                    ]
                ) +
                '$'
            );
        }

        return result;
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

    function rankFilesInplace(map, rank, log) {
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
                        throw new Error('unknown directive in ' + file.path + ':' + (lineNumber + 1));
                    }

                    var found;

                    Object.getOwnPropertyNames(flatten).sort().forEach(function (name) {
                        if (directivePattern.test(name)) {
                            var file = flatten[name];

                            if (file.rank) {
                                log && log('Warning, file ' + name + ' is already defined in another .merge file, file order will be overwritten');
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
                            log && log('Cannot find any files named like ' + directivePattern);
                        } else {
                            log && log('Cannot find any files named "' + directiveExact + '"');
                        }
                    }
                });
            } else if (name[name.length - 1] === '/') {
                // is directory
                rank = rankFilesInplace(file, rank, log);
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

    // Functions exposed for unit testing
    module.exports._sortAndSplitIntoMap = sortAndSplitIntoMap;
    module.exports._flattenRecursive = flattenRecursive;
    module.exports._rankFilesInplace = rankFilesInplace;
    module.exports._parseDirectiveLine = parseDirectiveLine;
    module.exports._compareRank = compareRank;
}(
    require('../processor'),
    require('async-linq'),
    require('../util/number'),
    require('path'),
    require('../util/regexp').replaceMultiple,
    require('../util/bufferappender')
);