/**
 * Small self-contained JavaScript utilities ala Underscore.js
 */
(function load_bandsquare_utils(export_root, name) {
  /**
   * Whether the provided value is undefined.
   * @param value
   * @returns {boolean}
   */
  function is_undefined(value) {
    return (typeof value === 'undefined');
  }

  function is_defined(value) {
    return (typeof value !== 'undefined');
  }

  /**
   * Debugging utility : inspect("someName")(value) logs "someName  = " + value
   * @param name
   * @returns {Function}
   */
  function inspect(name){
    return function(value){
      console.log(">>> INSPECT : " + (name || "value") + " = " , value);
      return value;
    };
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
      return function () {
        var that = this;
        return func.apply(that, [to_real_array(arguments)]);
      };
    } else {
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
  }

  /**
   * Returns the first element in arr for which pred yields a truthy value, or undefined if none exists.
   * @param arr an array-like object.
   * @param pred a single-argument function.
   * @returns {*}
   */
  function find(arr,pred){
    var res;
    for (var i= 0, n=arr.length; i<n; i++){
      var item = arr[i];
      if(pred(item)){
        return item;
      }
    }
    return res;
  }

  function some_defined_in_arr(arr){
    return find(arr,is_defined);
  }

  /**
   * Function that returns the first of its elements that is defined, or undefined if none are.
   * @type {Function}
   */
  var some_defined = varargs_ify(some_defined_in_arr);

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
   * Usage : var g = partial(f)(3,2);
   * @param f
   * @returns {with_args}
   */
  function partial(f){
    return function with_args(){
      var partial_args = to_real_array(arguments);
      return function curried (){
        var args = to_real_array(arguments);
        return f.apply(this,partial_args.concat(args));
      }
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
  function augmented_with (additional_behavior) {
    return function augment (initial_function) {
      return function () {
        var initial_res, wrapper_res;

        var that = this;
        var args = to_real_array(arguments);

        var invoke_initial = function (this_arg) {
          if (is_undefined(this_arg)) {
            this_arg = that;
          }
          initial_res = initial_function.apply(this_arg, args);
        };

        wrapper_res = additional_behavior(invoke_initial, args);

        if (is_undefined(wrapper_res)) {
          return initial_res;
        } else {
          return wrapper_res;
        }
      };
    };
  }

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
    return function detach(method){
      return function detachable(){
        var args = to_real_array(arguments);
        return method.apply(owner, args);
      };
    };
  }

  function detached(from_object, method_name){
    return loyal_to(from_object)(from_object[method_name]);
  }

  function make_FIFO (elements) {
    elements = (elements || []).slice(); //defensive copying
    var begin = 0, end = elements.length;

    var res = {};
    function toArray () {
      return elements.slice(begin,end);
    }
    function size () {
      return end-begin;
    }
    function isEmpty () {
      return begin === end;
    }
    function push(element){
      elements.push(element);
      end += 1;
      return res;
    }
    function pop(){
      if(!isEmpty()){
        var element = elements[begin];
        delete elements[begin];
        begin += 1;
        return element;
      }
    }
    res.toArray = toArray; // copies elements into a new array
    res.size = size; // number of elements
    res.isEmpty = isEmpty;
    res.push = push; // adds an element at the end of the queue and returns the queue
    res.pop = pop; //

    return res;
  }

  /**
   * Creates a bounded FIFO queue which drops the oldest elements when max_size is reached.
   * @param max_size
   * @param elements
   * @returns {fifo}
   */
  function make_bounded_FIFO(max_size, elements){
    var fifo = make_FIFO(), bounded_fifo = Object.create(fifo); // decorates a regular FIFO.

    // decorating push.
    function push(element) {
      fifo.push(element);
      while(fifo.size() > max_size) {
        fifo.pop();
      }
      return bounded_fifo;
    }
    bounded_fifo.push = push;

    // adding all elements
    elements = elements || [];
    elements.forEach(push);

    return bounded_fifo;
  }

  /**
   * Creates an array of the integers from the specified range.
   * @param begin
   * @param end
   * @returns {Array}
   */
  function range (begin, end) {
    var arr = [];
    if(is_undefined(end)){
      end = begin;
      begin = 0;
    }
    for(var i = begin; i < end; i++) {
      arr.push(i);
    }
    return arr;
  }

  /**
   * Creates a constant function from the specified value.
   * @param v
   * @returns {Function}
   */
  function constant (v) {
    return function () {
      return v;
    };
  }

  function constant_array (size,v) {
    return range(size).map(constant(v));
  }

  /**
   * Takes an array of elements and returns a map m such that m[getKey(item)] = item
   * @param elements
   * @param getKey
   */
  function indexArray (elements, getKey) {
    var res = {};
    elements.forEach(function (item) {
      res[getKey(item)] = item;
    });
    return res;
  }

  function get_in(obj, props) {
    for(var i = 0, l = props.length; i < l; i++) {
      if(typeof obj === 'object'){
        obj = obj[props[i]];
      } else {
        return;
      }
    }
    return obj;
  }

  /**
   * Creates a deep getter function from the parameterized sequence of property names.
   * Example :
   * deep_getter('a','b',2,'c')( {a:{b:[1,"coucou",{c:"alabama"},43]}} ) => "alabama"
   * @type {Function}
   */
  var deep_getter = varargs_ify(function (props) {
    return function (obj) {
      return get_in(obj,props);
    };
  });

  /**
   * Takes an object or array and makes it a function of its keys
   * @param obj an object (or array)
   */
  function as_func (obj) {
    return function (key) {
      return obj[key];
    }
  }

  // EXPORT HERE :

  var exposed = {
    as_func: as_func,
    augmented_with : augmented_with,
    compose: compose,
    constant: constant,
    constant_array: constant_array,
    deep_getter: deep_getter,
    partial: partial,
    detached: detached,
    find: find,
    forProperty: forProperty,
    get_in: get_in,
    identity: identity,
    indexArray: indexArray,
    inspect: inspect,
    is_defined: is_defined,
    is_undefined: is_undefined,
    loyal_to: loyal_to,
    make_FIFO: make_FIFO,
    make_bounded_FIFO: make_bounded_FIFO,
    range: range,
    some_defined: some_defined,
    to_real_array: to_real_array,
    varargs_ify : varargs_ify
  };

  // Expose in global namespace
  if(!is_undefined(export_root[name])){
    console.error("Can't add " + name + ", already defined : ", export_root[name]);
  } else {
    export_root[name] = exposed;
  }

  // Expose in angular
  if(angular){
    angular.module('valsJsTricks',[])
      .constant('jsTricks',exposed);
  }

}(window,"valsJsTricks"));

var complicatedObjects = [
  {a:1,b:{c: "hello"}},
  {a:2,b:{c: "how"}},
  {a:3,b:{c: "are"}},
  {a:4,b:{c: "you ?"}}
];

complicatedObjects.map(deep_getter('a')); // => [1,2,3,4]
complicatedObjects.map(deep_getter('b','c')); // => ["hello","how","are","you ?"]
