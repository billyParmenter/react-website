import express from 'express';
import bodyParser from 'body-parser';
import { MongoClient } from 'mongodb';
import path from 'path';

const uri = "mongodb+srv://billy:billy@my-blog-db.o1ung.mongodb.net/my-blog?retryWrites=true&w=majority";

const app = express();

app.use(express.static(path.join(__dirname, '/build')));
app.use(bodyParser.json());

const withDB = async (operations, res) => {
    try {        
        const client = await MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        const db = client.db("my-blog");

        await operations(db);

        client.close();

    } catch (error) {
        res.status(500).json({ message: "Could not connect or query the database. ", error});
    } 
}

app.get('/api/articles/:name', async (req, res) => {

    withDB( async  (db) => {
        const articleName = req.params.name;
        
        const articleInfo = await db.collection("articles").findOne({ name: articleName });
        res.status(200).json(articleInfo);
    }, res);
        

        
});

app.post('/api/articles/:name/upvote', async(req, res) => {

    withDB( async (db) => {
        const articleName = req.params.name;
                
        const articleInfo = await db.collection("articles").findOne({ name: articleName });

        await db.collection("articles").updateOne({ name: articleName }, {
            '$set': {
                upvotes:articleInfo.upvotes + 1,
            },
        });

        const updatedArticleInfo = await db.collection("articles").findOne({ name: articleName });

        res.status(200).json(updatedArticleInfo);
    }, res);

});

app.post('/api/articles/:name/add-comment', (req, res) => {
    const articleName = req.params.name;
    const { userName, text } = req.body;

    withDB( async (db) => {
        const articleInfo = await db.collection("articles").findOne({ name: articleName });

        await db.collection("articles").updateOne({ name: articleName }, {
            '$set': {
                comments: articleInfo.comments.concat({ userName, text}), 
            },
        });
        const updatedArticleInfo = await db.collection("articles").findOne({ name: articleName });

        res.status(200).json(updatedArticleInfo);
    }, res);
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + '/build/index.html'));
});

app.listen(8000, () => console.log('Listening on port 8000'));