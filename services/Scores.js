const {getCollectionPropertyValue} = require("../utils/array");

class Scores {
    constructor(){
        console.log('Scores Class Constructor')
        this.collection = null
    }

    init (db) {
        console.log('Scores Class - init')
        this.collection = db.collection("Users")
    }

    async getSmallerScores (score) {
        const collection = await this.collection.find().toArray()
        const scores = getCollectionPropertyValue(collection, 'score')
        return Math.min(...scores)
    }

    // TODO : create a Capped Collections with a fixed size to 20
    // https://www.mongodb.com/docs/manual/core/capped-collections/#behavior
    async checkScores (score) {
        return new Promise(async (resolve, reject) => {


            //
            //
            // this.collection.findOne({'name' : 'b'})
            //     .then((result) => {
            //         console.log('findOne name b', result)
            //     })

            // const collection = this.collection.find({}).sort({score:-1}).toArray()
            let collection
            let scores
            try {
                collection = await this.collection.find().toArray()
                scores = this.getCollectionPropertyValue(collection, 'score')

                console.log('collection')
                console.log('length', collection.length)
                console.log('min', Math.min(...scores))
                console.log('max', Math.max(...scores))



                if(score > Math.min(...scores)) {
                    console.log('score is higher', score)
                    resolve()
                }
                reject(collection)
            } catch (error) {
                console.log('checkScores - ERROR', error)
                reject()
            }


            // this.collection.find({}).sort({score:-1}).toArray()
            //     .then((result) => {
            //         console.log('length', result.length)
            //         console.log('min', Math.min(...this.getCollectionScore(result)))
            //         console.log('max', Math.max(...this.getCollectionScore(result)))
            //     })

        })
    }
}

module.exports = Scores
