---
title: "3 Tricks to get More out of SQL Server in Common Web Scenarios"
date: "2012-07-03T07:00:00.000Z"
draft: false
---

Learn several little-known SQL tricks/techniques used to improve query times and enforce business rules with common everyday web-development scenarios

###Article Index:

- The MERGE Statement
- Indexed Views (a.k.a Materialized Views)
- Common Table Expressions

##1. The MERGE Statement

The [Merge Statement][1] is a small treasure made available in SQL Server 2008. It can be used in many different scenarios, but I find it constantly useful in simplifying some CRUD-type logic in Web Apps.

Fundamentally, the MERGE Statement takes two tables, one being the **SOURCE** table and the other being the **TARGET** table, and attempts to perform a join based on some criteria. In most cases this will be a common identity or key column just as it would be in a normal SQL JOIN. Using these two tables, it allows you to specify several different actions to perform for different scenarios. The canonical use of this, which may be clear from the name of the statement, is to take two tables which hold essentially the same information, and MERGE them together.

Let's say you have a member table defined like so:

    CREATE TABLE [dbo].[Member](
    	[ID] int,
    	[Email] varchar(127),
    	[FullName] varchar(127),
    	[IsSubscribed] bit
    )

Additionally, you might have a separate table called "Subscriber" which holds a subscriber email list for your product. Now, traditionally it would make more sense for you to just have one table, since we have both an email field and an "IsSubscribed" flag to indicate that they should get your email, but your subscriber table might be from some third party tool and so you might need to perform some synchronization. This is exactly the scenario MERGE was intended for.

So with our Subscriber table which might look like this:

    CREATE TABLE [dbo].[Subscriber](
    	[Email] varchar(127),
    	[FullName] varchar(127),
    	[DateSubscribed] datetime
    )

We can now synchronize these two tables using MERGE:

    MERGE dbo.Member as TARGET
    USING dbo.Subscriber as SOURCE
    ON ( TARGET.Email = SOURCE.Email )
    WHEN MATCHED THEN
    	-- SOURCE has matching email in TARGET
    	-- UPDATE TARGET to indicate its a subscriber
    	UPDATE SET TARGET.[IsSubscribed] = ((1))

    WHEN NOT MATCHED BY TARGET THEN
    	-- SOURCE has row with no match in TARGET
    	-- INSERT missing subscriber into TARGET
    	INSERT (Email, FullName, IsSubscribed)
    	VALUES (SOURCE.Email, SOURCE.FullName, ((1)));

These are often called "Delta Operations" when you are trying to determine the differences on two tables based off some common key.

###Enforce voting system business logic efficiently with MERGE###

This is great, but truth be told this scenario doesn't come up ALL that often. I end up using the MERGE statement in a bit of a different way so let me walk you through how it has been useful for me:

Let's say you have a web application where a heavy amount of voting is performed on some entity. You have the following business rules:

- an Entity can be voted up or down with amount +1 or -1
- a user is allowed to cast one vote per entity

Given we have the two tables:

    CREATE TABLE [dbo].[Entity](
    	[Id] [int] IDENTITY(1,1) NOT NULL,
    	-- More Entity specific fields
    )

    CREATE TABLE [dbo].[EntityVote](
    	[Id] [int] IDENTITY(1,1) NOT NULL,
    	[VoterId] [int] NOT NULL,
    	[EntityId] [int] NOT NULL,
    	[Direction] [int] NOT NULL
    )

You would like to have a web page with some up-vote and down-vote button which votes via AJAX.

Well, you want to make sure that your business rules are enforced at the database level (or at least server-side) so that user's can't register false votes for a given entity (each user can only vote once!)

One quick approach which is sure to work is to create a UNIQUE INDEX on the EntityVote table

    CREATE UNIQUE NONCLUSTERED INDEX [IX_Entity_Vote_SingleVote]
    ON [dbo].[EntityVote]
    (
    	[EntityId] ASC,
    	[VoterId] ASC
    )

This will enforce your business rules, and prevent users from "hacking" the system. This is less than ideal, however, as every time a user tries to insert a vote again this will raise an error on SQL Server and will cause unnecessary overhead since it is not being handled.

