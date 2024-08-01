class AppError extends Error { //this is syntax to inherit new class from old class
    constructor(message, statusCode) {
        super(message)  //super to call the parent constructor

        this.statusCode = statusCode
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'
        this.isOperational = true  

        Error.captureStackTrace(this, this.constructor)
    }
}

module.exports = AppError