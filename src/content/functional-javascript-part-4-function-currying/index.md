---
title: "Functional JavaScript, Part 4: Function Currying"
date: "2014-04-29T07:00:00.000Z"
draft: false
---

In an earlier post we [played around with function currying](/functional-javascript-part-2-what-makes-a-language-functional#functions_can_return_functions) very briefly. Currying is absolutely essential to Functional Programming, and in this post we are going to take a deep dive.

## What is currying?

> Currying is the process of transforming a function that takes multiple arguments into a function that takes just a single argument and returns another function if any arguments are still needed.

When said like this, I think currying sounds rather simple. What would this look like in JavaScript?

Let's say we want to write a function that takes 3 arguments.

```js
var sendMsg = function(from, to, msg) {
  alert(["Hello " + to + ",", msg, "Sincerely,", "- " + from].join("\n"));
};
```

For the moment, let's assume we have some function `curry`, which turns any old JavaScript function into a curried function:

```js
var sendMsgCurried = curry(sendMsg); // returns function(a,b,c)

var sendMsgFromJohnToBob = sendMsgCurried("John")("Bob"); // returns function(c)

sendMsgFromJohnToBob("Come join the curry party!");
//=> "Hello Bob, Come join the curry party! Sincerely, - John"
```

## Manual Currying

In the above example, we had some mystical `curry` function. I will get to the implementation of such a function, but in the mean time, we should first see why such a function would be needed in the first place.

For instance, currying a function manually is not difficult, but it sure is verbose:

```js
// uncurried
var example1 = function(a, b, c) {
  // do something with a, b, and c
};

// curried
var example2 = function(a) {
  return function(b) {
    return function(c) {
      // do something with a, b, and c
    };
  };
};
```

In JavaScript, if you don't specify all of the arguments of a function, it will be invoked anyway. This is a neat feature of JavaScript, but it makes currying difficult and annoying.

The idea is every function is a function of one parameter. If you want to have more parameters, you then must define nested functions. Yuck! Doing this once or twice is fine, but this is quite verbose and hard to read if we want to do this a lot. (Don't worry though, I'll show you a way around it in a second!)

Some functional programming languages, such as Haskell and OCaml, have function currying baked into the language's syntax. In these languages, for example, **every function is a function of one argument, and one argument only**. You may think that such a restriction would be more annoying than helpful, but the language's syntax is such that this restriction is virtually unnoticeable.

For instance, in OCaml, one could define the `example` function like the example above in two possible ways:

```ocaml
let example1 = fun a b c ->
    // (* do something with a, b, c *)

let example2 = fun a ->
    fun b ->
        fun c ->
            // (* do something with a, b, c *)
```

It's pretty easy to see how these two examples look analogous to the two JavaScript examples above.

The difference, however, is that in OCaml **these are _exactly_ the same thing**. In OCaml, no functions have multiple arguments. However, declaring multiple arguments in a row is "short-hand" for defining nested one-argument functions.

Similarly, invoking curried functions syntactically looks the same in OCaml as what one would expect invoking a function with multiple arguments would be. To call the functions above we would write:

```ocaml
example1 foo bar baz
example2 foo bar baz
```

Whereas in JavaScript, we have the obvious difference:

```js
example1(foo, bar, baz);
example2(foo)(bar)(baz);
```

So in languages such as OCaml, currying is baked into the language. In JavaScript, currying is possible (higher-order functions), but the syntax is inconvenient. This is why we decide to make a `curry` function which does the heavy lifting for us, and keeps our code succinct.

## Creating a `curry` helper function

Ideally we would like to have an easy way to transform a plain-old JavaScript function (of multiple parameters) into a fully curried function.

This idea is not my own, and has been done by others, for example the `.autoCurry()` function in the [wu.js library][2] (though the implementation you are about to see is my own).

First, let's create a simple helper function `sub_curry`:

```js
function sub_curry(fn /*, variable number of args */) {
  var args = [].slice.call(arguments, 1);
  return function() {
    return fn.apply(this, args.concat(toArray(arguments)));
  };
}
```

Let's think for a minute about what this does. It's pretty simple. `sub_curry` accepts a function as it's first argument, and any number of arguments following that. It then returns a function which, when applied, will take the arguments originally passed in, plus the arguments passed in when it's invoked, and call the function.

For example:

```js
var fn = function(a, b, c) {
  return [a, b, c];
};

// these are all equivalent
fn("a", "b", "c");
sub_curry(fn, "a")("b", "c");
sub_curry(fn, "a", "b")("c");
sub_curry(fn, "a", "b", "c")();
//=> ["a", "b", "c"]
```

Obviously, this isn't quite what we want, but it is starting to look a little like currying. Now we are ready to define the following `curry` function:

```js
function curry(fn, length) {
  // capture fn's # of parameters
  length = length || fn.length;
  return function() {
    if (arguments.length < length) {
      // not all arguments have been specified. Curry once more.
      var combined = [fn].concat(toArray(arguments));
      return length - arguments.length > 0
        ? curry(sub_curry.apply(this, combined), length - arguments.length)
        : sub_curry.call(this, combined);
    } else {
      // all arguments have been specified, actually call function
      return fn.apply(this, arguments);
    }
  };
}
```

This function accepts two arguments, a function and a number of arguments to "curry". The second argument is optional, and if omitted, the `Function.prototype.length` property is used, which tells you the number of arguments the function was defined with.

As a result, we can demonstrate the following behavior:

```js
var fn = curry(function(a, b, c) {
  return [a, b, c];
});

// these are all equivalent
fn("a", "b", "c");
fn("a", "b", "c");
fn("a", "b")("c");
fn("a")("b", "c");
fn("a")("b")("c");
//=> ["a", "b", "c"]
```

I know what you're thinking...

> **Wait... WHAT?!**

Is your mind blown? It should be! We can now make functions in JavaScript curried and behave just like functions in OCaml or Haskell. Even more, if we want to pass multiple arguments in at once, we can just separate the arguments with a comma like we did before. No need to have all those ugly parentheses between arguments, even when it is curried.

This is incredibly useful, and I'm gonna talk about why in a second, but first I am going to take this `curry` function _just one step further_.

## Currying with "holes"

So currying functions is great, but it causes you to put a little more thought into what the order of arguments should be for functions you define. After all, the idea behind currying is to create new functions, with more specific functionality, out of other more general functions by partially applying them.

Of course that only works if the left-most argument is the argument you want to partially apply!

To remedy this, in some functional programming languages there is a special "placeholder variable" defined. It is usually assigned to the underscore `_` such that if `_` is passed in as a function argument, it is as if it was "skipped". and is still yet to be specified.

This is useful when you would like to partially apply a certain function, but the argument you would like to partially apply is not the left-most argument.

For instance, we might have the function:

```js
var sendAjax = function(url, data, options) {
  /* ... */
};
```

And we might want to define a new function which partially applies sendAjax with specific `options`, but allows `url` and `data` to be specified.

Of course, we could do this pretty simply by defining the function:

```js
var sendPost = function(url, data) {
  return sendAjax(url, data, { type: "POST", contentType: "application/json" });
};
```

OR, using this underscore convention, what if we could just do the following:

```js
var sendPost = sendAjax(_, _, {
  type: "POST",
  contentType: "application/json"
});
```

Notice the two parameters passed in with the underscore. Obviously, this isn't functionality that JavaScript has natively, so how would we go about doing this?

Let's go back and see if we can make our `curry` function a little bit smarter...

First we define a global reference to our "placeholder" variable.

```js
var _ = {};
```

We make it an object literal `{}` so that we can test for reference-equality via the `===` operator later on.

You could really call this whatever you'd like, but let's keep it as `_` for simplicity. We can now define our new `curry` function as something like this:

```js
function curry(fn, length, args, holes) {
  length = length || fn.length;
  args = args || [];
  holes = holes || [];
  return function() {
    var _args = args.slice(0),
      _holes = holes.slice(0),
      argStart = _args.length,
      holeStart = _holes.length,
      arg,
      i;
    for (i = 0; i < arguments.length; i++) {
      arg = arguments[i];
      if (arg === _ && holeStart) {
        holeStart--;
        _holes.push(_holes.shift()); // move hole from beginning to end
      } else if (arg === _) {
        _holes.push(argStart + i); // the position of the hole.
      } else if (holeStart) {
        holeStart--;
        _args.splice(_holes.shift(), 0, arg); // insert arg at index of hole
      } else {
        _args.push(arg);
      }
    }
    if (_args.length < length) {
      return curry.call(this, fn, length, _args, _holes);
    } else {
      return fn.apply(this, _args);
    }
  };
}
```

This curry function behaves almost identically to the last one, but the actual code is quite a bit different. We are now doing a bit of record keeping on where these "hole" arguments are. All in all, though, the principals of what is going on are the same.

To demonstrate our new helper, the following statements are all equivalent:

```js
var f = curry(function(a, b, c) {
  return [a, b, c];
});
var g = curry(function(a, b, c, d, e) {
  return [a, b, c, d, e];
});

// all of these are equivalent
f("a", "b", "c");
f("a")("b")("c");
f("a", "b", "c");
f("a", _, "c")("b");
f(_, "b")("a", "c");
//=> ["a", "b", "c"]

// all of these are equivalent
g(1, 2, 3, 4, 5);
g(_, 2, 3, 4, 5)(1);
g(1, _, 3)(_, 4)(2)(5);
//=> [1, 2, 3, 4, 5]
```

Crazy, right?!

## Why do I care? How is currying useful to me?

You may be sitting here thinking...

> This seems cool and all... but is this really going to **help me write better code?**

There are lots of reasons why function currying is useful.

Function currying allows and encourages you to compartmentalize complex functionality into smaller and easier to reason about parts. These smaller units of logic are dramatically easier to understand and test, and then your application becomes a nice and clean composition of the smaller parts.

To give a simple example, let's compare writing a naive CSV parser in Vanilla.js, Underscore.js, and "the functional way" (with full-on `curry` capabilities.

### Vanilla.js (Imperative)

```js
//+ String -> [String]
var processLine = function(line) {
  var row, columns, j;
  columns = line.split(",");
  row = [];
  for (j = 0; j < columns.length; j++) {
    row.push(columns[j].trim());
  }
};

//+ String -> [[String]]
var parseCSV = function(csv) {
  var table, lines, i;
  lines = csv.split("\n");
  table = [];
  for (i = 0; i < lines.length; i++) {
    table.push(processLine(lines[i]));
  }
  return table;
};
```

### Underscore.js

```js
//+ String -> [String]
var processLine = function(row) {
  return _.map(row.split(","), function(c) {
    return c.trim();
  });
};

//+ String -> [[String]]
var parseCSV = function(csv) {
  return _.map(csv.split("\n"), processLine);
};
```

### The "Functional" Way

```js
//+ String -> [String]
var processLine = compose(
  map(trim),
  split(",")
);

//+ String -> [[String]]
var parseCSV = compose(
  map(processLine),
  split("\n")
);
```

All of these examples are equivalent in functionality. I've intentionally written them to be as similar as I could possibly make them.

It's hard to be anything but subjective with examples such as this, but I really do think the last example, the "functional" way, shows some of the power behind functional programming.

## Some notes on the performance of `curry`

Some of the performance-minded folks out there might take a look at some of this and feel like their face is melting. I mean, look at all of this extra stuff going on?

In general, yes, using `curry` all over the place has some amount of overhead. Depending on what you are doing, this may or may not impact you in a noticeable way. That being said, I would venture to say that in _almost all_ cases, your code will have performance bottlenecks in other areas before this one.

With regards to performance, here are some overall things to keep in mind:

- accessing the `arguments` object is generally much slower than accessing named arguments
- some older browsers have a very slow implementation of `arguments.length`
- using `fn.apply( ... )` and `fn.call( ... )` in general is marginally slower than invoking directly like `fn( ... )`
- creating lots of nested scopes and closures comes at a cost, both in memory and speed

In most web applications the "bottle-neck" is going to be DOM interaction. It is very unlikely that you will notice a performance hit at all. Obviously, use the above code at your own risk.

## Up Next:

I have a lot more to talk about regarding functional programming in JavaScript. Coming up in the series will be discussions on Variadic Functions, Functors, Monads, and more.

Also, I've been asked to provide more in-depth examples of functional programming, and to do so I will be implementing the viral [puzzle-game 2048][3], and an AI Solver all from scratch! Stay tuned!

### More From This Series:

- [Part 1: Introduction](/functional-javascript-part-2-what-makes-a-language-functional/)
- [Part 2: What makes a language "functional"](/functional-javascript-part-2-what-makes-a-language-functional/)
- [Part 3: .apply(), .call(), and the arguments object](/functional-javascript-part-3-apply-call-and-the-arguments-object/)
- [Part 4: Function Currying](/functional-javascript-part-4-function-currying/)
- Part 5: Variadic Functions (coming soon)
- Part 6: 2048 Game & Solver, a "practical" example (coming soon)
- Part 7: Lazy sequences / collections (coming soon)
- Part 8: Why Argument order matters (coming soon)
- Part 9: Functors and Monads (coming soon)

---

> **Credits:**<br>
> This series has been influenced and inspired by the work of many other people I have learned from. If this post interests you, I encourage you to check out:

>

- [Brian Lansdorf: Hey Underscore, You're doing it wrong][4]
- [Functional JavaScript by Oliver Steele][5]
- [Reginald Braithwaite][6] and [allong.es][7]
- [Underscore.js][8]

[2]: http://fitzgen.github.io/wu.js/#wu-autocurry
[3]: http://gabrielecirulli.github.io/2048/
[4]: https://www.youtube.com/watch?v=m3svKOdZijA
[5]: http://osteele.com/sources/javascript/functional/
[6]: http://raganwald.com/
[7]: https://github.com/raganwald/allong.es
[8]: http://underscorejs.org/
