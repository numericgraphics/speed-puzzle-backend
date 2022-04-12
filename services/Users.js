class Users {
    constructor(){
        console.log('Users Class Constructor')
        this.collection = null
    }

    getCollectionScore(arr){
        return arr.map(a => a.score);
    }

    init (collection) {
        console.log('Users Class - init')
        this.collection = collection.collection("users")
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


    // TODO : create a Capped Collections with a fixed size to 20
    // https://www.mongodb.com/docs/manual/core/capped-collections/#behavior
    checkUserScore (score) {
        return new Promise((resolve, reject) => {
            this.collection.findOne({'name' : 'b'})
                .then((result) => {
                    console.log('findOne name b', result)
                })
            this.collection.find({}).sort({score:-1}).toArray()
                .then((result) => {
                    console.log('length', result.length)
                    console.log('min', Math.min(...this.getCollectionScore(result)))
                    console.log('max', Math.max(...this.getCollectionScore(result)))
                })

        })
    }
}

module.exports = Users
