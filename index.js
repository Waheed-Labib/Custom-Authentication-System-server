const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
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

        app.post('/users', async (req, res) => {

            // check if email is already in use
            const email = req.body.email;
            const findEmail = usersCollection.find({ email: email })
            if (findEmail.length) return res.status(400).send({ 'message': 'Email already in use' })

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
            res.send(result)
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