In order to circumvent this, you may then decide to build a more robust Stored Procedure to handle this logic when working with a vote. Us developers may want to write this stored procedure like so:

    CREATE PROCEDURE [dbo].[spu_Entity_Vote_Insert](
    	@VoterId int,
    	@EntityId int,
    	@Direction int
    )
    AS
    BEGIN
    	SET NOCOUNT ON;


    	IF EXISTS(
    		SELECT TOP 1
    			Id
    		FROM dbo.EntityVote
    		WHERE VoterId = @VoterId
    		AND EntityId = @EntityId
    		AND Direction = @Direction)
    	BEGIN
    		--same vote exists -> user is "un-voting"
    		DELETE FROM dbo.EntityVote
    		WHERE VoterId = @VoterId
    		AND EntityId = @EntityId
    		AND Direction = @Direction
    	END
    	ELSE IF EXISTS(
    		SELECT TOP 1
    			Id
    		FROM dbo.EntityVote
    		WHERE VoterId = @VoterId
    		AND EntityId = @EntityId
    		AND Direction <> @Direction)
    	BEGIN
    		--same voter/entity exists, but different amount
    		--this means user is changing his mind.
    		UPDATE dbo.EntityVote
    			SET Direction = @Direction
    		WHERE VoterId = @VoterId
    		AND EntityId = @EntityId
    		AND Direction <> @Direction
    	END
    	ELSE
    	BEGIN
    		--new voter/entity combo, insert vote
    		INSERT INTO dbo.EntityVote(
    			VoterId,
    			EntityId,
    			Direction
    		) VALUES (
    			@VoterId,
    			@EntityId,
    			@Direction
    		)
    	END
    END

###Avoid Race Conditions in "UPSERT"###

What the DBA's reading this might be thinking after looking at a stored procedure like that is that you have just introduced a [Race Condition][2].

Race Conditions stem from the fact that us simple-minded developers often times write SQL (and code in general) under the false assumption that this code is only ever going to be run synchronously, and that these IF/ELSE Logic loops will always return the same result within the context of the procedure. Since SQL Server can hold MANY connections at once, any of which can be executing this stored procedure, we could have a situation where this is not true.

For those of you who are MySQL devs, you might be familiar with the INSERT .. ON DUPLICATE KEY UPDATE ... syntax, which I was always jealous of after moving to SQL Server (this was before I knew about the MERGE syntax...).

In any event, one way to prevent this, as mentioned in the article above, is to simply demand that all of this be executed as a single transaction. This can be done with the **BEGIN TRAN** statement:

    CREATE PROCEDURE [dbo].[spu_Entity_Vote_Insert](
    	@VoterId int,
    	@EntityId int,
    	@Direction int
    )
    AS
    BEGIN
    	SET NOCOUNT, XACT_ABORT ON

    	BEGIN TRAN

    	-- original stored procedure code

    	COMMIT
    END

I don't know about you guys, but this starts to worry me a little bit. Seems like there is a lot going on there for one transaction, and I don't like to use the BEGIN TRAN / COMMIT statements loosely. Here is where the MERGE statement can help us. The MERGE statement is actually built for all of this "UPSERT" type madness and is run off of a a single join + scan, and thus a single transaction:

    CREATE PROCEDURE [dbo].[spu_Entity_Vote_Insert](
    	@VoterId int,
    	@EntityId int,
    	@Direction int
    )
    AS
    BEGIN
    	SET NOCOUNT ON;

    	MERGE dbo.EntityVote as TARGET
    	USING ( SELECT
    		@VoterId as VoterId,
    		@EntityId as EntityId,
    		@Direction as Direction
    	) as SOURCE
    	ON (
    		SOURCE.EntityId = TARGET.EntityId
    		AND
    		SOURCE.VoterId = TARGET.VoterId
    	)
    	--same vote exists -> user is "un-voting"
    	WHEN MATCHED AND (SOURCE.Direction = TARGET.Direction)
    		THEN DELETE

    	--same voter/entity exists, but different amount
    	--this means user is changing his mind.
    	WHEN MATCHED AND (SOURCE.Direction <> TARGET.Direction)
    		THEN UPDATE
    			SET TARGET.Direction = SOURCE.Direction

    	--new voter/entity combo, insert vote
    	WHEN NOT MATCHED
    		THEN INSERT (
    			VoterId,
    			EntityId,
    			Direction
    		) VALUES (
    			SOURCE.VoterId,
    			SOURCE.EntityId,
    			SOURCE.Direction
    		)
    	;
    END

