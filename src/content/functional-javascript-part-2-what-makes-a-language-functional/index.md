---
title: "Functional JavaScript, Part 2: What Makes a Language Functional?"
date: "2014-04-15T07:00:00.000Z"
draft: false
---

## Is JavaScript a "functional" programming language?

There is no magic formula for what makes a language "functional" or not. There seem to be languages that are clearly functional, while there are others that _clearly_ are not, but there is quite a bit of middle ground.

So here are some common and important "ingredients" of functional languages (ingredients that JavaScript implements are in **bold**).

- **Functions are "first-class" objects**
- **Functions can return functions**
- **Lexical closures**
- Functions are "pure"
- Safe Recursion
- NO mutating state

This is by no means an exhaustive list, but we've at least enumerated the three most important features of JavaScript that give it the power to be used in a "functional" way.

Let's have a look at each of these in detail:

## Functions are "first-class" objects

This is perhaps the most obvious of all the ingredients, and perhaps the most common among more modern programming languages.

In JavaScript local variables are defined using the `var` keyword.

```js
var foo = "bar";
```

It is quite easy to define functions as local variables in JavaScript.

```js
var add = function(a, b) {
  return a + b;
};
var even = function(a) {
  return a % 2 === 0;
};
```

These are in fact, variables: the variables `add` and `even` are references to the function definitions they were set to, and this can be changed at any time.

```js
// capture the old version of the function
var old_even = even;

// assign variable `even` to a new, different function
even = function(a) {
  return a & (1 === 0);
};
```

Of course, this is nothing out of the ordinary. But an important feature of being "first-class", is being able to pass them into functions as parameters. For instance:

```js
var binaryCall = function(f, a, b) {
  return f(a, b);
};
```

This is function that takes in a binary function, and two arguments, and then calls that function with the passed in arguments.

```js
add(1, 2) === binaryCall(add, 1, 2); // true
```

That may seem a bit silly, but when combined with the next "ingredient" of functional programming, we start to see some powerful results...

## Functions can return functions (a.k.a, "Higher-order functions")

This is where things start to get cool. Let's start off simple though. Functions can end up returning new functions as their result. For instance:

```js
var applyFirst = function(f, a) {
  return function(b) {
    return f(a, b);
  };
};
```

This function takes in a binary function as an argument, plus the first argument to "partially" apply to the function, and then returns a _unary_ (single-argument) function that when called, will return the result of the original function with the two arguments applied.

So let's say we have some function like `mult`:

```js
var mult = function(a, b) {
  return a * b;
};
```

We can now build on the logic of `mult` to construct a new function `double`:

```js
var double = applyFirst(mult, 2);

double(32); // 64
double(7.5); // 15
```

This is what's called _partial application_, and is used quite often in FP.

One can also define function similar to `applyFirst`:

```js
var curry2 = function(f) {
  return function(a) {
    return function(b) {
      return f(a, b);
    };
  };
};
```

Now, if we wanted a `double` function, we would instead do:

```js
var double = curry2(mult)(2);
```

This is what's called ["function currying"][1]. It's similar to partial application, but can be a bit more powerful.

I discuss [much more about currying](/functional-javascript-part-4-function-currying/) later in this series.

This is precisely where much of the power of functional programming comes from. Simple and understandable functions become the building blocks of our software. Functions can be combined and mixed together to form more complex behavior while having a high level of organization and very little re-use of logic.

Higher order functions can get a bit more fun. Let's look at a couple more examples:

Flip the order of arguments for a binary function

```js
// flip the argument order of a function
var flip = function(f) {
  return function(a, b) {
    return f(b, a);
  };
};

divide(10, 5) === flip(divide)(5, 10); // true
```

Create a function composed of other functions

```js
// return a function that's the composition of two functions...
// compose (f, g)(x) -> f(g(x))
var compose = function(f1, f2) {
  return function(x) {
    return f1(f2(x));
  };
};

// abs(x) = Sqrt(x^2)
var abs = compose(
  sqrt,
  square
);

abs(-2); // 2
```

This example creates a utility function that we can use if we want log every time a certain function was called.

```js
var logWrapper = function(f) {
  return function(a) {
    console.log('calling "' + f.name + '" with argument "' + a);
    return f(a);
  };
};
```

```js
var app_init = function(config) {
  /* ... */
};

if (DEBUG) {
  // log the init function if in debug mode
  app_init = logWrapper(app_init);
}

// logs to the console if in debug mode
app_init({
  /* ... */
});
```

## Lexical Closures + Scoping

