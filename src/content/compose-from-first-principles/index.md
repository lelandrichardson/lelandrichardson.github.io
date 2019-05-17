---
title: "Compose From First Principles"
date: "2019-05-13T07:00:00.000Z"
draft: true
---

Last week was the week of Google I/O 2019. It was a particularly exciting I/O for me, as it was the first time Google has talked publicly about Jetpack Compose, the project I was hired to work on in February of 2018.

Compose is an ambitious multi-team effort to reimagine Android's UI Toolkit more than 10 years after the Android Platform launched with the original UI Toolkit.

If you haven't yet watched the [session on Declarative UI Patterns](https://www.youtube.com/watch?v=VsStyq4Lzxo), you should do that now. It is a proper overview of the motivations and goals behind the project, which this post is _not_.

<iframe 
  style="width:100%;height:320px;" 
  src="https://www.youtube.com/embed/VsStyq4Lzxo" 
  frameborder="0" 
  allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" 
  allowfullscreen
></iframe>

Since we've announced and [open sourced Compose](http://d.android.com/jetpackcompose), it has generated a lot of interest and questions about how it works. I spent some time thinking about what the right thing to talk about first would be. There's so much to talk about and a lot of pieces that work together and are hard to understand without the context of the other pieces.

Ultimately, I came to the conclusion of writing this post. There will (hopefully!) be many more blog posts that follow this one that go into depth about more specific topics, but I think it's important to start with a good foundational overview.

The goal of this post is to give people a solid mental model around what Compose _does_, and eliminate anything one might think of as "magic". One of the best ways to do this, I think, is to try and construct a simpler version of what we're doing, and incrementally add on to it until we have something that resembles the real thing. In other words, let's try and build Compose starting from nothing but "first principles".

It's important to say outright that the **details of this post may not be 100% technically accurate**. Even if they were, Compose is so early in its development that it would quickly _become_ inaccurate. Nevertheless, I will do my best to point out places where I'm simplifying things or talking about aspects that are still unimplemented.

todo: indicate that the goal of this blog is not to convince someone of the motivations behind the programming paradigm or the change, but instead to help describe how ir works.

## Underlying Mental Model

At its core, Compose is designed to efficiently build _and maintain_ tree-like data structures. More specifically, it provides a programming model to describe how that tree will _change over time_.

This programming model is not entirely new. We've gotten a lot of inspiration from other frameworks such as Flutter, React, Litho, Vue, and more, all of which mostly accomplish the same goal, albeit in slightly different ways. (todo: link each one)

As one might surmise from the list of frameworks above, one of the more compelling use cases for this type of a system is to build user interfaces (UIs). UIs are typically tree-like data structures that change over time. Moreover, UIs are becoming more and more dynamic and complicated, resulting in demand for a programming model to help tame that complexity.

For Compose, the actual type of the tree does not matter much here. Compose's runtime does not target a specific tree node type, but rather requires that you implement an `ApplyAdapter<N>` interface for any type of tree node base class `N`.

```kotlin
interface ApplyAdapter<N> {
    fun N.insertAt(index: Int, instance: N)
    fun N.removeAt(index: Int, count: Int)
    fun N.move(from: Int, to: Int, count: Int)
}
```

These three operations are really all that we need to manage a tree. Compose is already being used to target several different tree types: Android Views, ComponentNodes, Vectors, TextSpan, and there will likely be more to come.

Rather than go into details about how this generalism is achieved, lets define a basic tree-like data structure that we can use for the purposes of this blog post.

We can imagine an extremely simple UI library that had the following types defined:

```kotlin
abstract class Node {
   val children = mutableListOf<Node>()
}

class Box : Node()

class Text(var text: String) : Node()
```

