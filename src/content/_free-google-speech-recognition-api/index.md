---
title: "Free Google Speech Recognition API"
date: "2011-08-16T07:00:00.000Z"
draft: true
---

If you are a web developer (or if you're not) and you haven't had a chance to check out the new x-webkit-speech input that should now be accessible to HTML5 capable browsers (or is it webkit-based only?)

If you haven't seen it or used it on google's home page (which, if you don't use chrome, chances are you haven't) then it is worth the [chrome download][1] just to try it out.  At least I think so.  The basic idea is now with adding just the following html to your webpage:

    <input id="speechInput" type="text" x-webkit-speech />

You have successfully created a text input on a webpage, just like it would have before, except now it has a nifty little mic icon on the right side of it, which when clicked will immediately tap into your microphone and wait for you to "utter" a word, phrase, or sentence even - and then transcribe it and place it right inside the text box.  Pretty cool, eh?

Not only will this recognize what us English-speaking web surfers are saying, but it apparently automatically recognizes what language you are speaking in - without even needing to speek more than a single word or phrase! Obviously, a task such as speech recognition, especially multi-lingual speech recognition, has been something that has been difficult for quite some time - and requires a lot of linguistic data in order to function properly.  Something like this cannot be processed client-side, and must be passed onto a server.

So far this client-to-server communication is occurring through the actual user-agent, rather than the browser client.  This is very likely necessary as a result of security reasons - some of which are outlined in [Google's draft on the API][2]

Either way, this little input element has generated a bit of buzz lately as several curious fellows decided to dissect how this thing works. Turns out, google has exposed (at least for now) an API at the following URI which one can post to with whatever HTTP client he/she wants to:

> [https://www.google.com/speech-api/v1/recognize][3]

It seems that most found this URI most easily by navigating through [Chromium source code][4] to find where the open-sourced browser manages to turn our mumbles into text. Several people have already managed to get this working in several languages, and some have even created wrappers.  For instance, over at Github there is a [speech2text Ruby Wrapper][5] which interfaces with this API.  Similarly, [Mike Pultz's Article][6] and [Fenn Bailey's Article][7] show how to use Perl and Sox to easily create the audio to the right specifications and send it off.

Fenn's article goes into a bit of detail showing how to use SoX to properly normalize and clean up the audio into the best format for the API to recognize the speech in.

The API returns several possible interpretations of the speech, along with its confidence levels:

    {
        "hypotheses": [
            {
                "confidence": 0.88569070000000005,
                "utterance": "this is pretty cool"
            },
            {
                "utterance": "thesis pretty cool"
            },
            {
                "utterance": "this is spirit cool"
            },
            {
                "utterance": "this ease pretty cool"
            },
            {
                "utterance": "this is pretty kool"
            }
        ],
        "id": "48e33aa5b2e21889c66f69ae492307b7-1",
        "status": 0
    }

[Source][8]

I'm only wondering how long it will take to get a wrapper of this in every major programming language out there.  Google has done us a good one and made it super-easy to put this form of data input in any web application of our choosing - but it would still be nice to have the same capabilities in any desktop application, yah?

If one doesn't come out soon, I may spend some time building some clean UI controls for .NET or Java that replicate the x-webkit-speech input.

Or, since Windows 8 is going to use HTML5 ANYWAY, does it really matter???

[1]: http://chrome.google.com
[2]: http://www.w3.org/2005/Incubator/htmlspeech/2010/10/google-api-draft.html
[3]: https://www.google.com/speech-api/v1/recognize
[4]: http://src.chromium.org/viewvc/chrome/trunk/src/content/browser/speech/speech_recognition_request.cc?content-type=text/plain
[5]: https://github.com/taf2/speech2text
[6]: http://mikepultz.com/2011/03/accessing-google-speech-api-chrome-11/
[7]: http://fennb.com/fast-free-speech-recognition-using-googles-in
[8]: http://fennb.com/fast-free-speech-recognition-using-googles-in
