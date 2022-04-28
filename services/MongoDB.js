const { MongoClient } = require("mongodb")
const uri = process.env.MONGODB_URI
const client = new MongoClient(uri)

class MongoDB {
    constructor() {
        console.log('MongoDB Class - Constructor')
    }

    connect() {
        return new Promise((resolve, reject) => {
            client.connect()
                .then(() => {
                    resolve(client.db("speed-puzzle-db"))
            })
                .catch(e => {
                    console.log('MongoDB Class - getDB / connect - ERROR', e)
                    reject(e)
                })

        })
    }
}

module.exports = MongoDB
