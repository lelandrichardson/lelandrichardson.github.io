---
title: "Functional JavaScript, Part 3: apply, call, and the arguments object"
date: "2014-04-23T07:00:00.000Z"
draft: false
---

We are on a quest to bend and twist JavaScript in such a way that we can do some real functional programming. In order to do that, understanding function invocation and the Function prototype in detail is very much a pre-requisite.

This is the **third post** of a (to be determined)-post series on Functional Programming in Javascript. If you are just joining in, you may want to jump back to previous posts:

- [Part 1: Introduction](/functional-javascript-part-1-introduction)
- [Part 2: What makes a language "functional"](/functional-javascript-part-2-what-makes-a-language-functional)

Now that you've successfully read or ignored the above links, we are ready to move on!

### The `Function` prototype

If we crack open our favorite browser + JavaScript console, let's take a look at the `Function.prototype` object's properties:

```js
Object.getOwnPropertyNames(Function.prototype);
//=> ["length", "name", "arguments", "caller", "constructor", "bind", "toString", "call", "apply"]
```

The output here might vary depending on the browser and version of JavaScript you are using. (In my case, I am using Chrome 33).

We see several properties that might be of interest to us. For the purposes of this post, I'd like to talk about the following:

- Function.prototype.length
- Function.prototype.call
- Function.prototype.apply

The first is a property, while the other two are methods. In addition to these, I'd also like to discuss the special variable `arguments`, which is _slightly different_ than `Function.prototype.arguments` (now [deprecated][1]).

To get started, I am going to define a "tester" function which will help us understand what is going on

```js
var tester = function(a, b, c) {
  console.log({
    this: this,
    a: a,
    b: b,
    c: c
  });
};
```

This function simply logs the value of the parameters passed into it, along with the value of it's "context variable", `this`.

Now, let's try a couple of things out:

```js
tester("a");
//=> {this: Window, a: "a", b: (undefined), c: (undefined)}

tester("this", "is", "cool");
//=> {this: Window, a: "this", b: "is", c: "cool"}
```

We notice that if the second and third parameters are left blank, they show up as `undefined`. Additionally, we notice that the default "context" of a function is the global `window` object.

### Using `Function.prototype.call`

The `.call` method of a function invokes the function with the context variable `this` set to the first argument passed in, and then each additional argument is passed into the function.

Syntax:

```js
fn.call(thisArg[, arg1[, arg2[, ...]]])
```

Thus, the following two lines are effectively equivalent:

```js
tester("this", "is", "cool");
tester.call(window, "this", "is", "cool");
```

Of course, we can pass whatever we want in though:

```js
tester.call("this?", "is", "even", "cooler");
//=> {this: "this?", a: "is", b: "even", c: "cooler"}
```

The main utility of this method is to set the value of `this` in the function you are calling.

### Using `Function.prototype.apply`

The `.apply` method of a function has a bit more utility than `.call`. Similar to `.call`, `.apply` invokes the function with the context variable `this` set to the first argument passed in. The second and final argument, however, will end up being the arguments of the function provided as an array (or an array-like object);

Syntax:

```js
fun.apply(thisArg, [argsArray]);
```

Thus, the folllowing three lines are all equivalent:

```js
tester("this", "is", "cool");
tester.call(window, "this", "is", "cool");
tester.apply(window, ["this", "is", "cool"]);
```

Being able to specify the arguments list as an array is often times very useful (as we will find out).

For example, the `Math.max` function is a variadic function (a funciton which expects any number of arguments).

```js
Math.max(1, 3, 2);
//=> 3

Math.max(2, 1);
//=> 2
```

So, if I have an array of numbers and I need to find the maximum with the `Math.max` function, how do I go about doing that in one line?

```js
var numbers = [3, 8, 7, 3, 1];
Math.max.apply(null, numbers);
//=> 8
```

The `.apply` method really starts to show it's importance when coupled with the special `arguments` variable:

### The `arguments` object

Every function expression has a special local variable accessible inside it's scope: `arguments`. To investigate it's properties, let's create another tester function:

```js
var tester = function(a, b, c) {
  console.log(Object.getOwnPropertyNames(arguments));
};
```

> Note: We must use `Object.getOwnPropertyNames` in situations like this, because `arguments` has some properties that are not marked as enumerable, so they will not show up if we just do something like `console.log(arguments)`.

Now we test by invoking the tester function a couple of times:

```js
tester("a", "b", "c");
//=> ["0", "1", "2", "length", "callee"]

tester.apply(null, ["a"]);
//=> ["0", "length", "callee"]
```

The `arguments` variable has properties corresponding to each parameter passed into the function, as well as a `.length` and a `.callee` property.

The `.callee` property provides a reference to the function which invoked the current function, but is not fully supported in all browsers. For the moment, we will be ignoring it.

Let's redefine our tester function to be a little more informative:

```js
var tester = function() {
  console.log({
    this: this,
    arguments: arguments,
    length: arguments.length
  });
};

tester.apply(null, ["a", "b", "c"]);
//=> { this: null, arguments: { 0: "a", 1: "b", 2: "c" }, length: 3 }
```

### `arguments`: Object or Array?

As we can see, `arguments` is not quite an array, but it sort of looks like one. In many cases, though, we will want to manipulate it as if it was an array. To turn `arguments` into an array, this is a nice little shortcut:

```js
function toArray(args) {
  return Array.prototype.slice.call(args);
}

var example = function() {
  console.log(arguments);
  console.log(toArray(arguments));
};

example("a", "b", "c");
//=> { 0: "a", 1: "b", 2: "c" }
//=> ["a", "b", "c"]
```

