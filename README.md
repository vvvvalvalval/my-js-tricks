valsJsTricks
============

Some JavaScript utility functions I use for my developments. Many of them are inspired from other programming languages I have used, like Clojure and OCaml.

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


get_in
------

Takes a nested data structure and an array of keys, and gets the value corresponding to the that path in the data structure, or `undefined` if that path is broken as some point.

```javascript
get_in(myObj,['a']); // => "hello"
get_in(myObj,['b','c']); // => 42
get_in(myObj,['b','d',2]); // => "friends"
get_in(myObj,['b','d',3]); // => {aKey: "a value"}
get_in(myObj,['b','d',3,'aKey']); // => {aKey: "a value"}
get_in(myObj,[]); // => myObj

get_in(myObj,['nonexistentKey']); // => undefined
get_in(myObj,['b','nonexistentKey']); // => undefined
get_in(myObj,['a','nonexistentKey']); // => undefined
```

Note that the "keys" in the array must be strings or numbers.


deep_getter
------

Built atop `get_in` this function takes one or several "keys", and returns a function that acts as a getter to be applied to any object.

Typical usage :
```
var complicatedObjects = [
  {a:1,b:{c: "hello"}},
  {a:2,b:{c: "how"}},
  {a:3,b:{c: "are"}},
  {a:4,b:{c: "you ?"}}
];

complicatedObjects.map(deep_getter('a')); // => [1,2,3,4]
complicatedObjects.map(deep_getter('b','c')); // => ["hello","how","are","you ?"]
```
