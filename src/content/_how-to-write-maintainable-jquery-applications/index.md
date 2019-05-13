---
title: "How to write Maintainable jQuery Applications"
date: "2012-12-18T08:00:00.000Z"
draft: true
---

These days it's hard to call yourself a web developer if you do not have at least _some_ jQuery experience. jQuery is very helpful for many many things such as browser compatibility, ajax calls, DOM manipulation, utility, and more. It helps us lazy web developers do these common operations simply - but **one thing it does not help us do, is write good code**.

Not so long ago (ok, maybe a while ago) I wrote a post titled [How jQuery and "unobtrusive javascript" can be poisonous][1]. This can be thought of as a bit of a follow up to that post.

##The Problem

Here is how to structure the "Front End Layers" of a web application.

![The desired separation: Presentation (CSS), Behavior (Javascript), Data/Structure (HTML)][2]

Source: [Maintainable Javascript 2012][3] via [Nicholas C. Zakas][4] (1)

There you have it. It's as easy as that. **Except for, you know, it not being that easy.**

It's easy to say, well, just keep the **data in the HTML**, and the **behavior in javascript**, and anything UI related in CSS, and thus you will have good separation.

Well, turns out in practice **this doesn't always work out so well**. If you're not careful, anything more then elementary client-side interactivity done through jQuery will result in some pretty terrible spaghetti code. Worse than that, jQuery in practice is often **extremely coupled to the structure of your HTML**. This makes it extremely hard to maintain, refactor, and understand.

###Can't I just use one of the fancy new MVC/MV\* Javascript Frameworks?

> Well, yeah, actually &mdash; if that's an option...

This is where I tell you if you haven't heard of frameworks such as [KnockoutJS][7], [BackboneJS][8], [Ember.js][9], [AngularJS][10], [Spine][11], and [BatmanJS][12], you should check them out. Many of them are great options. I only have extensive experience (extensive meaning, say above [ToDo App][13] level) with KnockoutJS and BackboneJS.

My suggestion is that you check out at least 2 of them to get an idea of the variety/flavors. I personally use knockout the most, although if I was building a web project on top of a RESTful API, I would choose Backbone instead (since it has built-in RESTful conventions).

The big problem with these frameworks (in my opinion) is that **they are completely and utterly incompatible with SEO friendly web design**.

If you want to use one of the MV* frameworks mentioned above, you pretty much have to send/retrieve data in JSON format. This is how it should be (hell, it DOES seems natural to have *Javascript Objects* be stored in *<b>J</b>ava<b>S</b>cript <b>O</b>bject <b>N</b>otation\*).

Well this seems to change the organizational chart above, doesn't it? Now, HTML is essentially just our **View**, while our **Data** lives in server-generated JSON. Usually comminicated asynchronously via AJAX.

> ###Google looks at HTML. Plain and simple. No JSON.

Thus our problem. If you are trying to build an SEO-friendly web app, for the most part you are required to push out the data in HTML format, not in JSON format which then gets rendered client-side.

So thus, we are back where we started.

> ###Our data lives in HTML.

Let's assume for now that all of the fun MVC javascript frameworks are out. We want to build a fully-functional, client-side web application, meanwhile keeping everything friendly and crawlable for Google. We pick jQuery as the backbone of our client-side application.

##How do we build a Maintainable Javascript applicaiton with jQuery?

This is a good question. I am going to demonstrate a "pattern" to do this which has worked for me. I will do so by building a faux application which has the basic behavior of a commenting system. I feel like this is a richer demonstration than the TODO applications, as there is generally more complex user interaction, and more server-side communication which needs to take place.

![enter image description here][14]

