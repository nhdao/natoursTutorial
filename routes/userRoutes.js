const express = require('express');


const router = express.Router()


const userController = require('./../controllers/userController')
const authenController = require('./../controllers/authenController')

//ROUTE MOUNTING

//Authentication and authorization related toutes
router
    .route('/signup')
    .post(authenController.signUp)

router
    .route('/login')
    .post(authenController.logIn)

router
    .route('/forgetpassword')
    .post(authenController.forgetPassword)

router
    .route('/resetpassword/:token')
    .patch(authenController.resetPassword)



//Current user related routes
router.use(authenController.protect)

router
    .route('/me')
    .get(
        userController.getMe, 
        userController.getUser
    )
router
    .route('/updatemypassword')
    .patch(
        authenController.updatePassword
    )
router
    .route('/updateme')
    .patch(
        userController.uploadUserPhoto,
        userController.resizeUserPhoto,
        userController.updateMe
    )
router
    .route('/deleteme')
    .patch(
        userController.deleteMe
    )


//Admin related route
router.use(authenController.restrictTo('admin'))

// router
//     .route('/')
//     .get(userController.getAllUsers)
// router
//     .route('/:id')
//     .get(userController.getUser)
//     .patch(userController.updateUser)
//     .delete(userController.deleteUser)

module.exports = router