Here we are taking advantage of the [Array.prototype.slice method][2] in order to turn the array-like-object into an array. Because of this, the `arguments` object can end up being incredibly useful when in conjunction with `.apply`.

## Some Useful Examples

---

### Log Wrapper

We built a `logWrapper` function in the last post, but it would only work properly for unary functions:

```js
// old version
var logWrapper = function(f) {
  return function(a) {
    console.log('calling "' + f.name + '" with argument "' + a);
    return f(a);
  };
};
```

Of course, with what we know now we can create a `logWrapper` function that works for _any_ function:

```js
// new version
var logWrapper = function(f) {
  return function() {
    console.log('calling "' + f.name + '"', arguments);
    return f.apply(this, arguments);
  };
};
```

By calling

```js
f.apply(this, arguments);
```

We are ensuring that the function `f` is being invoked with the _exact same_ context as it would have before. Thus, this logging function is completely unobtrusive if we want to replace some function in our code with the "wrapped" version.

### Turn native prototype methods into utility functions

Browsers come with lot's of useful methods right out of the box that we might want to "borrow" and use in our own code. Methods typically operate on the `this` variable as the "data". In functional programming, we won't have the `this` variable, but we may want to use the function anyway!

```js
var demethodize = function(fn) {
  return function() {
    var args = [].slice.call(arguments, 1);
    return fn.apply(arguments[0], args);
  };
};
```

Some other examples:

```js
// String.prototype
var split = demethodize(String.prototype.split);
var slice = demethodize(String.prototype.slice);
var indexOfStr = demethodize(String.prototype.indexOf);
var toLowerCase = demethodize(String.prototype.toLowerCase);

// Array.prototype
var join = demethodize(Array.prototype.join);
var forEach = demethodize(Array.prototype.forEach);
var map = demethodize(Array.prototype.map);
```

And of course, many more. To show how these would work:

```js
"abc,def".split(",");
//=> ["abc","def"]

split("abc,def", ",");
//=> ["abc","def"]

["a", "b", "c"].join(" ");
//=> "a b c"

join(["a", "b", "c"], " ");
// => "a b c"
```

> **Aside:**<br>As I will show later, it is actually better to use define this demethodize function in such a way that the arguments are flipped.

> In the case of functional programming, you generally want to have the "data" or "input data" argument to be the right-most argument of the function. Methods usually have the `this` variable bound to the "data". For instance, a `String.prototype` method is usually _operating on_ the actual string (ie, the "data"). The same goes for Array methods.

> The reason for this may not be immediately clear, but it is once you get used to currying and combining functions to get meaningful logic. This is precisely the issue that I brought up in the [Introduction](/functional-javascript-part-1-introduction/) post about [Underscore.js][4] and will go into more detail about in future posts. Almost every function in the Underscore.js library has the "data" argument as the left-most argument. This ends up leading to very little re-use, and code that is difficult to read and/or reason about. :sadface:

### Manipulate Argument Order

```js
// shift the parameters of a function by one
var ignoreFirstArg = function(f) {
  return function() {
    var args = [].slice.call(arguments, 1);
    return f.apply(this, args);
  };
};

// reverse the order that a function accepts arguments
var reverseArgs = function(f) {
  return function() {
    return f.apply(this, toArray(arguments).reverse());
  };
};
```

### Function Composition

Function Composition is incredibly important in the world of functional programming. The general idea is to create smaller, testable functions that are "units of logic", which can then be combined into larger "machines" which do much more complex work.

```js
// compose(f1, f2, f3..., fn)(args) == f1(f2(f3(...(fn(args...)))))
var compose = function(/* f1, f2, ..., fn */) {
  var fns = arguments,
    length = arguments.length;
  return function() {
    var i = length;
    // we need to go in reverse order
    while (--i >= 0) {
      arguments = [fns[i].apply(this, arguments)];
    }
    return arguments[0];
  };
};

// sequence(f1, f2, f3..., fn)(args...) == fn(...(f3(f2(f1(args...)))))
var sequence = function(/* f1, f2, ..., fn */) {
  var fns = arguments,
    length = arguments.length;
  return function() {
    var i = 0;
    // we need to go in normal order here
    while (i++ < length) {
      arguments = [fns[i].apply(this, arguments)];
    }
    return arguments[0];
  };
};
```

Example:

```js
// abs(x) = Sqrt(x^2)
var abs = compose(
  sqrt,
  square
);

abs(-2); // 2
```

That's it for today, but the next post takes a deep dive on function currying.

### Up Next -> [Part 4, Function Currying](/functional-javascript-part-4-function-currying/)

### More From This Series:

- [Part 1: Introduction](/functional-javascript-part-1-introduction/)
- [Part 2: What makes a language "functional"](/functional-javascript-part-2-what-makes-a-language-functional/)
- [Part 3: .apply(), .call(), and the arguments object](/functional-javascript-part-3-apply-call-and-the-arguments-object/)
- [Part 4: Function Currying](/functional-javascript-part-4-function-currying/)
- Part 5: Variadic Functions (coming soon)
- Part 6: 2048 Game & Solver, a "practical" example (coming soon)
- Part 7: Lazy sequences / collections (coming soon)
- Part 8: Why Argument order matters (coming soon)
- Part 9: Functors and Monads (coming soon)

[1]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/arguments
[2]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice
[4]: http://underscorejs.org/