(Bear with me on the Visio diagrams - they aren't great but I think they help)

The idea is, in a javascript-disabled world, the application essentially still works. Note: If you have javascript disabled, **I pity you** - this is primarily for it to "work" for google - not for people who have js turned off. Although it helps them too so win/win.

We will talk more later about how that HTML might look, but first let's see what the basic structure of the application is:

###Basic JS Structure:

    "use strict";
    (function($, application, window) {

        application.CommunicationLayer = function (spec) {
            var self = this;

            // Communicate with server + business-level logic

            return self;
        };

        application.performBinding = function (app, selector) {
            //Handle all HTML-specific code here

            //DOM wrapper element, all event handlers are bound to this element
            var $wrapper = $(selector || window.document);

            //bind all events
            $wrapper
                //PRIMARY BINDINGS
                .on('click', '.-delete', function() {
                    //user clicked delete
                    //handle UI changes
                    //get necessary data
                    //call appropriate method on app
                    app.delete(data);
                })
                .on('click', '.-search', function () {
                    //user clicked search
                    //handle UI changes
                    //get necessary data
                    //call appropriate method on app
                    app.search(data);
                })
                // ...
            ;
        };

    })(jQuery, window.MyApp || (window.MyApp = {}), window);

Then, your HTML page will have the following:

    <div id="application-wrapper">
        <!-- rendered HTML/Data -->
    </div>

    <script src="Scripts/App.js" type="text/javascript"></script>
    <script type="text/javascript">
        $(function() {
            MyApp.performBinding(new MyApp.CommunicationLayer(), "#application-wrapper");
        });
    </script>

Let's try this out. As promised, I'll create a simple commenting app as an example. Comments can get pretty complex in the web 2.0 age, so **how about we specify some requirements/constraints**.

- comments can have children comments
- users can delete comments
- users can flag comments
- users can edit comments
- users can reply to comments

The page will have the following dependencies:

- Handlebars.js (templating engine) \*
- jQuery (this post IS about jQuery after all)

  \*It is important to note that Handlebars is being used ONLY to generate HTML based on actions of the user. All of the original HTML is generated server side. Generating the HTML is considered outside the scope of this post.

I am going to make the following assumptions about the HTML:

- all comments are contained by an element with the class `-comment`
- comments have child elements with classes `-reply`, `-update`, `-delete`, and `-flag` which are clickable
- the comment content (text) is contained in a child element of `-comment` with the class `-body`
- child comments are contained by an element with a class `-child-comments`
- the `-comment` element has a `data-app` attribute like so: `data-app="id: 123, parentId: 456"`

![enter image description here][15]

(Assumptions about the HTML structure)

The important thing to note here is that we aren't tying ourselves to the structure of the HTML too much. **The assumptions made are essentially about the structure of the data**. For example, Comments have child comments - thus it seems logical that in the HTML-representation of this data, a node representing a comment, would have, somewhere down the DOM tree, a child node representing a list of child comments. This does limit things slightly, but is not disabling. The coupling between the HTML and the javascript should still be pretty small relatively speaking. I will demonstrate this point later.

###Conventions

I have followed a convention where any class names prefixed with a `-` (e.g., `-comment`) are class names for Javascript. The idea is to **not use any of these classes for CSS styling** &mdash; this allows for a clean separation over presentation and behavior. All class names not prefixed can be safely assumed to be tied to CSS rules. This allows developers to easily and cleanly navigate your view code, knowing whether or not you changing something will affect the behavior of the javascript or not. This, in my mind, is an invaluable feature.

With that in mind, let's build our communication layer...

    application.CommunicationLayer = function (spec) {
        var self = this;
        //hardcode author as "Current User"
        //normally, you might pull this from a cookie or something
        self.author = "Current User";

        self.insert = function (comment, callback) {
            //send data to server via AJAX
            //server returns the inserted comment ID
            //trigger callback method with comment data

            //emulate inserted comment by triggering callback
            //with a dummy ID
            callback({
                id: comment.parentId + 1000,
                body: comment.body,
                date: new Date(),
                author: self.author
            });
        };

        self.delete = function(id) {
            //delete comment
        };

        self.update = function(toUpdate, callback) {
            //update comment

            callback();
        };

        self.flag = function (id, reason) {
            //flag comment
        };

        return self;
    };

Since this is just a demo, the communication layer is pretty empty, but it should be pretty clear how one would code this, and where business logic and communication logic would go.

We need to decide how our HTML is going to look. Let's make some Handlebars templates.

**Comment Template:**

    <li class="-comment" data-app="id:{{id}}, parentId: {{parentId}}">
        <div>
            <span class="comment-author">{{author}}</span> at
            <span class="comment-date">{{date}}</span>
        </div>
        <div class="comment-body -body">{{body}}</div>
        <div class="comment-tools">
            <a class="-reply">Reply</a>
            <a class="-update">Update</a>
            <a class="-delete">Delete</a>
            <a class="-flag">Flag</a>
        </div>

        <ul class="-child-comments"></ul>
    </li>

We are also going to need some templates for replying and editing comments.

**Add comment Template:**

    <li class="-add-comment-template">
        <form class="-add-comment-form" data-app="parentId: {{parentId}}">
            <input type="text" class="-body" />
            <input class="btn" type="submit" value="Submit"/>
            <a class="btn -cancel">Cancel</a>
        </form>
    </li>

**Update Comment Template:**

    <form class="-update-comment-form">
        <input type="hidden" class="-original" value="{{body}}" />
        <textarea class="-value">{{body}}</textarea>
        <button class="btn" type="submit">Save</button>
        <a class="btn -cancel">Cancel</a>
    </form>

Note: as a benefit to the conventions we have used, at the end of this I will demonstrate how one would be able to completely change the design, and HTML structure of the comments, **without altering a single line of javascript**!

Now comes the binding code.

    application.bindCommentApp = function(app, selector) {
        var $wrapper = $(selector || window.document);

        //templates - for user-created comments
        var addCommentTemplate = Handlebars.compile($("#add-comment-template").html());
        var commentTemplate = Handlebars.compile($("#comment-template").html());
        var commentUpdateTemplate = Handlebars.compile($("#comment-update-template").html());

        $wrapper
            //PRIMARY BINDINGS
            .on('click', '.-delete', function() {
                var $comment = $(this).closest(".-comment"),
                    data = $comment.data("app");
                var proceed = confirm("Are you sure you would like to delete this comment?");
                if (!proceed) { return; }
                app.delete(data.id);
                $comment.remove();
            })
            .on('click', '.-flag', function () {
                var data = $(this).closest(".-comment").data("app");
                var reason = window.prompt("Why would you like to flag this comment?");
                if (!reason) { return; }
                app.flag(data.id, reason);
            })
            .on('click', '.-reply', function () {
                var $comment = $(this).closest(".-comment"),
                    data = $comment.data("app");

                var $children = $comment.find(".-child-comments").first();

                //insert the add comment form template into children list
                $children.prepend(addCommentTemplate({parentId: data.id}));

            })
            .on('click', '.-update', function () {
                var $comment = $(this).closest(".-comment"),
                    data = $comment.data("app");

                var $body = $comment.find(".-body").first();
                var body = $body.text();
                $body.empty();
                $body.html(commentUpdateTemplate({ body: body }));

            })


            //TEMPLATE RELATED BINDINGS
            .on('submit', '.-add-comment-form', function () {
                var $this = $(this),
                    $tmpl = $this.closest(".-add-comment-template"),
                    $children = $this.closest(".-child-comments"),
                    data = $this.data("app"),
                    body = $this.find(".-body").val();

                $tmpl.remove();
                app.insert({ parentId: data.parentId, body: body }, function (comment) {
                    $children.prepend(commentTemplate(comment));
                });

                return false; //prevent post
            })
            .on('click', '.-add-comment-form .-cancel', function () {
                var $tmpl = $(this).closest(".-add-comment-template");

                $tmpl.remove();
            })

            .on('submit', '.-update-comment-form', function () {
                var $tmpl = $(this).closest(".-update-comment-form"),
                    $comment = $tmpl.closest(".-comment"),
                    $body = $comment.find(".-body").first(),
                    data = $comment.data("app"),
                    body = $tmpl.find(".-value").val();

                $body.empty();
                app.update({ id: data.id, body: body }, function () {
                    $body.text(body);
                });

                return false; //prevent post
            })
            .on('click', '.-update-comment-form .-cancel', function () {
                var $tmpl = $(this).closest(".-update-comment-form"),
                    $body = $tmpl.closest(".-comment").find(".-body").first(),
                    originalValue = $tmpl.find(".-original").val();
                $body.text(originalValue);
                $tmpl.remove();

            })


        ;
    };

Clearly, this snippet is a bit longer - but it is also fully functioning. Take some time to read over it and understand what it is doing. The general pattern is this:

    //Typical logic for event handler
    $wrapperElement.on('{event}', '{element triggering event}', function () {
        //Step 1: gather contextual data. (Usually an identifier of entity
        //        being acted on + user-created data)

        //Step 2: If needed, confirm action with user (ie, "Are you sure?")

        //Step 3: Call communicaiton layer with appropriate data to perform
        //        Business logic + communicate with server
    })

To maintain flexibility, I typically store contextual data in a `data-` HTML attribute. This is helpful to gather more complex contextual data since it will be typed (rather than parsing it from html). [I have also written about ways to make this simpler][16].

Using just this code here and a little bit of CSS, you can try out a working demo in the jsFiddle below:

###Try it out:

---

\$[http://jsfiddle.net/lelandrichardson/52uGc/][result,html,css,js]

---

Also, as promised, here is an alternate version using Html Tables instead of HTML lists to present the comments. Note that by keeping the structure of the javascript `-classname` selectors the same, this was relatively easy to accomplish.

The point here is to show that even with dramatically altered HTML representations of the data (one using a list, one using a table), I was able to refactor the design successfully without changing ANY javascript code. This is fairly significant and will save much time once your application gets sufficiently complex.

---

\$[http://jsfiddle.net/lelandrichardson/52uGc/11/][result,html,css,js]

---

###A final Note:

There are many ways to structure javascript applications. I don't pretend to have the right way. There are many very smart people thinking about how to do to this properly. Over the years I have come up with conventions and structure to battle common problems that I have had with maintaining large Javascript code bases, and have found this to work pretty well.

I hope that this can help those that are struggling with the same problems. If you have any comments or suggestions on how to improve on this, I would love to hear them.

Also, if you made it this far and actually read everything: bravo. I'll try to keep my posts shorter in the future.

**Additional Sources:**

- For the record, if you have not seen [Nick Zakas' speech above on Maintainable Javascript][5], or [read his book on the subject][6] - and are wondering how to write maintainable javascript code (not necessarily _jQuery_-driven applications), I would recommend giving it a look.

[1]: http://www.intelligiblebabble.com/how-jquery-and-unobtrusive-javascript-can-be-poisonous/
[2]: http://www.intelligiblebabble.com/asset/img/uploads/maintainablejquery/front_end_layers.png
[3]: http://www.slideshare.net/nzakas/maintainable-javascript-2012
[4]: http://www.nczonline.net/
[5]: http://www.slideshare.net/nzakas/maintainable-javascript-2012
[6]: http://www.amazon.com/Maintainable-JavaScript-Nicholas-C-Zakas/dp/1449327680/ref=sr_1_1?ie=UTF8&qid=1355847843&sr=8-1&keywords=maintainable%20javascript
[7]: http://knockoutjs.com/
[8]: http://backbonejs.org/
[9]: http://emberjs.com/
[10]: http://angularjs.org/
[11]: http://spinejs.com/
[12]: http://batmanjs.org/
[13]: http://addyosmani.github.com/todomvc/
[14]: http://www.intelligiblebabble.com/asset/img/uploads/maintainablejquery/app_diagram.png
[15]: http://www.intelligiblebabble.com/asset/img/uploads/maintainablejquery/html_structure.png
[16]: http://www.intelligiblebabble.com/using-html5-data-tags-razor-csharp/
