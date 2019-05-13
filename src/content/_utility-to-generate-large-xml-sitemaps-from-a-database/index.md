---
title: "Utility to generate large XML Sitemaps from a Database"
date: "2012-06-22T07:00:00.000Z"
draft: true
---

I wrote a quick utility awhile ago to generate large XML sitemaps from a database. There are many sitemap generating tools out there, such as <a href="http://www.xml-sitemaps.com/" title="xml-sitemaps.com" target="_blank">xml-sitemaps.com</a> which are now even made to be web tools (you don't even have to download anything).

The problem with this is that these tools are usually crawler-based. That means that you basically point it at a starting URL, and it crawls that page looking for links, adds them to the sitemap, and then continues onward to all of those pages, crawling for those links, etc...

I never really understood this. Google is _already_ doing that (and believe me, they are doing it BETTER). More importantly, these crawlers are usually not as forgiving to your web server as google is. Some of them will blindly hit your server with as many connections as they can throw at it, and not only will your server come to a screeching halt - your sitemap will take FOREVER to create - and might error out on the bagillionth page and then corrupt the whole file or something.

Now if you are the supposed "webmaster" for this web site, isn't it safe to assume that you have more intimate knowledge about what pages you want to include in your sitemap than a crawler does? If your website is pulling content from a database of some sort, the answer is likely yes.

Anyway, I created this little tool to make it easy for me to generate large XML SiteMap files from a database query of some sort so that I could pack these SiteMap files chock-full of good links without even sending one HTTP Request.

The code is a single file using an XmlTextWriter:

    using System;
    using System.Collections.Generic;
    using System.Text;
    using System.Xml;
    using System.IO;

    class SiteMapWriter
    {
        private const string xmlFormatString = @"<?xml version=""1.0"" encoding=""UTF-8""?>";
        private const string xmlStylesheetString = @"<?xml-stylesheet type=""text/xsl"" href=""http://www.intelligiblebabble.com/files/style.xsl""?>";
        private const string xmlns = "http://www.sitemaps.org/schemas/sitemap/0.9";
        private const string xmlns_xsi = "http://www.w3.org/2001/XMLSchema-instance";
        private const string xsi_schemaLocation = "http://www.sitemaps.org/schemas/sitemap/0.9\nhttp://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd";

        private int MaxUrls; //urls per file

        private XmlTextWriter writer;
        private XmlTextWriter parentwriter;
        private readonly HashSet<string> urls;
        private int NumberOfFiles;
        private int NumberOfUrls;

        private string BaseUri;
        private string FileDirectory;
        private string BaseFileName;

        /// <summary>
        /// Create SiteMapWriter Instance
        /// </summary>
        /// <param name="fileDirectory">the directory to generate the sitemap files to</param>
        /// <param name="baseFileName">filename to prefix all generated sitemap files</param>
        /// <param name="baseUri">URL to prefix all generated URLs.  leave blank if you want relative.</param>
        public SiteMapWriter(string fileDirectory, string baseFileName, string baseUri = "", int maxUrlsPerFile = 30000)
        {
            urls = new HashSet<string>();

            NumberOfFiles = 1;
            NumberOfUrls = 0;

            BaseUri = baseUri;
            BaseFileName = baseFileName;
            FileDirectory = fileDirectory;
            MaxUrls = maxUrlsPerFile;

            var f = string.Format("{0}{1}.xml", fileDirectory, baseFileName);

            if (File.Exists(f)) File.Delete(f);
            parentwriter = new XmlTextWriter(f, Encoding.UTF8) { Formatting = Formatting.Indented };

            parentwriter.WriteRaw(xmlFormatString);
            parentwriter.WriteRaw("\n");
            parentwriter.WriteRaw(xmlStylesheetString);


            parentwriter.WriteStartElement("sitemapindex");
            parentwriter.WriteAttributeString("xmlns", xmlns);
            parentwriter.WriteAttributeString("xmlns:xsi", xmlns_xsi);
            parentwriter.WriteAttributeString("xsi:schemaLocation", xsi_schemaLocation);

            CreateUrlSet();

        }

        /// <summary>
        /// Add Url to SiteMap
        /// </summary>
        /// <param name="loc">relative path to page</param>
        /// <param name="changefreq">how often the file changes. either "daily", "weekly", or "monthly". leaves out if empty.</param>
        /// <param name="priority">the priority of the page (double between 0 and 1). defaults to 0.5</param>
        public void AddUrl(string loc, double priority = 0.5, string changefreq = null)
        {
            if (urls.Contains(loc)) return;

            writer.WriteStartElement("url");
            writer.WriteElementString("loc", loc);
            if(changefreq != null) {writer.WriteElementString("changefreq", changefreq);}
            writer.WriteElementString("priority",string.Format("{0:0.0000}",priority));
            writer.WriteEndElement();

            urls.Add(loc);
            NumberOfUrls++;
            if(NumberOfUrls % 2000 == 0) Console.WriteLine(string.Format("Urls Processed: {0}",NumberOfUrls));
            if (NumberOfUrls >= MaxUrls) LimitIsMet();

        }

        private void LimitIsMet()
        {
            //close out current file
            CloseWriter();
            NumberOfFiles++;
            CreateUrlSet();
            //create and start new file
            NumberOfUrls = 0;
        }

        private void CreateUrlSet()
        {
            string f = string.Format("{0}{1}_{2}.xml", FileDirectory, BaseFileName, NumberOfFiles);

            if(File.Exists(f)) File.Delete(f);
            writer = new XmlTextWriter(f, Encoding.UTF8) { Formatting = Formatting.Indented };

            writer.WriteRaw(xmlFormatString);
            writer.WriteRaw("\n");
            writer.WriteRaw(xmlStylesheetString);


            writer.WriteStartElement("urlset");
            writer.WriteAttributeString("xmlns", xmlns);
            writer.WriteAttributeString("xmlns:xsi", xmlns_xsi);
            writer.WriteAttributeString("xsi:schemaLocation", xsi_schemaLocation);
            AddSiteMapFile(string.Format("{0}_{1}.xml", BaseFileName, NumberOfFiles));

        }

        private void AddSiteMapFile(string filename)
        {
            parentwriter.WriteStartElement("sitemap");
            parentwriter.WriteElementString("loc", string.Concat(BaseUri,filename));
            parentwriter.WriteEndElement();
        }

        private void CloseWriter()
        {
            writer.WriteEndElement();
            writer.Flush();
            writer.Close();
        }

        /// <summary>
        /// Flushed and closes all open writers.
        /// </summary>
        public void Finish()
        {
            CloseWriter();

            parentwriter.WriteEndElement();
            parentwriter.Flush();
            parentwriter.Close();
        }
    }

Not the most elegant code in the world, but it gets the job done. Note, as mentioned above, this is NOT for crawling pages for URLs... (although you could write a quick crawler and then use this alongside it to write the file... maybe a post for next week).

The upside though is that this will write your SiteMaps essentially as quick as you can pull the data from the database. I recently used it to generate > 4 Million URLs in around 30 seconds.

Some things to note:

You can try it out yourself like so

    public static void Main(string[] args)
    {
        var writer = new SiteMapWriter(
                @"C:\SiteMapDirectory\",
                "SiteMap",
                "http://www.intelligiblebabble.com/");

        for(int i = 0; i < 300000; i++)
        {
            writer.AddUrl(
                string.Format("{0}/index.html",Guid.NewGuid()));
        }
        writer.Finish();
    }

Here I am generating 300,000 (fake) URLs. Google will not accept sitemap files with more than 50,000 URLs (any more than that and these files are going to be getting pretty large). As a result, this script will create a parent SiteMap file which will link to children sitemap files - each less than 50,000 URLs long. I have set the default max number of URLS in each file to be 30,000 just to be on the safe side - but you can override this in the constructor with the maxUrlsPerFile param.

The Sitemaps generated will generally look like this:

    <?xml version="1.0" encoding="UTF-8"?>
    <?xml-stylesheet type="text/xsl" href="http://www.intelligiblebabble.com/files/style.xsl"?>
    <urlset
    	xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
    	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    	xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9&#xA;http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
      <url>
        <loc>2b55897a-43d1-4d3f-bec0-22ff50226a9a/index.html</loc>
        <priority>0.5000</priority>
      </url>
      <url>
        <loc>a4cb2c7a-3080-4e77-a5e8-27a869e33afc/index.html</loc>
        <priority>0.5000</priority>
      </url>
      <url>
        <loc>614f281b-c60b-4dca-9c5c-9c59f1fff1fe/index.html</loc>
        <priority>0.5000</priority>
      </url>
    </urlset>

Some other things to note are:

- A HashSet is used to maintain that there are no duplicate URLs inserted into the file.
- the AddUrl method accepts a <strong>changefreq</strong> parameter, and <strong>priority</strong> parameter to set the corresponding XML attributes
- if you are generating the base URL from the database, or you would like to keep the URLs relative, you can leave off the **baseUri** parameter from the constructor

That's pretty much it, please let me know if this was helpful to anyone.
