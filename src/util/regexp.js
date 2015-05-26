!function () {
    'use strict';

    function replacePatterns(input, pairs) {
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

                pairs.every(function (pair) {
                    var pattern = pair[0],
                        replace = pair[1],
                        text = output.text,
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
                    spliceArgs.push({ processed: 1, text: changed.replace(pattern, replace) });
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

    module.exports.replacePatterns = replacePatterns;
}();