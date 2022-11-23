/* eslint-disable consistent-return */
/* eslint-disable no-unused-vars */
/* eslint-disable no-empty */
import colors from 'colors';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import jwt from 'jsonwebtoken';
import { MongoClient, ObjectId } from 'mongodb';

// port and env
dotenv.config();
const app = express();
const port = process.env.PORT;
// middleware
app.use(cors());
app.use(express.json());

// console color
colors.setTheme({
    info: 'green',
    help: 'cyan',
    warn: 'yellow',
    error: 'red',
});

// Set up default mongodb connection

const mongoDB = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.dtbllhc.mongodb.net/?retryWrites=true&w=majority`;
// const mongoDB = 'mongodb://localhost:27017';

const client = new MongoClient(mongoDB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access !' });
    }
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' });
        }
        req.decoded = decoded;
        next();
    });
}
const run = async () => {
    try {
        const serviceCollection = client.db('aceLegalDb').collection('services');
        const reviewCollection = client.db('aceLegalDb').collection('reviews');

        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
            res.send({ token });
        });
        // all service operation
        app.get('/services', async (req, res) => {
            const query = {};

            const cursor = serviceCollection.find(query).sort({ date: -1 });
            const allServices = await cursor.toArray();

            const fewCursor = serviceCollection.find(query).sort({ date: -1 });
            const fewServices = await fewCursor.limit(3).toArray();

            res.send({ fewServices, allServices });
        });
        // all review operation
        app.get('/reviews', async (req, res) => {
            const query = {};

            const cursor = reviewCollection.find(query).sort({ date: -1 });
            const reviews = await cursor.toArray();

            res.send(reviews);
        });
        app.get('/service/:id', async (req, res) => {
            const { id } = req.params;

            const query = { _id: ObjectId(id) };
            const service = await serviceCollection.findOne(query);

            res.send(service);
        });

        app.get('/reviewsByEmail', verifyJWT, async (req, res) => {
            const { email } = req.query;

            const { decoded } = req;

            if (decoded.email !== email) {
                res.status(403).send({ message: 'unauthorized access in server' });
            }

            const query = {
                email,
            };

            const cursor = reviewCollection.find(query);
            const reviews = await cursor.toArray();

            res.send({
                success: true,
                reviews,
            });
        });
        app.get('/reviewsById', async (req, res) => {
            const { id } = req.query;

            const query = { serviceId: id };

            const cursor = reviewCollection.find(query).sort({ date: -1 });
            const reviews = await cursor.toArray();

            res.send({
                success: true,
                reviews,
            });
        });
        //  find a review
        app.get('/review/:id', async (req, res) => {
            const { id } = req.params;

            const query = { _id: ObjectId(id) };
            const review = await reviewCollection.findOne(query);

            res.send(review);
        });
        // patch operation
        app.patch('/myreview/:id', verifyJWT, async (req, res) => {
            const { id } = req.params;
            const { message, ratings } = req.body;
            const query = { _id: ObjectId(id) };
            const updatedReview = {
                $set: {
                    message,
                    ratings,
                },
            };
            const result = await reviewCollection.updateOne(query, updatedReview);
            res.send(result);
        });

        // delete operation

        app.delete('/myreview/:id', verifyJWT, async (req, res) => {
            const { id } = req.params;

            const query = { _id: ObjectId(id) };
            const result = await reviewCollection.deleteOne(query);
            res.send(result);
        });

        // Service Posting to collection
        app.post('/service', async (req, res) => {
            const data = req.body;

            const service = await serviceCollection.insertOne(data);

            res.send(service);
        });

        // review posting to collection  
        app.post('/review', async (req, res) => {
            const data = req.body;

            const review = await reviewCollection.insertOne(data);

            res.send(review);
        });
    } finally {
    }
};
run().catch((err) => console.log(err));

// Error middleware
// 404 handlers

app.use('/', (req, res) => {
    res.send('Great! server running successfully');
});
app.use((req, res) => {
    res.status(404).send('404 error! url does not exist');
});

app.use((err, req, res, next) => {
    if (res.headerSent) {
        return next(err);
    }

    return res.status(500).send('server side error!');
});

app.listen(port, () => {
    console.log('Server running on ports'.warn.italic, port);
});
