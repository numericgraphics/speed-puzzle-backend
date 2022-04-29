const MongoDB = require("../services/MongoDB")
const Users = require("../services/Users");
const Scores = require("../services/Scores");
const EVENTS = require("../constants/events");

class Global {
    constructor(){
        console.log('Global Class Constructor')

        this.mongoDB = new MongoDB()
        this.users = new Users()
        this.scores = new Scores()
        this.db = {}

        this.initDB = this.initDB.bind(this)
    }

    initDB () {
        return new Promise((resolve, reject) => {
            this.mongoDB.connect()
                .then(result => {
                    this.db = result
                    this.users.init(this.db)
                    this.scores.init(this.db)
                    resolve(null)
                })
                .catch(e => {
                    console.log('Global Controller - initDB initialisation failed !!!')
                    reject(e)
                })
        })
    }

     addUser (user) {
        const { email, score } = user
        return new Promise(async (resolve, reject) => {

            if(!score) {
                return reject()
            }

            const oldUser =  await this.users.isUserAlreadyExist(email)
            if (oldUser) {
               return resolve({message: EVENTS.USER_ALREADY_EXIST})
            }

            this.users.addUser(user)
                .then((result) => {
                    return resolve({ message: EVENTS.USER_CREATED, list: result})
                })
                .catch(e => {
                console.log('Global Controller - addUser failed !!!')
                return reject()
            })
        })
    }

    checkScore (score = 123) {
        return new Promise((resolve, reject) => {
            this.scores.checkScores(score)
                .then((result) => {
                    console.log('Global Controller - checkScore', result)
                    if(result) {
                        return resolve({ message: EVENTS.SCORED})
                    }
                    return resolve({ message: EVENTS.SCORE_REJECTED})
                }).catch(result => {
                console.log('Global Controller - checkScore failed !!!')
                reject(result)
            })
        })
    }
}

module.exports = Global
