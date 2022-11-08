/* eslint-disable no-unused-vars */
/* eslint-disable no-empty */
import colors from 'colors';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { MongoClient, ObjectID } from 'mongodb';

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
const run = async () => {
    try {
        const serviceCollection = client.db('aceLegalDb').collection('services');
        const reviewCollection = client.db('aceLegalDb').collection('reviews');

        app.get('/services', async (req, res) => {
            const query = {};

            const cursor = serviceCollection.find(query).sort({ timestamp: -1 });
            const allServices = await cursor.toArray();

            const fewCursor = serviceCollection.find(query).sort({ timestamp: -1 });
            const fewServices = await fewCursor.limit(3).toArray();

            res.send({ fewServices, allServices });
        });
        app.get('/service/:id', async (req, res) => {
            const { id } = req.params;

            const query = { _id: ObjectID(id) };
            const service = await serviceCollection.findOne(query);

            res.send(service);
        });
        app.get('/reviews', async (req, res) => {
            const { id } = req.query;
            const { email } = req.query;
            let query = {};
            if (id && email) {
                query = {
                    serviceId: id,
                    email,
                };
            }
            if (email) {
                query = {
                    email,
                };
            }
            if (id) {
                query = {
                    serviceId: id,
                };
            }
            const cursor = await reviewCollection.find(query).sort({ timestamp: -1 });
            const reviews = await cursor.toArray();

            res.send(reviews);
        });
        // // find all reviews
        // app.get('/reviews', async (req, res) => {
        //     const query = {};

        //     const cursor = reviewCollection.find(query).sort({ timestamp: -1 });
        //     const reviews = await cursor.toArray();

        //     res.send(reviews);
        // });
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
