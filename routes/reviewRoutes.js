const express = require('express')
const reviewController = require('./../controllers/reviewController')
const authenController = require('./../controllers/authenController')

const router = express.Router({mergeParams: true})
//We need 'mergeParam: true' because normally, each route only can get
//access to the param of it's specific route
//in createReview controller, we need to get access to tourId param from tourRoutes

router.use(authenController.protect)

router
    .route('/')
    .get(reviewController.getAllReviews)
    .post( 
        authenController.restrictTo('user'), 
        reviewController.setTourUserId,
        reviewController.createReview
    )

router
    .route('/:id')
    .get(reviewController.getReview)
    .patch(
        authenController.restrictTo('user', 'admin'), 
        reviewController.updateReview
    )
    .delete(
        authenController.restrictTo('user', 'admin'), 
        reviewController.deleteReview
    )

module.exports = router