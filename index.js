const express = require('express')
const cors = require('cors')
// require('dotenv').config()
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express()
const port = process.env.PORT || 3000;

// middlewere
app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://homeDbUser:4iQ0VcZDANJ9Ylnu@cluster0.4di52mx.mongodb.net/?appName=Cluster0`;


const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

app.get('/', (req, res) =>{
    res.send('Home Nest server is running')
})

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    console.log('database Connected')
    // Send a ping to confirm a successful connection
    
    const db = client.db('home_bd');
    const productsCollection = db.collection('properties')
    const usersCollection = db.collection('users')


    // USERS APIS
    app.post('/users', async (req, res)=>{
        const newUser = req.body;
        const email = req.body.email
        const query = {email: email}
        const existingUser = await usersCollection.findOne(query);
        if(existingUser){
            res.send({message: 'User already exist. Do not need to insert again'})
        }
        else{
            const result = await usersCollection.insertOne(newUser);
            res.send(result)
        }
    })

    
    app.get('/latest-property', async (req, res) => {
            const cursor = productsCollection.find().sort({ created_at: -1 }).limit(6);
            const result = await cursor.toArray();
            res.send(result);
    })


    app.post('/products', async (req, res) => {
            console.log('header in the post', req.headers)
            const newProduct = req.body;
            const result = await productsCollection.insertOne(newProduct);
            res.send(result);
        })


    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, ()=>{
    console.log(`Home Nest server is running on port : ${port}`)
})