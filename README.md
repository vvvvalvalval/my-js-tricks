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