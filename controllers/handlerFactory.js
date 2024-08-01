const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appErrors');
const APIfeatures = require('./../utils/apiFeatures')

exports.deleteOne = Model => catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id)

        if(!doc) {
            return next(new AppError('Cannot find document with that id', 404))
        }

        res.status(204).json({
            status: 'success',
            data: null
        })     
    }
)

exports.updateOne = Model => catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(
        req.params.id, req.body, 
        {
            new: true,
            runValidators: true
        }
    )

    if(!doc) {
        return next(new AppError('Cannot find document with that id', 404))
    }

    res.status(201).json({
        status: 'Success',
        data: {
            doc
        }
    })
})

exports.createOne = Model => catchAsync(async (req, res, next) => {
    const newDoc = await Model.create(req.body)
    res.status(201).json({
        status: "Success",
        data: {
            newDoc
        }
    })
})

exports.getOne = (Model, populateOpt) => catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id)

    if(populateOpt) {
        query = query.populate(populateOpt)
    }
    const doc = await query

    if(!doc) {
        return next(new AppError('Cannot find document with that id', 404))
    }

    res.status(200).send({
        status: 'Success',
        data: {
            doc
        }
    })
})

exports.getAll = Model => catchAsync(async (req, res, next) => {

    //To allow nested GET reviews on tour
    let filter = {}

    if(req.params.tourId) {
        filter = {
            tour: req.query.tourId
        }
    }

    //EXECUTE THE QUERY
    const features = new APIfeatures(Model.find(filter), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate()
    
    const docs = await features.query

    //SEND RESPONSE
    res.status(200).json({
        status: 'Success',
        results: DOMRectList.length,
        data: {
            docs
        }
    })
}
)