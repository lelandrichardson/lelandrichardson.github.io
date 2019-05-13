---
title: "A Better Query Language: BQL Language Specification"
date: "2014-03-05T08:00:00.000Z"
draft: false
---

For some reason or another, it seems to me that SQL has always taken a back seat in the language economy. I have used SQL for years, and very little has changed.

After working on a couple of relatively large projects which use SQL quite a bit, I have slipped into a bit of a love-hate relationship with SQL.

SQL has lot's of beautiful features. SQL is already a fairly high-order language; a tremendous amount of implementation detail is left invisible to the programmer. In terms of spewing data out of a data store, it can be impressively efficient.

But somehow it just still isn't quite _there_. Right?

Most developers I know seem to avoid SQL like the plague... and that's too bad.

One day I started thinking about some of the specific hardships I've had with maintaining a large SQL codebase, and something dawned on me...

Why hasn't anyone created more convenient languages that transpile into SQL?

There is CoffeeScript, Dart, Typescript, etc for JavaScript.  
There is LESS and SCSS for CSS.

**Why not something for SQL?**

So I played the devil's advocate and said: "What if SQL was a compile target?"

In doing so, I found myself wanting a language that:

- **Strict superset of SQL.** This is important because it promotes a clean transition. One can move migrate their SQL codebase incrementally since all valid SQL is also valid in this language.
- **Promotes good and efficient SQL practices**
- **Promotes keeping SQL code DRY**
- **Transpiles into easily readable SQL**

For now I will call "BQL" for "A Better Query Language". I have taken a stab at outlining below a rough specification for what I think would be some positive features to add, while adhering to the constraints above.

To summarize what I see as "benificial" to a language such as this, I would put as the following:

## Key Language Benefits

- notion of "projections" to keep SQL efficient, and keep code DRY
- inner joins are inferred with simplified syntax
- reordered select/from clauses to make autocomplete context more helpful
- queries can be stored syntactically and referenced in other statements to help readability, logical separation, and DRYness
- strict superset, so all SQL is already valid
- syntactic niceties with variable declaration / boolean logic / functions / etc.

## Language Specification

---

### The `select` clause can be anywhere in a statement

In TSQL, the `select` clause of a select statement is done first, which makes it logically difficult to provide meaningful autocomplete suggestions for field names currently available in the context, since that is defined afterwards in the `from` and `join` clauses.

In BQL, the `select` is valid at both the beginning and the end of the query.

For example, the following BQL statements are equivalent:

```sql
from student
where status = 'enrolled'
select id, name, grade


select id, name, grade
from student
where status = 'enrolled'
```

both of which will compile into the following SQL:

```sql
SELECT
    id,
    name,
    grade
FROM student
WHERE status = 'enrolled'
```

### With the presence of foreign keys, join conditions are implied

Provided there is a single foreign key relationship defined unambiguously between two tables, the foreign key relationship is chosen implicitly as the default join condition.

For instance, let's say we have the following simplified tables:

```sql
DECLARE TABLE post (
    id INT, -- primary key
    /* ... */
)

DECLARE TABLE comment (
    id INT, -- primary key
    postId INT, -- foreign key to post.id
    /* ... */
)
```

The following BQL statement:

```sql
from post
inner join comment
select *
```

compiles to

```sql
SELECT *
FROM post p
INNER JOIN comment c
ON c.postId = p.id
```

When multiple tables are joined in a single statement, the table with which you want to join may become ambiguous, and an optional `with` clause can be added to the join:

For instance, we may have the following tables:

```sql
DECLARE TABLE user (
    id INT, -- primary key
    /* ... */
)

DECLARE TABLE post (
    id INT, -- primary key
    authorId INT, -- foreign key
    /* ... */
)

DECLARE TABLE comment (
    id INT, -- primary key
    postId INT, -- foreign key to post.id
    authorId INT, -- foreign key to user.id
    /* ... */
)
```

then the following BQL statement

```sql
from post
inner join user u1 with post
inner join comment
inner join user u2 with comment
select *
```

compiles to:

```sql
SELECT *
FROM post p
INNER JOIN user u1
ON post.authorId = user.id
INNER JOIN comment c
ON comment.postId = post.id
INNER JOIN user u2
ON comment.authorId = user.id
```

Furthermore, in some cases there are multiple foreign keys from one table to a single table. In this case, the join condition is ambiguous until you clarify which foreign key relationship you would like to use. As a result, one can use the `on` clause, however, unlike it's SQL counterpart, only the column in the "foreign" table is needed.

To demonstrate, provided we have the following tables:

```sql
DECLARE TABLE user (
    id INT, -- primary key
    /* ... */
)

DECLARE TABLE message (
    id INT, -- primary key
    senderId INT, -- foreign key with user.id
    recipientid INT, -- foreign key with user.id
    /* ... */
)
```

Thus, the following BQL query:

```sql
from message m
inner join user s on senderId
inner join user r on recipientId
select *
```

compiles into

```sql
SELECT *
FROM message m
INNER JOIN user s ON m.senderId = s.id
INNER JOIN user r ON m.recipientId = r.id
```

### Short-cutting Join Conditions in `where` clauses...

Joins are commonly used simply to perform a lookup and return the corresponding rows of one table. Provided there is a unique foreign key relationship between two tables, the lookup can be performed by a simple condition in the where clause like so:

```sql
from user
where user:country.name = 'Canada'
select id
```

which compiles into

```sql
SELECT u.id
INNER JOIN country c
ON c.id = u.country_id
WHERE c.name = 'Canada'
```

Here the `{fk table name}:{pk table name}` syntax is used to identify the join while making the condition more easily legible.

### Table Projections

Table projections are a construct in BQL which is not present in standard SQL. A table projection is simply a named collection of field names which can be used (and thus re-used) in the select clause of any query.

For instance, one can define a projection as follows:

```sql
projection [contact_info] {
    firstName,
    lastName,
    phoneNumber,
    email
}
```

and thus, the BQL query

```sql
from dbo.users
select <contact_info>
```

compiles into the following SQL:

```sql
SELECT
    firstName,
    lastName,
    phoneNumber,
    email
FROM dbo.users
```

Further, I can mix selecting Projections and field names if needed:

```sql
from dbo.users
select id, <contact_info>
```

compiles into:

```sql
SELECT
    id,
    firstname,
    lastName,
    phoneNumber,
    email
FROM dbo.users
```

The projection can be prefixed by the table name or table alias if you are projecting a specific table in a join...

for instance, provided we have the following projections:

```sql
projection abc { a, b, c }

projection def { d, e, f }
```

this BQL statement

```sql
from tblX x
inner join tblY y
on x.id = y.xid
select x.<abc>, y.<def>
```

compiles into

```sql
SELECT
    x.a,
    x.b,
    x.c,
    y.d,
    y.e,
    y.f
FROM tblX X
INNER JOIN tblY y
ON x.id = y.id
```

### The special `<$all>`, `<$keys>` Projection

Every table by default has an "include all" projection. This does not need to be defined anywhere, and is pragmatically equivalent to the "\*" operator in normal SQL, except for the fact that the compiled SQL will have all of the table's fields enumerated explicitly in the compilation step.

Given we have the following table definitions:

```sql
declare table abc (
    id int, -- (primary key)
    f1 int,
    f2 varchar(20),
    f3 datetime
)

declare table def (
    id int PRIMARY KEY,
    abcId int,  -- (foreign key to tbl1.id)
    f4 varchar(20),
    f5 datetime
)
```

The following projections are implicitly created for these tables:

```sql
-- for table "abc"
projection $all { id, f1, f2, f3 }
projection $keys { id }

-- for table "def"
projection $all { id, abcId, f4, f5 }
projection $keys { id, abcId }
```

and thus, the following BQL statements:

```sql
from abc select <$all>

from abc
inner join def
on abc.id = def.abcId
select abc.<$keys>, def.<$keys>
```

compile into

```sql
SELECT
    id,
    f1,
    f2,
    f3
FROM abc

SELECT
    abc.id,
    def.id,
    def.abcId
FROM abc
INNER JOIN def
ON abc.id = def.abcId
```

Similar to select lists, you can also specify computed columns as well as field name aliases

```sql
projection foo {
    id as userId,
    '{{first}} {{last}}' as displayName
}
```

where the projection takes:

```sql
from users
select <foo>
```

and compiles it into

```sql
SELECT
    id as userId,
    first + ' ' + last as displayName
FROM users
```

Projection definitions can also reference other projections:

```sql
projection fullName {
    '{{first}} {{last}}' as fullName
}

projection user {
    id,
    email,
    <fullName>
}
```

and thus:

```sql
from users
select <user>
```

compiles into

```sql
SELECT
    id,
    email,
    first + ' ' + last as fullName
FROM users
```

Notes about projections:

- they can be thought of as ad-hoc interfaces. They can be applied to any table, but will be a SQL compile error if the proper field names are not present on the table
- one can select multiple projections, comma delimited. in this case, common field names between the projections will be repeated... (or should they just be indicated once???)
- if projecting a table alias `a`, it would be `select a.<contact_info>`
- if a delimited name is needed, it would be `select <[projection name]>`
- the above example uses another feature of BQL discussed below, string interpolation.

