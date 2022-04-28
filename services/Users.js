const bcrypt = require('bcryptjs')
var jwt = require('jsonwebtoken')
const {getCollectionPropertyValue} = require("../utils/array");

class Users {
    constructor(){
        console.log('Users Class Constructor')
        this.collection = null
    }

    init (db) {
        console.log('Users Class - init')
        this.collection = db.collection("users")
    }

    async isUserAlreadyExist (email) {
       return  await this.collection.findOne({ email });
    }

    addUser (user) {
        return new Promise(async (resolve, reject) => {

            const collection = await this.collection.find().toArray()

            // limit the base at 10 items by removing the smaller score
            if(collection.length >= 9) {
                console.log('collection > 9')
                const scores = getCollectionPropertyValue(collection, 'score')
                await this.deleteUser({score: Math.min(...scores)})
            }

            // encrypt user password
            user.password = await bcrypt.hash(user.password, 10)

            // insert the new user with encrypted password
            this.collection.insertOne(user)
                .then((result) => {
                    console.log('Users - addUser', result)
                    resolve(result)
                })
                .catch(e => {
                    console.log('Users - addUser failed !!!')
                    reject(e)
                })
        })
    }

    getUser (user) {
        return new Promise((resolve, reject) => {
            this.collection.findOne(user)
                .then((user) => {
                    console.log('Users - getUser', user)
                    resolve(user)
                })
                .catch(e => {
                    console.log('Users - addUser failed !!!')
                    reject(e)
                })
        })
    }

    deleteUser (query = { score: 123 }) {
        return new Promise((resolve, reject) => {
            this.collection.deleteOne(query).then((result) => {
                console.log('Users - deleteUser done', result);
                resolve()
            }).catch((err) => {
                reject(err)
            })
        })

    }
}

module.exports = Users
