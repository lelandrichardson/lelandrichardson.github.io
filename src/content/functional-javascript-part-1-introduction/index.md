---
title: "Functional JavaScript, Part 1: Introduction"
date: "2014-04-14T07:00:00.000Z"
draft: false
---

## Introduction

JavaScript is a powerful, but misunderstood language. People like to say that it _is_ an object oriented programming language, or that it _is_ a functional language. Others like to say that it _isn't_ an object oriented programming language, or that it _isn't_ a functional language. One could say it's sorta both&mdash;and also neither&mdash;but let's set that debate aside for now.

> Let us pretend we are on a mission: a mission to write JavaScript using as many principles from Functional Programming as the language allows.

This series of posts is meant to take you on that journey with me. First, we need to clear up some incorrect conceptions about Functional Programming that might currently be in your head.

### Functional Programming is (largely) Misunderstood in JS-land

Obviously there is a sizable group of developers that use functional paradigms in JavaScript day in and day out. I would say there is a much _larger_ group of JavaScript developers that just don't really understand what that means.

I believe this is a result of the fact that most languages used for server-side web development have roots in C, which most would agree is _not_ a functional programming language.

There seem to be two levels of confusion. The first level of confusion can be demonstrated by the following example of what might be considered common use of jQuery:

```js
$(".signup").click(function(event) {
  $("#signupModal").show();
  event.preventDefault();
});
```

Hey, look at that. We passed in an anonymous function as an argument, otherwise known in the JavaScript world as the infamous "callback" function.

Some might call this functional programming. Is it? **Not at all!**

This example _is_ demonstrating one key feature of functional languages: functions as parameters. On the other hand, this example _also_ goes against almost every other paradigm of functional programming that one can possibly go against in a 3 line example.

The second level of confusion is a bit more subtle. Reading this, several trendy JS developers are thinking to themselves:

> Well, duh! But I already know all about functional programming. I use Underscore.js in _all_ my projects.

[Underscore.js][1] is a wildly popular JavaScript library used all over the place. For the sake of example, let's say I have a set of words, and I need the corresponding set of the first two characters of each word. This is pretty straight-forward to do with Underscore.js:

```js
var firstTwoLetters = function(words) {
  return _.map(words, function(word) {
    return _.first(word, 2);
  });
};
```

> See! Look at that JavaScript voodoo. I'm using these fancy functional utility functions like `_.map` and `_.first`. What do you have to say to THAT, Leland?

Although underscore and functions like `_.map` are useful functional paradigms, the way in which these are put together in this example just seem... verbose and hard to comprehend to me. Do we really need all this?

If we start thinking of things just a little bit more "functionally", perhaps we can take the above example and turn it into this:

```js
// ... a little bit of magic
var firstTwoLetters = map(first(2));
```

If you think about it, all of the same information is contained in this one line, as in the 5 lines above. `words` and `word` are just parameters/placeholders. The real meat of the logic is in combining the function `map`, the function `first`, and the constant `2` in a meaningful way.

Some of you may be looking at this example and thinking what this "little bit of magic" is. After all, putting any example with a "a little bit of magic" comment above it is like... kind of cheating, isn't it?

Well, I'm gonna spend the next couple of posts explaining that "little bit of magic", so if you're at all intrigued, please continue on.

This series of blog posts is here to help others learn how to borrow some of the beauty of functional programming languages in the context of JavaScript.

In the next post, I will discuss the various elements of the JavaScript language that _are_ functional, as well as those that aren't. With this knowledge, we will slowly piece together some of the fundamental building blocks of functional programming, and what they look like in JavaScript.

### Up Next -> [Part 2: What makes a language "functional"?](/functional-javascript-part-2-what-makes-a-language-functional/)

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

### Translations of this article:

- [Russian][4]

[1]: http://underscorejs.org/
[4]: http://habrahabr.ru/post/229893/
