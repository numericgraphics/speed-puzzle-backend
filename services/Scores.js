const {getCollectionPropertyValue} = require("../utils/array");

// EXAMPLES MONGODB QUERY
// - list complete decroissant : const collection = this.collection.find({}).sort({score:-1}).toArray()
// - list complete : this.collection.find().toArray()
// - list query : this.collection.findOne({'name' : 'b'})

class Scores {
    constructor(){
        console.log('Scores Class Constructor')
        this.collection = null
    }

    init (db) {
        console.log('Scores Class - init')
        this.collection = db.collection("users")
    }

    async getSmallerScores (score) {
        const collection = await this.collection.find().toArray()
        const scores = getCollectionPropertyValue(collection, 'score')
        return Math.min(...scores)
    }

    async getHigherScores (score) {
        const collection = await this.collection.find().toArray()
        const scores = getCollectionPropertyValue(collection, 'score')
        return Math.max(...scores)
    }

    async checkScores (score) {
        return new Promise(async (resolve, reject) => {

            let collection
            let scores
            try {
                collection = await this.collection.find().toArray()
                scores = getCollectionPropertyValue(collection, 'score')
                console.log('User score --> ', score)
                console.log('-- checkScores - collection User --------------')
                console.log('length', collection.length)
                console.log('min', Math.min(...scores))
                console.log('max', Math.max(...scores))
                console.log('---------------------------')


                if(score > Math.min(...scores)) {
                    console.log('score is higher', score)
                    resolve(true)
                }
                // TODO : send message with resolve method to explain that the score is to low
                resolve(false)
            } catch (error) {
                console.log('checkScores - ERROR', error)
                reject()
            }
        })
    }
}

module.exports = Scores
