const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const res = require('express/lib/response');
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000;

// middleware 
app.use(cors())
app.use(express.json())

function verifyJWT(req, res, next) {
  const authHeaders = req.headers.authorization;
  if (!authHeaders) {
    return res.status(401).send({ message: 'Unauthorize access' })
  }
  const token = authHeaders.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_SECRET_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: 'Forbidden access' })
    }
    console.log('decoded', decoded);
    req.decoded = decoded;
    next();
  })

  
}



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.7vaxu.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
  try {
    await client.connect();
    const serviceCollection = client.db("geniusCar").collection("service");
    const orderCollection = client.db('geniusCar').collection('order');

    app.post('/login', (req, res) => {
      const user = req.body;
      const accessToken = jwt.sign(user, process.env.ACCESS_SECRET_TOKEN, {
        expiresIn: '1d'
      })
      res.send({ accessToken });
    })
    // service api
    app.get('/service', async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const services = await cursor.toArray();
      res.send(services);
    })
    // get service
    app.get('/service/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) }
      const service = await serviceCollection.findOne(query);
      res.send(service);/*  */
    })
    // update service
    app.post('/service', async (req, res) => {
      const newService = req.body
      const result = await serviceCollection.insertOne(newService)
      res.send(result)
    })
    // delete service
    app.delete('/service/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: ObjectId(id) }
      const result = await serviceCollection.deleteOne(query)
      res.send(result);
    })
    // order collection API
    app.post('/order', async (req, res) => {
      const newOrder = req.body;
      const result = await orderCollection.insertOne(newOrder);
      res.send(result)
    })
    app.get('/order', verifyJWT, async (req, res) => {
      const decodedEmail = req.decoded.email;
      const email = req.query.email;
      if (email === decodedEmail) {
        const query = { email: email };
        const cursor = orderCollection.find(query);
        const orders = await cursor.toArray();
        res.send(orders);
      }
      else{
        res.status(403).send({message: 'Forbidden access'})
      }
    })

  } finally {

  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('genius car service server')
})
app.listen(port, () => {
  console.log('Listening to port', port);
})