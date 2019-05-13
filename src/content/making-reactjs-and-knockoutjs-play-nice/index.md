---
title: "Making React.js and Knockout.js Play Nice"
date: "2015-05-18T07:00:00.000Z"
draft: false
---

Choosing a JavaScript framework or library to build a project with is a complicated choice, these days. There's just so much to choose from. There's the new hotness, then there's the old and trusty.

https://twitter.com/iamdevloper/status/540481335362875392

With such a rampant ecosystem of choice and change, there often comes a time where you want to refactor your project from using Framework/Library X to use Framework/Library Y.

For now, I won't make any points as to whether or not making these changes is good or bad or whatever, but instead I'd like to talk about how to make the transition between two particular frameworks easier: React.js and Knockout.js

If you have a large project, making the transition all in one big pull request might not be a feasible option. It's important to allow some sort of middle ground where the two code-bases or technologies can play nice with one another.

## What do we want?

In order for a transition to be successful, you need two things: 1) You need to be able to use Knockout from within the context of React, and 2) You need to be able to use React from within the context of Knockout.

Let's think about what this might look like.

### Using Knockout from within the context of React

React is built in terms of composable `Components`. Ideally, we could have some jump right into "knockout-land" from inside the `render` function of a React component. In "knockout-land", it would be nice if we had access to the `this.props` and `this.state` of "react-land".

For example, we want something like this:

```js
var ToDoList = React.createClass({
  render() {
    return (
      <ul data-bind="foreach: props.todos">
        <li data-bind="text: $data" />
      </ul>
    );
  }
});
```

With JSX, this might not even be much more than copy-and-paste, and update a few variable names.

There are a couple of complications right off the bat, though. React renders to a virtual representation of the DOM, then diff's it from the previous version, then updates the actual DOM with what it found to be different. Knockout on the other hand, works with _actual_ DOM. So we need to actually work with the DOM elements somewhere along the line. We can do this hooking into some lifecycle events.

Naively, doing something like this get's us a little bit closer to reality:

```js
var ToDoList = React.createClass({
  componentDidMount() {
    ko.applyBindings(
      {
        props: this.props,
        state: this.state
      },
      this.getDOMNode()
    );
  },
  render() {
    return (
      <ul data-bind="foreach: props.todos">
        <li data-bind="text: $data" />
      </ul>
    );
  }
});
```

Still, we have a couple of issues. Namely, whenever the props or state update, knockout has no idea it needs to update. Additionally, whenever this component is unmounted, we aren't cleaning up after ourselves very well.

To tidy up after ourselves, we want to use the `ko.cleanNode` function and call it in the `componentWillUnmount` lifecycle method.

```js
var ToDoList = React.createClass({
  componentDidMount() {
    ko.applyBindings(
      {
        props: this.props,
        state: this.state
      },
      this.getDOMNode()
    );
  },
  componentWillUnmount() {
    ko.cleanNode(this.getDOMNode());
  },
  render() {
    return (
      <ul data-bind="foreach: props.todos">
        <li data-bind="text: $data" />
      </ul>
    );
  }
});
```

Now for the trickier part. We could just call `ko.cleanNode` followed by `ko.applyBindings` on the `componentDidUpdate` method, but that seems pretty inefficient.

Knockout actually allows the first parameter of `ko.applyBindings` to be an observable itself, and will update the DOM accordingly. As a result, it's best to just create an observable whose value is set to an object with our props and state, and then we can just update the observable with our props and state change.

We can do this in the `componentDidMount` method and then update in the `componentDidUpdate` method:

```js
    updateKnockout() {
        this.__koTrigger(!this.__koTrigger());
    },
    componentDidMount() {
        this.__koTrigger = ko.observable(true);
        this.__koModel = ko.computed(function () {
            this.__koTrigger(); // subscribe to changes of this...
            return {
                props: this.props,
                state: this.state
            };
        }, this);

        ko.applyBindings(this.__koModel, this.getDOMNode());
    },
    componentDidUpdate() {
        this.updateKnockout();
    }
```

None of what we have done here is really component-specific, so we can easily abstract this out into a mixin:

```js
var KnockoutMixin = {
  updateKnockout() {
    this.__koTrigger(!this.__koTrigger());
  },

  componentDidMount() {
    this.__koTrigger = ko.observable(true);
    this.__koModel = ko.computed(function() {
      this.__koTrigger(); // subscribe to changes of this...

      return {
        props: this.props,
        state: this.state
      };
    }, this);

    ko.applyBindings(this.__koModel, this.getDOMNode());
  },

  componentWillUnmount() {
    ko.cleanNode(this.getDOMNode());
  },

  componentDidUpdate() {
    this.updateKnockout();
  }
};
```

We could then use this like so:

```js
var ToDoList = React.createClass({
  mixins: [KnockoutMixin],

  render() {
    return (
      <ul data-bind="foreach: props.todos">
        <li data-bind="text: $data" />
      </ul>
    );
  }
});
```

Nice! Here's a quick fiddle with a rapidly changing to do list whose state is being managed in React, but is being rendered by knockout:

<iframe width="100%" height="300" src="//jsfiddle.net/lelandrichardson/v2spwr3a/embedded/js,html,result/dark/" allowfullscreen="allowfullscreen" allowpaymentrequest frameborder="0"></iframe>

Now that we have that direction covered, let's see what we can do about the other way around.

### Using React from within the context of Knockout

Similar to the first part of this post, let's first try to figure out what kind of API we might want to create.

React works in terms of "Components", and Knockout has "binding handlers", which are a little bit different but not entirely.

Let's say we have a `Contact` component in React-land, which accepts an `info` prop. It would be nice if we could render that component inside a div and have it look something like this:

```html
<div data-bind="react: Contact, props: { info: info }"></div>
```

To do this, we are going to want to create a `react` binding handler.

```js
ko.bindingHandlers.react = {
  init: function(el, valueAccessor, allBindings) {
    var Component = ko.unwrap(valueAccessor());
    var props = ko.toJS(allBindings.get("props"));

    // render to react? initial setup maybe?

    return { controlsDescendantBindings: true }; // important
  },

  update: function(el, valueAccessor, allBindings) {
    var Component = ko.unwrap(valueAccessor());
    var props = ko.toJS(allBindings.get("props"));

    // tell react to re-render?
  }
};
```

Couple things of note here:

First, we are returning `{ conrolsDescendantBindings: true }` from the `init` function of the binding handler. This tells knockout to not walk the DOM tree below this node, as this binding handler "has that covered". This is really important because the DOM tree below us is going to be controlled by React, and we don't want knockout to mess with it.

Second, we are not creating a "props" binding, but we _are_ retrieving the props passed into the `data-bind` attribute by using `allBindings.get('props')`.

Third, we are using `ko.unwrap` and `ko.toJS` on our passed in Component and props because we want to make sure that what we pass into React-land are plain JS objects, and not knockout observables (under the assumption that we don't want observables in React-land). Additionally, this "subscribes" this DOM element to the changes of any observable that is passed into, which will cause it to call the `update` function of this binding handler.

We haven't really done anything react-specific yet, but we've got most of the boilerplate out of the way.

React has a `React.render` function which will mount a React tree onto a DOM element that we will want to use.

Conveniently, React is pretty smart about how this render function works, and if we call it multiple times on the same mounted node, it will simply diff the two virtual DOM representations and update accordingly (making it a very cheap operation).

Additionally, Knockout runs the `update` method right after `init` on first pass anyway, so it turns out our `init` method doesn't really have to do anything. In the `update` method, in order to render to react we simply need to call:

```js
React.render(React.createElement(Component, props), el);
```

And that's it! With all that, we end up with a binding handler something like the following:

```js
ko.bindingHandlers.react = {
  init: function() {
    return { controlsDescendantBindings: true }; // important
  },

  update: function(el, valueAccessor, allBindings) {
    var Component = ko.unwrap(valueAccessor());
    var props = ko.toJS(allBindings.get("props"));

    // tell react to render/re-render
    React.render(React.createElement(Component, props), el);
  }
};
```

Crazy simple, right? I don't know if I should be more impressed with Knockout or React, but it sure was easy to get these two playing together nicely going this direction!

Here is a fiddle that is doing basically the same thing as the fiddle above, but the todo items are being held in a `ko.observableArray` in knockout-land, but being rendered by React.js!

<iframe width="100%" height="300" src="//jsfiddle.net/lelandrichardson/vu9vq2u0/embedded/js,html,result/dark/" allowfullscreen="allowfullscreen" allowpaymentrequest frameborder="0"></iframe>

Note: Using some of Knockout 3.0's new features, it is probably possible to make this:

```html
<div data-bind="react: Contact, props: { info: model().info }"></div>
```

look a little more like this instead:

```js
<Contact info="model().info" />
```

However, I'm skeptical that this adds any value over what we have now. Would be a fun to get working though...

### Some parting thoughts

I want to make it clear to people that I'm not trying to promote the usage of knockout and react together as a good practice. I think that if you are wanting to migrate a project from one to the other, this is a good way to do it "piece-meal". That is all.

Additionally, I haven't given much thought to the performance of these implementations. I think if you are worried about the performance here it might be worth it for you to just spend the extra time to port the project into whatever library you want to end up in, however, if anyone wants to run some performance tests on the code above, or has any thoughts on how to make the implementation better, please let me know in the comments.