I believe understanding how to effectively utilize closures and scoping is at the core of being a great JavaScript developer.

So.... What is closure?

> Simply put, a closure is when an inner function has access to the scope of parent functions, even when the parent function has already returned.

Perhaps an example is in order.

```js
var createCounter = function() {
  var count = 0;
  return function() {
    return ++count;
  };
};

var counter1 = createCounter();

counter1(); // 1
counter1(); // 2

var counter2 = createCounter();

counter2(); // 1
counter1(); // 3
```

Whenever the function `createCounter` is called, a new block of memory is allocated for the variable `count`. Then, a function is returned which _holds on to_ the reference of the `count` variable, and increments it every time it is called.

Note that from outside the scope of the `createCounter` function, there is no way for us to manually manipulate the value of `count`. The `counter1` and `counter2` functions can manipulate their respective copies of the `count` variable, but only in the very specific way that was intended (incrementing by 1).

In JavaScript, the boundaries of scope are determined only by `function` declarations. Each function, and only each fonction, has it's own scope table. (Note: [this will change in ECMAScript 6][3] with the introduction of `let`)

Some further examples to demonstrate the point:

```js
// global scope
var scope = "global";

var foo = function() {
  // inner scope 1
  var scope = "inner";
  var myscope = function() {
    // inner scope 2
    return scope;
  };
  return myscope;
};

console.log(foo()()); // "inner"

console.log(scope); // "global"
```

There are some important things to consider with scoping. For instance, let's say we want to create a function which accepts a digit (0 through 9) and returns the corresponding English name of that digit.

Naively, one might:

```js
// global scope...
var names = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine"
];
var digit_name1 = function(n) {
  return names[n];
};
```

But this has the disadvantage that `names` is now in the global scope and can be modified accidentally, which would render the `digit_name1` function incorrect.

Then one might:

```js
var digit_name2 = function(n) {
  var names = [
    "zero",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine"
  ];
  return names[n];
};
```

This creates the `names` array locally. This function isn't in danger of being buggy, but it does come with the performance penalty of defining and re-allocating space for the `names` array each time the function `digit_name2` is called. If this were some other example where `names` was a very large array, and perhaps `digit_name2` was being called many times in a loop, the performance impact could be noticeable.

```js
// "An inner function enjoys that context even after the parent functions have returned."
var digit_name3 = (function() {
  var names = [
    "zero",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine"
  ];
  return function(n) {
    return names[n];
  };
})();
```

And thus we arrive on our third option. Here we are utilizing an [Immediately-Invoked-Function-Expression][4] (IIFE), which then instantiates the `names` variable once, and returns the `digit_name3` function, which has the `names` variable in it's closure.

This solution has the benefits of both the first two examples with none of the downsides. Win! This is a common pattern to create "private" state that cannot be modified by the outside environment.

---

### Update Apr 25, 2014: What about what JavaScript DOESN'T have?

We've gone over the ingredients JavaScript has, but what about the three things I mentioned that it _doesn't_ have?

- Functions are "pure"
- NO mutating state
- Safe Recursion

#### **Pure functions and NO mutating state**

Pure functions have "no side effects", which is another way of saying that there is NO mutating state. This makes your code much _much_ easier to reason about, easier to test, easier to parallelize, etc...

Even though you can write code that doesn't mutate variables, this is not as useful as having the _guarantee_ that it won't happen.

#### **Safe Recursion**

Although you can call a function recursively in JavaScript, interpreters do not compile with tail-recursion optimizations. This means that any recursively defined function can quickly lead to stack overflow errors if you're not careful. This makes using for/while loops as necessity in some cases (which is decidedly _less_ elegant).

---

## Can it get better? What's next?

JavaScript is an incredibly flexible language. However, most of the examples in this post may be of limited utility in practical situations.

For example, the `curry2` function is useful but only applies to binary functions. Most functional programming languages have currying built into the syntax, but JavaScript does not.

Of course there are ways around this: JavaScript exposes useful functions like `Function.prototype.call`, `Function.prototype.bind`, and the special `arguments` object. These functions can be utilized to implement some of the more powerful conventions of functional programming (like currying).

I will talk about this in much greater detail in my next post of the series:

### Up Next -> [Part 3: .apply(), .call(), and the arguments object](/functional-javascript-part-3-apply-call-and-the-arguments-object/)

---

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

[1]: http://en.wikipedia.org/wiki/Currying
[3]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/New_in_JavaScript/1.7#Block_scope_with_let_%28Merge_into_let_Statement%29
[4]: http://benalman.com/news/2010/11/immediately-invoked-function-expression/