### Boolean values first class citizens

BQL has `true` and `false` as new keywords which translate into a SQL `bit` data type.

For instance, the following BQL:

```sql
select true
```

Compiles into the following SQL:

```sql
DECLARE @true BIT = 1;

SELECT @true
```

If any statement contains usage of the boolean values `true` or `false`, it will be transpiled into a local variable reference which is initialized at `1` or `0` accordingly. This prevents some common ambiguities found between the `BIT` value of 1 and the `INT` value of 1.

Further, many expressions are automatically converted into boolean expressions if evaluated in an `if` structure or a `where` clause.

Note: more needs to be discussed on first-class suport of booleans in BQL.

### Setting variables

no need for `SET`... ie, the line `@a = 1` => `SET @a = 1`

### Control-flow Logic

BQL introduces the usage of curly brackets as natural scope boundaries, similar to (but not equivalent to) SQL's `BEGIN ... END` syntax.

### Brackets as scope boundaries

instead of `BEGIN ... END` we would have brackets. ie,

```sql
if ( /* boolean expression */ ) {
    /* expression */
} else {
    /* expression
}
```

### Variable declaration simplified...

```sql
-- implicit type
var @a = 'abc',
    @b = 123

-- explicit type
varchar(20) @a;
int @b;
datetime @c;
```

Instead of:

```sql
DECLARE @a VARCHAR(MAX) = 'abc'
DECLARE @b INT = 123

DECLARE @a VARCHAR(20)
DECLARE @b INT
DECLARE @c DATETIME
```

### Better implicit type coercion...

```sql
print 'abc' + 123  // prints 'abc123'
```

compiles to

```sql
PRINT 'abc' + CAST(123 AS VARCHAR)
```

Note: this should be thought about a little more. I like this, but it could actually cause existing (valid) SQL to break where the original intention different.

### C-style `for` loops

```sql
for(int @i = 0; @i < @length; @i++) {
    /* expressions */
}
```

compiles into

```sql
DECLARE @i INT = 0
WHILE @i < @length BEGIN

    /* expressions */

    SET @i = @i + 1
END
```

### C# style foreach

```sql
foreach(var @row in users) {
    if( @row.id % 2 ) {
        print '{{row.first}} {{row.last}}'
    }

    /* expressions */
}
```

compiles into

```sql
DECLARE @id INT,
        @first VARCHAR(50),
        @last VARCHAR(50)

DECLARE cursor_1 CURSOR FOR
SELECT
    id,
    first,
    last
FROM users

OPEN cursor_1;

FETCH NEXT FROM cursor_1
INTO @id, @first, @last;

WHILE @@FETCH_STATUS = 0
BEGIN
    IF NOT( @id % 2 = 0 ) BEGIN
        PRINT @first + ' ' + @last
    END

    /* expressions */

    FETCH NEXT FROM cursor_1
    INTO @id, @first, @last;
END

CLOSE cursor_1;
DEALLOCATE cursor_1;
```

Note: might want to talk about how this promotes precedural flow in SQL which isn't necessarily a good thing...

### String interpolation

```sql
var @name = 'john doe'

-- prints 'my name is john doe'
print 'my name is: {{name}}'
```

Note: we could adopt something different than this sort of "mustache-style" here. We might want to think more about this. This is also potentially the most obvious breach of being a "strict superset" of SQL.

### Local scoping rules

```sql
var @i = 1;

if (true)  { // new variable scope...
    var @i = 2;

    print @i // prints 2
}

print @i // prints 1
```

this would compile into:

```sql
DECLARE @true BIT = 1,
        @i INT = 1,
        @i_two INT;

IF (@true = @true) BEGIN
    SET @i_two = 1;

    PRINT @i_two;
END

PRINT @i
```

you can also declare local scope by just writing code inside brackets:

```sql
{
    -- in this scope, @i is an int
    var @i = 123;
}
{
    -- in this scope, @i is of type varchar
    var @i = 'abc'
}
```

### Ternary operator

```sql
select @a > @b ? '123' : '456'
```

compiles into:

```sql
SELECT CASE WHEN @a > @b THEN '123' ELSE '456' END
```

### Null coalescing operator

```sql
from students
select name ?? 'N/A'
```

compiles into:

```sql
SELECT ISNULL(name, 'N/A')
FROM students
```

### Boolean operators

```sql
if ( (@a || @b) && !@c) {
    /* expressions */
}
```

compiles into

```sql
DECLARE @true BIT = 1,
        @false BIT = 0;

IF ( (@a = @true OR @b = @true) AND @c = @false ) BEGIN
    /* expressions */
END
```