Here we just have two primitives: `Box` and `Text`. In reality there would probably be more, and they would probably have more properties, but again, we are keeping it simple. In the existing Android toolkit, this would correspond to [`View`](https://developer.android.com/reference/android/view/View) and all of it's subclasses, and on the web this would correspond to any [`Element`](https://developer.mozilla.org/en-US/docs/Web/API/Element).

Now we need a way to take a tree of Nodes, and render their current state to the screen:

```kotlin
fun renderNodeToScreen(node: Node) { /* ... */ }
```

A "Hello World" type application in this application might look something like this:

```kotlin
fun main() = onVsync {
  renderNodeToScreen(Text("Hello World!"))
}
```

Of course we have glossed over a lot of complexity that might go into the `renderNodeToScreen` method, but let's just assume that it works and works well. For the purposes of this article, it's implementation is not important.

Let's move on to a slightly more complex example of a "To Do List" App.

## UI as a Transform Function

A practical guiding principle to structuring an application is to separate the concept of a "model" from that of the "UI".

Given our "model" as a set of `TodoItem`s, one way to do this is to create a function that just transforms our list of items into a tree of `Node`s:

```kotlin
fun TodoApp(items: List<TodoItem>): Node {
   return Box().apply {
       for (item in items) {
           children.add(Box().apply {
               children.add(
                   Text("[${if (item.completed) "x" else " "}] ${item.title}")
               )
           })
       }
   }
}
```

This can be used elsewhere in your app to render the UI to the screen in response to your application-specific data model. We can imagine a working app as something like:

```kotlin
fun main() {
  todoItemRepository.observe { items ->
    renderNodeToScreen(TodoApp(items))
  }
}
```

There are a few problems with this approach:

todo: refine these problems

1. **Composability**. It is difficult to break the logic of transforming data into this tree into smaller pieces.
2. **Allocations** UIs can often have very large trees, but only small parts of them change dynamically
3. **Allocations** Every time we want to update something, we end up recreating (reallocating) the entire tree

To address some of these issues, lets create an abstraction for “emitting” nodes into a context object, instead of explicitly adding nodes to the children array of the parent.

This context object is helping us "compose" the tree, so let's call it a `Composer`. The simplest implementation of this could be the following:

```kotlin
interface Composer {
  // add node as a child to the current Node, execute
  // `block` with `node` as the current Node
  fun emit(node: Node, block: () -> Unit = {})
}

class ComposerImpl(root: Node): Composer {
  private var current: Node = root

  override fun emit(node: Node, block: () -> Unit = {}) {
    val parent = current
    parent.children.add(node)
    current = node
    block()
    current = parent
  }
}
```

Now we can imagine having a function called `compose` with the following shape:

```kotlin
fun compose(block: Composer.() -> Unit): Node {
  return Box().let { ComposerImpl(it).apply(block) }
}
```

Using this new abstraction, we can rewrite our To Do App above:

```kotlin
fun Composer.TodoApp(items: List<TodoItem>) {
   emit(Box()) {
       for (item in items) {
           emit(Text("[${if (item.completed) "x" else " "}] ${item.title}"))
       }
   }
}
```

Now, whenever we want to render our UI based on the items we have, we can run the following:

```kotlin
// render UI
renderNodeToScreen(compose { TodoApp(items) })
```

With this new abstraction, it is also easy to pull out parts of our UI into smaller functions:

```kotlin
fun Composer.TodoItem(item: TodoItem) {
   emit(Text("[${if (item.completed) "x" else " "}] ${item.title}"))
}

fun Composer.TodoApp(items: List<TodoItem>) {
   emit(Box()) {
       for (item in items) {
           TodoItem(item)
       }
   }
}
```

todo: Problems:

- no way to create local state
- allocations, performance

## Positional Memoization

Someone performance conscious might look at the previous example we had and realize that we are creating a completely new tree every time we run `compose`. For large applications, this could create a lot of garbage on each successive pass. Furthermore, it means that if any of those nodes have any private state, the state will get thrown away.

There are several ways one might go about fixing this, but Compose utilizes a technique we are calling “Positional Memoization”. Much of Compose’s architecture is built around this technique, so let’s try to build up a solid mental model of how it works.

In the last section, we introduced a `Composer` object, which held some of the context of where in the tree we were and what node we were emitting into currently. Our goal is to preserve the programming model we had above, but try and reuse the nodes that we had created in the previous execution of the UI. Essentially, we want to cache each node.

Most caches require keys; some way of identifying which object you're wanting to retrieve the cached result of. Assuming we are caching each node in the tree we are creating, in the example above we can see that every time we execute the `TodoApp` function, we will consult the cache in the same exect order every time the function is executed (this logic breaks down if we introduce any conditional logic into our app, but we'll get to that later).

If we utilize _execution order_ as the cache key, we can avoid lookups entirely; we can just use a flat list or array to hold the nodes, which should mean that retrieval is very cheap. We can just keep track of a "current index" while we execute the app transform function and increment it every time we retrieve a value.

As a simple implementation of this, consider the following two methods being added to the `Composer` class we had above:

```kotlin
interface Composer {
  // returns whether current cached item matches the passed in value.
  // If it doesn't, it replaces it in the table. consumes item.
  fun <T> changed(value: T): Boolean

  // return the current item in the cache, if `update` is true or the
  // cache is empty, run `factory`, cache and return result
  override fun <T> cache(update: Boolean, factory: () -> T): T
}

class ComposerImpl: Composer {
  private var cache = mutableListOf<Any?>()
  private var index = 0

  override fun <T> changed(value: T): Boolean {
    val index = index++
    return if (cache.size <= index) {
        cache[index] = value
        false
    } else {
        val item = cache[index]
        cache[index] = value
        item != value
    }
  }

  override fun <T> cache(update: Boolean, factory: () -> T): T {
    return if (update) factory().also { cache[index++] = it }
    else cache[index++] as T
  }
}
```