This statement will find out if the record exists, and then operate on it appropriately - allowing us to expand the logic if necessary. While at first this may be slightly less readable, once you get familiar with the syntax it is actually much better in my opinion. Plus, we don't have to get into any of that nasty BEGIN TRAN / COMMIT stuff.

<br/><br/>

##2. Indexed Views (a.k.a Materialized Views)

As far as I am aware, there is no MySQL equivalent to the SQL Server Indexed Views. While most developer-facing differences between the two database engines comes down to semantics, I actually consider this to be a fairly large win for MS SQL. While they can certainly be overused, if you have relationships across large tables that are being utilized on a regular basis in the form of a READ, and the tables are not too INSERT heavy, **indexed views can be a tremendous win.**

This came in quite handy for me a couple of weeks ago in a situation which I think is quite common: a web application where some Entity has comments. Comments are usually associated with an application User, which is also another table. So that makes an Entity table, Comments table, and User ("Member") table:<sup>1</sup>

    CREATE TABLE [dbo].[Entity](
    	[Id] [int] IDENTITY(1,1) NOT NULL,
    	-- More Entity specific fields
    )

    CREATE TABLE [dbo].[Member](
    	[Id] [int] IDENTITY(1,1) NOT NULL,
    	[FullName] varchar(50) NOT NULL,
    	-- More member-related specific fields
    )

    CREATE TABLE [dbo].[EntityComment](
    	[Id] [int] IDENTITY(1,1) NOT NULL,
    	[MemberId] [int] NOT NULL,
    	[EntityId] [int] NOT NULL,
    	[CommentBody] varchar(MAX) NOT NULL,
    	[DateCreated] datetime NOT NULL
    )

Actually, wait. Let's make it even better. Let's say we have multiple entities, each of which have comments... so being the nice relational DBA's that we are, we decide that ALL comments for ALL entities will reside in one table, and we will just create a Cross Reference table for each entity. So now we have this...

    CREATE TABLE [dbo].[Entity](
    	[Id] [int] IDENTITY(1,1) NOT NULL,
    	-- More Entity specific fields
    )

    CREATE TABLE [dbo].[Member](
    	[Id] [int] IDENTITY(1,1) NOT NULL,
    	[FullName] varchar(50) NOT NULL,
    	-- More member-related specific fields
    )

    CREATE TABLE [dbo].[EntityToComment](
    	[Id] [int] IDENTITY(1,1) NOT NULL,
    	[CommentId] [int] NOT NULL,
    	[EntityId] [int] NOT NULL
    )

    CREATE TABLE [dbo].[Comment](
    	[Id] [int] IDENTITY(1,1) NOT NULL,
    	[MemberId] [int] NOT NULL,
    	[CommentBody] varchar(MAX) NOT NULL,
    	[DateCreated] datetime NOT NULL
    )

Now, in a typical scenario we might have a web-page which is viewing an Entity based off of the primary key... ie, some endpoint like: **www.example.com/entity/detail/123**

Naturally, here we write a nice little query to pull all of the data for the entity with a simple primary key lookup:

    SELECT *
    FROM dbo.Entity
    WHERE Id = @Id

Done. Now we want the comments... and things get a little bit messier.

    SELECT
    	c.*,
    	m.*
    FROM dbo.EntityToComment as ec
    INNER JOIN dbo.Comment as c
    ON c.Id = ec.CommentId
    INNER JOIN dbo.Member as m
    ON m.Id = c.MemberId
    WHERE ec.EntityId = @Id

OK. Great. Looks like we are done! We now have all of the information we need to display comments on the client.

While this is true, let's say your site makes it big and your Comments table all of a sudden gets to be a couple of million rows long. More than that, maybe your member table and entity tables are similarly of `O(10^6)`. **For a high traffic site, this is not going to cut it.**

