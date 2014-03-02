(function () {
    /*
     * CROCKFORD
     */

    /**
     * Define new methods.
     */
    Function.prototype.method = function (name, func) {
        if (!this.prototype[name]) {
            this.prototype[name] = func;
        }
        return this;
    };

    /**
     * Adds a function that creates an object using an old object as its prototype.
     * The newly created object has no own properties.
     */
    if (typeof Object.create !== 'function') {
        Object.create = function (o) {
            var F = function () {
            };
            F.prototype = o;
            return new F();
        }
    }

    /**
     * Adding a method for extract the integer part of a number.
     */
    Number.method('integer', function () {
        return Math[this < 0 ? 'ceiling' : 'floor'](this);
    });

    String.method('trim', function () {
        return this.replace(/^\s+|\s+$/g, '');
    });

    /**
     * Whether the provided value is an array.
     * @param value
     * @returns {*|boolean}
     */
    function is_array(value) {
        return value &&
            typeof value === 'object' &&
            typeof value.length === 'number' &&
            typeof value.splice === 'function' && !(value.propertyIsEnumerable('length'));
    };

    Array.method('reduce', function (f, value) {
        var idx;
        for (idx = 0; idx < this.length; idx += 1) {
            value = f(this[idx], value)
        }
        return value;
    });

//pseudo-classical inheritance pattern. Careful with that.
    (function pseudo_classical() {
        /**
         * Adding an inherit method to all functions, to create constructors with pseudoclassical inheritance.
         */
        Function.method('inherits', function (Parent) {
            this.prototype = new Parent();
            return this;
        });
        //example
        var Mammal = function (name) {
            this.name = name;
        }
        Mammal.prototype.get_name = function () {
            return this.name;
        }
        Mammal.prototype.says = function () {
            return this.saying || '';
        }
        var Cat = function (name) {
            this.name = name;
            this.saying = 'meow';
        }.
            inherits(Mammal).
            method('purr',function (n) {
                var i, s = '';
                for (i = 0; i < n; i += 1) {
                    if (s) {
                        s += '-';
                    }
                    s += 'r';
                }
                return s;
            }).
            method('get_name', function () {
                return this.says() + ' ' + this.name + ' ' + this.says();
            })
    }());

    /**
     * This lets you define recursive functions on integer with a memoizer.
     * @param memo
     * @param fundamental
     * @returns {shell}
     */
    function memoizer(memo, fundamental) {
        function shell(n) {
            var result = memo[n];
            if (typeof result !== 'number') {
                result = fundamental(shell, n);
                memo[n] = result;
            }
            return result;
        }

        return shell;
    }

    /*
     * ANGULAR JS
     */

    /**
     * Utility function that merges several injectable bodies into one injectable body that sequentially executes them.
     *
     * We call 'injectable body' an array such as those used to create AngularJS services or controllers : an array that begins with services names, and which last element is a 'body' function into which the corresponding services are injected and that gets executed.
     *
     * @param injectable_bodies an array of injectable bodies, i.e an array of arrays, for which all elements are strings except for the last one that is a function.
     * @returns {Array} the injectable body that is obtained by merging all these injectable bodies : the services names list is the concatenation of all the services names list, and the body function executes all body function sequentially.
     */
    var merge_injectable_bodies = (function () {
        /**
         * a utility function for extracting sub-arrays
         * @param arr the array to extract from
         * @param start the first index (inclusive)
         * @param end the last index (exclusive)
         * @returns {Array}
         */
        function sub_array(arr, start, end) {
            var result = [];
            for (var i = start; i < end; i++) {
                result.push(arr[i]);
            }
            return result;
        }

        /**
         * utility function for extracting all elements from an array but the last one.
         * @param arr
         * @returns {Array}
         */
        function all_but_last(arr) {
            return sub_array(arr, 0, arr.length - 1);
        }

        //the function itself.
        return function (injectable_bodies) {
            var bodiesData = [];

            //executing that function creates an object for each injectable body with useful info.
            function extractBodiesData() {
                var currentArgs = [];
                var beginIndex = 0;
                var endIndex;
                for (var i = 0; i < injectable_bodies.length; i++) {
                    //an array with names and a function
                    currentArgs = injectable_bodies[i];
                    endIndex = beginIndex + currentArgs.length - 1;

                    bodiesData.push({
                        "servicesNames": all_but_last(currentArgs),
                        "beginIndex": beginIndex,
                        "endIndex": endIndex,
                        "bodyFunction": currentArgs[currentArgs.length - 1]
                    });

                    beginIndex = endIndex;
                }
            }

            var mergedBody = [];

            extractBodiesData();

            //adding all the services names.
            for (var i = 0; i < injectable_bodies.length; i++) {
                var servicesNames = bodiesData[i].servicesNames;
                for (var j = 0; j < servicesNames.length; j++) {
                    mergedBody.push(servicesNames[j]);
                }
            }

            //the function that is passed as the last argument of mergedArgs. Is injected with all the merged services.
            var wrappingFunction = function () {
                var currentBodyData, currentBody, currentInjectedServices;
                //for each args array, we retrieve the injected services and feed them to the corresponding body function.
                for (var i = 0; i < bodiesData.length; i++) {
                    //retrieving the data for the current body.
                    currentBodyData = bodiesData[i];
                    currentBody = currentBodyData.bodyFunction;

                    //building an argument array that are the services to inject into the current body function.
                    currentInjectedServices = sub_array(arguments, currentBodyData.beginIndex, currentBodyData.endIndex);

                    //calling the body function with the injected services.
                    currentBody.apply(null, currentInjectedServices);
                }
            }
            //appending the wrapping function that merges all the body function at the end of the merged arguments array.
            mergedBody.push(wrappingFunction);

            return mergedBody;
        };
    }());

    /*
     * PERSONAL
     */

    /**
     * Whether the provided value is undefined.
     * @param value
     * @returns {boolean}
     */
    function is_undefined(value) {
        return (typeof value === 'undefined');
    }

    /**
     * Transforms a pseudo-array (e.g the arguments object of a function) into a real array.
     * Can also be used to make defensive copies of a real array.
     * @param pseudo_array
     * @returns {Array|T[]}
     */
    function to_real_array(pseudo_array) {
        return Array.prototype.slice.call(pseudo_array, 0);
    }

    /**
     * A for-like (currified) construct that iterates over the items of an array (or any array-like structure).
     * @param array the array which elements are to be iterated over.
     * @returns {Function} A function consuming a body function which takes an 'item' parameter, and optionally an 'index' parameter.
     */
    function forEach(array) {
        return function (body_function) {
            var l = array.length;
            var idx, item;
            for (idx = 0; idx < l; idx++) {
                item = array[idx];
                body_function(item, idx);
            }
        }
    }

    /**
     * Functional (currified) construct for iterating over the property names of an object.
     * @param obj the object which properties are t be iterated over.
     * @param accept_functions whether the functional members should be accepted or filtered.
     * @param accept_inherited_members whether the members inherited from the prototype chain should be accepted or filtered.
     * @returns {Function} A function that accepts a 'body' as its argument, i.e a function with a single argument that is the name of the current property. That body function gets executed for each
     */
    function forProperty(obj, accept_functions, accept_inherited_members) {
        return function (body_function) {
            var name;
            for (name in obj) {
                if (obj.hasOwnProperty(name) || accept_inherited_members) {
                    var value = obj[name];
                    if ((typeof value !== 'function') || accept_functions) {
                        body_function(name, value);
                    }
                }
            }
        };
    }

    /**
     * Tranforms a function consuming an array into a function with varargs.
     * @param func a function consuming (among other things) an array.
     * @param opts a configuration object for extracting the varargs, specifying the number of starting and trailing non-varargs arguments.
     * @returns {Function} a varargsified function.
     */
    function varargs_ify(func, opts){
        if(is_undefined(opts)){
            opts = {
                "starting":0,
                "trailing":0
            }
        }
        return function(){
            var provided_args = to_real_array(arguments);

            //extracting the starting args
            var first_args = provided_args.splice(0, opts.starting);
            //extracting the trailing args
            var last_args = provided_args.splice(provided_args.length - opts.trailing, provided_args.length);
            first_args.push(provided_args);

            var that = this;
            return func.apply(that, first_args.concat(last_args));
        }
    }

    /**
     * The identity function, useful to make some API more generic.
     * @param x
     * @returns x
     */
    function identity(x) {
        return x;
    }

    /**
     * Composes the specified function to zero or more other functions, of any arity.
     * Currified construct.
     * @param f the function that returns the final result.
     * @returns {Function}
     */
    function compose(f) {
        if (is_undefined(f)) {
            return identity;
        } else {
            return function () {
                var gs = arguments;
                if (gs.length == 0) {
                    return f;
                } else {
                    var that = this;
                    return compose(function () {
                        var intermediate_results = [];
                        var args = arguments;
                        forEach(gs)(function (g_i) {
                            intermediate_results.push(g_i.apply(null, to_real_array(args)));
                        });
                        return f.apply(that, intermediate_results);
                    });
                }
            };
        }
    }

    /**
     * Utility for augmenting functions with a specified behavior.
     * From the provided behavior, returns a function, that consumes other functions (regardless of their arity), and augments them with that behaviour.
     * The additional behavior is a function with a single argument, that is a callback with no parameters, and optionally a second argument, that is the array of the arguments on which the function is called. When invoked, that callback passes the arguments to the initial function and returns its result.
     * If the additional behavior returns no result (more specifically, returns undefined), then the result of the initial function is automatically returned.
     * Therefore, this function can be used for both adding side-effects to the initial function or intercepting its result.
     * @param additional_behavior the additional behavior, a function with one or two arguments, that may return a result.
     * @returns {Function} An augmenter function consuming functions to be augmented. The augmented takes the same arguments as the initial function;
     */
    var augmented_with = (function () {
        function augmented_with_one(additional_behavior) {
            return function (initial_function) {
                return function () {
                    var initial_res, wrapper_res;

                    var that = this;
                    var args = to_real_array(arguments);

                    var invoke_initial = function (this_arg) {
                        if (is_undefined(this_arg)) {
                            this_arg = that;
                        }
                        initial_res = initial_function.apply(this_arg, args);
                    }

                    wrapper_res = additional_behavior(invoke_initial, args);

                    if (typeof wrapper_res == 'undefined') {
                        return initial_res;
                    } else {
                        return wrapper_res;
                    }
                };
            };
        }

        /**
         * Composes the augmentations that are provided in an array of behaviors.
         * @param behaviors
         * @returns {*}
         */
        function augmented_with_several(behaviors) {
            if (behaviors.length == 0) {
                return identity;
            } else if (behaviors.length == 1) {
                return augmented_with_one(behaviors[0]);
            } else {
                var first_behavior = behaviors.pop();
                return compose(augmented_with_several(behaviors))(augmented_with_one(first_behavior))();
            }
        }

        return function () {
            var args = to_real_array(arguments);
            return augmented_with_several(args);
        }
    }());

    /**
     * Transforms a function into time function.
     * @param initial_function the function to time, of any arity, owner and result type.
     * @param do_with_duration Optional callback to apply to the duration. Defaults to logging the elapsed time.
     * @returns {}
     */
    function timed(initial_function, do_with_duration) {
        // The do_with_duration callback is optional, if not provided this is the default implementation.
        if (!do_with_duration) {
            do_with_duration = function (duration) {
                console.log("Elapsed time : " + duration + " ms.");
            }
        }

        return augmented_with(function (invoke) {
            var start, end;

            start = new Date().getTime();
            invoke();
            end = new Date().getTime();

            do_with_duration(end - start);
        })(initial_function);
    }

    /**
     * Transforms a function into a function that always refers to this as the specified owner object.
     * Useful for detaching a method from an object.
     * @param owner
     * @returns {}
     */
    function loyal_to(owner) {
        var loyalty = function (invoke) {
            invoke(owner);
        }
        return augmented_with(loyalty);
    }


    /*
     * PACKAGING AND EXPORTING
     */

    var loyal_to_console = loyal_to(console);
    var debug = loyal_to_console(console.debug);
    var info = loyal_to_console(console.info);
    var warn = loyal_to_console(console.warn);
    var error = loyal_to_console(console.error);


    function make_packager_in(obj, package_name) {

        function pkg(name, body) {

            var current_obj, current_package_name;

            function def_single(name, value) {
                if (!is_undefined(current_obj[name])) {
                    warn(name + " was already defined in " + current_package_name);
                }
                current_obj[name] = value;

                debug("Bound " + name + " to a value of type " + (typeof value) + " in " + current_package_name);
            }

            function def_all(exports) {
                forProperty(exports, true)(function (name) {
                    def_single(name, exports[name]);
                });
            }

            function exprt() {
                if (typeof arguments[0] === "object") {
                    def_all.apply(null, arguments);
                } else {
                    def_single.apply(null, arguments);
                }
            }

            current_package_name = package_name + "." + name;

            if (typeof obj[name] === "undefined") {
                debug("Created package object " + current_package_name);
                obj[name] = {};
            }
            current_obj = obj[name];

            debug("Creating package " + current_package_name);

            body(exprt, make_packager_in(current_obj, current_package_name));

            debug("Done creating package " + current_package_name);
        }

        return pkg;
    }
    var root_packager = make_packager_in(Object, "<root>");

    function in_package(path, body) {
        function aux(path, body, pkg) {
            if (path.length < 0) {
                error("Path must be of length 1 at least.");
            }
            var current_package_name = path.pop();
            if (path.length > 0) {
                pkg(current_package_name, function (def, pkg) {
                    aux(path, body, pkg);
                });
            } else {
                pkg(current_package_name, body);
            }
        }

        aux(path.reverse(), body, root_packager);
    }

    in_package(["js_toolbox"], function (expt, pkg) {

        pkg("personal", function (expt, pkg) {
            expt({
                "augmented_with": augmented_with,
                "compose": compose,
                "forEach": forEach,
                "forProperty": forProperty,
                "identity": identity,
                "loyal_to": loyal_to,
                "to_real_array": to_real_array,
                "timed": timed,
                "varargs_ify": varargs_ify
            });
        });

        pkg("angular", function (expt, pkg) {
            expt({
                "merge_injectable_bodies": merge_injectable_bodies
            });
        });
    });

}());
