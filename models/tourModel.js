const mongoose = require('mongoose')
const slugify = require('slugify')
const validator = require('validator')
const User = require('./userModel')

const tourSchema = new mongoose.Schema(
    {
        name: {
            type: String, 
            required: [true, 'A tour must have a name'], 
            unique: true, 
            trim: true,
            maxLength: [40, 'A name must have max 40 characters'],
            minLength: [10, 'A name must be at least 10 characters'],
            validate: [validator.isAlpha, 'Tour name must only contain letters']
        }, 
        duration: {
            type: String,
            required: [true, 'A tour must have a duration']
        },
        maxGroupSize: {
            type: String,
            required: [true, 'A tour must have a group size']
        },
        difficulty: {
            type: String,
            required: [true, 'A tour must a have difficulty'],
            enum: {
                //enum only for type: String
                values: ['easy', 'medium', 'difficult'],
                messages: 'Diffculty is either easy, medium or difficult'
            }
        },
        ratingsAverage: {
            type: Number, 
            default: 4.5,
            min: [1, 'Rating must be above 1'],
            max: [1, 'Rating must be below 5'],

            //This set will run each time a new value is passed to this field
            set: val => Math.round(val * 10) / 10
        },
        ratingsQuantity: {
            type: Number,
            default: 0
        },
        rating: {
            type: Number,
            default: 4.5
        },
        price: {
            type: Number,
            required: [true, 'A tour must have a price']
        },
        priceDiscount: {
            type: Number,
            validate: {
                validator:  function(val) {
                    //this keyword ony points to current doc on NEW doc creation
                    return val < this.price     //val and VALUE is the input value of priceDiscount, they're the same
                },
                message: 'Discount price ({VALUE}) must be smaller than original price'
            }
        },
        summary: {
            type: String,
            required: [true, 'A tour must have description'],
            trim: true //trim only works for string, it removes all white spaces in the beginning and the end 
        }, 
        description: {
            type: String,
            trim: true
        },
        imageCover: {
            type: String,
            required: [true, 'A tour must a cover image']
        },
        images: {
            type: [String]
        },
        createdAt: {
            type: Date,
            default: Date.now(),
            select: false
        },
        startDates: {type: [Date]},
        slug: {type: String}, 
        secretTours: {
            type: Boolean,
            default: false
        },
        startLocation: {
            //GeoJSON    
            type: {
                type: String,
                default: 'Point',
                enum: ['Point']
            },
            coordinates: [Number],
            address: String,
            description: String
        },
        locations: [
            {
                type: {
                    type: String,
                    default: 'Point',
                    enum: ['Point'],
                },
                coordinates: [Number],
                address: String,
                description: String,
                day: Number
            }
        ],
        
        //This type of defining is just for embedding
        // guides: Array

        //THis type of defining is for referencing
        guides: [
            {
                type: mongoose.Schema.ObjectId,
                ref: 'User'
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

//tourSchema.index
tourSchema.index({ price: 1, ratingsAverage: -1 })
tourSchema.index({ slug: 1 })
tourSchema.index({ startLocation: '2dsphere' })


//Virtual properties
tourSchema.virtual('durationWeeks').get(function () {
    return this.duration / 7
})


//Virtual populate: When we want to get all the review 
//but dont want to persist data in DB or using child referens
tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour',
    localField: '_id'
    //To make it simple, let's just understand this action in a way that
    //we want to find all the review that has value in 'tour' field (in review collection)
    //equals to the value in '_id' field (in tour collection)
    //and then create a virtual 'reviews' field that contains all the result
})


//DOCUMENT MIDDLEWARE: it runs before or right after .save() and .create() but not .insertMany()
tourSchema.pre('save', function(next) {
    this.slug = slugify(this.name, {lower: true})  //this keyword point to the current document
    next()
})

//this function is used to EMBEDDING user into tour 
// tourSchema.pre('save', async function(req, res, next) {
//     const guidePromises = this.guides.map(async id => await User.findById(id))
//     this.guides = await Promise.all(guidePromises)
//     next()
// })

//tourSchema.post('save', function(doc, next) {
//    next()
//})



//AGGREGATION MIDDLEWARE: run before or right after any aggregation
// tourSchema.pre('aggregate', function(next) {
//     this.pipeline().unshift({
//         $match:  {secretTours: {$ne: true}}
//     })
//     //console.log(this.pipeline())
// })




//QUERY MIDDLEWARE: run before or right after any query
tourSchema.pre(/^find/, function(next) {
    this.find({secretTours: {$ne: true}})                        //this keyword point to current query
    next()
})


tourSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'guides',
        select: '-__v -passwordChangedAt -role'
    })

    next()
})


// tourSchema.post(/^find/, function(docs, next) {
//     this.find({secretTours: {$ne: true}})                        //this keyword point to current query
//     next()
// })


const Tour = mongoose.model('Tour', tourSchema)

module.exports = Tour