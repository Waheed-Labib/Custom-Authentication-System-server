const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;
require('dotenv').config();

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// mongodb config

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.nbmbmyw.mongodb.net/`;

const client = new MongoClient(uri);

async function run() {
    try {
        const database = client.db("customAuthSystem");
        const usersCollection = database.collection("users");

        // api for creating new user
        app.post('/users/signup', async (req, res) => {

            // check if email is already in use
            const email = req.body.email;
            const findEmail = await usersCollection.findOne({ email: email })
            if (findEmail) return res.status(400).json({ error: "Email is already in use." })

            // hash the user's password
            const password = req.body.password;
            const salt = await bcrypt.genSalt(10)
            const hashedPassword = await bcrypt.hash(password, salt)

            // create the user
            const user = {
                name: req.body.name,
                email: req.body.email,
                password: hashedPassword
            }

            // insert the user to database
            const result = await usersCollection.insertOne(user);
            user._id = result.insertedId;
            res.send({
                message: 'Signup successful',
                user: user
            })
        })

        // api for login
        app.post('/users/login', async (req, res) => {
            // check if user exists
            const email = req.body.email;
            const user = await usersCollection.findOne({ email: email })
            if (!user) return res.status(400).json({ error: "User Not Found." })

            // check if password is valid
            const password = req.body.password;
            const isValidPassword = await bcrypt.compare(password, user.password)

            if (!isValidPassword) return res.status(400).json({ error: "Invalid Password." })

            res.send({
                message: "Login Successful",
                user: user
            })
        })

        // api to get jwt token
        app.post('/jwt', async (req, res) => {
            const email = req.query.email;
            const user = await usersCollection.findOne({ email: email })
            if (!user) {
                return res.status(403).send({ accessToken: '' })
            }
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN, { expiresIn: "2h" })
            res.send({ accessToken: token })
        })

        // get an individual user
        app.get('/users/:id', async (req, res) => {
            const _id = new ObjectId(req.params.id);
            const user = await usersCollection.findOne({ _id: _id });
            res.send(user)
        })
    } finally {

    }
}

run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('custom-authentication-system-server running')
})

app.listen(port, () => {
    console.log('Custom Authentication System Server running on port ', port)
});
