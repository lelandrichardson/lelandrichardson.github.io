---
title: "A pattern for writing CSS to scale"
date: "2014-05-14T07:00:00.000Z"
draft: true
---

As a web developer, CSS is incredibly important. There is nothing that users are quicker to judge than the style of a web application or web page. Yet, somehow CSS seems to take a backseat to other aspects of web development. An afterthought. Unimportant in the grand scheme of architecture and organization.

_That is just plain nonsense._

While writing modular and "DRY" CSS has improved recently with the advent of CSS pre-processors such as SASS and LESS, I feel that proper "design patterns" for writing CSS at-scale is not discussed enough.

In my time as a web developer, I have come to form several opinions on what to do and not to do when writing CSS for a large web application. I'd like to discuss them here by first going over a design pattern I have come to find very useful for larger projects.

## The "Widget Wrapper" Pattern

---

I have come to write CSS in a specific way to avoid some common pitfalls one might encounter on a large project over a long period of time. I call it, perhaps somewhat uncreatively, the "widget wrapper" pattern.

Overall this method attempts to promote the following:

- CSS style rules that do not conflict with other rules
- clean, short, and legible `class=""` attributes in your markup
- relatively short selectors, optimizing performance
- a modular, order-independent codebase

To demonstrate this pattern, I will use LESS syntax for examples. Although this pattern is in no way reliant to CSS pre-processing such as LESS, it is accomplished much more cleanly with LESS or SASS (or any other CSS pre-processor which allows selector nesting).

To give you an example, let's pretend we have a text editor widget. The style for such a widget might look like:

```css
.ns-editor {
  // ← the widget's primary selector
  ... .input {
    ...;
  } // ← one of the rule-sets for the widget's "sub-styles"
  .toolbar {
    ...;
  }
  .button {
    ...;
  }
  .preview {
    ...;
  }
}
```

This might be reflected by the following HTML:

```html
<div class="ns-editor">
  <ul class="toolbar">
    <li class="button"><a>Bold</a></li>
    <li class="button"><a>Italic</a></li>
    <!-- ... -->
  </ul>
  <textarea class="input"></textarea>
  <div class="preview"></div>
</div>
```

There are a couple of subtle choices being made here that might not immediately be obvious.

### 1. Sub-classes are simple/semantic. Widget-classes are namespaced/unique.

This maintains a balance between having short, convenient, and semantic class names while avoiding style conflicts with other parts of the codebase / website.

An approach I commonly see is to prefix _all_ styles with a contextual prefix, similar to the name of the widget. For example, if I have some widget, say a "site search" widget, I might have CSS rule-sets like the following:

```css
// don't do this
.site-search {
  ...;
}
.site-search-textbox {
  ...;
}
.site-search-button {
  ...;
}
.site-search-icon {
  ...;
}
```

Even worse, I might be using LESS or SASS, so I decide to nest these:

```css
// don't do this either
.site-search {
  ... .site-search-textbox {
    ...;
  }
  .site-search-button {
    ...;
  }
  .site-search-icon {
    ...;
  }
}
```

This results in long and redundant class names. Using the "widget wrapper" pattern, one would instead define this widget as:

```css
// do this
.site-search {
  ... .textbox {
    ...;
  }
  .button {
    ...;
  }
  .icon {
    ...;
  }
}
```

In this case, the risk of conflicting with other styles is just as small as before, but now our rendered CSS is shorter, plus our markup and CSS code is easier to read and understand.

The benefit of having all of these classes nested underneath the widget's parent `.site-search` selector is that we can now use simple and semantic class names underneath, without concern of the same class-names being used in other widgets.

For example, class names such as `.title`, `.image`, `.description`, `.name`, etc. are great class names and describe the type of content that their elements contain, but would normally be avoided when not using this pattern because of the high risk of conflicting styles made elsewhere with the same name.

### 2. Selector Nesting depth is minimized, but greater than 0

One must resist the temptation to overly nest things. If you look closely, you will notice that in the `.ns-editor` example, the HTML has the `.button` elements nested under the `.toolbar` element. Despite this inherent structure in the HTML, we avoided nesting the classes in the LESS.

