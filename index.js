const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const port = process.env.PORT || 5000;
const app = express();



// middleware
app.use(cors());
app.use(express.json());



function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'Forbidden' });
        }
        console.log('decoded', decoded);
        req.decoded = decoded;
        next();
    })
}

// const uri = `mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@main-shard-00-00-03xkr.mongodb.net:27017,main-shard-00-01-03xkr.mongodb.net:27017,main-shard-00-02-03xkr.mongodb.net:27017/main?ssl=true&replicaSet=Main-shard-0&authSource=admin&retryWrites=true`;

// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.o3nucxx.mongodb.net/?retryWrites=true&w=majority`;
// const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });



// var MongoClient = require('mongodb').MongoClient;

const uri = `mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@ac-47ico0j-shard-00-00.o3nucxx.mongodb.net:27017,ac-47ico0j-shard-00-01.o3nucxx.mongodb.net:27017,ac-47ico0j-shard-00-02.o3nucxx.mongodb.net:27017/?ssl=true&replicaSet=atlas-7qjc0v-shard-0&authSource=admin&retryWrites=true&w=majority`;

MongoClient.connect(uri, function (err, client) {
    const productCollection = client.db('inventory').collection('product');
    const tokenCollection = client.db('tokendb').collection('token');
    // perform actions on the collection object
    console.log('DB connected');
    client.connect();
    try {

        //Auth
        app.post('/login', async (req, res) => {
            const user = req.body;
            console.log(user)
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1d'
            });
            res.send({ accessToken });
        });


        app.get('/inventory', async (req, res) => {
            const page = parseInt(req.query.page);
            const size = parseInt(req.query.size);
            const query = {};
            const cursor = productCollection.find(query);
            let products;
            if (page || size) {
                products = await cursor.skip(page * size).limit(size).toArray();
            }
            else {
                products = await cursor.toArray();
            }
            res.send(products);
        });


        app.get('/inventoryByEmail', verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const email = req.query.email;
            if (email === decodedEmail) {
                const query = { email: email };
                const cursor = productCollection.find(query);
                const products = await cursor.toArray();
                res.send(products);
            }
            else {
                res.status(403).send({ message: 'forbidden access' });
            }

        });



        app.get('/inventory/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const results = await productCollection.findOne(query);
            res.send(results);
        });


        app.put('/inventory/:id', async (req, res) => {
            const id = req.params.id;
            const updatedInventory = req.body;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    quantity: updatedInventory.quantity
                }
            };
            const result = await productCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        });



        app.delete('/inventory/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await productCollection.deleteOne(query);
            res.send(result);
        });



        app.post('/inventory', async (req, res) => {
            const product = req.body;
            const result = await productCollection.insertOne(product);
            res.send(result);
        });



        app.get('/inventoryCount', async (req, res) => {
            const count = await productCollection.estimatedDocumentCount();
            res.send({ count });
        });




    }
    finally { }

    // client.close();
});

// not work node.js 4.1 or later

// async function run() {
//     try {
//         await client.connect();
//         const productCollection = client.db('inventory').collection('product');

//         //Auth
//         app.post('/login', async (req, res) => {
//             const user = req.body;
//             console.log(user)
//             const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
//                 expiresIn: '1d'
//             });
//             res.send({ accessToken });
//         });


//         app.get('/inventory', async (req, res) => {
//             const query = {};
//             const cursor = productCollection.find(query);
//             const products = await cursor.toArray();
//             res.send(products);
//         });

//         // app.get('/inventoryByEmail', async (req, res) => {
//         //     const decodedEmail = req.decoded.email;
//         //     const email = req.query.email;
//         //     // if (email === decodedEmail) {
//         //     const query = {};
//         //     const cursor = productCollection.find(query);
//         //     const products = await cursor.toArray();
//         //     res.send(products);
//         //     // }
//         //     // else {
//         //     //     res.status(403).send({ message: 'forbidden access' });
//         //     // }

//         // });



//         app.get('/inventory/:id', async (req, res) => {
//             const id = req.params.id;
//             const query = { _id: ObjectId(id) };
//             const results = await productCollection.findOne(query);
//             res.send(results);
//         });

//         app.put('/inventory/:id', async (req, res) => {
//             const id = req.params.id;
//             const updatedInventory = req.body;
//             const filter = { _id: ObjectId(id) };
//             const options = { upsert: true };
//             const updatedDoc = {
//                 $set: {
//                     quantity: updatedInventory.quantity
//                 }
//             };
//             const result = await productCollection.updateOne(filter, updatedDoc, options);
//             res.send(result);
//         });

//         app.delete('/inventory/:id', async (req, res) => {
//             const id = req.params.id;
//             const query = { _id: ObjectId(id) };
//             const result = await productCollection.deleteOne(query);
//             res.send(result);
//         });

//         app.post('/inventory', async (req, res) => {
//             const product = req.body;
//             const result = await productCollection.insertOne(product);
//             res.send(result);
//         });


//     }
//     finally { }
// }
// run().catch(console.dir);




app.get('/', (req, res) => {
    res.send("Running Car Network");
});

app.listen(port, () => {
    console.log('Car Network is running', port);
});