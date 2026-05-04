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
        const result = await usersCollection.insertOne(newUser);
        res.send(result)
    })

    // app.post('/register', (req, res)=>{
    //     console.log('request',req.body)
    //     try{

    //     } catch (err) {

    //     }
    // })




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