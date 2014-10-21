Some generic JavaScript utility functions I use for my developments. 
Many of them are inspired from other programming languages I have used, like Clojure and OCaml.

Usage
======

If you add this file, a global variable `window.valsJsTricks` will be created, that is an object holding the functions defined below.

You'll typically want to write :
```javascript
var u = window.valsJsTricks;
u.augmentedWith() // ...
```

If you are using AngularJS, a `'valsJsTricks'` with a constant named `'jsTricks'` will be created.

All of the functions are autonomous (i.e none of them are defined with the `this` keyword).


get_in
------

Takes a nested data structure and an array of keys, and gets the value corresponding to the that path in the data structure, or `undefined` if that path is broken as some point.

```javascript
var myObj = {
  a: "hello",
  b: {
    c: 42,
    d: ["happy","tree","friends",{aKey: "a value"}]
  }
};

get_in(myObj,['a']); // => "hello"
get_in(myObj,['b','c']); // => 42
get_in(myObj,['b','d',2]); // => "friends"
get_in(myObj,['b','d',3]); // => {aKey: "a value"}
get_in(myObj,['b','d',3,'aKey']); // => {aKey: "a value"}
get_in(myObj,[]); // => myObj

get_in(myObj,['nonexistentKey']); // => undefined
get_in(myObj,['b','nonexistentKey']); // => undefined
get_in(myObj,['b','nonexistentKey','d',1]); // => undefined
get_in(myObj,['a','nonexistentKey']); // => undefined
```

Note that the "keys" in the array must be strings or numbers.


deep_getter
------

Built atop `get_in` this function takes one or several "keys", and returns a function that acts as a getter to be applied to any object.

Typical usage :
```javascript
var complicatedObjects = [
  {a:1,b:{c: "hello"}},
  {a:2,b:{c: "how"}},
  {a:3,b:{c: "are"}},
  {a:4,b:{c: "you ?"}}
];

complicatedObjects.map(deep_getter('a')); // => [1,2,3,4]
complicatedObjects.map(deep_getter('b','c')); // => ["hello","how","are","you ?"]
```

loyal_to and detached
------

As soon as a function is declared as a method of an object using the `this` keyword, it stops being first-class, in that you have to always call it from the object to which it belongs.

This can lead to confusing or painful situations, for example :
 
```javascript
// confusing
console.log("hello"); // logs "hello"
var f = console.log; f("hello"); // throws an error

// painful
["hello","how","are","you ?"].map(console.log); // you can't do that.
```

You can avoid this issue by defining your own functions without this, but sometimes a library just won't give you a choice. `loyal_to` and `detached` are here to right this wrong.

`loyal_to` consumes an object `obj` and a function `f` (that supposedly was defined with `this`, or it would be useless), and returns a function that acts just like `f`, but for which `this` is "frozen" to always resolve to `obj`.

Example : 

```javascript
var obj = {
  greetee: "World"
};
var greet = function () {
  return "Hello, " + this.greetee + "!";
};
obj.greet(); // "Hello, World!"

var greetWorld = loyal_to(obj,greet);
greetWorld(); // "Hello, World!"
``` 

You usually want to use `loyal_to` to "detach" a method from an object, like this :

```javascript
var detachedMethod = loyal_to(ownerObject,ownerObject.methodName);
```

`detached` simply acts as a shortcut for that : 

```javascript
 var detachedMethod = detached(ownerObject,'methodName');
```
  
to_real_array
------
 
 Takes an array-like structure and copies it into a real array. Can be used to copy real arrays to.
 
 
 
varargs_ify
------
 
 Takes a function that accepts an array as argument, and returns a function with variadic arguments. 
 
