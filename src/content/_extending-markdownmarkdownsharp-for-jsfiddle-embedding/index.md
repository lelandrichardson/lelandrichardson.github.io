---
title: "Extending Markdown/MarkdownSharp for jsFiddle Embedding"
date: "2012-12-02T08:00:00.000Z"
draft: true
---

I'm currently working on a project which will be a developer/tech community. I am building out a framework for users to post tutorials and general blog-type postings, and decided to use Markdown syntax on all user-created content.

If you don't know what [Markdown][1] is, it is a simple and efficient syntax for marking up text to HTML. It has become popular throughout the developer community, largely due to it's use on [StackOverflow][2] and [GitHub][3].

Since the specification of Markdown was sort of defined in an ad-hoc manner by John Gruber, there have been several subtly different implementations of it. Jeff Atwood is [proposing to standardize it][4], but whether or not that will happen any time soon is unknown.

Anyway, going against the very direction that Jeff Atwood is calling for above (sorry Jeff), I realized that a common desire of mine is to [embed a jsFiddle][5] into a post. Such a feature [has been discussed for use in StackOverflow][6] [multiple times][7], and has had a fairly positive reception (first post got 67 upvotes...)

If you don't know what [jsFiddle][8] is, and you are a web developer, you are missing out. jsFiddle is a purely awesome service that makes communicating with code snippets significantly easier.

With Fully-capable markdown, embedding fiddles is somewhat simple, since full HTML syntax is allowed. However, on sites like StackOverflow and GitHub, it would be unwise to allow full HTML support. This would technically allow users to embed whatever nasty javascript they wanted onto a certain page, and because of this concern, one usually decides to whitelist only certain HTML elements so that a user cannot post any malicious content.

Of course, it seems clear that `<iframe>` HTML elements should not be included in the whitelisted group of elements. I sought out, however, to include a simple syntax for including embedded jsFiddle iframes into the markdown specification to make writing about javascript, HTML, or CSS that much easier (not to mention interactive).

##Convention

