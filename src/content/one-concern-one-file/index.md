---
title: "One Concern, One File"
date: "2015-05-19T07:00:00.000Z"
draft: false
---

Most of us are aware of the notion of having a "Separation of Concerns". It's one of the holy truths of computer science. An unbreakable law: something we mustn't ever question, only follow.

It's a good rule.

There _are_ some things about this rule that I think are up to interpretation though. It's not that I want to break the rule. I just want to explore it a little bit. That's what this post is about.

## Let's talk about MVC

The MVC (Model View Controller) pattern is everywhere these days. I mean _everywhere_. Even if something isn't following a pattern even remotely close to MVC, library authors will try and somehow map elements of their library on to those three letters in hopes that someone might be fooled into thinking it's as well thought out as the one design pattern to rule them all: MVC.

When people talk about "separation of concerns", the MVC pattern is often brought up. In this context, it often means separating things such as "business logic" from other things like "presentation logic". Hence, the "Model" stays separate from the "View". The "Controller", for the most part, determines where the other two come from, and how they interact.

There is something that is particularly frustrating to me that comes about when using the MVC design pattern: the number of files I have to create to do _one_ thing.

Let's assume for a moment that I am building a web site and need to create a new entity called a "post". I crack open my editor and create a couple of new files. After a minute or so, my folder structure might look something like this:

    - Server
    - Models
        Post.js
    - Views
        Post.ejs
    - Controllers
        Post.js

_Note: For the sake of example, I'm assuming this is something like a node app with js files on the server, but it doesn't make any real difference for this post. Most environments will map to the same files, just different extensions._

So we just created **three** files for our **one** new thing: the Post entity.

Just to be clear, I don't have a problem with having a bunch of files in a project... Small, clean, concise, clear files are always a plus. What seems problematic though is that all of these files are _deeply_ coupled together. If I want to make a change in one, I will likely have to make a change in the others. That leaves a bit of a bad taste in my mouth.

According to MVC we are doing everything right... but we aren't done implementing our "post" yet...

We will be generating HTML here, and we don't want to have a bunch of inline styles so we go ahead and create a `Styles/Post.css` file.

We have to keep up with the trends and make our "post" fancy and interactive, so of course at some point we are going to plop some JS onto the page; let's go ahead and create a `Scripts/Post.js` file.

We know that our controller code is supposed to be minimal, so we make sure and move that code into a repository and create a `Repositories/Post.js` file.

So just to recap, our project may look a little closer to this now:

    - Server
      - Repositories
          Post.js
      - Models
          Post.js
      - Views
          Post.ejs
      - Controllers
          Post.js
    - Client
      - Scripts
          Post.js
      - Styles
          Post.css

This is getting a little crazy, right?

Now of course, this is just one entity/piece (one might say... "concern") of our project. We will have many more, and chances are each one might have _at least_ this many files associated with it.

### Let's make a quick change

Consider an example where we added on a field to our "post" entity, and need to update our application to display it. What kind of change would we need to make?

1. Update the `Repositories/Post.js` file so that it included the `image` property in the data query.
2. Update the `Models/Post.js` file so that the model included the `image` property.
3. Update the `Views/Post.ejs` file so that it actually renders the included image now.
4. Update the `Scripts/Post.js` file to have some cool hover effect over the image, because why not?
5. Update the `Styles/Post.css` file to include some new basic styling for the image.

Whoa. We just had to update almost every file in our project! The controller, assuming it was properly designed, was the one thing we didn't really have to change.

That's kind of excessive, isn't it? I mean, what happened to "separation of concerns"? Was adding our "image" property really such a huge refactor that it required us to change every file in our project?!

## Are we separating by the wrong concerns?

I have often heard some people remark about how brilliantly the MVC pattern worked for them, and that they had such good separation of concerns that they once had to completely change their underlying data store technology and only had to change one file (or just a few files, or something like that).

We should optimize the ease with which we can make common everyday feature changes, since that's what we as developers will be doing every day. It's not a perfect metric, but the lower we can get to the average number of files needing to be changed by implementing a new feature or tweak, the better off we probably are.