```javascript
 var count = function (arr) {
   return arr.length;
 };
 var countMyArgs = varargs_ify(count);
 countMyArgs(); // => 0;
 countMyArgs("a","b","c"); // => 3
 
 // if the initial function accepts other arguments arguments than an the array, you can specify starting and/or trailing options
 var logCount = function (beginning, arr, end) {
   console.log(beginning + " " + arr.count + " " + end);
 };
 logCount("The array has",[1,2,3,4],"arguments"); // => logs "The array has 4 arguments"
 
 var logMiddleArgs = varargs_ify(logCount,{starting: 1, trailing: 1});
 logMiddleArgs("The array has", 1, 2, 3, 4, "arguments");
```
 

index_array
------

Takes an array and a function f of this array's elements, and returns an object that maps f(e) to e for each item e. 

```javascript
var myArray = [
  {id: 'a', message: "hello"},
  {id: 'b', message: "how"},
  {id: 'c', message: "are"},
  {id: 'd', message: "you"}
];

var indexed = index_array(myArray, deep_getter('id'));
indexed['b']; // {id: 'b', message: "how"}
```

find
------

Takes an array an a predicate function, an returns the first element of the array for which the predicate returns logically true, or undefined is there is none.

```javascript
var isEven = function (n) {return n % 2 === 0;};
find([1,3,4,2,5,6,null,9],isEven); // => 4
```


is_defined and is_undefined
------

These do exactly what you think.


as_func
------
Takes a JS object (or array), and returns the natural function of its keys / indexes.

```javascript
var myObj = {a: 1, b: "hello", c: null}, f = as_func(myObj);
f('a'); // => 1
f('b'); // => "hello"
f('c'); // => null
f('d'); // => undefined

var myArr = [1,"hello",null], g = as_func(myArr);
g(0); // => 1
g(1); // => "hello"
g(2); // => null
g(3); // => undefined
```


partial
------

Takes a function, then fewer arguments than the function usually takes, and returns a function with accepts the remaining args.

```javascript
var add = function(a,b){return a+b;};
var add5 = partial(add)(5); // notice the curried construct.
add5(2); // => 7
add5(8); // => 13
``` 


compose
------
Advanced multivariate composition function. Uses deep currying to provide an elegant composition API. 

```javascript
// Composing 2 functions f(x) and g(y1,y2) : (y1,y2) -> x = g(y1,y2) -> f(x)
var fog = compose(f)(g)();
fog(y1,y2); // same as f(g(y1,y2))

// Composing 3 functions f(x1,x2), g1(y) and g2(y) : y -> (x1 = g1(y), x2 = g2(y)) -> f(x1,x2)
var h = compose(f)(g1,g2)(); // notice how each number of parameters is the number of variables of the functions on the left.
h(y); // same as f(g1(y),g2(y))

// (z1,z2) -> y = h(z1, z2) -> (x1 = g1(y), x2 = g2(y), x3 = g3(y)) -> f(x1,x2,x3)
var ultraComposed = compose(f)(g1,g2,g3)(h)();
ultraComposed(z1,z2); // same as f(g1(h(z1,z2)),g2(h(z1,z2)),g3(h(z1,z2)))
```

Note that in a construct like `composedFn = compose(f)(g1,g2,...)(h1,h2,...)...(l1,l2)()`, there is *always* **one** argument in the first parameters group (`f` in this case), and none in the last.


augmented_with
------

Accepts a *behavior* function, and returns a function that "augments" other functions with this behavior.
Can be used to add side-effects to functions, or intercept its calls or returned values.

This is best understood by example : 

```javascript
// adding side-effects
var timingBehavior = function (invoke) {
  var start = new Date();
  invoke();
  var end = new Date();
  console.log("Elapsed time : " + (end.getTime() - start.getTime()) + " ms");
};
var timed = augmented_with(timingBehavior);
var myTimedFn = timed(myFn); // myTimedFn has exactly the same arity and logic as myFn, but additionally logs how much time it takes to compute.

// intercepting result
var defaultingToZero = function(invoke){
  var res = invoke();
  if(!res){
    return 0;
  }
};
var safeFindMyNumber = augmented_with(defaultingToZero)(findMyNumber); // this function is like findMyNumber, but returns 0 when findMyNumber would return null or undefined.
```