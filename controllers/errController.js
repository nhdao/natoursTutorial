const AppError = require('./../utils/appErrors')

const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}`
    return new AppError(message, 400)
}

const handlleDuplicateErrorDB = err => {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0]
    console.log(value)
    const message = `Duplicate field value. Please enter other value`
    return new AppError(message, 400)
}

const handleValidationErrorDB = err => {
    const errors  = Object.values(err.errors).map(value => value.message)
    const message = `Invalid input data. ${errors.join(`. `)}`
    return new AppError(message, 400)
}

const handleJWTError = error => new AppError('Invalid token! Please login again', 401)

const handleJWTExpiredError = error => new AppError('Your token has expired! Please login again', 401)

const sendErrDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
    })
}

const sendErrProd = (err, res) => {
    //Trusted error, operational: send message to client 
    if(err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        })
    } else {  //Programming or unkwon error: dont leak for details
        //1. Log error
        console.error('ERROR', err)

        //2. Send generic message
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong'
        })
    }
}

module.exports = ((err, req, res, next) => {
   //console.log(err.stack)

    err.statusCode = err.statusCode || 500
    err.status = err.status || 'error'
    
    if(process.env.NODE_ENV === 'development') {
       sendErrDev(err, res)
    } else if(process.env.NODE_ENV === 'production') {
        let error = {...err}
        
        if(error.name === 'CastError') {
            error = handleCastErrorDB(error)
        }

        if(error.code === 11000) {
            error = handlleDuplicateErrorDB(error)
        }

        if(error.name === 'ValidationError') {
            error = handleValidationErrorDB(error)
        }

        if(error.name === 'JsonWebTokenError') {
            error = handleJWTError()
        }

        if(error.name === 'TokenExpiredError') {
            error = handleJWTExpiredError()
        }

       sendErrProd(error, res)
    }

})