## What about Flux?

This problem isn't unique to MVC. For instance, the Flux design pattern that is being pushed a lot in the React community has similar symptoms. In a flux application, I might have a file structures like the following:

    - Server
      - API
          Post.js
    - Client
      - Actions
          PostActions.js
      - Stores
          PostStore.js
      - Components
          Post.js
      - Styles
          Post.css

In this scenario, I still have many files across a single entity. Implementing a single feature will often lead to me needing 4-5 different files open... I might add an action, subscribe to it in my store, update my component's render, add some CSS, and finish it all off with an API call... each in different files. I think on average it may be better than our MVC example, but it's still not perfect.

## How can we make it better?

Let's pretend for a moment that you buy into this whole "just one file" idea, or at least you are interested enough that you've read this far. Well, what's the next step then?

## Step 1: Components

First, we stop writing HTML. Let's write JSX instead. It looks almost identical, but has magical powers that HTML doesn't have (hint: JavaScript). Components are easily separable into composable containers that are smart instead of dumb (like partial string-based templates are).

Most importantly, this rids us entirely of the need of models and view models. Our models are now all of a sudden just our actual data, and our view models are just our view. There's no implicit coupling. Logic is just logic, and it's right there in plain sight. And we have all of the composable powers of JavaScript at our fingertips.

Result: Our `Scripts/Post.js` file and our `Views/Post.ejs` file have now become one.

## Step 2: CSS in your JS

If you haven't looked at the [CSS in JS presentation by Christopher Chedeau](https://speakerdeck.com/vjeux/react-css-in-js) (@vjeaux) at Facebook, you should take some time to look at it. There is a whole set of problems that CSS has that are difficult to scale, and using JavaScript with inline styles solves a lot of them. To get around these failures, we have some conventions like the BEM syntax, but in the end it's just a bandaid over a huge gaping flesh wound causing severe internal bleeding.

Bringing our styling into JS actually fixes a lot (if not all) of these issues. And we don't actually have to change our habits that much.

For instance, the way we do things like now might look kinda like this:

```css:title=FooComponent.css
.foo-component {
  padding: 10px;
  background-color: red;
}
.foo-component-inner {
  width: 80px;
  border: 1px solid #000;
}
```

```js:title=FooComponent.js
module.exports = React.createClass({
  render() {
    return (
      <div class="foo-component">
        Foo Component
        <div class="foo-component-inner">Inner</div>
      </div>
    );
  }
});
```

Embracing component styling from within JS, we might instead have something that looks like this:
  


```js:title=FooComponent.js
var styles = {
  outer: {
    padding: 10,
    backgroundColor: "red"
  },
  inner: {
    width: 80,
    border: "1px solid #000"
  }
};

module.exports = React.createClass({
  render() {
    return (
      <div style={styles.outer}>
        Foo Component
        <div style={styles.inner}>Inner</div>
      </div>
    );
  }
});
```

If you've been a web developer for a long time, you might first see this and cringe&mdash;but try to avoid your gut reaction for a minute and look at this objectively. Although there are still valid concerns for bringing all styles into JS-land, this new approach gives us several advantages.

1. Scope: We know, with absolute certainty, that these styles aren't used elsewhere
2. Semantically speaking, this actually reads more clearly (ie, it makes more sense for styles to go into a `style` property, rather than a `class` property).
3. Now that we are in JS-land, we can create/mix/compute styles with the full power of javascript behind us!
4. Removed global
5. We've eliminated a file! No mare needing to switch between these two coupled files

## Step 3: Data Retrieval in your View

Somewhere along the line, the world decided that data retrieval needed to stay as far away from the UI as possible. Let's play devil's advocate for a minute and question this.

Let's continue our post example from above. A dumb, simple `Post` component in React might look like the following:

```js:title=PostComponent.js
var Post = React.createClass({
  render() {
    var post = this.props.post;
    return (
      <div>
        <h1>{post.title}</h1>
        <h4>by {post.author.name}</h4>
        <div>{post.body}</div>
      </div>
    );
  }
});
```

Great. Nice and simple.

