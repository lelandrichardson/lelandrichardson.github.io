---
title: 'Clever way to "demethodize" Native JS Methods'
date: "2014-06-10T07:00:00.000Z"
draft: false
---

Recently I wrote a blog: [Functional JavaScript, Part 3: .apply(), .call(), and the arguments object](/functional-javascript-part-3-apply-call-and-the-arguments-object/)

Taylor Smith ended up making a comment about a piece of code from my tutorial that could be simplified (or shortened, at least):

Taylor said:

> You can simplify this
>
> ```js
> var demethodize = function(fn) {
>   return function() {
>     var args = [].slice.call(arguments, 1);
>     return fn.apply(arguments[0], args);
>   };
> };
> ```
>
> to this
>
> ```js
> var demethodize = Function.prototype.bind.bind(Function.prototype.call);
> ```

This is quite the clever piece of code. And today Louis Lazaris asked for someone to explain it in more detail:

## How it works

---

The original function that I wrote, is a function that accepts a single function as an argument. In return, it gives back a new function which is like the old one, except the arguments are "shifted" to the right by one, and the first argument is now what the old function used to expect as the `this` context variable.

To give an example, let's use [`String.prototype.split`][6].

```js
var test = "abc,def,g";
test.split(",");
//=> ["abc","def","g"]

var split = demethodize(String.prototype.split);
split(test, ",");
//=> ["abc","def","g"]
```

Both my version and taylor's version produce the same results, but why?

Let's look at all of the moving parts. Taylor's function makes use of two prototype methods: [`Function.prototype.bind`][7] and [`Function.prototype.call`][8].

The function signatures for these methods look kinda like:

```js
Function.prototype.call = function(thisArg, ...args) {};

Function.prototype.bind = function(thisArg, ...args) {};
```

So firstly, we are calling `Function.prototype.bind` on _itself_. Since `Function.prototype.bind` is a function, it has itself as one of it's prototype methods. Kind of crazy, I know... but what does that mean?

That means that whatever we pass into the second `.bind`, is going to become the `thisArg` in the first one.

Thus, we could sort of decompose

```js
var demethodize = Function.prototype.bind.bind(Function.prototype.call);
```

is the same as...

```js
var demethodize = function(fn) {
  return Function.prototype.call.bind(fn);
};
```

Note: this is really the clever part. When you run .bind on Function.call, it's similar to shifting the arguments by 1...

is the same as...

```js
var demethodize = function(fn) {
  return function(thisArg, ...args) {
    return fn.call(thisArg, ...args);
  };
};
```

This is written using the `...` notation of ECMAScript 6, since it makes it easier to understand. In reality, this last block of code is the same as:

```js
var demethodize = function(fn) {
  return function() {
    var args = [].slice.call(arguments, 1);
    return fn.apply(arguments[0], args);
  };
};
```

Which you can see is pretty close to my original function.

Pretty cool stuff!

[5]: https://twitter.com/ImpressiveWebs/status/476126258712293376
[6]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/split
[7]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind
[8]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/call
