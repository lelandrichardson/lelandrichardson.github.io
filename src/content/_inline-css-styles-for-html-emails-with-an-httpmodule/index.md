---
title: "Inline CSS Styles for HTML Emails with an HttpModule"
date: "2012-09-27T07:00:00.000Z"
draft: true
---

HTML-based emails are one of those evil things in the life of a web-developer that we would all rather never have to do... but alas, it needs to be done. One can do this in a variety of ways, but it is fairly common to use modern web-development technologies to generate the actual email bodies over HTTP before sending. We all know how to make web pages, right? How different could an HTML email be?

This always seems rather simple in spirit, but the problem is that email clients have a very non-standardized way of rendering HTML. The fact that you must write HTML for emails as if you were living in the late 90's is bad enough, but on top of that - many email clients remove CSS stylesheets from the HTML.

I have an ASP.net Razor project where I need to generate some HTML emails. I would like them to be maintainable style-wise and share a common layout page and css styles. What would be nice is if I could develop the web pages like normal with CSS stylesheets, but have the CSS inlined automatically.

CSS parsing does not sound like something I would like to do myself, so naturally, I looked to see what was out there. There are some great tools out there, but one clear winner:

**[PreMailer.Net: C# Library for moving CSS to inline style attributes, to gain maximum E-mail client compatibility.][1]**

PreMailer.Net is a C# implementation of Premailer's CSS inlining service built by [Martin Normark][2]. This was exactly what I needed! With this library, it should be super easy to do the inlining.

Martin did a great job with this by utilizing [Fizzler][3], a CSS Selector Engine for HTML documents in .NET, and a CSS parser class from [The Dynamic Programmer][4] to do this. I believe a lot of the work was influenced by Premailer, which deserves a mention here:

**[Premailer: Pre-flight for HTML email][5]**

Premailer, written by [Alex Dunae][6] is the "original" Premailer library written in Ruby. Alex has been kind enough to put it up as a web service on his website, allowing anyone to inline CSS on the go - and provides some other HTML-email-specific type tools which are worth checking out.

Anyway, I decided to wrap an HttpModule around the PreMailer.Net library to automatically process the HTML from each response in a sub-folder of my application. The HttpModule would look something like this:

    public class InlineCssModule : IHttpModule
    {
        void IHttpModule.Init(HttpApplication context)
        {
            context.BeginRequest += new EventHandler(context_BeginRequest);
        }

    	// Add our custome InlineCssFilter to Response.Filter
        static void context_BeginRequest(object sender, EventArgs e)
        {
            HttpApplication app = sender as HttpApplication;
    		app.Response.Filter = new InlineCssFilter(app.Response.Filter);
        }

        private class InlineCssFilter : Stream
        {
    		// The PreMailer object to do the CSS inlining magic
            private static PreMailer pm = new PreMailer();

    		/* Stream Implementation abbreviated */

    		// Take in the response stream, write out the modified response
            public override void Write(byte[] buffer, int offset, int count)
            {
                byte[] data = new byte[count];
                Buffer.BlockCopy(buffer, offset, data, 0, count);
                string html = System.Text.Encoding.Default.GetString(buffer);

                html = pm.MoveCssInline(html, true);

                byte[] outdata = System.Text.Encoding.Default.GetBytes(html);
                _sink.Write(outdata, 0, outdata.GetLength(0));
            }
        }
    }

(you can find the full HttpModule code in a [github gist here][7])

Now, one simply needs to modify their config file to put it in the ASP.Net Pipeline:

    <system.webServer>
    	<modules>
    		<add name="InlineCssModule" type="{namespace}.InlineCssModule"/>
    	</modules>
    </system.webServer>

As a result, writing this:

    <html>
        <head>
            <style type="text/css">
                div {
                    color: red;
                }
                .blue {
                    color: blue;
                }
            </style>
        </head>
        <body>
            <div class="blue">I should be blue</div>
        </body>
    </html>

renders the following HTML after the filters: (notice the lack of a stylesheet, and the presence of the `style` tags).

    <html>
        <head>

        </head>
        <body>
            <div class="blue" style="color: blue;">I should be blue</div>
        </body>
    </html>

Success!

[1]: https://github.com/milkshakesoftware/PreMailer.Net
[2]: http://martinnormark.com/
[3]: http://code.google.com/p/fizzler/
[4]: http://blog.dynamicprogrammer.com/2008/01/20/CSSParserClassInNET.aspx
[5]: http://premailer.dialect.ca/
[6]: https://github.com/alexdunae
[7]: https://gist.github.com/3798098
