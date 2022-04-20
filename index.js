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
app.get('/', (req, res) => {
    res.send('<h1>Hello world</h1>')
});

app.post('/score', (req, res) => {
    const { score } = req.body
    console.log('globalController - /score', score)
      globalController.checkScore(score).then(() => {
        console.log('index - response 200')
          res.send()
    }).catch((result) => {
        console.log('index - response 406')
          res.status(406).send(result)
    })
});


server.listen(PORT, () => {
    console.log(`Listening on ${ PORT }`)
})