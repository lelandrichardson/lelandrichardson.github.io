---
title: "Lukemapper: A Super Fast ORM for Lucene.net"
date: "2013-02-11T08:00:00.000Z"
draft: false
---

Lucene is a document storage search engine library that utilizes inverted indexes and has great capabilities. It has been very popular and has been ported to almost every language, including .Net.

We use Lucene.Net for search here at Tech.Pro. Lucene has incredibly useful features, but it is built to work solely with strings, which can be a strong disadvantage if one is trying to store data of other types in a document. In addition, translating documents to strongly typed objects can be an annoying and redundant task.

We also use Dapper.Net here at Tech.Pro, and we love it's simple API and extremely satisfactory performance.

##Purpose

The concept I am trying to achieve is something similar in spirit to [Dapper][1], except is meant to deal with mapping Lucene Documents to generic Objects, rather than Rows from a database.

Although Lucene is schema-less, in practice there is often an implicit schema in a Document which corresponds to a class or object in your code-base. Although you can easily use ORMs like Dapper or EntityFramework to map data from an RDBMS to CLR objects, doing so in Lucene is cumbersome and error-prone. Enter LukeMapper:

The desired API is something like the following:

Given some generic class in .Net like as follows:

```csharp
class PocoClass
{
    public int Id;
    public string Name;

    public int PropId { get; set; }
    public string PropName { get; set; }
}
```

##Read Operations

If I wanted to run a query against an `IndexSearcher` in Lucene, and return the corresponding documents
mapped to a List<PocoClass>, I could do the following:

```csharp
IndexSearcher searcher;
Query qry;
int numberToReturn = 10;

List<PocoClass> results = searcher.Query<PocoClass>(qry, numberToReturn);
```

Thus, the `.Query<T>(Query,int)` method is implemented as an extension method to an `IndexSearcher`, similar to
how Dapper's `.Query<T>` method is implemented as an extension method to an `IDBConnection` object.

##Write Operations

Similarly, for Write operations, I would do the following:

```csharp
IndexWriter writer;
IEnumerable<PocoClass> objects;

// insert objects into index
writer.Write(objects)
```

And similarly, an update operation:

```csharp
IndexWriter writer;
IEnumerable<PocoClass> objects;
//method to find the corresponding document to update
Func<PocoClass, Query> identifyingQuery = o => new TermQuery(new Term("Id",o.Id.ToString()));

// update objects in index
writer.Update(objects, identifyingQuery);
```

