class APIfeatures {
    constructor(query, queryString) {
        this.query = query
        this.queryString = queryString
    }

    filter() {
        //1a. Filtering
        const queryObj = {...this.queryString} //destructoring
        const excludedFields = ['page', 'sort', 'limit', 'fields']
        excludedFields.forEach(element => delete queryObj[element])
        //console.log(req.query, queryObj)
        // const tours = await Tour.find().where('duration').equals(5).where('difficulty').equals('easy')
        
        //1b. Advanced filtering
        let queryStr = JSON.stringify(queryObj)
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`)
        this.query = this.query.find(JSON.parse(queryStr))
        //console.log(JSON.parse(queryStr))
        //let query = Tour.find(JSON.parse(queryStr))

        return this
    }

    sort() {
        if(this.queryString.sort) {
            let sortBy = this.queryString.sort.split(',').join(' ')
            this.query = this.query.sort(sortBy)
        } else {
            this.query = this.query.sort('-createdAt')
        }
        
        return this
    }

    limitFields() {
        if(this.queryString.fields) {
            let fields = this.queryString.fields.split(',').join(' ')
            this.query = this.query.select(fields)
        } else {
            this.query = this.query.select('-__v')
        }

        return this
    }

    paginate() {
        const page = this.queryString.page * 1 || 1
        const limit = this.queryString.limit * 1 || 10
        const skip = (page - 1) * limit
        this.query = this.query.skip(skip).limit(limit)
        
        return this
    }
}

module.exports = APIfeatures