---
title: "Creating a Dictionary<T,V> which doesn't throw a KeyNotFoundException"
date: "2014-03-10T07:00:00.000Z"
draft: false
---

I find it interesting when there are certain tasks in one language which feel simple, fluid, and elegant to write, when in another language they feel sloppy and wrong. This happens every so often and I try to think of a clean way to solve such a problem. Often this doesn't lead anywhere, but I wanted to briefly share something that did.

### Dictionaries in JavaScript

In JavaScript, it is fairly commonplace to treat standard objects as a "hash map" or a dictionary / set of key value pairs. Indeed it could possibly not be simpler:

```js
var dict = {}; // our dictionary
```

in this case we can set the dictionary entry for "foo" to be 1:

```js
dict["foo"] = "xyz";
```

we can then retrieve it:

```js
var foo = dict["foo"];
```

Pretty standard. What if we want to get a value, if it's present, and a default if not?

```js
var bar = dict["bar"] || "abc"; // "abc" is our default value for "bar"
```

Pretty simple.

### Dictionaries in C

Now let's jump over to C#. Of course, in C#'s case, we are strictly typed... so we are going to need to declare a typed dictionary like so:

```csharp
var dict = new Dictionary<string,int>();
```

Still pretty simple. So now we want to add an entry.... also pretty simple:

```csharp
dict["foo"] = 1; // using indexer
dict.Add("foo", 1); // using .Add() method
```

Getting a value:

```csharp
var foo = dict["foo"];
```

This is all good and easy. But there _is_ a bit of a difference between this line and the JavaScript equivalent: in this case, we might have just thrown an error!

If there is no entry for "foo" in the dictionary, then this will throw a `KeyNotFoundException`.

This isn't necessarily a bad thing. In many cases this is exactly what we want. In fact, what is the alternative?

You see, in JavaScript, we have a value `undefined` to specify these types of situations... the situations where you requested a value that has never been declared. In C#, we just have `null`.

The problem is, in C#, it is perfectly valid to _set_ a value of the dictionary to `null`. So how does one differentiate between accessing a key of a dictionary which has never been set, and accessing the key of a dictionary whose corresponding value is null?

This question, of course, was asked by the creators of the language C# years ago, and the answer was to throw a `KeyNotFoundException` in the case of the former.

Although I don't disagree with their conclusion, I sometimes wish there was a different way. Sometimes I don't want there to be a difference between a null value and the absense of a key. Without implementing your own dictionary, the best you can do is this:

```csharp
string bar;
if(!dict.TryGetValue("bar", out bar) || bar == null){
    bar = "abc";
}
// do something with bar
```

That just seems a bit verbose to me. The alternate syntax would be:

```csharp
var bar = dict["bar"] ?? "abc";
```

Of course, this is actually quite simple to obtain if you just implement your own "safe" version of Dictionary:

```csharp
public class SafeDictionary<TKey, TValue> : Dictionary<TKey, TValue> where TValue : class
{
    public new void Add(TKey key, TValue value)
    {
        if (value == null)
        {
            // adding null value is pointless...
            return;
        }
        base.Add(key, value);
    }

    public new void Remove(TKey key)
    {
        if (!ContainsKey(key))
        {
            // nothing to do
            return;
        }
        base.Remove(key);
    }

    public new TValue this[TKey key]
    {
        get
        {
            TValue value;
            return TryGetValue(key, out value) ? value : null;
        }
        set
        {
            if (value == null)
            {
                // setting value null is same as removing it
                Remove(key);
            }
            else
            {
                base[key] = value;
            }
        }
    }
}
```

The most significant limitation here is that you have to restrict `TValue` to `where TValue : class`, so as to make it nullable.

I'm not sure if anyone else has struggled with this as an issue, but if so, feel free to use the above class!
