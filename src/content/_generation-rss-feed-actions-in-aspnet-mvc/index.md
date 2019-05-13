---
title: "Generation RSS Feed Actions in ASP.NET MVC"
date: "2013-02-04T08:00:00.000Z"
draft: true
---

Generally when creating web applications, it is common to generate RSS Feeds that correspond to various pages of the application.

The .NET Framework generally provides pretty decent tools to write XML like the `XmlTextWriter`, but RSS is a fairly narrow specification of XML that can be quite repetitive if you use an `XmlTextWriter` every time. Thus, let's create some helpers to do all that stuff for us.

## Holding the Data

Starting off, let's just create some Plain Old CLR Objects to hold the data. Naturally, let's make an object `RssFeedItem`:

    public class RssFeedItem
    {
        public RssFeedItem() { Tags = new List<string>(); }
        public string Creator { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public string Url { get; set; }
        public DateTime Published { get; set; }
        public List<string> Tags { get; set; }

        public string ImageUrl { get; set; }
    }

In addition, RSS Feeds themselves require several pieces of data to be associated with them as well, so we create an `RssFeed` class:

    public class RssFeed
    {
        public RssFeed() { Items = new List<RssFeedItem>(); }
        public string Title { get; set; }
        public string Description { get; set; }
        public string Url { get; set; }
        public string Language { get; set; }
        public string ImageUrl { get; set; }
        public string Copyright { get; set; }
        public List<RssFeedItem> Items { get; set; }
    }

What all of these properties are should be fairly straight forward, however if you want to dig in to some of the specifics, check out the [Full RSS 2.0 Specification][1]

## Generating the XML

We would like to make sure that the XML we generate is valid, so we would like everything to go through an `XmlTextWritier`. We are going to create an `RssWriter` object to encapsulate this.

The two important methods on the RssWriter are going to be writing an `RssFeedItem` and writing an `RssFeed`. To start the feed, we are going to create a `Start(...)` method. The `RssWriter` also has an `XmlTextWriter` property named `Writer`:

    public void Start(
        string title,
        string mainUrl,
        string imageUrl = null,
        string description = null,
        string copyright = null,
        string language = null)
    {
        Writer.WriteStartDocument();
        // The mandatory rss tag
        Writer.WriteStartElement("rss");
        Writer.WriteAttributeString("version", "2.0");
        Writer.WriteAttributeString("xmlns:media", "http://search.yahoo.com/mrss/");
        Writer.WriteAttributeString("xmlns:atom", "http://www.w3.org/2005/Atom");
        // The channel tag contains RSS feed details
        Writer.WriteStartElement("channel");

            // This indentation is intentional, but purely aesthetic
            Writer.WriteElementString("title", title);
            Writer.WriteElementString("link", mainUrl);
            // description is optional
            if (description != null)
            {
                Writer.WriteStartElement("description");
                Writer.WriteCData(description);
                Writer.WriteEndElement();
            }
            //copyright is optional
            if (copyright != null)
            {
                Writer.WriteElementString("copyright", copyright);
            }

            Writer.WriteElementString("pubDate", DateTime.Now.ToString("r"));


            Writer.WriteStartElement("image");
                Writer.WriteElementString("url", imageUrl);
                Writer.WriteElementString("link", mainUrl);
                Writer.WriteElementString("title", title);
            Writer.WriteEndElement();


            //Atom Spec "self" link
            //http://validator.w3.org/appc/docs/warning/MissingAtomSelfLink.html
            Writer.WriteStartElement("link", "atom");
                Writer.WriteAttributeString("href",mainUrl);
                Writer.WriteAttributeString("rel", "self");
                Writer.WriteAttributeString("type", "application/rss+xml");
            Writer.WriteEndElement();
    }

Looking at this method, it should be pretty clear why this code can get a bit **repetitive**. One thing to note is that I am using a custom imported namespace with this line:

    Writer.WriteAttributeString("xmlns:media", "http://search.yahoo.com/mrss/");

Which is used to pull in yahoo's "Media RSS" spec, a commonly used specification for embedding images, html, and media into your RSS feeds. This was purely an implementation call and might not be to your liking.

We are likewise going to create an `End()` method which is simply the following:

    public void End()
    {
        Writer.WriteEndElement();
        Writer.WriteEndElement();
        Writer.WriteEndDocument();
        Writer.Flush();
        Writer.Close();
    }

This simply "ends" all of the tags that we created in the `Start()` method and closes the writer.

Executing the following code:

    var rssWriter = new RssWriter();
    rssWriter.Start(
        "This is a Title",
        "http://example.com/feed",
        "http://example.com/feed-image.png",
        "This is a Description"
    );
    rssWriter.End();

will produce the following XML:

    <?xml version="1.0" encoding="utf-8"?>
    <rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/" xmlns:atom="http://www.w3.org/2005/Atom">
    	<channel>
    		<title>This is a Title</title>
    		<link>http://example.com/feed</link>
    		<pubDate>Sun, 03 Feb 2013 18:39:09 GMT</pubDate>
                <description><![CDATA[This is a Description]]></description>
    		<image>
    			<url>http://example.com/feed-image.png</url>
    			<link>http://example.com/feed</link>
    			<title>This is a Title</title>
    		</image>
    		<link href="http://example.com/feed" rel="self" type="application/rss+xml" xmlns="atom" />
    	</channel>
    </rss>

Next, we have the writing of XML from an `RssFeedItem`. This is where all the meat of the feed goes.

    public void Item(
        string title,
        string description,
        string link,
        string guid,
        DateTime pubDate,
        IEnumerable<string> tags = null,
        string imageUrl = null)
    {
        Writer.WriteStartElement("item");
        Writer.WriteElementString("title", title);
        Writer.WriteElementString("description", description);
        Writer.WriteElementString("link", link);
        Writer.WriteElementString("guid", guid);
        Writer.WriteElementString("pubDate", pubDate.ToString("r"));
        if (tags != null)
        {
            foreach (var tag in tags)
            {
                Writer.WriteStartElement("category");
                Writer.WriteCData(description);
                Writer.WriteEndElement();
            }
        }

        if (imageUrl != null)
        {
            Writer.WriteStartElement("thumbnail", "media");
                Writer.WriteAttributeString("url", imageUrl);
                Writer.WriteAttributeString("height", "75");
                Writer.WriteAttributeString("width", "75");
            Writer.WriteEndElement();
        }

        Writer.WriteEndElement();
    }

One of the things to note here is that I am adding a `<thumbnail>` element for each item, which is part of the Yahoo "Media RSS" spec I mentioned above.

Additionally, the `<description>` element of each item is escaped by a `<!CDATA[ * ]]>` element.

### Hooking into the ASP.Net Pipeline

Now we want a clean way to hook this all up with MVC and return it as an `ActionResult` inside a controller. To do this we create an `RssFeedResult` class:

    public class RssFeedResult : ActionResult
    {

        public RssFeed Feed { get; set; }

        public RssFeedResult(RssFeed feed)
        {
            Feed = feed;
        }

        public override void ExecuteResult(ControllerContext context)
        {
            var response = context.HttpContext.Response;
            response.ContentType = "application/rss+xml";
            RssWriter.Execute(Feed, context.HttpContext.Response.OutputStream);
        }
    }

Where the `RssWriter.Execute` method is a static method which simply does the following:

    public static void Execute(RssFeed feed, Stream stream, Encoding encoding = null)
    {
        var writer = new RssWriter(stream, encoding);
        writer.Start(feed);

        foreach (var item in feed.Items)
        {
            writer.Item(item);
        }
        writer.End();
    }

Now, inside your Controller you can create an Action as follows:

    private RssFeedResult Feed()
    {
        RssFeed feed;

        //set feed properties and populate it's .Items list

        // return the result
        return new RssFeedResult(feed);
    }

And then we are done! I'll provide below the full code for the `RssWriter` class:

    public class RssWriter
    {
        public XmlTextWriter Writer { get; private set; }

        public RssWriter()
        {
            Writer = new XmlTextWriter(HttpContext.Current.Response.OutputStream, Encoding.UTF8);
        }

        public RssWriter(Stream stream, Encoding encoding = null)
        {
            Writer = new XmlTextWriter(stream, encoding ?? Encoding.UTF8);
        }

        public static void Execute(RssFeed feed, Stream stream, Encoding encoding = null)
        {
            var writer = new RssWriter(stream, encoding);
            writer.Start(feed);

            foreach (var item in feed.Items)
            {
                writer.Item(item);
            }
            writer.End();
        }

        public void End()
        {
            Writer.WriteEndElement();
            Writer.WriteEndElement();
            Writer.WriteEndDocument();
            Writer.Flush();
            Writer.Close();
        }

        public void Start(RssFeed feed)
        {
            Start(feed.Title, feed.Url, feed.ImageUrl, feed.Description, feed.Copyright, feed.Language);
        }

        public void Start(
            string title,
            string mainUrl,
            string imageUrl = null,
            string description = null,
            string copyright = null,
            string language = null)
        {
            Writer.WriteStartDocument();
            // The mandatory rss tag
            Writer.WriteStartElement("rss");
            Writer.WriteAttributeString("version", "2.0");
            Writer.WriteAttributeString("xmlns:media", "http://search.yahoo.com/mrss/");
            Writer.WriteAttributeString("xmlns:atom", "http://www.w3.org/2005/Atom");
            // The channel tag contains RSS feed details
            Writer.WriteStartElement("channel");
                Writer.WriteElementString("title", title);
                Writer.WriteElementString("link", mainUrl);
                if (description != null)
                {
                    Writer.WriteStartElement("description");
                    Writer.WriteCData(description);
                    Writer.WriteEndElement();
                }
                if (copyright != null)
                {
                    Writer.WriteElementString("copyright", copyright);
                }

                Writer.WriteElementString("pubDate", DateTime.Now.ToString("r"));


                Writer.WriteStartElement("image");
                    Writer.WriteElementString("url", imageUrl);
                    Writer.WriteElementString("link", mainUrl);
                    Writer.WriteElementString("title", title);
                Writer.WriteEndElement();


                //Atom Spec "self" link
                //http://validator.w3.org/appc/docs/warning/MissingAtomSelfLink.html
                Writer.WriteStartElement("link", "atom");
                    Writer.WriteAttributeString("href",mainUrl);
                    Writer.WriteAttributeString("rel", "self");
                    Writer.WriteAttributeString("type", "application/rss+xml");
                Writer.WriteEndElement();
        }

        public void Item(RssFeedItem item)
        {
            Item(
                item.Title,
                item.Description,
                item.Url,
                item.Url,
                item.Published,
                item.Tags,
                item.ImageUrl
                );
        }

        public void Item(
            string title,
            string description,
            string link,
            string guid,
            DateTime pubDate,
            IEnumerable<string> tags = null,
            string imageUrl = null)
        {
            Writer.WriteStartElement("item");
            Writer.WriteElementString("title", title);
            Writer.WriteElementString("description", description);
            Writer.WriteElementString("link", link);
            Writer.WriteElementString("guid", guid);
            Writer.WriteElementString("pubDate", pubDate.ToString("r"));
            if (tags != null)
            {
                foreach (var tag in tags)
                {
                    Writer.WriteStartElement("category");
                    Writer.WriteCData(description);
                    Writer.WriteEndElement();
                }
            }

            if (imageUrl != null)
            {
                Writer.WriteStartElement("thumbnail", "media");
                    Writer.WriteAttributeString("url", imageUrl);
                    Writer.WriteAttributeString("height", "75");
                    Writer.WriteAttributeString("width", "75");
                Writer.WriteEndElement();
            }

            Writer.WriteEndElement();
        }
    }

Happy coding!

[1]: http://cyber.law.harvard.edu/rss/rss.html
