const express = require('express');
const http = require('http')
require('dotenv').config()
const Global = require('./Controllers/Global')

const app = express()
const server = http.createServer(app)
const PORT = process.env.API_PORT

console.log('process env', process.env)

const globalController = new Global()
globalController.initDB()
    .then(() => console.log('SERVER - initDB - DONE'))
    .catch((e) => console.log('SERVER - initDB - ERROR', e))

app.use(express.json())
app.get('/', async (req, res) => {
    res.send('<h1>Hello world</h1>')
});


server.listen(PORT, () => {
    console.log(`Listening on ${ PORT }`)
})