Similar to Dapper and [other Micro-ORMs out there](https://github.com/sapiens/SqlFu), the implementation of the **mapping will be done by generating a Deserializer/Serializer method via IL-Generation and caching it**.

For the `.Query()` operation, the desired IL method generated should be semantically similar to the IL generated from the following method:

```csharp
public static PocoClass ExampleDeserializerMethod(Document document)
{
    var poco = new PocoClass();

    poco.Id = Convert.ToInt32(document.Get("Id"));
    poco.Name = document.Get("Name");

    poco.PropId = Convert.ToInt32(document.Get("PropId"));
    poco.PropName = document.Get("PropName");

    return poco;
}
```

Similarly, for the `.Write()` and `Update()` methods, the Serializer methods will be semantically similar to the IL generated from the following method:

```csharp
public static Document ExampleSerializerMethod(PocoClass obj)
{
    var doc = new Document();

    doc.Add(new Field("Id", obj.Id.ToString(), Field.Store.YES, Field.Index.NOT_ANALYZED_NO_NORMS));
    doc.Add(new Field("Name", obj.Name, Field.Store.YES, Field.Index.NOT_ANALYZED_NO_NORMS));
    doc.Add(new Field("PropId", obj.PropId.ToString(), Field.Store.YES, Field.Index.NOT_ANALYZED_NO_NORMS));
    doc.Add(new Field("PropName", obj.PropName, Field.Store.YES, Field.Index.NOT_ANALYZED_NO_NORMS));

    return doc;
}
```

Although, some error handling may need to be inserted, among other things to make the method a bit more robust.

##Enhancing / Customizing with Attributes

Although basic functionality works essentially out of the box, with no attributes needed, further flexibility is garnered by the use of various Attributes.

```csharp
[LukeMapper(IgnoreByDefault = true)]
public class ExampleClass
{
    // doesn't get indexed/stored
    [Luke(Store = Store.YES)]
    public int Id { get; set; }

    // doesn't get stored, but is indexed in "searchtext" field
    [Luke(Store = Store.NO, Index = Index.ANALYZED, FieldName = "searchtext")]
    public string Title { get; set; }

    // doesn't get stored, but is indexed in "searchtext" field
    [Luke(Store = Store.NO, Index = Index.ANALYZED, FieldName = "searchtext")]
    public string Body { get; set; }

    // doesn't get indexed/stored
    public int IgnoredProperty { get; set; }
}

[LukeMapper(DefaultIndex = Index.ANALYZED)]
public class ExampleClass
{
    // doesn't get indexed/stored
    [Luke(Index = Index.NOT_ANALYZED_NO_NORMS)]
    public int Id { get; set; }

    // get's analyzed, AND stored
    public string Title { get; set; }

    // get's analyzed, AND stored
    public string Body { get; set; }
}

public class ExampleClass
{
    // everything get's indexed and stored by default
    public int Id { get; set; }
    public string Title { get; set; }
    public string Body { get; set; }

    //opt-in ignored per property/field
    [Luke(Ignore=true)]
    public int Ignored { get; set; }
}

public class ExampleClass
{
    // everything get's indexed and stored by default
    public int Id { get; set; }
    public string Title { get; set; }
    public string Body { get; set; }

    //opt-in ignored per property/field
    public int Ignored { get; set; }
}
```

##Custom Serialization/Deserialization

You can override the serialization of certain properties, even more complex ones which are not supported, if it is needed for your application.

For instance, a common example might be that I have a list or array of something that I would like to serialize/deserialize into the document.

In this case, you can simply specify a static method to use for the serialization (and deserialization) using the `LukeSerializerAttribute` and `LukeDeserializerAttribute`.

```csharp
public class TestCustomSerializerClass
{
    public int Id { get; set; }

    //this list would typically be ignored
    public List<string> CustomList { get; set; }

    // if you specify a serializer, it will get serialized
    [LukeSerializer("CustomList")]
    public static string CustomListToString(List<string> list)
    {
        return string.Join(",", list);
    }

    // and similarly, deserialized
    [LukeDeserializer("CustomList")]
    public static List<string> StringToCustomList(string serialized)
    {
        return serialized.Split(',').ToList();
    }
}


public class TestCustomSerializerClass
{
    public int Id { get; set; }

    // maybe you just want to index the list for search, but don't need it on .Query()
    [Luke(Store = Store.NO,Index = Index.ANALYZED)]
    public List<string> CustomList { get; set; }

    // in this case, only a serializer is needed
    [LukeSerializer("CustomList")]
    public static string CustomListToString(List<string> list)
    {
        return string.Join(" ", list);
    }
}
```

As of now, the cacheing is done via a hashcode which should be unique to the declared fields in the `IndexSearcher`'s index,
and the object type which it is being mapped to.

##Data Types supported:

- Textual:
  - `string`
  - `char`
- Numeric:
  - `int`
  - `int?`
  - `long`
  - `long?`
- Other:
  - `bool`
  - `bool?`
  - `DateTime`
  - `DateTime?`
- In Progress (Not Yet Supported):
  - `char?`
  - `byte`
  - `byte?`

##Performance

With an example class:

```csharp
public class TestClass
{
    public int Id;

    public string PropString { get; set; }
}
```

The test was to instantiate 500 instances of `TestClass`, and compared inserting the

<table class="table table-bordered">
<tr>
    <th>Operation</th>
    <th>LukeMapper</th>
    <th>Lucene.Net (native)</th>
</tr>
<tr>
    <td>Insert 500 Documents (With no Serializer Cached)</td>
    <td>89ms</td>
    <td>19ms</td>
</tr>
<tr>
    <td>Insert 500 Documents (Subsequent Calls)</td>
    <td>3.31ms</td>
    <td>4.52ms</td>
</tr>
<tr>
    <td>Query 500 Documents (With no Deserializer Cached)</td>
    <td>49ms</td>
    <td>1ms</td>
</tr>
<tr>
    <td>Query 500 Documents (Subsequent Calls)</td>
    <td>1.26ms</td>
    <td>1.05ms</td>
</tr>
</table>

This is a simple class, with only a string and an int, so I ran a second test with 2 more properties:

```csharp
public class TestClass1
{
    public int Id;
    public string PropString { get; set; }
    public DateTime DateTime { get; set; }
    public int? NullId { get; set; }
}
```

Which had the following similar performance:

<table class="table table-bordered">
<tr>
    <th>Operation</th>
    <th>LukeMapper</th>
    <th>Lucene.Net (native)</th>
</tr>
<tr>
    <td>Insert 500 Documents (With no Serializer Cached)</td>
    <td>103ms</td>
    <td>23ms</td>
</tr>
<tr>
    <td>Insert 500 Documents (Subsequent Calls)</td>
    <td>5.84ms</td>
    <td>6.05ms</td>
</tr>
<tr>
    <td>Query 500 Documents (With no Deserializer Cached)</td>
    <td>42ms</td>
    <td>2ms</td>
</tr>
<tr>
    <td>Query 500 Documents (Subsequent Calls)</td>
    <td>1.84ms</td>
    <td>1.15ms</td>
</tr>
</table>

What these benchmarks show is essentially what is to be expected. The first time `.Write()` is called on a class, it takes O(10^2) ms to generate the deserializer/serializer method. Once it is cached, the write and read operations are of the same order as the native calls (which they should be, since we are generating essentially the same CIL as when we are hand-coding it). What is a bit mysterious to me is why LukeMapper seems to consistently be writing to the index faster. This may be an issue with the benchmark. You can find the actual code used to find these numbers [here][2]

If anyone would like me to compare it to anything else, let me know. As far as I know there aren't really any other ORMs for lucene out there to compare against.

##Pseudo-Code: Under The Hood

The code of LukeMapper is essentially a [single file][3] which exposes several extension methods to `IndexWriter` and `IndexSearcher`.

The `.Query()` method might look like this:

```csharp
public static IEnumerable<T> Query<T>(
    this IndexSearcher searcher,
    Query query,
    int n /*, Sort sort*/)
{
    // run actual search
    TopDocs td = searcher.Search(query, n);

    // if no results, nothing to do
    if (td.TotalHits == 0)
    {
        yield break;
    }

    //check to see if we have a deserializer
    var deserializer = Cache.Get(typeof(T),searcher);

    if(deserializer = null){
        // need to generate deserializer
        deserializer = GenerateDeserializer(typeof(T),searcher);
    }

    //perform mapping
    foreach(var document in td.ScoreDocs.Select(sd=>searcher.Doc(sd.doc)))
    {
        object next;
        next = deserializer(document);
        yield return (T)next;
    }
}
```

All of the magic is essentially in the `GenerateDeserializer` method. This is where reflection is used to determine what IL to generate and cache as a method. In some seriously simplified pseudo-code:

```csharp
private static Func<Document, object> GenerateDeserializer(Type type, IndexSearcher searcher)
{
    var dm = new DynamicMethod(...);
    var il = dm.GetILGenerator();

    var properties = GetSettableProps(type);
    var fields = GetSettableFields(type);
    var attributes = GetLukeAttributes(type);

    foreach(var prop in properties){
        // figure out prop type, attributes, etc. and emit proper IL.
        il.Emit(...);
        il.Emit(...);
        il.Emit(...);
    }
    foreach(var field in fields){
        // figure out prop type, attributes, etc. and emit proper IL.
        il.Emit(...);
        il.Emit(...);
        il.Emit(...);
    }

    return (Func<Document, object>)dm.CreateDelegate(typeof(Func<Document, object>));
}
```

The methods for generating serializer methods are very similar.

If you are interested in the code, you can see it all on [github][4]

###Notes

In many ways this is not as practical as Dapper and is more of a specific application; Lucene is only meant to handle textual data and is schema-less, so mapping to objects of non-textual type with a specific schema is more error prone. The reality, though, is that most Lucene indexes are implemented with a relatively uniform schema.

###Current Status

I have started working on this project more and think it has promise and will likely use it in some projects of my own. If anyone is interested in helping out, I would certainly love the help. On the other hand, if anyone has any suggestions or feature requests, bring them on. Although this is not currently used in the Tech.Pro codebase, it will be soon.

Right now, I am focusing on the following:

- Improve the error handling / feedback currently
- Build in some support for `NumericField`s
- Attribute to specify the "Identifier" of an object, and auto-generate the "identifyingQuery" needed for the `Update()` method.
- Attribute to utilize term vectors usefully
- Build in some automatic support for handling lists in typical fashion (ie csv, json-encoding, etc)
- get `char`'s and `byte`'s working (seriously, why are they so difficult?)
- I would like to get the project hosted on NuGet. Need to look into this as I have never done it.

**Link to [LukeMapper GitHub Repo][5]**

Any and all comments/feedback appreciated!

[1]: http://code.google.com/p/dapper-dot-net/
[2]: https://github.com/lelandrichardson/LukeMapper/blob/master/LukeMapper.Benchmarks/Program.cs
[3]: https://github.com/lelandrichardson/LukeMapper/blob/master/LukeMapper.cs
[4]: https://github.com/lelandrichardson/LukeMapper
[5]: https://github.com/lelandrichardson/LukeMapper
