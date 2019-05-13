---
title: "Custom Lucene Tokenizer for Tech Keywords"
date: "2015-05-13T07:00:00.000Z"
draft: false
---

In the world of search and text indexing, Lucene is perhaps the most pervasive implementation. These days many developers opt to use technology that uses Lucene's inverted index implementation under-the-hood, like Elastic Search, Solr, etc.

Indexing text is hard. Lucene will get you most of the way, but massive search engines like Google have spoiled most of the public into expecting search to "just work".

At Tech.pro, we use Lucene.Net to power our search, and it works pretty well, but there are some issues. One issue in particular that I'd like to talk about today is tokenizing.

Lucene has some built in tokenizers that work pretty well for most scenarios. Tokenizers are meant to take in an arbitrary piece of text content, and then normalize it into a stream of "tokens" which can then be compared to one another, where equality would mean that they "meant" the same thing.

This seems fairly simple, and it can be, but it can also get quite complicated.

For instance, consider the simple situation of plural word forms:

> The cat was cleaning its fur

versus

> The cats were cleaning their fur

In this case, if we made the search `cat fur`, depending on your tokenizer, only the first example, with the non-plural "cat" would show up.

Lucene comes with several tokenizers to abstract out some of this complexity for common use cases. In Tech.pro's case, we used the `StandardAnalyzer`, which is intended for text in the english language, and normalizes based on a couple of factors.

One thing the standard analyzer does is remove punctuation and non-word characters. This is normally desirable, but on Tech.pro we talk a lot about technologies, some of which have punctuation in their name.

Consider the scenario where someone wants to search for articles on C#. They might search for `C# tutorial`, which lucene would then tokenize into the two tokens: `c tutorial`.

The problem here is that `C#` gets tokenized into `c`, but `c` is already a meaningful think in tech (a programming language), not to mention that there is also `C++` (another language) which also gets normalized into `c`.

This had been a known problem in our search since day one, so we decided to investigate to see what could be done.

### Creating a custom Tokenizer

I didn't want to reinvent the wheel, so from the get-go I tried to figure out what classes Lucene already exposes that we could override for our purposes.

The `CharTokenizer` was one such class. The `CharTokenizer` is a very basic implementation of a tokenizer which simply looks character-to-character to determine if a character is or isn't part of a token, and then streams contiguous token characters together into a single token.

This works great if determining whether or not a character is part of a token is only a function of the character itself. This isn't the scenario we are in, but it is a useful first step. I created a `TechKeywordTokenizer` that simply includes all letters, digits, and the characters `+`, `#`, and `.` into the set of valid token characters. After some looking around, this seems to be inclusive of most of the tech keywards that I wanted to differentiate.

```csharp
public class TechKeywordTokenizer : CharTokenizer
{
    protected override char Normalize(char c)
    {
        return char.ToLower(c);
    }

    protected override bool IsTokenChar(char c)
    {
        // we are splitting tokens on non-letters, so long
        // as they are not "+" or "#", which are often used in tech
        // key words (like C++ and C#)
        return char.IsLetterOrDigit(c) || c == '+' || c == '#' || c == '.';
    }
}
```

Stopping here would clearly be problematic, as now we've just lobbed a huge curve-ball into our indexing process. At this point, if a word was at the end of a sentence, it would tokenize differently than if it was in the middle of a sentence. For instance, with the two sets of text:

> This was fun.

and

> This was fun and scary.

Only the latter would show up for a search for `fun`.

In this case, we need to create a `TokenFilter` to take in the tokens from the `TechKeywordTokenizer`, and let the good ones through, and fix the bad ones (like periods at the end of a sentence).

```csharp
public class TechKeywordTokenFilter : TokenFilter
{
    private TermAttribute termAtt;

    public TechKeywordTokenFilter(TokenStream input) : base(input)
    {
        this.termAtt = (TermAttribute)this.AddAttribute(typeof(TermAttribute));
    }

    private string Normalize(string term)
    {
        term = term.TrimStart('#', '+');
        term = term.TrimEnd('.');
        if (term.Length == 0)
        {
            return null;
        }
        return term;
    }

    public override bool IncrementToken()
    {
        while (this.input.IncrementToken())
        {
            var term = this.termAtt.Term();
            var first = term[0];
            var last = term[term.Length - 1];

            // unless these conditions are met, we don't need to do
            // anything special
            if (first == '#' || first == '+' || last == '.')
            {
                // update the term to what we actually want it to be.
                // if null is returned, then move onto next term
                var newTerm = Normalize(termAtt.Term());

                if (newTerm == null)
                {
                    continue; // next token
                }
                termAtt.SetTermBuffer(newTerm);
            }

            return true;
        }
        return false;
    }

}
```

This is a lot of code for something pretty simple. The important stuff is all in the `Normalize` function:

```csharp
private string Normalize(string term)
{
    term = term.TrimStart('#', '+');
    term = term.TrimEnd('.');
    if (term.Length == 0)
    {
        return null;
    }
    return term;
}
```

Essentially, our tokenizer has left some special characters like `+`, `.`, and `#` on our tokens, but we are removing them again in some cases. Namely, we are removing `+` and `#` from the start of terms, and `.` from the end of terms. (that's it!).

### Building our Analyzer

We now want to build an analyzer that does the full tokenization of our text. This is simply putting together the classes we have just built, and the built-in tokenizers/filters that we want to use on top of our own.

In this case we want to also add the english `StopFilter` to our overall analysis. To do this, we create a new analyzer and implement the `TokenStream` method:

```csharp
public class TechKeywordAnalyzer : Analyzer
{
    public override TokenStream TokenStream(string fieldName, TextReader reader)
    {
        TokenStream result = new TechKeywordTokenizer(reader);
        result = new TechKeywordTokenFilter(result);
        result = new StopFilter(false, result, StopAnalyzer.ENGLISH_STOP_WORDS_SET, true);
        return result;
    }
}
```

and that's it!

### Have anything to add?

I did a lot of searching to see how others have tackled problems like this, and wound up with very little. If you've implemented similar things for similar problems, or have anything you think we should add to this implementation, let me know!
