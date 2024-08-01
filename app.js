const fs = require('fs')
const express = require('express')
const morgan = require('morgan')
const path = require('path')
const rateLimit = require('express-rate-limit')
const helmet = require('helmet')
const mongoSanitize = require('express-mongo-sanitize')
const xss = require('xss-clean')
const hpp = require('hpp')

const AppError = require('./utils/appErrors')
const globalErrHandler = require('./controllers/errController')
const tourRouter = require('./routes/tourRoutes')
const userRouter = require('./routes/userRoutes')
const reviewRouter = require('./routes/reviewRoutes')


const app = express()

//1. GLOBAL MIDDLEWARE
//Set security HTTP headers
app.use(helmet()) 

//Development logging
if(process.env.NODE_ENV == 'development') {
    app.use(morgan('dev'))
}

//Apply rate limit
const limiter = rateLimit({
    max: 100, //how many request allowed
    windowMs: 60 * 60 * 1000, //100 requests per 1 hour
    message: 'Too many requests, please try again in 1 hour!'
})

app.use('/api', limiter) //Apply to all routes start with /api

//Body parser, reading data from body into req.body
app.use(express.json({
    limit: '10kb', //Limit body payload
}))

//Data sanitization against NoSQL query injection
app.use(mongoSanitize()) //It basically return a middleware that filter out all the $ or . sign in req.quey, req.param

//Data sanitization against XSS attacks
app.use(xss()) //Clean any user input from HTML code from attacker

//Prevent parameters polution
app.use(hpp({
    whitelist: ['duration', 'ratingsQuantity', 'maxGroupSize', 'ratingsAverage', 'price']
}))

//Serving static file
app.use(express.static(path.join(__dirname, '/public')))



app.use('/api/v1/tours', tourRouter)
app.use('/api/v1/users', userRouter)
app.use('/api/v1/reviews', reviewRouter)

app.all('*', (req, res, next) => { 
    next(new AppError(`Can not find ${req.originalUrl} on this server`, 404))
})

app.use(globalErrHandler)

module.exports = app

