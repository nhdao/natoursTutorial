const Tour = require('./../models/tourModel')
const catchAsync = require('./../utils/catchAsync')
const AppError = require('./../utils/appErrors')
const handlerFactory = require('./handlerFactory')
const multer = require('multer')

//Save image to buffer to resize if needed
const multerStorage = multer.memoryStorage()


const multerFilter = (req, file, cb) => {
    //Check if file uplaod is an image or not
    //If yes => pass true to cb function
    //If no => pass false to cb function
    if(file.mimetype.startsWith('image')) {
        cb(null, true)
    } else {
        cb(new AppError('Not an image', 400), false)
    }
}

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
})

exports.uploadTourImages = upload.fields(
    {name: 'imgaCover', maxCount: 1},
    {name: 'images', maxCount: 3}
)


exports.resizeTourImages = catchAsync(async (req, res, next) => {

    if(!req.files.imageCover || !req.files.images) {
        return next()
    }

    //Start processing images
    //1. cover image
    req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`

    await sharp(req.file.imageCover[0].buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${req.body.imageCover}`)

    //2. images
    req.body.images = []

    await Promise.all(req.files.images.map(async (image, index) => {
        const fileName = `tour-${req.params.id}-${Date.now()}-${index + 1}.jpeg`

        await sharp(image.buffer)
        .resize(500, 500)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${fileName}`)

        req.body.images.push(fileName)
    }))

    next()
})


/*----- TOURS ROUTE HANDLER -----*/
exports.aliasTopTours = (req, res, next) => {
    req.query.limit = '5'
    req.query.sort = 'price,-ratingsAverage'
    req.query.fields = 'name,duration,ratingsAverage,summary,difficulty'
    next()
}

// exports.getAllTours = catchAsync(async (req, res, next) => {
//         //BUILD THE QUERY
//         // //1a. Filtering
//         // const queryObj = {...req.query} //destructoring
//         // const excludedFields = ['page', 'sort', 'limit', 'fields']
//         // excludedFields.forEach(element => delete queryObj[element])
//         // //console.log(req.query, queryObj)
//         // // const tours = await Tour.find().where('duration').equals(5).where('difficulty').equals('easy')
        
//         // //1b. Advanced filtering
//         // let queryStr = JSON.stringify(queryObj)
//         // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`)
//         // //console.log(JSON.parse(queryStr))
//         // let query = Tour.find(JSON.parse(queryStr))

//         //2. Sorting
//         // if(req.query.sort) {
//         //     let sortBy = req.query.sort.split(',').join(' ')
//         //     query = query.sort(sortBy)
//         // } else {
//         //     query = query.sort('-createdAt')
//         // }

//         //3. Fields limiting
//         // if(req.query.fields) {
//         //     let fields = req.query.fields.split(',').join(' ')
//         //     query = query.select(fields)
//         // } else {
//         //     query = query.select('-__v')
//         // }

//         //4. Pagination
//         // const page = req.query.page * 1 || 1
//         // const limit = req.query.limit * 1 || 1
//         // const skip = (page - 1) * limit
//         // query = query.skip(skip).limit(limit)
        
//         // if(req.query.page) {
//         //     const numTours = await Tour.countDocuments()
//         //     if(skip >= numTours) {
//         //         throw new Error('This page does not exist')
//         //     }
//         // }

//         //EXECUTE THE QUERY
//         const features = new APIfeatures(Tour.find(), req.query)
//             .filter()
//             .sort()
//             .limitFields()
//             .paginate()
        
//         const tours = await features.query
//         //const tours = await Tour.find()
        
//         //SEND RESPONSE
//         res.status(200).json({
//             status: 'Success',
//             results: tours.length,
//             data: {
//                 tours: tours
//             }
//         })
//     }
// )

// exports.getTourById = catchAsync(async (req, res, next) => {
//         const tour = await Tour.findById(req.params.id).populate('reviews')
//         console.log(tour)
//         if(!tour) {
//             return next(new AppError('Cannot find tour with that id', 404))
//         }

//         res.status(200).send({
//             status: 'Success',
//             data: {
//                 tour: tour
//             }
//         })
//     }
// )

// exports.createTour = catchAsync(async (req, res, next) => {
//         const newTour = await Tour.create(req.body)
//         res.status(201).json({
//             status: "Success",
//             data: {
//                 tour: newTour
//             }
//         })
//     }
// )
    
// exports.updateTourById = catchAsync(async (req, res, next) => {
//         const tour = await Tour.findByIdAndUpdate(
//             req.params.id, req.body, 
//             {
//                 new: true,
//                 runValidators: true
//             }
//         )

//         if(!tour) {
//             return next(new AppError('Cannot find tour with that id', 404))
//         }

//         res.status(201).json({
//             status: 'Success',
//             data: {
//                 tour: tour
//             }
//         })
//     }
// )

// exports.deleteTourById = catchAsync(async (req, res, next) => {
//         const tour = await Tour.findByIdAndDelete(req.params.id)

//         if(!tour) {
//             return next(new AppError('Cannot find tour with that id', 404))
//         }

//         res.status(204).json({
//             status: 'success',
//             data: null
//         })     
//     }
// )


//Using handlerFactory
exports.getAllTours = handlerFactory.getAll(Tour)
exports.getTour = handlerFactory.getOne(Tour, {path: 'reviews'})
exports.createTour = handlerFactory.createOne(Tour)
exports.updateTour = handlerFactory.updateOne(Tour)
exports.deleteTour = handlerFactory.deleteOne(Tour)


exports.getTourStats = catchAsync(async (req, res, next) => {
        //stage: match and group and sort
        const stats = await Tour.aggregate([
            {
                $match: {ratingsAverage: {$gte: 4.5}}
            },
            {
                $group: {
                    _id: '$difficulty',
                    numTours: {$sum: 1},
                    avgRating: {$avg: '$ratingsAverage'},
                    avgPrice: {$avg: '$price'},
                    minPrice: {$min: '$price'},
                    maxPrice: {$max: '$price'},
                }
            },
            {
                $sort: {avgPrice: 1}   //1 for ascending
            },
            // {
            //     $match: {_id: {$ne: 'easy'}}
            // }
        ])

        res.status(200).json({
            status: 'Success',
            data: {
                stats
            }
        })
    }
)

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
        const year = req.params.year * 1

        //stage: unwind and project
        const plan = await Tour.aggregate([
        {
            $unwind: '$startDates'
        },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`)
                }
            }
        },
        {
            $group: {
                _id: { $month: '$startDates' },
                numTourStarts: { $sum: 1 },
                tours: { $push: '$name' }
            }
        },
        {
            $addFields: { month: '$_id' }
        },
        {
            $project: {
                _id: 0
            }
        },
        {
            $sort: { numTourStarts: -1 }
        },
        {
            $limit: 12
        }
        ]);
        
        res.status(200).json({
            status: 'Success',
            data: {
                plan
            }
        })
    }
)

exports.getToursWithin = catchAsync(async (res, req, next) => {
    const {distance, latlng, unit} = req.params
    const [latitude, longtitude] = latlng.split(',')
    
    const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1

    if(!latitude || !longtitude) {
        next(new AppError('Please provide latitude and longtitude in format like this lattitude,longtitude', 403))
    }

    const tours = await Tour.find({ 
        startLocation: { $geoWithin: { $centerSphere: [[longtitude, latitude], radius] } } 
    })

    res.status(200).json({
        status: 'success',
        results: tours.length,
        data: {
            data: tours
        }
    })
})


//Get distance to tour from point
exports.getDistances = catchAsync(async (res, req, next) => {
    const { latlng, unit} = req.params
    const [latitude, longtitude] = latlng.split(',')

    const multiplier = unit === 'mi' ? 0.0006 : 0.001

    if(!latitude || !longtitude) {
        next(new AppError('Please provide latitude and longtitude in format like this lattitude,longtitude', 403))
    }

    const distances = await Tour.aggregate([
        {
            //geoNear always need to be the 1st stage in aggregation pipeline
            $geoNear: {
                near: {
                    type: 'Point',
                    coordinates: [longtitude * 1, latitude * 1]
                },
                distanceField: 'distance',
                distanceMultiplier: multiplier
            },
            $project: {
                distance: 1,
                name: 1
            }
        }
    ])

    res.status(200).json({
        status: 'success',
        data: {
            data: distances
        }
    })
})