The simplest convention I could come up with was the following:

    // render jsFiddle embed iframe with default options
    $[http://jsfiddle.net/uzMPU/]

    // render jsFiddle embed iframe with specific tabs
    $[http://jsfiddle.net/uzMPU/][result,js,css]

In addition, following similar convention to links and images, referencing the link by id will also be valid:

    // render jsFiddle embed iframe with default options
    $[1]

    // render jsFiddle embed iframe with specific tabs
    $[1][result,js,css]

      [1]: http://jsfiddle.net/uzMPU/

This would result in the following iframes being rendered as the following:

    <iframe src="http://jsfiddle.net/uzMPU/embedded/" allowfullscreen="allowfullscreen" frameborder="0"></iframe>

    <iframe src="http://jsfiddle.net/uzMPU/embedded/result,js,css/" allowfullscreen="allowfullscreen" frameborder="0"></iframe>

(In reality, I have modified this slightly, and included a style tag: `width: 100%; height: 300px;` by default)

In addition to the `$[]` syntax, I have made it a requirement that the `$[]` be entirely on it's own line. As a result, writing the following:

    This is an inline $[http://jsfiddle.net/uzMPU] fiddle looking link

will not result in an iframe being rendered.

##Implementation

Since I am working in .Net, I am using [MarkdownSharp][9] to process the markdown into HTML, and also using the same Sanitizer that (I think) is used on StackOverflow. Uncommon to most parsers, MarkdownSharp is implemented largely using Regular Expressions. I tried to follow similar conventions as were being used in the MarkdownSharp project, but I simply added the following code into the `Markdown.cs` file:

    private static Regex _fiddlesRef = new Regex(@"
                        ^               # must be at start of line
                        (               # wrap whole match in $1
                        \$\[
                            ([^\]]*?)       # id = $2, match anything except for endbracket
                        \]
                        (
                            \[
                            ([a-zA-Z,]*)    # tab options in $4
                            \]
                        )?              # tab options are optional
                        )$              # must be entire line
    ", RegexOptions.IgnorePatternWhitespace | RegexOptions.Multiline | RegexOptions.Compiled);

    /// <summary>
    /// Turn Markdown fiddle shortcuts into embedded iframes
    /// </summary>
    /// <remarks>
    /// $[link to fiddle]
    ///
    /// OR
    ///
    /// $[link to fiddle][fiddle tab options]
    ///
    /// OR
    ///
    /// $[1]
    ///   [1]: {link to fiddle}
    /// </remarks>
    private string DoFiddles(string text)
    {
        return _fiddlesRef.Replace(text, new MatchEvaluator(FiddleEvaluator));
    }

    private string FiddleEvaluator(Match match)
    {
        string idOrLink = match.Groups[2].Value;
        string tabOptions = match.Groups[4].Length > 0 ? match.Groups[4].Value : null;
        string linkID = idOrLink.ToLowerInvariant();

        string url = _urls.ContainsKey(linkID) ? _urls[linkID] : idOrLink;
        url = EncodeProblemUrlChars(url);
        url = EscapeBoldItalic(url);
        return CreateFiddle(url, tabOptions);

    }

    private static string CreateFiddle(string url, string tabOptions = null)
    {
        url = CreateFiddleUrl(url, tabOptions); // creates safe and valid fiddle embed URL. returns empty if not valid.

        if (string.IsNullOrEmpty(url))
        {
            return ""; //if empty, don't render fiddle
        }

        return String.Format(
            @"<iframe style=""width: 100%; height: 300px"" src=""{0}"" allowfullscreen=""allowfullscreen"" frameborder=""0""></iframe>",
            url
        );
    }

I wanted it to be simple to add a fiddle, and one way of making it simple is to make it so that I could be on any fiddle page in my browser, and simply Copy-and-paste the current browser url into a bracketed `$[]` and have it work. In order to properly embed the fiddle, it is required that the url have the `/embedded/` flag at the end of the url. In addition to wanting this to handle a default fiddle URL without the `/embedded/` flag, I thought it would be good to make sure the URL was a proper fiddle URL, and not some malicious URL which could produce an unsafe iframe. This magic currently happens in the `CreateFiddleUrl(url, tabOptions);` method.

    public static string CreateFiddleUrl(string originalUrl, string tabOptions = null)
    {
        var match = _fiddlesUrl.Match(originalUrl);

        if (!match.Success)
        {
            return "";
        }

        return string.Format(
            @"http://jsfiddle.net/{0}/{1}/{2}{3}{4}{5}",
            match.Groups[5].Value, //username
            match.Groups[6].Value, //fiddle id
            match.Groups[7].Length > 0 ? match.Groups[7].Value + "/" : "", //version number if present
            "embedded/",
            tabOptions != null ?
                tabOptions + "/" :
                (match.Groups[9].Length > 0 ?
                    match.Groups[9].Value + "/" :
                    ""), //if tab options are included, use them
            match.Groups[10].Value //any additional options at end of url
            );

    }

    private static Regex _fiddlesUrl = new Regex(@"
        ^                       # url starts string
        (                       # wrap whole match in $1
        (https?://)?            # optional http:// or https:// in $2
        (www\.)?                # allows www. even though jsfiddle doesn't use it in $3
        (jsfiddle\.net)         # required jsfiddle.net in $4
        /([a-zA-Z0-9_]*)        # required username of fiddle creator in $5
        /([a-zA-Z0-9]*)         # required fiddle ID in $6
        /([0-9]*)?              # optional fiddle version number in $7
        /?(embedded)?           # embedded option - not required. will add manually if not present in $8
        /?([a-zA-Z,]*)?         # fiddle tabs options csv list of tabs in $9
        /?(.*)                  # other options are possible, put them all in $10
        )
    ", RegexOptions.Singleline | RegexOptions.IgnorePatternWhitespace | RegexOptions.Compiled);

Thus, the following urls are all valid:

    Markdown.CreateFiddleUrl("http://jsfiddle.net/username/AbCdEf/")
    // returns "http://jsfiddle.net/username/AbCdEf/embedded/"

    Markdown.CreateFiddleUrl("http://jsfiddle.net/AbCdEf/")
    // returns "http://jsfiddle.net/AbCdEf/embedded/"

    Markdown.CreateFiddleUrl("jsfiddle.net/AbCdEf/result,js/")
    // returns "http://jsfiddle.net/AbCdEf/embedded/result,js/"

    Markdown.CreateFiddleUrl("http://jsfiddle.net/AbCdEf/embedded/")
    // returns "http://jsfiddle.net/AbCdEf/embedded/"

    Markdown.CreateFiddleUrl("http://jsfiddle.net/AbCdEf/", "result,js")
    // returns "http://jsfiddle.net/AbCdEf/embedded/result,js/"

Now I simply hook this into the main `RunBlockGamut` method:

    /// <summary>
    /// Perform transformations that form block-level tags like paragraphs, headers, and list items.
    /// </summary>
    private string RunBlockGamut(string text, bool unhash = true)
    {
        text = DoHeaders(text);
        text = DoHorizontalRules(text);
        text = DoLists(text);
        text = DoCodeBlocks(text);
        text = DoBlockQuotes(text);

        text = DoFiddles(text);

        // We already ran HashHTMLBlocks() before, in Markdown(), but that
        // was to escape raw HTML in the original Markdown source. This time,
        // we're escaping the markup we've just created, so that we don't wrap
        // <p> tags around block-level tags.
        text = HashHTMLBlocks(text);

        text = FormParagraphs(text, unhash: unhash);

        return text;
    }

and all is well!

Thus, the result is - by me writing the following in markdown on this current post:

    $[http://jsfiddle.net/nGE9q/][result,html,css]

results in the following fiddle being embedded like so:

\$[http://jsfiddle.net/nGE9q/][result,html,css]

##Sanitization

If one is interested in including this syntax into the markdown spec, but still ensuring that safe HTML is always produced, one can use the following Sanitization code (borrowed and extended from [here][10]):

    private static Regex _tags = new Regex("<[^>]*(>|$)",
        RegexOptions.Singleline | RegexOptions.ExplicitCapture | RegexOptions.Compiled);
    private static Regex _whitelist = new Regex(@"
        ^</?(b(lockquote)?|code|d(d|t|l|el)|em|h(1|2|3)|i|kbd|li|ol|p(re)?|s(ub|up|trong|trike)?|ul)>$|
        ^<(b|h)r\s?/?>$",
        RegexOptions.Singleline | RegexOptions.ExplicitCapture | RegexOptions.Compiled | RegexOptions.IgnorePatternWhitespace);
    private static Regex _whitelist_a = new Regex(@"
        ^<a\s
        href=""(\#\d+|(https?|ftp)://[-a-z0-9+&@#/%?=~_|!:,.;\(\)]+)""
        (\stitle=""[^""<>]+"")?\s?>$|
        ^</a>$",
        RegexOptions.Singleline | RegexOptions.ExplicitCapture | RegexOptions.Compiled | RegexOptions.IgnorePatternWhitespace);
    private static Regex _whitelist_img = new Regex(@"
        ^<img\s
        src=""https?://[-a-z0-9+&@#/%?=~_|!:,.;\(\)]+""
        (\swidth=""\d{1,3}"")?
        (\sheight=""\d{1,3}"")?
        (\salt=""[^""<>]*"")?
        (\stitle=""[^""<>]*"")?
        \s?/?>$",
        RegexOptions.Singleline | RegexOptions.ExplicitCapture | RegexOptions.Compiled | RegexOptions.IgnorePatternWhitespace);
    //<iframe style="width: 100%; height: 300px" src="http://jsfiddle.net/" allowfullscreen="allowfullscreen" frameborder="0"></iframe>
    private static Regex _whitelist_fiddle = new Regex(@"
        ^<iframe
            (\sstyle=""width:\s?\d{1,3}(%|px);\s?height:\s?\d{1,3}(%|px)"")?
            (\ssrc=""http://jsfiddle.net/[a-zA-Z0-9,_/]*"")
            (\sallowfullscreen=""allowfullscreen"")?
            (\sframeborder=""\d"")?
        >$|^</iframe>$
        ",
        RegexOptions.Multiline | RegexOptions.ExplicitCapture | RegexOptions.Compiled | RegexOptions.IgnorePatternWhitespace);

    /// <summary>
    /// sanitize any potentially dangerous tags from the provided raw HTML input using
    /// a whitelist based approach, leaving the "safe" HTML tags
    /// CODESNIPPET:4100A61A-1711-4366-B0B0-144D1179A937
    /// </summary>
    public static string Sanitize(string html)
    {
        if (String.IsNullOrEmpty(html)) return html;
        string tagname;
        Match tag;
        // match every HTML tag in the input
        MatchCollection tags = _tags.Matches(html);
        for (int i = tags.Count - 1; i > -1; i--)
        {
            tag = tags[i];
            tagname = tag.Value.ToLowerInvariant();
            if (!(_whitelist.IsMatch(tagname) || _whitelist_a.IsMatch(tagname) || _whitelist_img.IsMatch(tagname) || _whitelist_fiddle.IsMatch(tagname)))
            {
                html = html.Remove(tag.Index, tag.Length);
                System.Diagnostics.Debug.WriteLine("tag sanitized: " + tagname);
            }
        }
        return html;
    }

##Synopsis

At the end of the day - I want to be clear: **I am not necessarily proposing that this become a markdown standard**. Similar to some additions/deviations from the current "standard" that [sites like GitHub have taken][11], I saw a chance to significantly improve the convenience of an often (or what should be often) task in writing developer-focused content, and I took it. If other people have similar ideas, then perhaps they will read this first and choose to implement it in the same way.

The biggest issue with doing something like this is the markdown syntax becomes dependent on 3rd party services (ie, jsFiddle.net), which is generally not good. At this point, the specification becomes much less portable.

What this does do, however, is makes it a lot easier for a developer to write interactive (and thus, hopefully better) tutorials by including executable and/or editable code snippets. To me, this is worth it.

I would love to hear anyone's opinion on ways to make this particular convention better, or even other things to change about the markdown spec which could help improve it's convenience to the developer in this context.

[1]: http://daringfireball.net/projects/markdown/
[2]: http://stackoverflow.com
[3]: http://www.github.com
[4]: http://www.codinghorror.com/blog/2012/10/the-future-of-markdown.html
[5]: http://doc.jsfiddle.net/use/embedding.html
[6]: http://meta.stackoverflow.com/questions/49728/custom-jsfiddle-for-stack-overflow
[7]: http://meta.stackoverflow.com/questions/141674/auto-embed-jsfiddle-into-questions
[8]: http://jsfiddle.net/
[9]: http://code.google.com/p/markdownsharp/
[10]: http://www.codetunnel.com/blog/post/24/mardownsharp-and-encoded-html
[11]: http://github.github.com/github-flavored-markdown/
[12]: http://tpstatic.com/img/usermedia/uswKbq24EUKdBw_bKfQEIw/w734.png