```css
// YES!
.ns-editor {
  ... .toolbar {
    ...;
  }
  .button {
    ...;
  }
}
```

```css
// NO!!! resist the urge to nest!
.ns-editor {
  ... .toolbar {
    ... .button {
      ...;
    }
  }
}
```

There are several reasons to avoid this:

- Nesting will result in overly specific selectors. Overly specific selectors result in poorer performance and larger stylesheets.

- Overly specific selectors are harder to override. This will come back to bite you in the butt later down the road.

- If your CSS is somehow inherently tied to the structure of the HTML, whenever you go to refactor your HTML a little bit, it is going to be a big pain to unwind all of the nesting to match the new structure. Relying only on one "wrapper" element, and a single class-name will make refactoring easy.

### 3. Use class names over HTML tag names and #id selectors whenever possible.

Some debate usually ensues with this. Hell, I was even on the opposing side at one point. There are really two separate discussions here... `.class` selectors vs. `#id` selectors and `.class` selectors vs. `tag` selectors.

**Why should I use a `.class-name` selector instead of an `#id-name` selector?**

- the `#id-name` selector has a high specificity, resulting in hard-to-override rule sets.
- there is little to no performance benefit with the `#id-name` selector over the `.class-name` selector
- reduces the reusability of the style rule since the `#id-name` element can only appear on the page once.

**Why should I use a `.class-name` selector instead of a `tag-name` selector?**

- performance. a selector rule like `.widget-name div` can result in _really_ poor performance. The CSS engine works from right-to-left, so every `<div/>` tag on the page must then be recursively checked to see if it is a child of an element matching `.widget-name`. This can end up being wildly problematic for large pages.
- harder to read. The meaning behind a rule set for `.img-carousel > p` is much harder to reason about than `.img-carousel .caption`

Of course, where there are rules, there are exceptions to that rule. This are good guidelines to follow, but there may be situations where it does not hold true.

## Using this pattern

---

Whenever writing new CSS, go through the following three steps:

### Step #1: Decide what the boundaries of your "widget" is.

This may sound easy, but it's actually perhaps the hardest part. I like to think of the widget as some sort of proper "unit" of web design. Pretty much everything you design will be part of a widget, but the trick is deciding where one widget ends, and another begins.

Roughly speaking, I think the "sweet spot" is to choose widgets such that the fully styled widget requires somewhere between 5 and 15 selectors to fully define it. If it requires less than this, I think the widget may be too small or specific. If it requires more than this, you may want to break up some of the pieces of the "widget" into widgets of their own.

### Step #2: Name your widget

This widget name should be **descriptive** and **unique**. The descriptive part is pretty self explanatory. The uniqueness part is a bit of a balancing act. I suggest using some sort of namespace convention here to more or less guarantee uniqueness. For instance, if we declared a namespace `.ns-` for all widgets, a widget might have a class `.ns-foo` or `.ns-bar`.

### Step #3: Assign simple/semantic class names for any necessary child elements of the widget

Hopefully this step is somewhat self-explanatory. Your widget is composed of parts. An `.ns-editor` editor widget would have an `.input` field, some `.buttons`, a `.preview` div, etc... Make sure the class names rightfully explain the function of the element, and you will thank yourself later. In the short term, be thankful that because of this patter you are now free to use clean and short class names instead of the `.long-and-crazy-specific-class-names` that you had to use before!

## Conclusion

---

I'd love to hear any thoughts on where using this pattern and/or structure could run someone into trouble. Generally speaking, I have found this pattern to be tremendously helpful, and result in the following goodness:

- high level of code reuse
- more performant CSS
- easy to refactor styles
- no unintentional style conflicts
- implicit level of code organization based on 1-file-per-widget

[1]: https://github.com/necolas/normalize.css/
[2]: http://meyerweb.com/eric/tools/css/reset/
[3]: http://getbootstrap.com/
[4]: http://getbootstrap.com/
[5]: http://foundation.zurb.com/
[6]: http://purecss.io/
