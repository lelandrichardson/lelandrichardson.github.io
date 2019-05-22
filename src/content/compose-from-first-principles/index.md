---
title: "Compose From First Principles"
date: "2019-05-22T07:00:00.000Z"
draft: false
---

Thousands of Developers from around the world attended Google I/O 2019 earlier this month. It was a particularly exciting I/O for me, as it was the first time Google has talked publicly about Jetpack Compose, the project I was hired to work on in February of 2018.

Compose is an ambitious multi-team effort to reimagine Android's UI Toolkit more than 10 years after the Android Platform launched with the original UI Toolkit.

If you haven't yet watched the [session on Declarative UI Patterns](https://www.youtube.com/watch?v=VsStyq4Lzxo), it is a proper overview of the motivations and goals behind the project, which this post is _not_. If you would like to understand the motivations behind the project before taking the time to read this article, which discusses implementation details, give it a watch!

<iframe
 style="width:100%;height:320px;"
 src="https://www.youtube.com/embed/VsStyq4Lzxo"
 frameborder="0"
 allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
 allowfullscreen
></iframe>

Since we've announced and [open sourced Compose](http://d.android.com/jetpackcompose), it has generated a lot of interest and questions about how it works. I spent some time thinking about what would be the right thing to talk about first.

The goal of this post is to give people a solid mental model around what Compose _does_, and eliminate anything one might think of as "magic". One of the best ways to do this, I think, is to try and construct a simpler version of what we're doing, and incrementally add on to it until we have something that resembles the real thing. In other words, let's try and build Compose starting from nothing but "first principles".

