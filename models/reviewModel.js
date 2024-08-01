const mongoose = require('mongoose');
const Tour = require('./tourModel')

const reviewSchema = new mongoose.Schema(
    {
        review: {
            type: String,
            required: [true, 'Review cannot be empty']
        },
        rating: {
            type: Number,
            min: 1, 
            max: 5
        },
        createdAt: {
            type: Date,
            default: Date.now()
        },
        tour: [
            {
                type: mongoose.Schema.ObjectId,
                ref: 'Tour',
                required: [true, 'Review must belong to a tour']
            }
        ],
        user: [
            {
                type: mongoose.Schema.ObjectId,
                ref: 'User',
                required: [true, 'Review must belong to a user']
            }
        ]
    }, 
    //These options is to mkae sure that virtual property show up 
    //in JSON and object ouput
    {
        toJSON: {virtuals : true},
        toObject: {virtuals : true}
    }
)

reviewSchema.index({ tour: 1, user: 1 }, { unique: true })
//the 'unique' part can be explained like this: This part specifies that
//the combination of tour and user values in the index must be unique. 
//It ensures that there cannot be multiple documents with the same tour and user values.
//Just to prevent one user write multiple reviews on one tour


reviewSchema.pre(/^find/, function(next) {
    // this
    // .populate(
    //     {
    //         path: 'tour',
    //         select: 'name'
    //     },
    // )
    this.populate(
        {
            path: 'user',
            select: 'name photo'
        }
    )
})

//the "statics" keyword allow us to create a method for the model itself
reviewSchema.statics.calcAverageRatings = async function(tourId) {
    //the 'this' keyword refers to the current model itself
    const stats = await this.aggregate([
        //Select all the reviews belong to the tour with tourId
        {
            $match: {tour: tourId}
        },
        {
            $group: {
                _id: '$tour',
                nRating: { $sum: 1 },
                avgRating: { $avg: '$rating' }
            }
        }
    ])

    if(stats.length > 0) {
        //Update the rating in Tour model
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: stats[0].nRating,
            ratingsAverage: stats[0].avgRating  
        })
    } else {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: 0,
            ratingsAverage: 4.5 //Back to default value
        })
    }
}

reviewSchema.post('save', function() {

    //We cannot use Review.calcAverageRatings here because it's used 
    //before Review is created (line 85)
    //so we have to use this.constructor
    //basically this.constructor = Review
    this.constructor.calcAverageRatings(this.tour)
})

reviewSchema.pre(/^findOneAnd/, async function(next) {
    this.r = await this.findOne()
    next()
})

reviewSchema.post(/^findOneAnd/, async function() {
    await this.r.constructor.calcAverageRatings(this.r.tour)
})


const Review = mongoose.model('Review', reviewSchema)
module.exports = Review