### Method notation on various datatypes

various datatypes would have various "methods" defined for them which simply compile into calls for the global method...

for instance, everything would have a `.toString()` method...

```sql
var @i = 1234;
var @s = ' AbcdEf ';
datetime @d = GETUTCDATE();
```

#### Methods for `char`, `varchar`, `nchar`, and `nvarchar`

- trim()
- ltrim()
- rtrim()
- toLowerCase()
- toUpperCase()
- toTitleCase() - not sure this is possible/practical
- padLeft()
- padRight()
- pad()
- contains(string s)
- endsWith(string s)
- startsWith(string s)
- substring
- split(string seperator) - this would return a table... could be interesting
- toCharSet() - not sure if this is possible/practical, but could be a cool feature as well.
- indexOf()

calling methods on variables would work pretty much how you would expect:

```sql
@s.trim()
```

compiles into

```sql
LTRIM(RTRIM(@s))
```

and so on...

#### Methods for `datetime` and `date`

- addDays(numerical d)
- addHours(numerical d)
- addMinutes(numerical d)
- addMilliseconds(numerical d)
- addMonths(numerical d)
- addSeconds(numerical d)
- addTicks(numerical d)
- addYears(numerical d)
- toOADate()
- toString(string format)
- subtract(datetime d) - need to think about this more... how is a timespan represented in SQL?
- add(datetime d)
- dayOfMonth()
- dayOfYear()
- dayOfWeek()
- hour()
- minute()
- millisecond()
- ticks()
- second()
- year()
- date()

note: i'd like to think more about functionality that can be had around UTC time / local time conversion and such. Could be a big win for this language if implemented in a way that prevented people from doing bad practices...

#### Methods on `int`, `bigint`, `tinyint`, `decimal`, `float`

- toString(string format)

### Datetime declaration

a convention for declaring date times will exist, but i'm not sure on the syntax.

could be: `var @dt = #1/12/2014#` (this is kind of similar to an MS Access convention).

could also be `var @dt = &'1/12/2014'`

### Regular expressions

```sql
var @a = /(s|o)me?reg[ular]ex[pression]/.replace('abcd','');
var @islower = !/[A-Z]/.match(@test);
```

Note: I'd like to do more thinking here on how we could bring more native support to regular expressions to SQL. This will largely depend on the target (ie, T-SQL, PL/SQL, etc.)

### Explicit type casting

```sql
select (varchar)123
```

compiles into

```sql
select CAST(123 as VARCHAR)
```

### `+=` and `-=` operators

```sql
var @i = 1,
    @s = 'abc';

@i += 1
@s += 'def'
```

compiles to

```sql
DECLARE @i INT = 1,
        @s varchar = 'abc';

SET @i = @i + 1;
SET @s = @s + 'def';
```

### Paging syntax

The `offset` and `limit` keywords will be used for paging, and will
satisfy all SQL targets appropriately.

For instance:

```sql
from tbl
order by a
select a, b, c
offset 100
limit 20
```

for SQL Server 2008 would compile into

```sql
;WITH tbl_paged AS
(
    SELECT
        a,
        b,
        c,
        ROW_NUMBER() OVER (ORDER BY a ASC) as __row_number
    FROM tbl
)
SELECT
    a,
    b,
    c
FROM tbl_paged
WHERE __row_number BETWEEN 100 AND 100 + 20
```

Versus MySQL where it would simply compile into:

```sql
SELECT
    a,
    b,
    c
FROM tbl
OFFSET 100
LIMIT 20
```

Of course, we are also able to use variables or scalar expressions here

```sql
from tbl
order by a
select a, b, c
offset (@page - 1) * @size
limit @size
```

compiles into

```sql
;WITH tbl_paged AS
(
    SELECT
        a,
        b,
        c,
        ROW_NUMBER() OVER (ORDER BY a ASC) as __row_number
    FROM tbl
)
SELECT
    a,
    b,
    c
FROM tbl_paged
WHERE __row_number BETWEEN (@page - 1) * @size + 1 AND @page * @size
```

NOTE: the compilation of these keywords would be different depending on the target... different SQL engines have different support for paging already.

### Implicit "result sets" as local variables

Result set variables can be declared as you would any other query select statement

```sql
var @results = from tbl1 select a, b, c where a < 20;
```

Result set variables have a couple of unique properties that temp tables and table variables do not have...

For example, you can...

#### Coerce a resultset variable into a boolean as a shortcut for `EXISTS`

```sql
var @results = from tbl1 select a, b, c where a < 20;

if (@results) {
    /* expressions */
}
```

this will compile into:

```sql
DECLARE @results TABLE (
            a INT,
            b VARCHAR(20),
            c VARCHAR(255)
        )

INSERT INTO @results ( a, b, c )
SELECT
    a,
    b,
    c
FROM tbl1
WHERE a < 20

IF EXISTS(SELECT TOP 1 * FROM @results)
BEGIN
    /* expressions */
END
```

#### Get a resultset variable's number of rows

calling a `.length` method on a resultset variable is shorthand for getting the total count

```sql
var @results = from tbl1 select a, b, c where a < 20;

var @count = @results.length
```

compiles into

```sql
DECLARE @results TABLE (
            a INT,
            b VARCHAR(20),
            c VARCHAR(255)
        )
DECLARE @count INT

INSERT INTO @results ( a, b, c )
SELECT
    a,
    b,
    c
FROM tbl1
WHERE a < 20

SELECT @count = COUNT(*)
FROM @results
```

in certain cases where a resultset variable can be optimized into a CTE, it will do so. This is the case when the query is referenced in only one statement.

```sql
var @results = from tbl1 select a, b, c where a < 20;

-- here we only use results in *one* statement
from @results
where a > 10
select a, b, c
```

compiles into

```sql
;WITH results AS
(
    SELECT
        a,
        b,
        c
    FROM tbl1
    WHERE a < 20
)
SELECT
    a,
    b,
    c
FROM results
WHERE a > 10
```

note: some of the above examples would also allow and utilize this optimization, but the compiled output shown is that of the more general case (table variables) simply for clarity of what would normally happen.
  
In other cases, the resultset variable will be created as a table variable

```sql
var @results = from tbl1 select a, b, c where a < 20;

var @count = @results.length
```

### Resultsets as partial queries

Resultset variables can be useful in taking complex queries and compartmentalizing them into digestable parts without sacrificing performance by storing the results into temp tables, or going through the unnecessary overhead of creating a view to be used just once:

```sql
-- notice how no "select" clause is needed here...
var @unpaid_cust = from customers where status = 'unpaid'

from invoices i
inner join @unpaid_cust
where i.date_sent != null
select invoices.<$all>
```

compiles into

```sql
SELECT
    i.id,
    i.field1,
    /* ... */
FROM invoices i
INNER JOIN customers c
ON i.customer_id = c.id
WHERE
    c.status = 'unpaid' AND
    i.date_sent IS NOT NULL
```

Although this is a smple example, it should be clear how you can take a very complex query with several joins and partialize it into logically separate pieces, letting BQL compile it into one final efficient query.

### Mixins: Inline Functions

simple inline functions:

```sql
var @postUrl = mixin(@id, @slug) {
    return 'http://my-blog.com/post/{{@id}}/{{slug}}'
}


from post
select id, @postUrl(id,slug) as url
```

compiles into

```sql
SELECT
    id,
    'http://my-blog.com/post/' + CAST(id as varchar) + '/' + slug
FROM posts
```

or...

```sql
var @isEmail = mixin(@email){
    return @email.contains('@')
}

from users
where @isEmail(email)
select id, email
```

compiles to

```sql
SELECT id, email
FROM users
WHERE CHARINDEX('@',email) > 0
```

### Schema scope declaration

you can use a schema scope declaration in order to default to certain databases and schema

```sql
    schema abc {
        from tbl1
        select a, b, c
    }
```

compiles to:

```sql
SELECT
    a,
    b,
    c
FROM abc.tbl1
```

if no schema scope is used, the schema will instead be the database default schema. This is essentially like locally "overriding" the database default schema...

### Some ideas I haven't thought through yet...

1. support for more complicated aggregate functions? For example a `JOIN` or `CSV` aggregate function based on the XML expand functionality.

2. what about boolean logic w/ nulls? could we allow `if (field_name = null)` in replacement of `IF (field_name IS NULL)`?

3. We could have some javascript-like type coersion? For example, could `!field_name` be converted to `field_name is null OR field_name = ''` and similar tests?

### Next steps...

Languages are complicated things, and I think in order to be successful, must be the product of many minds. I'd like for any and all feedback (or help) on producing this language spec, as well as a parser/compiler for it. If you stumbles upon this article because you have similar wishes for such a language to exist, please consider contributing.

I've opened a [GitHub repo][1] where I've started work on the parser and grammar. Right now I'm trying out [Irony][2] to build an AST, as it makes building into the Visual Studio toolchain very easy, but the Irony grammar is very easy to translate into BNF if we want to try other AST Parsers as well.

**At the very least, share your opinions below.**

Thank you.

[1]: https://github.com/lelandrichardson/BQL
[2]: http://irony.codeplex.com/
