require('dotenv').config()
const express = require('express');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 3000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// Middleware
app.use(cors());
app.use(express.json())

// --------------------------------------------------------------------------------------

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.d2h2whv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const articlesCollection = client.db('eduVerse').collection('articles');
    const commentsCollection = client.db('eduVerse').collection('comments')

    // Articles api----------------------------------------
    // Articles api to get all articles
    app.get('/articles', async (req, res) => {
      const cursor = articlesCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })

    // Specific article get by id
    app.get('/articles/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await articlesCollection.findOne(query);
      res.send(result)
    })

    // Articles Sort by category
    app.get('/articles/category/:categoryName', async (req, res) => {
      const category = req.params.categoryName;
      const result = await articlesCollection
        .find({ category: category })
        .sort({ date: -1 }) // optional sort
        .toArray();

      res.send(result);
    });


    // Comments api----------------------------------------
    app.post('/comments', async (req, res) => {
      const comment = req.body;
      const result = await commentsCollection.insertOne(comment);
      res.send(result)
    })

    // Get article shecific comments data api
    app.get('/comments/:articleId', async (req, res) => {
      const articleId = req.params.articleId;
      const query = { article_id: articleId }
      const result = await commentsCollection.find(query).toArray();
      res.send(result)
    })

    // Do a patch for update like data in articles
    app.patch('/articles/:id', async (req, res) => {
      const id = req.params.id;
      const email = req.body.user_email;

      const filter = { _id: new ObjectId(id) }

      // Now identify the duplicacy of user
      const article = await articlesCollection.findOne(filter);
      if (article.liked_users?.includes(email)) {
        return res.status(400).send({ message: 'Already Liked' });
      }

      const result = await articlesCollection.updateOne(filter, {
        $inc: { likes: 1 },
        $push: { liked_users: email }
      });
      res.send(result)
    })

    // ----------------------------------------------------------------------------------

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);

// --------------------------------------------------------------------------------------

app.get('/', (req, res) => {
  res.send('Eduverse is Cooking!')
})

app.listen(port, () => {
  console.log(`Eduverse is running on port ${port}`)
})
