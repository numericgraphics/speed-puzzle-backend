const MongoDB = require("../Services/MongoDB")
const Users = require("../services/Users");

class Global {
    constructor(){
        console.log('Global Class Constructor')
        this.mongoDB = new MongoDB()
        this.users = new Users()
        this.db = {}

        this.initDB = this.initDB.bind(this)
    }

    initDB () {
        return new Promise((resolve, reject) => {
            this.mongoDB.getDB()
                .then(result => {
                    this.db = result
                    this.users.init(this.db)
                    resolve(null)
                })
                .catch(e => {
                    console.log('Global Controller - initDB initialisation failed !!!')
                    reject(e)
                })
        })
    }

    getHigherScore () {
        return new Promise((resolve, reject) => {
            this.users.checkUserScore(123)
                .then((users) => {
                    console.log('Global Controller - getHigherScore', users)
                    resolve(users)
                }).catch(e => {
                console.log('Global Controller - getHigherScore failed !!!')
                reject(e)
                })
        })
    }
}

module.exports = Global
