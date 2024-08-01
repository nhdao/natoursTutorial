const User = require('./../models/userModel')
const catchAsync = require('./../utils/catchAsync')
const AppError = require('./../utils/appErrors')
const APIfeatures = require('./../utils/apiFeatures')
const handelerFactory = require('./handlerFactory')
const multer = require('multer');
const sharp = require('sharp')


// const multerStorage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, 'public/img/users')
//     },
//     filename: (req, file, cb) => {
//         const ext = file.mimetype.split('/')[1]
//         cb(null, `user-${req.user.id}-${Date.now()}.${ext}`)
//     }
// })

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

exports.uploadUserPhoto = upload.single('photo')

exports.resizeUserPhoto = catchAsync(async (req, res, next) => { 
    if(!req.file) {
        return next()
    }

    req.file.filename = `user-${req.user.id}-${Date.now()}`

    //Start processing images
    await sharp(req.file.buffer)
        .resize(500, 500)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/users/${req.file.filename}`)

    next()
})

const filterObj = (obj, ...allowedFields) => {
    const newObj = {}
    Object.keys(allowedFields).forEach(el => {
        if(allowedFields.includes(el)) {
            newObj[el] = obj[el]
        }
    })

    return newObj
}


/*----- USERS ROUTE HANDLER -----*/

exports.getMe = (req, res, next) => {
    req.params.id = req.user.id
    next()
}

//user itself update its data
exports.updateMe = catchAsync(async (req, res, nest) => {
    //1. Create error if user try to update password in this route
    if(req.body.password || req.body.passwordConfirm) {
        return next(new AppError('This route is not for updating password!', 400))
    }

    //2. Filter out unwanted field
    const filteredBody = filterObj(req.body, 'name', 'email')

    if(req.file) {
        filteredBody.photo = req.file.filename
    }

    //3. Update user document
    const user = await User.findByIdAndUpdate(req.user.id, filteredBody, {
        new: true,
        runValidators: true
    })

    res.status(200).json({
        status: 'success', 
        user
    })
})

//user delete itself from app 
//we do not immediately delete user from database
//we just set the account status to 'INACTIVE'
exports.deleteMe = catchAsync(async (req, res, next) => {

    await User.findByIdAndUpdate(req.user.id, { active: false })

    res.status(204).send({
        status: 'Error'
    })


exports.getAllUsers = handelerFactory.getAll(User)
exports.getUser = handelerFactory.getOne(User)
//Do NOT update password with this
exports.updateUser = handelerFactory.updateOne(User) 
exports.deleteUser = handelerFactory.deleteOne(User)


})