The first thing you would want to do is to create an index on dbo.Comment over the MemberId column. Similarly, you could create an index across the dbo.EntityToComment for the EntityId, CommentId columns. This will definitely be faster, but you know what can be EVEN FASTER? **Indexed views**. In order to use indexed views one first must create a Schema Bound view like so:

    CREATE VIEW [dbo].[vu_Entity_Comment_Member]
    WITH SCHEMABINDING
    AS
    SELECT
    	c.Id,
    	c.CommentBody,
    	c.DateCreated,
    	c.MemberId,
    	m.FullName,
    	-- more Comment or Member fields, if needed
    FROM dbo.EntityToComment as ec
    INNER JOIN dbo.Comment as c
    ON c.Id = ec.CommentId
    INNER JOIN dbo.Member as m
    ON m.Id = c.MemberId

Notice the **WITH SCHEMABINDING** keyword here. This is important, and SQL Server will yell at you if you try to create an index on a table which is not Schema Bound. This essentially means that the [view has constraints such that the referenced tables can not be altered in a way that would make the view invalid][3]. If you ask me, this should be a default value for SQL Views - but that's another discussion. In any event, **if you use views in SQL Server, it wouldn't be a bad idea to use the SCHEMABINDING keyword all of the time.**

Now we actually want to create a non-clustered index on the view in question. A lot of people find indexes to be these mystical creatures that can never be tamed or tricked into showing up in our execution plans, but BTREE-like indexes AREN'T THAT HARD to understand if you [sit down and actually think about what they are][4] and [how they work][5]. For now I will take the easy route out and say that is outside the scope of this post, but I strongly encourage reading the links above if you don't think you could explain an index to a 10 year old... your users will thank you.<sup>2</sup>

The index we want on our view is one which has EntityId's as primary nodes, since that is what we will be passing in the WHERE clause in our web page's stored procedure. The EntityId is not unique on this view (ie, there will be multiple rows returned per EntityId) and thus we will need to create a UNIQUE index first, then the Non-clustered index:

    CREATE UNIQUE CLUSTERED INDEX [IX_vu_Entity_Comment_Member_Unique]
    ON [dbo].[vu_Entity_Comment_Member]
    ([ID] ASC)

    CREATE NONCLUSTERED INDEX IX_EntityId_vu_Question_Comment_Member
    ON [dbo].[vu_Entity_Comment_Member] (EntityId)
    INCLUDE (Id,
    	CommentBody,
    	DateCreated,
    	MemberId,
    	FullName,
    	-- more columns from the view, if needed
    )

It is important to note that in the Non-Clustered view you will want to INCLUDE every row that you need to push onto the Client through our stored procedure. By including all of these columns, SQL Server is able to avoid a Table Scan in the query, and simply pull the page out of the in-memory index. **This is where our performance gain is**. Our previous 2 inner joins which required a ton of computation have essentially been reduced to a single memory lookup operation that will complete in unit time!

So we go back to our stored procedure for our Entity's detail view with comments and we rewrite our query to use the view instead of the joins:

    SELECT
    	Id,
    	CommentBody,
    	DateCreated,
    	MemberId,
    	FullName,
    	-- more columns, if needed
    FROM [dbo].[vu_Entity_Comment_Member]
    WITH (NOEXPAND)
    WHERE EntityId = @Id

It's important to notice the query hint **WITH (NOEXPAND)** added. As far as I know, this simply tells SQL Server that you would like it to treat the view as a TABLE, and not to scan the underlying tables if it doesn't need to. You can [find out more about NOEXPAND and Indexed Views here][6].

At this point, this stored procedure will be blazing fast, **even with millions and millions of rows in the corresponding tables**. I chose this example as I think it is a fairly common web-based scenario, as the title suggests, but any developer working in SQL should think about indexed views when constantly hitting tables with multiple joins.<sup>3</sup> Table Indexes are tremendously helpful for searching across single tables from non-primary keys, but Indexed views can essentially give us the speed of denormalization without needing to worry about synchronizing the denormalized and normalized data.

