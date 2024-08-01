const express = require('express')

const router = express.Router()

const tourController = require('./../controllers/tourController')
const authenController = require('./../controllers/authenController')
const reviewRouter = require('./reviewRoutes')
//Check ID param - use a param middleware
//router.param('id', tourController.checkId)

//ROUTE MOUNTING
router.use('/:tourId/reviews', reviewRouter)

router
    .route('/top-5-tours')
    .get(
        tourController.aliasTopTours, 
        tourController.getAllTours
    )

router
    .route('/tour-stats')
    .get(tourController.getTourStats)

router
    .route('/monthly-plan/:year')
    .get(
        authenController.protect, 
        authenController.restrictTo('admin', 'lead-guide', 'guide'), 
        tourController.getMonthlyPlan
    )   

router
    .route('/')
    .get(tourController.getAllTours)
    .post(
        authenController.protect, 
        authenController.restrictTo('admin', 'lead-guide'), 
        tourController.createTour
    )

router
    .route('/tour-within/:distance/center/:latlng/unit/:unit')
    .get(tourController.getToursWithin)

router
    .route('/distances/:latlng/unit/:unit')
    .get(tourController.getDistances)

router
    .route('/:id')
    .get(tourController.getTour)
    .patch(
        authenController.protect, 
        authenController.restrictTo('admin', 'lead-guide'), 
        tourController.uploadTourImages,
        tourController.resizeTourImages,
        tourController.updateTour
    )
    .delete(
        authenController.protect, 
        authenController.restrictTo('admin', 'lead-guide'), 
        tourController.deleteTour
    )

module.exports = router