With these primitives one can create a more general purpose `memo` function:

```kotlin
// Compoare each input with the previous value at this position. If any
// have changed, return result of factory, otherwise return previous result
fun <T> Composer.memo(vararg inputs: Any?, factory: () -> T): T {
   var valid = true
   for (input in inputs) {
       valid = !changed(input) && valid
   }
   return cache(!valid) { factory() }
}
```

Note that `memo` will increment the cache index `n+1` times when it is called with `n` inputs. This means that it has the expectation that it will be called with the same number of inputs each time it is called for a given “position”, or else the cache could get misaligned over time.

With this `memo` function, we are able to change our previous `TodoApp` example to now take advantage of memoization:

```kotlin
fun Composer.TodoItem(item: TodoItem) {
   emit(
       memo(item.completed, item.title) {
           Text("[${if (item.completed) "x" else " "}] ${item.title}")
       }
   )
}

fun Composer.TodoApp(items: List<TodoItem>) {
   emit(memo { Box() }) {
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

Because of this, we can memoize all Text nodes, and just update the `text` attribute when it changes. To do this, we want a slightly different signature of `emit`:

```kotlin
interface Composer {
   fun <T: Node> emit(
           factory: () -> T,
           update: (T) -> Unit = {},
           block: () -> Unit = {}
   )
}
```

In this version of `emit`, we pass a `factory` function, which `emit` memoizes to create the `Node` itself. Then, the `update` function is called with the current `Node` instance. Inside of `update`, we can memoize the setting of the properties of it individually.

For instance, the `TodoItem` component can be rewritten as:

```kotlin
fun Composer.TodoItem(item: TodoItem) {
   val text = "[${if (item.completed) "x" else " "}] ${item.title}"
   emit(
       { Text() },
       { memo(text) { it.text = text }}
   )
}
```

So to enable optimum reuse, we can memoize each property individually, and reuse `Node` instances across every `compose` call.

The keen reader might look at this and notice that there is a problem with this memoization approach. This seems to break down when we introduce any type of control flow into our transform functions. For example, consider the following `TodoApp` function:

```kotlin
fun Composer.TodoApp(items: List<TodoItem>) {
  emit({ Box() }) {
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

The first two items would memoize correctly, but when we encounter the third item, we would start to “memoize” using the `Text` node that was previously used below the list of TodoItems in the first pass! Essentially, any time there is any control-flow that causes the number of items cached in the list to change, everything after that conditional logic would be misaligned with the cache.

To fix this, we need to introduce another fundamental concept to “Positional Memoization”: Groups.

```kotlin
interface Composer {
   // start a group, execute block inside that group, end the group
   fun group(key: Any?, block: () -> Unit)
}
```

I'm going to leave the implementation of this out of this blog post. In reality, implementing this correctly is [quite complicated](https://android.googlesource.com/platform/frameworks/support/+/refs/heads/androidx-master-dev/compose/runtime/src/main/java/androidx/compose/Composer.kt#592) and I think would distract from the post.

This concept complicates the implementation of the memoization cache of the composer, but it is critical for Positional Memoization to work correctly. Essentially, a group is what turns the linear cache into a tree-like structure, where we can then identify when nodes in that tree have been moved, removed, or added.

The `group` method is expected to have a key passed into it. This key will be cached in the cache array just like inputs to `memo`, but when it doesn't match the key from the previous execution, the runtime will seek through the cache to determine if the group has been moved, removed, or is a new group to be inserted.

Note that the key itself of the group is only scoped to the immediate parent group, so there is no need for keys to be globally unique. Now if we want to correctly use groups in our TodoApp example, we might have something like:

```kotlin
fun Composer.TodoItem(item: TodoItem) {
  val text = "[${if (item.completed) "x" else " "}] ${item.title}"
  group(3) {
    emit(
      { Text() },
      { memo(text) { it.text = text } }
    )
  }
}

fun Composer.TodoApp(items: List<TodoItem>) {
   group(0) {
       emit({ Box() }) {
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

Now, each group and the contained set of cached values in that group will move along with the items, and then `TodoItem` will get called with the memoization cache of the same group from the previous compose, increasing the likelihood that the changes are minimal, with the cost of moving the cached items around.

I will talk more in a future post about these types of keys can manifest themselves automatically with the `@Pivotal` attribute.

# State

The examples so far have shown a UI that can be represented as a simple projection of data. The reality is that most UIs end up containing a number of stateful elements that don’t make any sense as part of the overall data model, but instead are specific to the UI itself (ie, “view state”).

Compose’s state model might be best understood if we try and build it up from the concepts we’ve discussed so far with Positional Memoization.

To discuss state, let’s change our app example to a simple counter UI with a “count”, an “Increment” button, and a “Reset” button. To start out, we can imagine implementing this just using a global state object:

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
       renderNodeToScreen(compose { <App recompose /> })
   }
   recompose()
}
```

Here we can see that the App component is using global state, which means that if this component is used in multiple places, the state will be shared across each usage. Though this can be useful in some situations, it’s usually not what we want. We want to be able to create an “instance” of count that can be used locally to the “instance” of App across compositions.

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

Note that this is remarkably similar to how the nodes used to get recreated every time the function was called, but we utilized positional memoization to fix that. It turns out that here we can do the exact same thing for local state!

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

# The `@Composable` Annotation

OK, so we've gotten pretty far in being able to build our App's UI using these `Composer` extension functions. That said, we've managed to really complicate the basic operations though in an effort to make this approach efficient and robust.

---

The above example suffers from the same problems that the memoizations of emits did before we introduced `group` calls around them. If we want to create state inside of control-flow logic, which we do, then we will need to do the same thing here.

```kotlin
val count = group(123) { memo { State(0) } }
```

This feels a bit tiresome to need to do this every time we want to introduce state, and it is also easy to forget and end up with incorrect code, so we have created a way of doing this that is less error-prone, that we call Effects.

Effects are like bound composable function calls that are waiting to be “positionally called”, and the way you call them is with the `+` operator:

```kotlin
class State<T>(var value: T)

@Composable fun App(recompose: () -> Unit) {
   val count = +memo { State(0) }

   <Text text="${count.value}" />
   <Button text="Increment" onClick={ count.value++; recompose(); } />
   <Button; text="Reset" onClick={ count.value = 0; recompose(); }/>
}
```

The `+` operator, similar to the KTX element syntax, takes care of wrapping the call with a group and a key that is unique to the location of the call in source.

As we will see later, Effects can be combined with observable @Model objects to make state really easy to work with in Compose, and remove some syntactic overhead, as well as ensure that a `recompose` function isn’t needed. Thus, our example just becomes:

```kotlin
@Composable fun App() {
   var count by +state { 0 }

   <Text text="$count" />
   <Button text="Increment" onClick={ count++ } />
   <Button text="Reset" onClick={ count = 0 } />
}
```

---

This forms a solid mental model from which we can build on top of to understand Compose in greater detail. The example above can be mapped to Compose directly, although it does not address problems (2) and (3) above, which Compose does and is explained in more detail further into this document.

To transition into the syntax of Compose, let’s perform the following transformations in our head:

The `Composer` receiver parameter we defined in the functions above is actually an implicit context object that the Compose compiler passes around for you. The type of this object is inferred with the `@Composable` annotation
The calls to other @Composable functions are done with a special syntax
The calls to `emit` on the `Composer` object are also done with the same special syntax

Using these mappings, the example above can be rewritten to be:

```kotlin
@Composable fun TodoItem(item: TodoItem) {
   <Text text="[${if (item.completed) "x" else " "}] ${item.title}" />
}

@Composable fun TodoApp(items: List<TodoItem>) {
   <Box>
       for (item in items) {
           <TodoItem item />
       }
   </Box>
}

// render UI
renderNodeToScreen(compose { <TodoApp items /> })
```

As we can see from this example, there is an intentional duality between “emitting” a Node with certain attributes into the Composer and “calling” a function with some parameters which may then “emit” something into the Composer.

We will use this mental model as a basis for understanding Compose. Compose introduces a concept called “Positional Memoization” which is a solution to the problems (2) and (3) posed above. We will talk about it in more detail below, but we will first delve into a few more concepts in the meantime.

This forms a good solution to (1) above, but (2) and (3) are not yet solved. These problems are solved with Compose with Positional Memoization, but is not readily addressed with this simplistic model.

We are going to discuss a few other concepts before jumping into Positional Memoization though.

---

As we can see here, there is quite a bit of ceremony around introducing new groups and keys manually for every single emit and call. Continuing the theme, the KTX element syntax also encompasses the creation of a group with a key. The key chosen is actually an integer that is computed from the unique position of the element in the source code. This is why we call it “Positional Memoization”: the memoization cache is keyed on the position of the element in source code, as well as the call graph. This means that, practically speaking, every element in the source code will have its own unique key that is part of its compilation. By using this position hash, we are able to leverage execution order for memoization while also allowing for conditional logic.

With these groups incorporated into the syntax of a KTX element, we see that our example simplifies down into this:

```kotlin
@Composable fun TodoApp(items: List<TodoItem>) {
   <Box>
       for (item in items) {
           <TodoItem item />
       }
   </Box>
   <Text text="Total: ${items.size} items" />
}
```

todo: things this blog post doesn't talk about...

- deferral/parallelization
- skipping to composables / purity / etc.
- constant folding
- observe scopes / recomposition / invalidation
- composable inference
- gap buffer slot table
