!function (async) {
    'use strict';

    function replaceMultipleAsync(input, pairs, callback) {
        var outputs = [{ text: input, index: 0 }],
            found;

        async.doWhilst(function (callback) {
            var index = -1;

            found = 0;

            async.every(outputs, function (output, callback) {
                if (++index % 2) { return callback(true); }

                // console.log(outputs);

                async.every(pairs, function (pair, callback) {
                    var match = pair[0].exec(output.text);

                    if (!match) { return callback(true); }

                    found = 1;

                    var replaceArgs = [].slice.call(match);

                    replaceArgs.push(output.index + match.index);
                    replaceArgs.push(input);
                    replaceArgs.push(function (err, replacement) {
                        var spliceArgs = [index, 1];

                        spliceArgs.push({ text: output.text.substr(0, match.index), index: output.index });
                        spliceArgs.push({ text: replacement });
                        spliceArgs.push({ text: output.text.substr(match.index + match[0].length), index: output.index + match.index + match[0].length });

                        outputs.splice.apply(outputs, spliceArgs);

                        callback(false);
                    });

                    pair[1].apply(null, replaceArgs);
                }, callback);
            }, function () {
                callback();
            });
        }, function () {
            return found;
        }, function (err) {
            callback(err, err ? null : outputs.map(function (output) { return output.text; }).join(''));
        });
    }

    function replaceMultiple(input, pairs) {
        var err, result;

        pairs = pairs.map(function (pair) {
            var pattern = pair[0],
                replacement = pair[1];

            return [
                pattern,
                typeof replacement === 'function' ?
                    function () {
                        var callback = arguments[arguments.length - 1];

                        callback(null, replacement.apply(null, [].slice.call(arguments, 0, arguments.length - 1)));
                    } :
                    function (match0) {
                        var callback = arguments[arguments.length - 1];
                        
                        callback(null, match0.replace(pattern, replacement));
                    }
            ];
        });

        replaceMultipleAsync(
            input,
            pairs,
            function (e, r) {
                err = e;
                result = r;
            }
        );

        if (err) {
            throw err;
        } else {
            return result;
        }
    }

    module.exports.replaceMultiple = replaceMultiple;
    module.exports.replaceMultipleAsync = replaceMultipleAsync;
}(
    require('async')
);