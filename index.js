const express = require('express');
const http = require('http')
require('dotenv').config()
const Global = require('./Controllers/Global')
const EVENTS = require("./constants/events");

const app = express()
const server = http.createServer(app)
const PORT = process.env.API_PORT

const globalController = new Global()
globalController.initDB()
    .then(() => console.log('SERVER - initDB - DONE'))
    .catch((e) => console.log('SERVER - initDB - ERROR', e))

app.use(express.json())
app.get('/', (req, res) => {
    res.send('<h1>Hello world</h1>')
});

app.post('/score', (req, res) => {
    const {score} = req.body

    globalController.checkScore(score).then(() => {
        res.send()
    }).catch((result) => {
        res.status(406).send(result)
    })

});

app.post('/adduser', (req, res) => {
    const {username, score, email, password} = req.body

    globalController.addUser({username, score, email, password})
        .then((result) => {
            console.log('index - adduser result', result)
            if (result.message === EVENTS.USER_ALREADY_EXIST) {
                res.status(409).send("User Already Exist.")
            }
            res.send()
        })
        .catch((result) => {
            console.log('index - response 406')
            res.status(406).send(result)
        })

});


server.listen(PORT, () => {
    console.log(`Listening on ${PORT}`)
})