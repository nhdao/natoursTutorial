const {promisify} = require('util')
const crypto = require('crypto')
const User = require('./../models/userModel')
const catchAsync = require('./../utils/catchAsync')
const AppError = require('./../utils/appErrors')
const SendEmail = require('./../utils/sendEmail')
const jwt = require('jsonwebtoken')

const signToken = id => {
    return jwt.sign({id}, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    })
}

const createAndSendToken = (user, statusCode, res) => {
    const token = signToken(user._id)

    const cookiesOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIES_EXPIRES_IN * 24 * 60 * 60 * 1000),
        secure: false,  //Cookies only be sent via encrypted connection
        httpOnly: true //Make sure that cookies cannot be modified in any way by browser
    }

    if(process.env.NODE_ENV == 'production') {
        cookiesOptions.secure = true
    }

    //Send jwt token via cookies to prevent from some attacks like XSS
    res.cookie('jwt', token, cookiesOptions)

    user.password = undefined //remove password field from response

    res.status(statusCode).json({
        status: 'OK',
        token,
        data: {
            user: user
        }
    })
}

exports.signUp = catchAsync(async (req, res, next) => {
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm
    })

   createAndSendToken(newUser, 201, res)
})

exports.logIn = catchAsync(async (req, res, next) => {
    const {email, password} = req.body

    //1. Check if email and password are provided
    if(!email || !password) {
        return next(new AppError('Please provide email and password', 401))
    }

    //2. Check if user exist and password is correct
    const user = await User.findOne({email}).select('+ password')

    if(!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Email or password is incorrect. Try again!', 401))
    }

    //3. Send token to client if everything is OK
    createAndSendToken(user, 200, res)
})

exports.protect = catchAsync(async (req, res, next) => {
    //1. Check if token is contained in the header or not
    let token

    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1]
    } 

    if(!token) {
        return next(new AppError('You are not login! Please login to get access', 401)) //401 means unauthorize
    }

    //2. Verify the token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)

    //3. Check if user still exists
    const currentUser = await User.findById(decoded.id)
    if(!currentUser) {
        return next(new AppError('The user belonging to the token is no longer exists', 401))
    }

    //4. Check if user changed password after the token was issued
    if(currentUser.changedPasswordAfter(decoded.iat)) { //iat stands for 'issued at' basically
        return next(new AppError('Password recently been changed! Please login again', 401))
    }

    //GRAND ACCESS TO PROTECTED ROUTES
    req.user = currentUser
    next()
})

exports.restrictTo = (...roles) => {
    //we create a function return a middleware function so that we can pass args into middleware function
    return (req, res, next) => {
        //roles is an array
        if(!roles.includes(req.user.role)) {
            return new AppError('You do not have permission to perform this action', 403)
        }

        next()
    }
}

exports.forgetPassword = catchAsync(async (req, res, next) => {
    //Let just make it clear that instead of sending the reset token to user
    //through response (which is unsafe), we send reset token to user's email
    //with the help of nodemailer

    //1. Get user based on email
    const user = await User.find({email: req.user.email})

    if(!user) {
        return next(new AppError('No user with that email', 404))
    }

    //2. Generate random token 
    const resetToken  = user.createPasswordResetToken()

    await user.save({validateBeforeSave: false})  //validateBeforeSave: false is used to turn off all validator in model

    //3. Send it back to user through email
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${req.params.token}`

    const message = `click ${resetURL} to reset your password`

    try{
        await SendEmail({
            email: user.email,
            subject: 'Reset password (valid for 10 minutes)',  
            message: message,
        })
    
        res.status(200).json({
            status: 'Success',
            message: 'Send reset token successfully!'
        })
    } catch(err) {  
        //If send email failed, reset token and expired time
        user.passwordResetToken = undefined
        user.passwordResetExpired = undefined
        await user.save({validateBeforeSave: false})

        return next(
            new AppError('Error sending email to user', 500)
        )
    }
})

exports.resetPassword = catchAsync(async (req, res, next) => {
    //1. Get user based on the token
    const hashedToken = crypto.createHashed('sha256').update(req.params.token).digest('hex')
    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpired:{
            $gt: Date.now()
        }
    })

    //2. Set new password only if user exist and token is not expired
    if(!user) {
        return next(new AppError('Token is invalid or is expired'), 400)
    }

    //3. Update changePasswordAt property for the user
    user.password = req.body.password
    user.passwordResetToken = undefined
    user.passwordResetExpired = undefined

    //user.passwordChangedAt = Date.now()
    //Instead of doing this, we can make it happen 'automatically' 
    //by using userSchema.pre('save', function(next) {}) in userModels

    await user.save()

    //4. Login user, send JWT token
    createAndSendToken(user, 200, res)
})

exports.updatePassword = catchAsync(async (req, res, next) => {

    //1. Get user from collection 
    const user = User.findById(req.user.id).select('+password')

    //2. Check if input password is correct
    if(!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
        return next(new AppError('Wrong password! Try again', 401))
    }

    //3. Update the password
    user.password = req.body.password
    user.passwordConfirm = re.body.passwordConfirm

    await user.save()

    //4. Log user in, send jwt token
    createAndSendToken(user, 200, res)
})
