const express = require('express')
const cors = require('cors')
require('dotenv').config()
const { ObjectId } = require('mongodb');
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express()
const port = process.env.PORT || 3000;



const admin = require("firebase-admin");

// index.js
const decoded = Buffer.from(process.env.FIREBASE_SERVICE_KEY, "base64").toString("utf8");
const serviceAccount = JSON.parse(decoded);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// middlewere
app.use(cors())
app.use(express.json())

const verifyFireBaseToken = async(req, res, next) =>{
    const authorization = req.headers.authorization;
    if(!authorization){
        return res.status(401).send({message: 'unauthorized access'})
    }
    const token = authorization.split(' ')[1];
    if(!token){
        return res.status(401).send({message: 'unauthorized access'})
    }
    try{
        const decoded = await admin.auth().verifyIdToken(token)
        console.log('inside token', decoded)
        req.token_email = decoded.email
        next()
    }
    catch(error){
        return res.status(401).send({message: 'unauthorized access'})
    }
}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.4di52mx.mongodb.net/?appName=Cluster0`;


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
    // await client.connect();
    console.log('database Connected')
    // Send a ping to confirm a successful connection
    
    const db = client.db('home_bd');
    const propertiesCollection = db.collection('properties')
    const usersCollection = db.collection('users')
    const reviewsCollection = db.collection('reviews')


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
    

    // PROPERTIES API

    app.post('/properties', async (req, res) => {
            console.log('header in the post', req.headers)
            const newProduct = req.body;
            const result = await propertiesCollection.insertOne(newProduct);
            res.send(result);
        })

  
    app.get('/properties', async (req, res) => {
    const search = req.query.search || ""; 
    const sort = req.query.sort; 

    let query = {
        propertyName: { $regex: search, $options: 'i' } 
    };

    try {
        let cursor = propertiesCollection.find(query);

        
        if (sort === 'asc') {
            cursor = cursor.sort({ price: 1 }); 
        } else if (sort === 'desc') {
            cursor = cursor.sort({ price: -1 });
        }

        const result = await cursor.toArray();
        res.send(result);
    } catch (error) {
        res.status(500).send({ message: "Error fetching properties" });
    }
});
   
    
    app.get('/latest-properties', async (req, res) => {
            const cursor = propertiesCollection.find().sort({ createdAt: -1 }).limit(6);
            const result = await cursor.toArray();
            res.send(result);
    })


    //  details api
app.get('/properties/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await propertiesCollection.findOne(query);
        
        if (!result) {
            return res.status(404).send({ message: "Data not found" });
        }
        res.send(result);
    } catch (error) {
        console.log(error)
        res.status(500).send({ message: "Server error" });
    }
});


        // MY PROPERTY API
     app.get('/myProperties',verifyFireBaseToken, async (req, res) => {
            const email = req.query.email;
            const query = {};
            if (email) {
                if(email !== req.token_email){
                    return res.status(403).send({message: 'forbiden access'})
                }
                query.sellerEmail = email;
            }

            const cursor = propertiesCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })
        



// update api
app.patch('/properties/:id', async (req, res) => {
    const id = req.params.id;
    const updatedProperty = req.body;
    const filter = { _id: new ObjectId(id) };
    const updateDoc = {
        $set: {
            propertyName: updatedProperty.propertyName,
            description: updatedProperty.description,
            category: updatedProperty.category,
            price: updatedProperty.price,
            location: updatedProperty.location,
            image: updatedProperty.image,
        },
    };
    const result = await propertiesCollection.updateOne(filter, updateDoc);
    res.send(result);
});


        app.delete('/properties/:id', async (req, res) => {
            const id = req.params.id;
                const query = { _id: new ObjectId(id) };

            const result = await propertiesCollection.deleteOne(query);
            res.send(result);
        })




        // review api
        app.post('/reviews', async (req, res) => {
            console.log('header in the post', req.headers)
            const newProduct = req.body;
            const result = await reviewsCollection.insertOne(newProduct);
            res.send(result);
        })


        

        app.get('/reviews', async (req, res) => {
            const productId = req.params.productId;
            const query = { product: productId }
            const cursor = reviewsCollection.find(query)
            const result = await cursor.toArray();
            console.log(result)
            res.send(result);
        })

        app.get('/reviews/:propertyId', async (req, res) => {
            const productId = req.params.propertyId;
            console.log(req.params)
            const query = { propertyId: productId }
            const cursor = reviewsCollection.find(query)
            const result = await cursor.toArray();
            console.log(result)
            res.send(result);
        })


app.get('/my-reviews/:email', async (req, res) => {
    const email = req.params.email;
    const query = { reviewerEmail: email };
    
    const result = await reviewsCollection.find(query).sort({ reviewDate: -1 }).toArray();
    res.send(result);
});


    


    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, ()=>{
    console.log(`Home Nest server is running on port : ${port}`)
})