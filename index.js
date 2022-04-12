const express = require('express');
const http = require('http')
require('dotenv').config()
const Global = require('./Controllers/Global')

const app = express()
const server = http.createServer(app)
const PORT = process.env.API_PORT

const globalController = new Global()
globalController.initDB()
    .then(() => console.log('SERVER - initDB - DONE'))
    .catch((e) => console.log('SERVER - initDB - ERROR', e))

app.use(express.json())
app.get('/', async (req, res) => {
    res.send('<h1>Hello world</h1>')
});

app.get('/getHighersScore', async (req, res) => {
    globalController.getHigherScore().then(() => {
        res.send('<h1>this is the higher score</h1>')
    })

});


server.listen(PORT, () => {
    console.log(`Listening on ${ PORT }`)
})