This component has some pretty dramatic coupling to our server though. In order for this component to work, we are assuming that a "post" object handed to us from the server is going to have a `title` and `body` property, as well as an `author` property which itself will have a `name` property.

Those requirements are not explicitly passed on to the server anywhere, so instead the developer must keep these requirements in their head as they are implementing things.

Because "data retrieval" has historically been considered a concern that should be pretty much as far away from the UI as possible, these data contracts are things that we usually and up dealing with _all the time_ as developers. As a result, whenever we decide that we want to add something to the UI that requires more data, we have to walk all the way down the stack to make sure that every layer along the way has that field properly included.

Consider this: let your component _declare_ it's data requirements, and do the data retrieval itself.

This is precisely what the "Relay" framework that Facebook is planning on open sourcing seems to be addressing. We can actually declare where the data is going to come from in our post component with syntax like the following:

```js:title=PostComponent.js
var Post = React.createClass({
  render() {
    var post = this.props.post;
    return (
      <div>
        <h1>{post.title}</h1>
        <h4>by {post.author.name}</h4>
        <div>{post.body}</div>
      </div>
    );
  }
});

module.exports = Relay.createContainer(Post, {
  queries: {
    post: graphql`
            Post {
                title,
                body,
                author {
                    name
                }
            }
        `
  }
});
```

The exact syntax here isn't really as important as the general idea. This allows us to effectively get rid of our "Stores" in Flux, and our Repository + Model in our MVC example, and instead just have our component declare its data needs directly.

A powerful side effect of this strategy is that our data requirements are now as composable as our components.

Let's say our Post component's render method instead looked something like this:

```js
render() {
    var post = this.props.post;
    return (
        <div>
            <h1>{post.title}</h1>
            <UserInfo user={post.author} />
            <div>{post.body}</div>
        </div>
    );
}
```

We now don't know from looking at this file exactly what data is needed in order to display a post, since we are now posting `post.author` into a child `<UserInfo />` component. If the `UserInfo` component decides that it needs more than just the author's name, how will we know? We can actually change the above example to be something like the following:

```js
module.exports = Relay.createContainer(Post, {
  queries: {
    post: graphql`
            Post {
                title,
                body,
                author {
                    ${UserInfo.getQuery("user")}
                }
            }
        `
  }
});
```

Perfect! Now our component's data requirements are a function of its own explicit needs, and any of the needs that its children components required themselves. No error-prone implicit coupling! If the `UserInfo` component is updated to require more data, all of the higher order components that depend on it will automatically update their requirements.

Similar to the CSS example, we see that this approach can have several immediate benefits:

1. We can change the data "contract" for this component and know for sure that it's only affecting this file, and won't break any of our other code.
2. Since Components are composable, we can also have component's data contracts simply reference the data contracts of other
3. We can now minimize the amount of data that our server needs to send us on each request, since we know precisely what data the UI needs to display.
4. We brought more files together!

_Note: I'd like to mention that bringing in these declarations to client-facing JavaScript files does have some potentially troubling security implications, and those issues will still need to be handled purely server-side... which may not be a trivial task_

## Recap

### What I am NOT saying:

I want to be clear that if our project is made up of 4 entities such as `Foo`, `Bar`, `Baz`, and `Biz`, that **I am NOT saying that the resulting file structure should look like this**:

    Foo.js
    Bar.js
    Baz.js
    Biz.js

### What I AM saying:

By moving to a component model, we should strive to have our components be completely self-contained and, ideally, made up of a single file. But thinking in terms of components might actually make our project end up with a larger number of files than a project which did not. The goal is to make it such that those files are not implicitly coupled with one another, and implementing a change in one will not usually necessitate updating a chain of other files.

By moving in data retrieval and styling into the component itself, we actually start to shed a lot of the weight off of the other parts of the app that were a little bit heavier before. The need for the "M" and the "C" in "MVC" might go away entirely...

## What's next?

I really like where I think the development world is heading by embracing UI in terms of components, and I would like to encourage you (the reader) to continue thinking along these lines about how we can make developing applications even nicer by minimizing the coupling between files, even if it goes against established "best practices".
