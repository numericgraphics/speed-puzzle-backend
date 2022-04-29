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

            // limit the base at 10 items by removing the smaller score
            const collectionCount = await this.collection.count()
            if(collectionCount >= 10) {
                console.log('User - addUser - delete user')
                const collection = await this.collection.find().toArray()
                const scores = getCollectionPropertyValue(collection, 'score')
                await this.deleteUser({score: Math.min(...scores)})
            }

            // encrypt user password
            user.password = await bcrypt.hash(user.password, 10)

            // insert the new user with encrypted password and send back final list
            this.collection.insertOne(user)
                .then(async () => {
                    const collection = await this.collection.find().toArray()
                    resolve(collection)
                })
                .catch(e => {
                    console.log('Users - addUser failed !!!', e)
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
                    console.log('Users - getUser failed !!!', e)
                    reject(e)
                })
        })
    }

    deleteUser (query = { score: 123 }) {
        return new Promise((resolve, reject) => {
            this.collection.deleteOne(query).then((result) => {
                console.log('Users - deleteUser done', result);
                resolve()
            }).catch((e) => {
                console.log('Users - deleteUser failed !!!', e);
                reject(e)
            })
        })

    }
}

module.exports = Users
