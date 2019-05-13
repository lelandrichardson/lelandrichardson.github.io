---
title: "Building an Image Uploading & Resizing Framework in ASP.Net"
date: "2013-02-11T08:00:00.000Z"
draft: true
---

Images are really important for us at Tech.Pro. When writing tutorials, it is important for you to quickly be able to insert images into your document, resize them, etc. Often times, you may want to allow users to upload an image, and then generate several different sizes of that image for the user. This is often needed for thumbnails and such. This is common practice and is seen on other blogging platforms such as wordpress.

The issue with this, is you might not always know what different sizes you will want. Maybe you need a 150x150 image for a thumbnail, but then down the road you change the thumbnail size to be 128x128px. Now you have to retroactively regenerate a bunch of images... that's no good.

Thus, I sought out to create a flexible Image Uploading and Resizing framework for Tech.Pro.

The basic idea is this:

1. Original image is stored on disk as **original.png** with a uniquely identified folder structure. A Unique identifier (in this case a base64-encoded guid) is created to identify the image (ie, `~/images/{guid}/original.png`).
2. All HTTP requests to `~/images/*` are routed through an `HttpHandler`

Where the HTTP Handler has the following functionality:

1. HTTP Requests of the form `~/images/{guid}/original.png` serve the corresponding file
2. HTTP Requests of the form `~/images/{guid}/w250-h110.png`, check for the existence of the corresponding file.
   - If file exists, it is served.
   - If file does not exist, **original.png** is used to generate an image of the appropriate size (in this case, 250x110)

Other request formats are accepted, like the following:

- `~/images/{guid}/w250.png` generates an image 250px wide, with the height whatever it needs to be to keep proportional.
- `~/images/{guid}/h250.png` generates an image 250px tall, with the width whatever it needs to be to keep proportional.
- `~/images/{guid}/w250-h115.png` generates an image 250px by 115px. The image stays in proportion, and any gap is filled with transparent pixels.
- `~/images/{guid}/cropped-w250-h115.png` generates an image 250px by 115px. The image stays in proportion, and any excess pixels are simply cropped.

This provides us with a lot of flexibility, and allows us to manage a single image while being able to serve it to the client in whatever size we desire.

As a result, I can upload an image, and make it 320px wide: `~/images/{guid}/w320.png` produces

