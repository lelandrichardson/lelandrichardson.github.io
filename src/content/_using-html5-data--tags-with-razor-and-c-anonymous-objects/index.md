---
title: "Using HTML5 data-* tags with Razor and C# Anonymous Objects"
date: "2012-06-21T07:00:00.000Z"
draft: true
---

One of the most used new features of the HTML5 spec are the [data-\* attributes][1]. This provides a nice and <i>valid</i> way to store JSON data corresponding with HTML elements on a page.

The basic usage is as follows:

say I have an HTML element like so:

    <div id="user" data-my='{"id":123,"name":"John Doe", "email":"johndoe@mail.com"}'>
        John Doe
    </div>

You can see that there is some JSON data stuffed into the "data-my" tag. If this attribute was not prefixed with "data-", then this would officially be against the w3c guidelines. However, since it is, we can stuff pretty much whatever we want into there.

The interesting part, though, is that we can now utilize the [.data() function of jQuery][2] in order to access that information, and it will provide us that information as an actual JS object, rather than as a string like the .attr() function would work:

    console.log($("#user").data("my").name); //prints "John Doe"

This is a pretty powerful feature in and of itself... but now it is left up to me to write the server side code which generates these HTML attributes, which might be a pain.

If you go look at the HTML source code for any random facebook page, you will find that almost every element in that page has a "data-ft" attribute and some associated data with it. The reason is because if you want to write heavy client-side apps where interaction with different elements on the page is everywhere, it is a lot easier to just stuff a bunch of metadata into these data tags and then look for it in your javascript, rather than having to figure out the metadata from hidden input fields which are nearby (which of course is the super-old-school HTML4 way of doing things).

I am writing an app in ASP.Net with the C# Razor View Engine that just so happens to have a heave client-side component, so I thought I would write some code to help me make this process cleaner...

    using System.Web;
    using System.Web.Script.Serialization;
    public static class DisplayExtensions
    {
        /// <summary>
        /// Returns an Html-Encoded string to be put inline with an Html Element with the
        /// data-attribute name "data-my".  Ie, returns: data-my="{ encoded Json }"
        /// </summary>
        public static IHtmlString MYData(object data)
        {
            var serializer = new JavaScriptSerializer();
            return new HtmlString(string.Format(
                "data-my=\"{0}\"",
                HttpContext.Current.Server.HtmlEncode(serializer.Serialize(data))
                ));
        }
    }

This method, which I've called "MYData" but it could be whatever you want it to be, which accepts an object and returns an <em>IHtmlString</em> wrapped string which contains the html data-\* attribute which I've hard-coded as "data-my" and the strict JSON serialized representation of the object, HTML-encoded into the attribute tag's value. The object is being serialized using [Microsoft's JavaScriptSerializer][3] class.

In order to keep my view's syntax nice and sweet, I'd like to have "MYData" available to me as an instance function off of my WebPage base-class, so I re-implemented the ASP.Net Razor WebPageBaseType. In order to do this you need to:

<strong>1. Create a new abstract view base class</strong>

    using System.Web.WebPages;
    public abstract class CustomWebView : WebPage
    {
        public IHtmlString MYData(object data)
        {
            return DisplayExtensions.MYData(data);
        }
    }

<strong>2. Tell Razor to USE your base-class by default via your Web.Config</strong>

    <configSections>
      <sectionGroup
        name="system.web.webPages.razor"
        type="System.Web.WebPages.Razor.Configuration.RazorWebSectionGroup,
          System.Web.WebPages.Razor,
          Version=1.0.0.0,
          Culture=neutral,
          PublicKeyToken=31BF3856AD364E35">
        <section
          name="pages"
          type="System.Web.WebPages.Razor.Configuration.RazorPagesSection,
          System.Web.WebPages.Razor,
          Version=1.0.0.0, Culture=neutral,
          PublicKeyToken=31BF3856AD364E35"
          requirePermission="false" />
      </sectionGroup>
    </configSections>
    <system.web.webPages.razor>
      <pages pageBaseType="MyNameSpace.CustomWebView"></pages>
    </system.web.webPages.razor>

Note: you can alternatively user the <em>@inherits MyNameSpace.CustomWebView</em> keyword if you want to use it on a page-by-page basis

Now I will have this available to me in my .cshtml file

![conveniently add metadata to HTML elements in Razor][4]

    <!DOCTYPE html>
    <html>
        <head></head>
        <body>
            @{
                var user = new
                {
                    id = 123,
                    name = "John Doe",
                    email = "johndoe@mail.com"
                };
            }
            <div id="user" @MYData(user)></div>
        </body>
    </html>

For a bonus, you can even write a small jQuery function which will get your data by default:

    $.fn.my = function () {
        /// <summary>
        /// quick-hand to grab the object in the "data-my" attribute
        /// </summary>
        return this.data("my") || {};
    };

and so then you could use it like so:

    console.log($("#user").my().email); //prints "johndoe@mail.com"

This is all pretty small stuff, but if you are writing a large application that will make heave use of AJAX and javascript/client manipulation... it can be really instrumental in writing simpler code without muddying up your HTML with a bunch of hidden inputs or some other method of storing the data inside the html.

[1]: http://ejohn.org/blog/html-5-data-attributes/
[2]: http://api.jquery.com/data/
[3]: http://msdn.microsoft.com/en-us/library/system.web.script.serialization.javascriptserializer.aspx
[4]: http://tpstatic.com/img/usermedia/saauTTP0UUy31R7ponKXdw/original.png