In this post I am not going to try to convince you of the motivations behind this architecture or the project overall; I'm only trying to help explain the _what_ and not the _why_. I'm also assuming that the reader of this post is familiar with the [Kotlin Programming Language](https://kotlinlang.org/docs/reference/) and in particular [Extension Functions](https://kotlinlang.org/docs/reference/extensions.html).

Finally, if it wasn't clear already, _code in this post is not reflective of what code using Compose looks like_.

## UIs are Trees

At its core, Compose is designed to efficiently build _and maintain_ tree-like data structures. More specifically, it provides a programming model to describe how that tree will _change over time_.

This programming model is not entirely new. We've had a lot of inspiration from other frameworks such as [React](https://reactjs.org/), [Litho](https://fblitho.com/), [Vue](https://vuejs.org/), [Flutter](https://flutter.dev/), and more, all of which mostly accomplish the same goal, albeit in slightly different ways.

As we might surmise from the list of frameworks above, one of the more compelling use cases for this type of a system is to build user interfaces (UIs). UIs are typically tree-like data structures that change over time. Moreover, UIs are becoming more and more dynamic and complicated, resulting in demand for a programming model to help tame that complexity.

Compose's runtime does not target a specific type of tree, and is already being used to target several different tree types: Android Views, ComponentNodes, Vectors, TextSpan, and there will likely be more to come.

Instead of focusing on any of these, let’s define a basic tree-like data structure that we can use to make our examples in this article simpler.

We can imagine an extremely basic UI library that has the following types defined:

```kotlin
abstract class Node {
  val children = mutableListOf<Node>()
}

enum class Orientation { Vertical, Horizontal }

class Stack(var orientation: Orientation) : Node()

class Text(var text: String) : Node()
```

Here we just have two primitives: `Stack` and `Text`. In reality, there would probably be more, and they would probably have more properties and methods, etc., but again, we are keeping it simple. In the existing Android toolkit, these would correspond to [`View`](https://developer.android.com/reference/android/view/View) and all of its subclasses, and on the web these would correspond to any [`Element`](https://developer.mozilla.org/en-US/docs/Web/API/Element).

Now we need a way to take a tree of Nodes and render them to pixels on the screen. How this is done isn't important for this article, so let's just assume we have a function of the following shape:

```kotlin
fun renderNodeToScreen(node: Node) { /* ... */ }
```

A "Hello World" in this application might look something like this:

```kotlin
fun main() {
  renderNodeToScreen(Text("Hello World!"))
}
```

Let's move on to a slightly more complex example of a "To Do List" App.

## UI as a Transform Function

A common guiding principle to structuring an application is to separate the concept of a "model" from that of the "UI".

Given our "model" is a list of `TodoItem`s, one way to do this is to create a function that just transforms our list of items into a tree of `Node`s:

```kotlin
fun TodoApp(items: List<TodoItem>): Node {
  return Stack(Orientation.Vertical).apply {
    for (item in items) {
      children.add(Stack(Orientation.Horizontal).apply {
        children.add(Text(if (item.completed) "x" else " "))
        children.add(Text(item.title))
      })
    }
  }
}
```

This can be used to render the UI to the screen in response to your application-specific data model. A working app could look something like:

```kotlin
fun main() {
  todoItemRepository.observe { items ->
    renderNodeToScreen(TodoApp(items))
  }
}
```

Adding nodes to the children of the parents explicitly like we are doing in `TodoApp` can add some complexity. For all nodes in the tree, we have to make sure we can access the `children` property of the parent `Node` and call `children.add(...)`. This was easy enough to do in this example, but as the logic of the function gets larger, this might become hard to juggle.

One thing we can do is create a "holder" object that holds on to the current "parent" `Node`. Then we can have an “emit” function which will add nodes to the parent, but also allow you to provide a "content" lambda with the `Node` you passed in set as `current`. The word "emit" is being used here to describe that we are storing a node at this "position" in the tree, without having to know exactly which node we are adding it to.

We are going to do more with this context object later, and semantically it is helping us "compose" the tree, so let's call it a `Composer`. We can define it with the following interface:

```kotlin
interface Composer {
  // add node as a child to the current Node, execute
  // `content` with `node` as the current Node
  fun emit(node: Node, content: () -> Unit = {})
}
```

```kotlin
// naive implementation. feel free to skip.
class ComposerImpl(root: Node): Composer {
  private var current: Node = root

  override fun emit(node: Node, content: () -> Unit = {}) {
    // store current parent to restore later
    val parent = current
    parent.children.add(node)
    current = node
    // with `current` set to `node`, we execute the passed in lambda
    // in the "scope" of it, so that emitted nodes inside of this
    // lambda end up as children to `node`.
    content()
    // restore current
    current = parent
  }
}
```

Using this new abstraction, we can rewrite our `TodoApp` function as an [extension function](https://kotlinlang.org/docs/reference/extensions.html) on `Composer`:

```kotlin
fun Composer.TodoApp(items: List<TodoItem>) {
  emit(Stack(Orientation.Vertical)) {
    for (item in items) {
      emit(Stack(Orientation.Horizontal)) {
        emit(Text(if (item.completed) "x" else " "))
        emit(Text(item.title))
      }
    }
  }
}
```

And then we create a top-level function called `compose` which creates a `Composer`, runs a lambda with it as the [receiver](https://stackoverflow.com/questions/45875491/what-is-a-receiver-in-kotlin), and then returns the root node:

```kotlin
fun compose(content: Composer.() -> Unit): Node {
  return Stack(Orientation.Vertical).also {
    ComposerImpl(it).apply(content)
  }
}
```

And whenever we want to render our UI based on the items we have, we can run the following:

```kotlin
// render UI
renderNodeToScreen(compose { TodoApp(items) })
```

With this new abstraction, it is also easy to pull out parts of our UI into smaller functions:

```kotlin
fun Composer.TodoItem(item: TodoItem) {
  emit(Stack(Orientation.Horizontal)) {
    emit(Text(if (item.completed) "x" else " "))
    emit(Text(item.title))
  }
}

fun Composer.TodoApp(items: List<TodoItem>) {
  emit(Stack(Orientation.Vertical)) {
    for (item in items) {
      TodoItem(item)
    }
  }
}
```

This type of easy decomposition--or factoring of common bits of UI logic into functions--is a critically important feature. We can call each of these functions "Components".

## Positional Memoization

Someone performance-conscious might see the above code and point out that we are creating a completely new tree every time we run `compose`. For large applications, this will create a lot of unnecessary allocations on each successive pass. From a correctness standpoint, it also means that if any of those nodes have any private state, it will not be preserved each time we rebuild the hierarchy.

There are several ways to go about fixing this, but Compose utilizes a technique we call “Positional Memoization”. Much of Compose’s architecture is built around this concept, so let’s try to build up a solid mental model of how it works.

In the last section, we introduced a `Composer` object which holds the context of where we are in the tree and what node we're currently emitting into. Our goal is to preserve the programming model we had above, but try and reuse the nodes that we had created in the previous execution of the UI instead of creating new ones on each execution. Essentially, we want to cache each node.

Most caches require keys--some way of identifying which object you're wanting to retrieve the cached result of. In the example above we can see that every time we execute the `TodoApp` function, we create the same exact number of `Nodes` each time, and in the same order. If we assume that we want to cache each node, it follows that we will consult the cache in the same exact order every time the function is executed (_this logic breaks down if we introduce any conditional logic into our app, but we'll get to that later_).

As a result, if we utilize _execution order_ as the cache key, we can avoid the lookup cost entirely; we can just use a flat list or array to hold the nodes, resulting in retrieval being very cheap. We can just keep track of a "current index" while we execute the app transform function and increment it every time we retrieve a value.

As a simple implementation of this, consider the following `memo` method being added to the `Composer` class above:

```kotlin
interface Composer {
  /* emit(...) excluded for brevity */

  // Compare each input with the previous value at this position. If any
  // have changed, return result of factory, otherwise return previous result
  fun <T> memo(vararg inputs: Any?, factory: () -> T): T
}
```

```kotlin
// naive implementation. feel free to skip
class ComposerImpl: Composer {
  private var cache = mutableListOf<Any?>()
  private var index = 0
  private val inserting get() = index == cache.size
  private fun get(): Any? = cache[index++]
  private fun set(value: Any?) {
    if (inserting) { index++; cache.add(value); }
    else cache[index++] = value
  }

  private fun <T> changed(value: T): Boolean {
    // if we are inserting, we have nothing to compare against,
    // so just store it and return
    return if (inserting) {
      set(value)
      false
    } else {
      // get current item, increment index. always store new
      // value, but return true only if they don't compare
      val index = index++
      val item = cache[index]
      cache[index] = value
      item != value
    }
  }

  private fun <T> cache(update: Boolean, factory: () -> T): T {
    // if we are asked to update the value, or if it is the first time
    // the cache is consulted, we need to execute the factory, and save
    // the result
    return if (inserting || update) factory().also { set(it) }
    // otherwise, just return the value in the cache
    else get() as T
  }

  override fun <T> Composer.memo(vararg inputs: Any?, factory: () -> T): T {
    var valid = true
    // we need to make sure we check every input, every time. no short-circuiting.
    for (input in inputs) {
      // it is not valid if any of the inputs have changed from last time
      valid = !changed(input) && valid
    }
    return cache(!valid) { factory() }
  }
}
```

Here we are just using a plain `MutableList`, but in Compose we are using a [Gap Buffer](https://en.wikipedia.org/wiki/Gap_buffer) with a flat `Array` in order to keep lookups, insertions, and deletions as cheap as possible.

Note that `memo` will increment the cache index `n+1` times when it is called with `n` inputs. This relies on the expectation that it will be called with the same number of inputs each time it is called for a given “position”, or else the cache could get misaligned over time.

With this `memo` function, we are able to change our previous `TodoApp` example to now take advantage of memoization:

```kotlin
fun Composer.TodoItem(item: TodoItem) {
  emit(memo { Stack(Orientation.Horizontal) }) {
    emit(
      memo(item.completed) {
        Text(if (item.completed) "x" else " ")
      }
    )
    emit(
      memo(item.title) {
        Text(item.title)
      }
    )
  }
}

fun Composer.TodoApp(items: List<TodoItem>) {
  emit(memo { Stack(Orientation.Vertical) }) {
    for (item in items) {
      TodoItem(item)
    }
  }
}
```

Now, every time we run `compose`, the nodes in the tree are reused unless they change. However, since we are using execution order to memoize, the amount of memory that we are using remains unchanged, and our programming model remains unchanged as well.

In the current example, an entire node is either memoized or not, but we can actually start to memoize individual properties of a node, provided they are mutable.

For instance, consider the fact that `text` is a mutable property of `Text`:

```kotlin
class Text(var text: String) : Node()
```

Because of this, we can reuse Text nodes, just updating the `text` attribute when it changes. To do this, we want a slightly different signature of `emit`:

```kotlin
interface Composer {
  /* emit(..) and memo(...) excluded for brevity */

  fun <T: Node> emit(
          factory: () -> T,
          update: (T) -> Unit = {},
          block: () -> Unit = {}
  )
}
```

```kotlin
// naive implementation. feel free to skip.
class ComposerImpl(val root: Node) : Composer {
  override fun <T: Node> emit(
          factory: () -> T,
          update: (T) -> Unit = {},
          block: () -> Unit = {}
  ) {
    val node = memo(factory)
    update(node)
    emit(node, block)
  }
}
```

In this version of `emit`, we pass a `factory` function, which `emit` memoizes to create the `Node` itself. Then, the `update` function is called with the current `Node` instance. The `update` lambda can run code that uses `memo` to update only the properties that have changed.

For instance, the `TodoItem` component can be rewritten as:

```kotlin
fun Composer.TodoItem(item: TodoItem) {
  emit({ Stack(Orientation.Horizontal) }) {
    emit(
      { Text() }
      { memo(item.completed) { it.text = if (item.completed) "x" else " " } }
    )
    emit(
      { Text() }
      { memo(item.title) { it.text = item.title } }
    )
  }
}
```

So to enable optimum reuse, we can memoize each property individually, and reuse `Node` instances across every `compose` call.

The keen reader might look at this and notice that there is a problem with this approach of memoizing based on execution order. This seems to break down when we introduce any type of control flow into our transform functions. For example, consider the following `TodoApp` function:

```kotlin
fun Composer.TodoApp(items: List<TodoItem>) {
  emit({ Stack(Orientation.Vertical) }) {
    for (item in items) {
        TodoItem(item)
    }
  }
  val text = "Total: ${items.size} items"
  emit(
      { Text() },
      { memo(text) { it.text = text }}
  )
}
```

In this example, if we had 2 items the first time the app composed, and 3 items the second time, what would happen?

The first two items would memoize correctly. The previous execution had the same two items, which means the cache was consulted the same exact number of times with the same values. No issue.

The interesting thing is what happens when we get to the third `TodoItem`. The previous execution only had two items, so when we get to the third item in the list, we start to consult the cache on top of what was previously used for the `Text` node with `"Total: ${items.size} items"` as its text, since that was the next node in the cache. Furthermore, when we get to that `Text` node, the cache won't have the values from the previous execution to consult, so we'll allocate a new `Text` node.

Essentially, any time there is any control-flow that causes the number of items cached in the list to change, or the order in which they're executed to change, our cache could get "misaligned", and we will have undefined behavior.

To fix this, we need to introduce another fundamental concept to “Positional Memoization”: Groups.

```kotlin
interface Composer {
  /* emit(...) and memo(...) excluded for brevity */

  // start a group, execute block inside that group, end the group
  fun group(key: Any?, block: () -> Unit)
}
```

I'm going to leave the implementation of this out of this blog post. In reality, implementing this correctly is [quite complicated](https://android.googlesource.com/platform/frameworks/support/+/f06c7ce26e29f15792b54490e4c2f77197d1222f/compose/runtime/src/main/java/androidx/compose/Composer.kt#592) and I think explaining it in full would distract from the post.

This concept complicates the implementation of the memoization cache of the composer, but it is critical for Positional Memoization to work correctly. Essentially, a group is what turns the linear cache into a tree-like structure, where we can then identify when nodes in that tree have been moved, removed, or added.

The `group` method is expected to have a key passed into it. This key will be cached in the cache array just like inputs to `memo`, but when it doesn't match the key from the previous execution, the runtime will seek through the cache to determine if the group has been moved, removed, or is a new group to be inserted.

Note that the key of the group is only scoped to the immediate parent group, so there is no need for keys to be globally unique, just unique among its siblings. Now if we want to correctly use groups in our TodoApp example, we might end up with something like:

```kotlin
fun Composer.TodoItem(item: TodoItem) {
  group(3) {
    emit({ Stack(Orientation.Horizontal) }) {
      group(4) {
        emit(
          { Text() }
          { memo(item.completed) { it.text = if (item.completed) "x" else " " } }
        )
      }
      group(5) {
        emit(
          { Text() }
          { memo(item.title) { it.text = item.title } }
        )
      }
    }
  }
}

fun Composer.TodoApp(items: List<TodoItem>) {
  group(0) {
    emit({ Stack(Orientation.Vertical) }) {
      for (item in items) {
          group(1) {
              TodoItem(item)
          }
      }
    }
  }

  val text = "Total: ${items.size} items"
  group(2) {
    emit(
        { Text() },
        { memo(text) { it.text = text } }
    )
  }
}
```

In this case, we’ve just assigned unique integers as the keys to each group. Importantly, we’ve also surrounded the call to `TodoItem` with a group here, which will ensure that each TodoItem is memoized independently.

Now, when the size of `items` changes from 2 to 3, we know to “add” items into the cache instead of look at the part of the cache that is ahead, since that would be outside of the group we are in. The same goes for cases where items are removed from the cache.

Items that “move” are similarly handled, although the algorithm to do so is a bit more complex. We won’t be getting into this in detail, but the important bit to understand is that we track “moves” in a group based on the key of the child group. If we shuffled the `items` list in this example, the fact that each TodoItem call is surrounded by a group with key `1` means that the Composer has no way of knowing that the order of the items changed. This isn’t fatal, it just means that the number of changes that are memoized is unlikely to be minimal, and any state that was associated with the item may now be associated with a different item. We could, however, use the `item` itself as the key:

```kotlin
for (item in items) {
  group(item) {
    TodoItem(item)
  }
}
```

Now, each group and the contained set of cached values in that group will move along with the items, and then `TodoItem` will get called with the memoization cache of the same group from the previous compose, increasing the likelihood that the changes are minimal, despite the added cost of moving the cached items around.

I will get into more detail in a future post about how these types of keys can be declared with the `@Pivotal` attribute.

## State

The examples so far have shown a UI that can be represented as a simple transform or projection of data. The reality is that most UIs end up with several pieces of state that don’t make any sense as part of the overall data model, but instead are specific to the UI itself (i.e., “view state”). For example, it would be inconvenient if state such as text selection, scroll position, focus, dialog visibility, etc. all had to be part of your domain-specific data model. This state is the concern of the UI, and nothing more.

Compose needs to have a state model that handles this "local state" use case. This model might be best understood if we try and build it up from the concepts we’ve discussed so far with Positional Memoization.

To discuss state, let’s consider a different example of a simple counter UI with a “count”, an “Increment” button, and a “Reset” button. To start out, we can imagine trying to have state by just using a top-level `count` variable referenced lexically:

```kotlin
var count = 0

fun Composer.App(recompose: () -> Unit) {
  emit({ Text() }, { memo(count) { it.text = "$count" } })
  emit({ Button() }, { it.text = "Increment"; it.onClick = { count++; recompose(); } })
  emit({ Button() }, { it.text = "Reset"; it.onClick = { count = 0; recompose(); } })
}

fun main() {
  var recompose: () -> Unit = {}
  recompose = {
      renderNodeToScreen(compose { App(recompose) })
  }
  recompose()
}
```

Since we are using global state, if this component is used in multiple places the state will be shared across all usages. Though this can be useful in some situations, it’s usually not what we want. We want to be able to create an “instance” of count that can be used locally to the “instance” of App across compositions ("instance" is in quotes here, because there isn't actually an "instance" of App in the OOP sense--it's just a function).

How can we do this in Compose?

The most basic thing to try is to move count into App as a local variable:

```kotlin
// NOTE: This example does NOT work
fun Composer.App(recompose: () -> Unit) {
  var count = 0

  emit({ Text() }, { memo(count) { it.text = "$count" } })
  emit({ Button() }, { it.text = "Increment"; it.onClick = { count++; recompose(); } })
  emit({ Button() }, { it.text = "Reset"; it.onClick = { count = 0; recompose(); } })
}
```

This doesn’t work because the variable `count` will get re-initialized to zero every time the function gets invoked.

Note that this is remarkably similar to how the nodes used to get recreated every time the function was called, where we utilized positional memoization to fix that. It turns out that here we can do the exact same thing for local state!

```kotlin
class State<T>(var value: T)

fun Composer.App(recompose: () -> Unit) {
  val count = memo { State(0) }

  emit({ Text() }, { memo(count.value) { it.text = "${count.value}" } })
  emit({ Button() }, { it.text = "Increment"; it.onClick = { count.value++; recompose(); } })
  emit({ Button() }, { it.text = "Reset"; it.onClick = { count.value = 0; recompose(); } })
}
```

Now that we are using `memo`, the instance of `State` will be the same for every subsequent call of the function (but unique to its position in the UI tree). We can then mutate it and trigger a recomposition for the hierarchy so that the screen reflects the new value of the `State` instance.

## The `@Composable` Annotation

OK, so we've gotten pretty far in being able to build our App's UI using these `Composer` [extension functions](https://kotlinlang.org/docs/reference/extensions.html). That said, we've managed to _really_ complicate just a basic UI in order to make this approach efficient and robust.

All of the boilerplate that we've added could have been added systematically. We could follow a simple formula or set of rules and add this boilerplate correctly without knowing anything about the specific application.

As a result, it is reasonable to have the compiler generate this code for us. Compose introduces an `@Composable` annotation which does exactly that. In particular, this annotation has the following effects:

1. All calls to the constructor of a `Node` subclass inside of the function into a corresponding `emit` call with mutation of any of its properties surrounded with a `memo` call.
2. Any other functions marked with `@Composable` that are called in the body of the function are surrounded by a group. The key of each group will be compiled as an integer that is unique to the _source location_ of the call site.
3. All `emit` calls in the body of the function are _also_ surrounded by a group. Likewise, the key of each group will be compiled as an integer that is unique to the _source location_ of the call site.
4. The function receives an extra implicit `Composer` as a parameter, instead of requiring it be a Composer extension function. This is possible because the only code that used the `Composer` is now implicit because of (1) and (2).
5. It means that it can _only_ be invoked from within another `@Composable` function. This is required for (3) to work since we have to pass in the `Composer` object implicitly at the point of invocation.

Given these effects, we can see that the above `App` function would turn into:

```kotlin
class State<T>(var value: T)

@Composable fun App(recompose: () -> Unit) {
  val count = memo { State(0) }

  Text("${count.value}")
  Button(text = "Increment", onClick = { count.value++; recompose(); })
  Button(text = "Reset", onClick = { count.value = 0; recompose(); })
}
```

Similarly, the `TodoApp` function from above could become:

```kotlin
@Composable fun TodoItem(item: TodoItem) {
  Stack(Orientation.Horizontal) {
    Text(if (item.completed) "x" else " ")
    Text(item.title)
  }
}

@Composable fun TodoApp(items: List<TodoItem>) {
  Stack(Orientation.Vertical) {
    for (item in items) {
      TodoItem(item)
    }
  }
  Text("Total: ${items.size} items")
}
```

That simplifies things considerably. The goal here is that while the `@Composable` annotation implies some amount of machinery around their invocations, it should not drastically alter the mental model someone has around what happens when invoking a function. This is analogous to the machinery that is required to implement `suspend` functions and Coroutines in Kotlin. We could write the same code using Futures, but if we can create a consistent mental model around what `suspend` means, then we can fit it into the language and reduce a significant amount of boilerplate.

With this mapping of `@Composable` invocations to the faux Compose runtime we have just built, you should have a solid understanding of what `@Composable` actually does and some of the design decisions that Compose has taken to end up where it is today.

There's still a lot more to cover, but I think that's more than enough for one post. There are several things Compose is doing or planning to do that are not covered in this post:

- How `@Model` works
- Deferral and parallelization of composable functions
- Skipping the execution of composable functions when they memoize
- Invalidating/recomposing specific sub-hierarchies of the tree
- Having @Composable functions that target different types of trees with compile-time safety
- Optimizing away comparisons of expressions we can determine will never change

All potential future topics!

Let me know if this blog post helped you better understand Compose or not. If it didn't, let me know what was confusing!

Have followup questions? [You can find me on Twitter](https://twitter.com/intelligibabble)!

Interested in Compose and want to chat with others about it? Stop by the `#compose` channel on the [Kotlin Slack](https://kotlinlang.slack.com/) ([get an invite](https://surveys.jetbrains.com/s3/kotlin-slack-sign-up?_ga=2.224677786.102200139.1558201416-402641717.1556213862))
