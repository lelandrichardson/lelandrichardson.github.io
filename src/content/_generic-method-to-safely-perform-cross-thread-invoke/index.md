---
title: "Generic Method to Safely Perform Cross-Thread Invoke"
date: "2011-08-15T07:00:00.000Z"
draft: true
---

Have you ever written a multi-threaded application in .NET? If you have, chances are, you think that <a href="http://msdn.microsoft.com/en-us/library/ms171728.aspx">making thread-safe calls to update your UI</a> is, well, really annoying and verbose at best.

The issue is that every time you are doing work in a thread other than your UI thread, and then need to update the UI from said thread, you need to create a delegate pattern in order to do so without getting an InvalidOperationException.

Well, turns out Michael Demeersseman over at CodeProject shares our hatred for these cross-thread calls, and wrote <a title="Updating Your Form from Another Thread without Creating Delegates for Every Type of Update" href="http://www.codeproject.com/KB/cs/Threadsafe_formupdating.aspx">some generic extension methods</a> which allow you to now perform cross-thread operations in essentially one line of code.

The extension methods are as follows:

    public static TResult SafeInvoke(this T isi, Func call) where T : ISynchronizeInvoke
    {
        if (isi.InvokeRequired) {
            IAsyncResult result = isi.BeginInvoke(call, new object[] { isi });
            object endResult = isi.EndInvoke(result); return (TResult)endResult;
        }
        else
            return call(isi);
    }

    public static void SafeInvoke(this T isi, Action call) where T : ISynchronizeInvoke
    {
        if (isi.InvokeRequired) isi.BeginInvoke(call, new object[] { isi });
        else
            call(isi);
    }

This is cool.  So now if I want to set the value of a progress bar:

    progressBar1.SafeInvoke(b => b.Value = progress);

Or if i want to simply call a method in my UI thread from another:

    formInstance.SafeInvoke(f => f.myFormMethod("parameter1","parameter2"));

And finally, grabbing text/value from a control in your UI thread is one line too:

    string textBoxText = txtBox1.SafeInvoke(f => f.txtBox1.Text);

See the <a title="Updating Your Form from Another Thread without Creating Delegates for Every Type of Update" href="http://www.codeproject.com/KB/cs/Threadsafe_formupdating.aspx">full article</a> here.
