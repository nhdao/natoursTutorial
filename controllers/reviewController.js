const Review = require('./../models/reviewModel')
const APIfeatures = require('./../utils/apiFeatures')
const catchAsync = require('./../utils/catchAsync')
const AppError = require('./../utils/appErrors')
const handlerFactory = require('./handlerFactory')


exports.setTourUserId = (req, rex, next) => {
    if(!req.body.tour) {
        req.body.tour = req.params.tourId
    }
    if(!reg.body.user) {
        req.body.user = req.user.id
    }
    next()
}

exports.getAllReviews = handlerFactory.getAll(Review)
exports.createReview = handlerFactory.createOne(Review)
exports.deleteReview = handlerFactory.deleteOne(Review)
exports.updateReview = handlerFactory.updateOne(Review)
exports.getReview = handlerFactory.getOne(Review)