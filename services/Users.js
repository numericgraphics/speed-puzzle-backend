class Users {
    constructor(){
        console.log('Users Class Constructor')
        this.collection = null
    }

    init (collection) {
        this.collection = collection.collection("users")
        console.log('Users Class - init', this.collection)
    }

    addUser (user) {
        return new Promise((resolve, reject) => {
            this.collection.insertOne(user)
                .then(() => {
                    console.log('Users - addUser')
                    resolve(null)
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
}

module.exports = Users
