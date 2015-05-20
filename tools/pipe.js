/*jshint forin:true, noarg:true, noempty:true, eqeqeq:true, evil:false, bitwise:false, strict:true, undef:true, curly:true, devel:true, indent:4, maxerr:50, expr:true, loopfunc:true, onevar:false, multistr:true, browser:true, node:true */

!function () {
    'use strict';

    function Pipe(actions, options) {
        var self = this;

        self.options = options;

        Object.getOwnPropertyNames(actions).forEach(function (name) {
            self[name] = function () {
                var context = new PipeContext(actions, options);

                return context[name].apply(context, arguments);
            };
        });
    }

    function PipeContext(actions, options) {
        var self = this,
            callStack = self._callStack = [];

        self.options = options;

        Object.getOwnPropertyNames(actions).forEach(function (name) {
            var fn = actions[name];

            self[name] = function () {
                callStack.push({
                    fn: fn,
                    args: [].slice.call(arguments)
                });

                return self;
            };
        });
    }

    PipeContext.prototype.run = function (input, callback) {
        var self = this,
            callStack = makeArray(self._callStack);

        if (arguments.length === 1) {
            callback = arguments[0];
            input = undefined;
        }

        self._run(callStack, input, callback);
    };

    PipeContext.prototype._run = function (callStack, input, callback) {
        var self = this,
            frame,
            args;

        if ((frame = callStack.shift())) {
            args = makeArray(frame.args);
            args.unshift(input);
            args.push(function (err, output) {
                if (err) {
                    callback(err);
                } else {
                    self._run.call(self, callStack, output, callback);
                }
            });

            try {
                frame.fn.apply(self, args);
            } catch (ex) {
                callback(ex);
            }
        } else {
            callback.call(self, null, input);
        }
    };

    function makeArray(array) {
        return [].slice.call(array);
    }

    module.exports = Pipe;
    Pipe.PipeContext = PipeContext;
}();