![](http://tpstatic.com/img/usermedia/JjmhrliGwEu_zwOFrRexwQ/w320.png)

Or I can make a smaller thumbnail: `~/images/{guid}/w128.png` produces

![](http://tpstatic.com/img/usermedia/JjmhrliGwEu_zwOFrRexwQ/w128.png)

Or I can crop it, to make it tall: `~/images/{guid}/cropped-w128-h300.png` produces

![](http://tpstatic.com/img/usermedia/JjmhrliGwEu_zwOFrRexwQ/cropped-w128-h300.png)

Note: tech.pro uses a system similar to this for user-uploaded images, which is being used above. Our version has a couple of additional features to take into account a distributed architecture, and some security, etc.

So let's get into the code now.

##Step 1: Handling the Upload

    public ActionResult Upload()
    {
        var mediaRepository = new MediaRepository();
        UserImage userImage;

        var uploadFiles = Request.Files;
        if (uploadFiles.Count > 0 && uploadFiles[0] != null)
        {
            // user is uploading a file from his/her computer
            userImage = mediaRepository.FromPost(uploadFiles[0]);
        }
        else if (Request["url"] != null)
        {
            // User wants to upload an image from the web.
            userImage = mediaRepository.FromUrl(Request["url"]);
        }
        else
        {
            // something is wrong, send back HTTP Error Code
            return new HttpStatusCodeResult(HTTP.BadRequest);
        }

        // create and save image
        mediaRepository.InsertImage(userImage.Guid, Identity.MemberId);

        // how does the client want us to return the guid?
        var returnFormat = Request["format"] ?? "json";
        switch (returnFormat)
        {
            case "redirect": // redirect user to a page with the resulting guid as a parameter
                var redirectUrl = Request["redirect-url"];
                return new RedirectResult(redirectUrl + "?guid=" + userImage.Guid, false);

            default: // by default, just send json back
                return Json(new
                    {
                        guid = userImage.Guid,
                        original = userImage.OriginalUrl,
                        thumbnail = userImage.UrlForWidth(128)
                    });
        }
    }

The code above is written as an ASP.Net MVC ActionResult, however it could be implemented essentially verbatim in ASP.Net WebForms or ASP.Net WebPages.

Of course, the code above relies on a couple of other classes. The most important of which, is the `MediaRepository` class. Let's have a look at that:

    public class MediaRepository
    {
        /// <summary>
        /// Creates a folder with the provided guid, makes sure it exists, and then returns the full folderpath
        /// </summary>
        public string ConstructPath(string guid)
        {
            string rootPath = HttpContext.Current.Server.MapPath("~/img/usermedia");
            var folderPath = Path.Combine(rootPath, guid);
            var imagePath = Path.Combine(folderPath, "original.png");

            if (!Directory.Exists(folderPath))
            {
                Directory.CreateDirectory(folderPath);
            }
            return imagePath;
        }

        /// <summary>
        /// Creates image based on user uploaded file
        /// </summary>
        /// <param name="postedFile"></param>
        public UserImage FromPost(HttpPostedFileBase postedFile)
        {
            string guid = ShortGuid.NewGuid().Value;

            var imagePath = ConstructPath(guid);

            using (var image = Image.FromStream(postedFile.InputStream))
            {
                image.Save(imagePath, ImageFormat.Png);
            }

            return new UserImage(guid);
        }

        /// <summary>
        /// Creates image based on Url.
        /// Note: this method creates a WebClient and downloads the image
        /// </summary>
        /// <param name="url">Url to image</param>
        public UserImage FromUrl(string url)
        {
            string guid = ShortGuid.NewGuid().Value;

            var imagePath = ConstructPath(guid);

            var webClient = new WebClient();
            webClient.DownloadFile(url, imagePath);

            using (var fs = new FileStream(imagePath, FileMode.Open, FileAccess.Read))
            using (var image = Image.FromStream(fs))
            {
                image.Save(networkPath, ImageFormat.Png);
            }
            return new UserImage(guid);
        }
    }

You may also notice that this class uses two more custom classes: `UserImage` and `ShortGuid`. `ShortGuid` is simply a wrapper around `System.Guid` which encodes them in base64 so they are a little bit cleaner and shorter than the standard base16 guids, but still URL-safe, [the code for which can be found here][1].

`UserImage` is a helper class used to help create and manage the image URLs.

    public class UserImage
    {
        /// <summary>
        /// Server-Relative Folder Path for Image Storage
        /// </summary>
        public const string MediaRelativePath = @"~/images/";

        /// <summary>
        /// Constructs UserImage wrapper with corresponding guid
        /// </summary>
        /// <param name="guid">guid of image</param>
        public UserImage(string guid)
        {
            Guid = guid;
            OriginalUrl = Url(guid, 0, 0);
        }

        public string Guid { get; private set; }

        public string OriginalUrl { get; private set; }

        /// <summary>
        /// Returns Fully qualified URL for image
        /// </summary>
        /// <param name="width">width in pixels</param>
        /// <param name="height">height in pixels</param>
        /// <param name="isCropped">if true, image will be cropped to size</param>
        public string Url(int width, int height, bool isCropped = true)
        {
            return Url(Guid, width, height, isCropped);
        }

        public string UrlForWidth(int width)
        {
            return Url(Guid, width, 0);
        }
        public string UrlForHeight(int height)
        {
            return Url(Guid, 0, height);
        }
        public string UrlSquare(int size)
        {
            return Url(Guid, size, size, true);
        }

        private static string Url(string guid, int width, int height, bool isCropped = false)
        {
            if (width == 0 && height == 0)
            {
                return string.Format(@"{0}/{1}/original.png", MediaRelativePath, guid);
            }
            if (width == 0 && height > 0)
            {
                return string.Format(@"{0}/{1}/h{2}.png", MediaRelativePath, guid, height);
            }
            if (height == 0 && width > 0)
            {
                return string.Format(@"{0}/{1}/w{2}.png", MediaRelativePath, guid, width);
            }
            return string.Format(@"{0}/{1}/{4}w{2}-h{3}.png", MediaRelativePath, guid, width, height, isCropped?"cropped-":"");
        }
    }

##Step 2: Handling the Requests (the HttpHandler)

There is plenty of logic in the HttpHandler, but the general concept of it can be understood most easily by looking at the `ProcessRequest(HttpContext context)` method:

    public void ProcessRequest(HttpContext context)
    {
        //see if image has been created, if so - serve and end processing.
        string physicalPath = context.Request.PhysicalPath;
        if (File.Exists(physicalPath))
        {
            ServeImage(context, Image.FromFile(physicalPath));
            return;
        }

        Image image;

        //path = "<guid>/<filename>.png"
        //args = ["<guid>","w<width>-h<height>",".png"];
        string[] args = context.Request.AppRelativeCurrentExecutionFilePath
                        .Replace(RootImageRelativePath, string.Empty)
                        .Split('/', '.');

        if (args.Length != 3)
        {
            //incorrect file structure, return not found
            ReturnNotFound(context);
            return;
        }

        string guid = args[0];
        string sizeParam = args[1];

        if (sizeParam == "original")
        {
            image = Image.FromFile(OrigFilePath(guid));
        }
        else
        {
            var size = GetWidthHeightParams(sizeParam);

            image = RetreiveImage(guid, size.Width, size.Height, size.IsCropped);
        }

        if (image == null)
        {
            ReturnNotFound(context);
            return;
        }

        ServeImage(context, image);
    }

The result is one of two responses being sent to the client, an image or a 404. Of course these images are static, so we would like to utilize caching as best as possible. The following methods are used for this:

    private static void ServeImage(HttpContext context, Image image)
    {
        context.Response.Clear();
        context.Response.ContentType = "image/png";
        context.Response.CacheControl = "public";
        context.Response.Expires = 525600; //one year
        context.Response.AddHeader("content-disposition", "inline;");
        image.Save(context.Response.OutputStream, ImageFormat.Png);
        image.Dispose();
    }

    private static void ReturnNotFound(HttpContext context)
    {
        context.Response.StatusCode = 404;
        context.Response.Close();
    }

The rest of the logic primarily entails the saving and resizing of images. I have included the full source below:

    /// <summary>
    /// Request Template:
    ///     ~/images/[GUID]/w[width-in-pixels]-h[height-in-pixels].png
    ///     ~/images/[GUID]/w[width-in-pixels].png
    ///     ~/images/[GUID]/h[height-in-pixels].png
    ///     ~/images/[GUID]/cropped-w[width-in-pixels]-h[height-in-pixels].png
    ///     ~/images/[GUID]/original.png
    /// For Example, with GUID: "acypAlENrUeSOX4-1n-yzg"
    ///     ~/images/acypAlENrUeSOX4-1n-yzg/w40-h60.png
    ///
    /// </summary>
    public class ImageStoreHandler : IHttpHandler
    {

        private const string RootImageRelativePath = @"~/images/";

        #region IHttpHandler Members

        public bool IsReusable { get { return false; } }

        public void ProcessRequest(HttpContext context)
        {
            //see if image has been created, if so - serve and end processing.
            string physicalPath = context.Request.PhysicalPath;
            if (File.Exists(physicalPath))
            {
                ServeImage(context, Image.FromFile(physicalPath));
                return;
            }

            Image image;

            //path = "<guid>/<filename>.png"
            //args = ["<guid>","w<width>-h<height>",".png"];
            string[] args = context.Request.AppRelativeCurrentExecutionFilePath
                            .Replace(RootImageRelativePath, string.Empty)
                            .Split('/', '.');

            if (args.Length != 3)
            {
                //incorrect file structure, return not found
                ReturnNotFound(context);
                return;
            }

            string guid = args[0];
            string sizeParam = args[1];

            if (sizeParam == "original")
            {
                image = Image.FromFile(OrigFilePath(guid));
            }
            else
            {
                var size = GetWidthHeightParams(sizeParam);

                image = RetreiveImage(guid, size.Width, size.Height, size.IsCropped);
            }

            if (image == null)
            {
                ReturnNotFound(context);
                return;
            }

            ServeImage(context, image);
        }

        #endregion

        private struct SizeParam
        {
            public int Width;
            public int Height;
            public bool IsCropped;
        }

        private static SizeParam GetWidthHeightParams(string sizeParam)
        {
            var args = sizeParam.Split('-');
            int width = 0, height = 0;
            bool isCropped = false;
            foreach (var s in args)
            {
                switch (s[0])
                {
                    case 'w':
                        int.TryParse(s.Substring(1), out width);
                        break;
                    case 'h':
                        int.TryParse(s.Substring(1), out height);
                        break;
                    case 'c':
                        isCropped = s.Equals("cropped",StringComparison.OrdinalIgnoreCase);
                        break;
                }
            }
            return new SizeParam
            {
                Width = width,
                Height = height,
                IsCropped = isCropped
            };
        }

        private Image RetreiveImage(string guid, int width, int height, bool isCropped)
        {
            //check if file exists
            //if exists, return file
            //if not exists, make image
            //save image
            //return image

            string filePathToReturn = FilePath(guid, width, height, isCropped);

            //if (File.Exists(filePathToReturn))
            //{
            //    return Image.FromFile(filePathToReturn);
            //}

            string originalImageFilePath = OrigFilePath(guid);

            if (File.Exists(originalImageFilePath))
            {
                var image = (Bitmap)Image.FromFile(originalImageFilePath);

                var resizedImage = ResizeImage(image, width, height, isCropped);

                resizedImage.Save(filePathToReturn, ImageFormat.Png);

                return resizedImage;
            }
            return null;
        }

        private static Image ResizeImage(Image image, int width, int height, bool isCropped)
        {
            return isCropped ?
                ResizeWithCropping(image, width, height) :
                ResizeWithoutCropping(image, width, height);
        }

        private static Bitmap ResizeWithoutCropping(Image image, int width, int height)
        {
            int sourceWidth = image.Width;
            int sourceHeight = image.Height;

            var currentRatio = ((float)sourceWidth / (float)sourceHeight);
            if (height == 0 && width > 0)
            {
                //resize to width
                height = (int)(width / currentRatio);
            }
            if (width == 0 && height > 0)
            {
                //resize to height
                width = (int)(height * currentRatio);
            }

            int sourceX = 0;
            int sourceY = 0;
            int destX = 0;
            int destY = 0;

            float nPercent = 0;
            float nPercentW = 0;
            float nPercentH = 0;

            nPercentW = ((float)width / (float)sourceWidth);
            nPercentH = ((float)height / (float)sourceHeight);
            if (nPercentH < nPercentW)
            {
                nPercent = nPercentH;
                destX = Convert.ToInt16((width -
                              (sourceWidth * nPercent)) / 2);
            }
            else
            {
                nPercent = nPercentW;
                destY = Convert.ToInt16((height -
                              (sourceHeight * nPercent)) / 2);
            }

            int destWidth = (int)(sourceWidth * nPercent);
            int destHeight = (int)(sourceHeight * nPercent);

            var bmPhoto = new Bitmap(width, height, PixelFormat.Format24bppRgb);
            bmPhoto.SetResolution(image.HorizontalResolution, image.VerticalResolution);

            using (var grPhoto = Graphics.FromImage(bmPhoto))
            {
                grPhoto.Clear(Color.White);

                grPhoto.InterpolationMode = InterpolationMode.HighQualityBicubic;
                grPhoto.SmoothingMode = SmoothingMode.HighQuality;
                grPhoto.PixelOffsetMode = PixelOffsetMode.HighQuality;
                grPhoto.DrawImage(image,
                    new Rectangle(destX, destY, destWidth, destHeight),
                    new Rectangle(sourceX, sourceY, sourceWidth, sourceHeight),
                    GraphicsUnit.Pixel);
            }
            bmPhoto.MakeTransparent(Color.White);
            return bmPhoto;
        }

        private static Bitmap ResizeWithCropping(Image image, int width, int height)
        {
            int sourceWidth = image.Width;
            int sourceHeight = image.Height;
            int sourceX = 0;
            int sourceY = 0;
            int destX = 0;
            int destY = 0;

            float nPercent = 0;
            float nPercentW = 0;
            float nPercentH = 0;

            nPercentW = ((float)width / (float)sourceWidth);
            nPercentH = ((float)height / (float)sourceHeight);

            if (nPercentH < nPercentW)
            {
                nPercent = nPercentW;
                destY = (int)((height - (sourceHeight * nPercent)) / 2);
            }
            else
            {
                nPercent = nPercentH;
                destX = (int)((width - (sourceWidth * nPercent)) / 2);
            }

            int destWidth = (int)(sourceWidth * nPercent);
            int destHeight = (int)(sourceHeight * nPercent);

            Bitmap bmPhoto = new Bitmap(width,
                    height, PixelFormat.Format24bppRgb);
            bmPhoto.SetResolution(image.HorizontalResolution,
                    image.VerticalResolution);

            using (var grPhoto = Graphics.FromImage(bmPhoto))
            {
                grPhoto.Clear(Color.White);

                grPhoto.InterpolationMode = InterpolationMode.HighQualityBicubic;
                grPhoto.SmoothingMode = SmoothingMode.HighQuality;
                grPhoto.PixelOffsetMode = PixelOffsetMode.HighQuality;

                grPhoto.DrawImage(image,
                    new Rectangle(destX, destY, destWidth, destHeight),
                    new Rectangle(sourceX, sourceY, sourceWidth, sourceHeight),
                    GraphicsUnit.Pixel);
            }
            bmPhoto.MakeTransparent(Color.White);
            return bmPhoto;
        }

        private static string FilePath(string guid, int width, int height, bool isCropped = false)
        {
            var RootImageFolder = HttpContext.Current.Server.MapPath(RootImageRelativePath);
            if (width == 0 && height == 0)
            {
                return string.Format(@"{0}\{1}\original.png", RootImageFolder, guid);
            }
            if (width == 0 && height > 0)
            {
                return string.Format(@"{0}\{1}\h{2}.png", RootImageFolder, guid, height);
            }
            if (height == 0 && width > 0)
            {
                return string.Format(@"{0}\{1}\w{2}.png", RootImageFolder, guid, width);
            }
            return string.Format(@"{0}\{1}\{4}w{2}-h{3}.png", RootImageFolder, guid, width, height, isCropped ? "cropped-":"");
        }

        private static string OrigFilePath(string guid)
        {
            return FilePath(guid, 0, 0);
        }

        private static void ServeImage(HttpContext context, Image image)
        {
            context.Response.Clear();
            context.Response.ContentType = "image/png";
            context.Response.CacheControl = "public";
            context.Response.Expires = 525600; //one year
            context.Response.AddHeader("content-disposition", "inline;");
            image.Save(context.Response.OutputStream, ImageFormat.Png);
            image.Dispose();
        }

        private static void ReturnNotFound(HttpContext context)
        {
            context.Response.StatusCode = 404;
            context.Response.Close();
        }
    }

##Step 3: The User Experience

Now we have all the plumbing figured out, we need to create the front-end for the users to simply and seamlessly upload images and take advantage of the resizability of them as well.

For the most part, this will vary depending on the application, and I will consider building the UI out of the scope of this tutorial.

I will, however, go into a little bit of detail as to how this was implemented here at Tech.Pro. If you registered today, you would be able to go write a tutorial or blog and you would see a toolbar over the top of our editor:

![][editor_img_button]

clicking the image button, a dialog appears. Here you have the option to upload an image on your local machine, or directly from the web via a URL.

![][upload_dialog_options]

After the image is uploaded, a preview is shown where you have the ability to change the size of it before it is added to your markup.

![][size_options]

In addition, the image is shown in the sidebar where you can use it later if you need to.

![][sidebar]

Anyway, that about sums it up. One might want to think carefully about exactly how they use this in a production app, as you may want to prevent anyone and everyone from being able to upload images and using it as their own personal imgur or something. This might simply start you off in the right direction.

If there are any questions or comments please let me know below!

[editor_img_button]: http://tpstatic.com/img/usermedia/ECC_wanUwkm3Ekouq-NlLg/original.png
[upload_dialog_options]: http://tpstatic.com/img/usermedia/CbAYGpiTjUmSA-2tolc2DQ/original.png
[size_options]: http://tpstatic.com/img/usermedia/mQ3iqa3fpEGdr9JBCAPisQ/original.png
[from_url]: http://tpstatic.com/img/usermedia/1OUfQNtqSkeE3ADlPDO5qQ/original.png
[sidebar]: http://tpstatic.com/img/usermedia/bP8EwLGn_k6wlhT--A7npA/original.png
[1]: http://www.singular.co.nz/blog/archive/2007/12/20/shortguid-a-shorter-and-url-friendly-guid-in-c-sharp.aspx