Long story short, **page load times are important, and Indexed Views can be a valuable tool to improve them**. You can see a [similar use of indexes to improve page performance of stack overflow over at Sam Saffron's blog][7].

<br/><br/>
##3. Common Table Expressions

[Common Table Expressions][8] are another example of a great tool that I discovered moving from MySQL to SQL Server. As far as I know, you can't do quite everything you can do with CTE in MySQL (but I welcome someone to show me that this is incorrect)<sup>4</sup>.

Anyway, CTE is essentially a way to reduce the complexity of complex queries by aliasing them. Here is a simple use case:

    WITH CustomerPurchase(
    	ProductId,
    	CustomerId,
    	CustomerName,
    	Amount
    ) AS (
    	SELECT
    		p.Id,
    		c.Id,
    		c.CustomerName,
    		p.Amount
    	FROM Purchase as p
    	INNER JOIN Customer as c
    	ON p.CustomerId = c.Id
    )
    SELECT *
    FROM CustomerPurchase
    WHERE ProductId = @ProductId

This is cool, but doesn't really help us all that much outside readability and maintainability (and in this case doesn't even do much there... but I promise, sometimes it is more readable/maintainable)

###Use Common Table Expressions to implement Paging###

On the other hand, CTE allows us to define calculated columns in our table and then filter them later, which provides us a bigger win. In the case of SQL Server's built-in RANK functions, this is actually not possible to do without the use of a sub-query. **For example, we can implement PAGING on a table very easily like so**:

    WITH Activity  AS
    (
    	SELECT [ID]
    	  -- more columns related to Entity
    	  ,[LastActivityDate]
    	  ,ROW_NUMBER() OVER
                    (ORDER BY [LastActivityDate] DESC) AS RowNumber
    	FROM [dbo].[Entity]
    )
    SELECT *
    FROM Activity
    WHERE RowNumber
          BETWEEN (@pageNumber - 1) * @perPage + 1
          AND @pageNumber * @perPage
    ORDER BY RowNumber ASC;

Paging is incredibly important in web-development and should be implemented whenever possible to reduce the number of bytes sent across the wire that are never even seen. Implementing Paging this way should be properly fast provided whatever you have in your OVER() clause is properly indexed.

This is honestly the most valuable thing I have found for Common Table Expressions other than improving readability, but there are some additional compelling uses in the [ability to use CTEs recursively][9]

###Author's Note:###

SQL is one of those things that I just tend to learn new things about constantly. While I consider myself a fairly competent SQL developer, I am by no means a DBA. I am sure in a years time I will know much more than I know now, just as now I know far more than I did a year ago, today. This article is meant to educate those who do not know of these features as I did not at one time. Additionally, **please let me know if you found the article useful**!

###Footnotes:###

1. if those links don't help you, and you are still wanting to learn more, send me an email or a comment and I can point you to some great free online courses discussing indexes in more detail.

2. Potential Argument: One might say that a comment table is not a good example of an entity which has few reads... I would beg to differ. In the world of the internet, almost EVERY entity will be a "high-read" entity, with the exception of a logging table where inserts will be proportional to the overall number of requests.

3. Note: while this is great, one should also weigh the pros and cons between the decrease in read time and the increase in insert time.

4. Note: when I say "can't do", what I really mean is "can't do without the use of temporary tables or sub-queries"

[1]: http://msdn.microsoft.com/en-us/library/bb510625.aspx
[2]: http://weblogs.sqlteam.com/dang/archive/2007/10/28/Conditional-INSERTUPDATE-Race-Condition.aspx
[3]: http://msdn.microsoft.com/en-us/library/ms187956.aspx
[4]: http://en.wikipedia.org/wiki/B-tree
[5]: http://msdn.microsoft.com/en-us/library/aa174537%28v=sql.80%29.aspx
[6]: http://sladescross.wordpress.com/2010/09/26/sql-noexpand-and-indexed-views/
[7]: http://samsaffron.com/archive/2011/05/02/A+day+in+the+life+of+a+slow+page+at+Stack+Overflow
[8]: http://msdn.microsoft.com/en-us/library/ms190766%28v=sql.105%29.aspx
[9]: http://www.codeproject.com/Articles/83654/Inside-Recursive-CTEs
