---
title: 'How jQuery and "Unobtrusive JavaScript" can be Poisonouse'
date: "2012-06-26T07:00:00.000Z"
draft: true
---

If you have been developing websites at all in the past 6 years, then chances are you have been using (or been exposed to) the [jQuery library][1]. In fact, [it is used by over half of the top 10,000 web sites in the world][2]!

So before I start an unwarranted flame-war:

> **I love and use jQuery almost every day, and think it is a freakin' fantastic library.**

Seriously. It is possibly [the most important ~9,400 lines of javascript][3] ever written.

###So what am I going on about then?###

The thing is, like for any great tool, people start to (mis-)use the crap out of it, even if it is not the right tool for the job. I'm guilty of it too. It is far too easy for a project to start out small, where the client-side interaction is simple and basic enough to be easily accomplished with a couple of lines of jQuery/javascript. Then, in short time, some more features are added. Slowly your jQuery code becomes more and more spaghetti-like.

If you allow this to happen, this is where things get poisonous. If you work in a team of developers, you can quickly become the ONLY person who can even look at your code. Even if you can look at it, the chances of you being able to quickly refactor it diminish by the day.

###jQuery is not a Framework; It's a library.###

The problem is: people use it like a framework. jQuery is intended to allow reliable manipulation and traversal of the DOM. It is NOT intended to provide a foundation for significant client-side interaction or client-side manipulation.

###When used carelessly, jQuery code can become hopelessly unmaintainable###

![enter image description here][4]

The primary issue here is with [jQuery's CSS Selectors][5], and over-using them to the point where, a simple change in your HTML can bring the whole house of cards down. This is because they make getting something to work FREAKIN' EASY. Let's look at a scenario:

Let's say I have the following in my HTML view:

    <div class="cool-content-wrapper">
        <a href="#" class="be-cool">Do Something Cool!</a>
        <div class="cool-content">
            Hello World!
        </div>
    </div>

And then in jQuery, I write the following code (and of course, like EVERY OTHER piece of javascript I write, I am going to stick it in my document.ready callback function):

    $(function () {
        $("a.be-cool").click(function () {
            alert($(this).parent().children(".cool-content").text());
        });
    });

Now I got this simple "Hello World"-ish app working in a line or two of code. I'm feeling pretty good about myself. Check in my code - onwards and upwards.

Here's the problem: Let's say 2 months down the road, I ask my designer/front-end dev to re-do some of the CSS for the page that contains this HTML. It needs a facelift. The page has been working without problems for months, so I think "Hah, I'm sure my designer can play around with it without affecting any of the code!"

In this facelift, something might come up to where it just makes more sense to move that anchor tag outside of the wrapper div:

    <a href="#" class="be-cool">Do Something Cool!</a>
    <div class="cool-content-wrapper">
        <div class="cool-content">
            Hello World!
        </div>
    </div>

All of a sudden my app is broken. Worse though - it's broken in a way which won't trigger any errors whatsoever - jQuery doesn't know that what it's doing is wrong. It's just doing what it's told. Now <b>please don't tell me how I could have written the javascript differently to where it wouldn't have failed</b>. That isn't my point. My point is that this isn't the only scenario where these selectors could become faulty. And no matter how good of a developer you are, you cannot predict the changes you will need to make 2+ months ahead of the time you are first writing the code.

###jQuery is NOT unobtrusive javascript. At least not how I see it.###

You may have heard that jQuery allows for you to create ["Unobtrusive Javascript"][6]. This term was basically created to combat code such as the following:

    <a href="#" onclick="foo(this);">Do Something Cool!</a>

Or something even uglier:

    <a href="#" onclick="if(someLogicIsMet) { foo(this);} else { bar(this);}">
        Do Something Cool!
    </a>

Basically, here we are just injecting straight up javascript into HTML attributes. Yeah. Doesn't seem like the best of solutions.

People were basically doing this left and right a couple of years ago, and then jQuery came along, and a light lit up in everyone's heads:

    <a id="coolButton" href="#">Do Something Cool!</a>
    <script type="text/javascript">
        $("#coolButton").click(function () {
            if (someLogicIsMet) { foo(this); } else { bar(this); }
        });
    </script>

Hey! Now my HTML looks nice and pretty! All of my UI logic is nicely tucked away into a &lt;script&gt; tag (or better yet, a .js file) and now I have reached Developer Zen!

Although this example is pretty bulletproof, let's go back to the samples above. What makes these different? The answer is not much - but just enough. Basically the primary difference in my mind is that most people look at an id of an HTML tag as something more or less permanent. When you start using the CSS Class Selectors instead of the ID selectors, your logic is starting to creep it's way into the territory of the "UI". If I'm a designer, chances are I'm not going to touch an id attribute.

The class attributes however, seem like fair game. They are primarily intended for CSS... so if I'm changing up the CSS and I determine I no longer need that css class, or that moving it outside of it's parent div will not affect the css attributes that have been applied thus far... what's the harm? By the time you actually need to do this, you have probably followed best practices and completely pulled out all of your javascript into a separate, minified file. Although this is great for page-load times, it sure makes it hard for me to remember that the CSS/HTML that I am refactoring is possibly going to break all my code.

Bottom line: jQuery cannot, and will not, ever separate itself from the HTML. You can pull out the logic, and have it contained inside an external js file. But that file is infested with dependency after dependency and is <b>intimately</b> coupled with the view. Unless you use a very strict limited subset of jQuery, there is no easy way out of this. This is worse than "obtrusive" javascript... this is SNEAKY javascript. Next to littering your code with comments and/or being part of the .001% which has managed to successfully implement a javascript Unit-Testing framework (at which point, I will throw a wild guess that this article is absolutely worthless to you and not providing you with any new insights), there is no easy way to determine if modifying your HTML view will break your UI logic.

###So what's the solution?###

If you want my take on it all, the solution is to **stop demanding that the UI be completely separated from logic**. Without the use of significantly robust _frameworks_ I simply do not think that this is achievable.

And why should it be?

Your HTML is no longer just presenting marked-up/formatted text to the client. That's the whole point of "client-side interaction". You are introducing the ability to _interact_ with the HTML. The best solution I can come up with is to do the following:

- don't mix and match CSS-intended classes with jQuery-intended classes.
- limit the amount of complex css-selectors used in jQuery event declarations (ie, \$(".class1 .class2 > .class3") or something similar)
- care less about whether or not your HTML is "pure" and more about whether or not your code will be _maintainable_
- expand your horizons into [one of the many javascript Frameworks available][7], and _utilize_ jquery, rather than abuse it.

The last item there is important. In the last few years, several awesome Javascript frameworks have come out (mostly of the MVC or MVVM variety). Every web developer should explore these options and learn more about what tools (other than jQuery) are out there. One of my next few posts will be about some of these frameworks, and what my thoughts are on them. The link above does do a good "first-glance" survey of 10 different frameworks though, and will be a good starting point for anyone wanting to learn more.

[1]: http://jquery.com/
[2]: http://royal.pingdom.com/2012/06/20/jquery-numbers/
[3]: http://paulirish.com/2010/10-things-i-learned-from-the-jquery-source/
[4]: http://tpstatic.com/img/usermedia/wFiZRbJx4UCkcYYO-qWb9Q/original.png
[5]: http://api.jquery.com/category/selectors/
[6]: http://en.wikipedia.org/wiki/Unobtrusive_JavaScript
[7]: http://codebrief.com/2012/01/the-top-10-javascript-mvc-frameworks-reviewed/
