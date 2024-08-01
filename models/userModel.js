const mongoose = require('mongoose')
const slugify = require('slugify')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please tell us your name!']
    },
    email: {
        type: String,
        required: [true, 'Please provide your email!'],
        unique: true,
        lowercase: true, //transform the email to lower case
        validate: [validator.isEmail, 'Please provide a valid email!']
    },
    photo: {
        type: String,
    },
    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user'
    },
    password: {
        type: String,
        required: [true, 'Please provide your password!'],
        minLength: 8,
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please provide your password!'],
        validate: {
            validator: function(passwordConfirm) { //this onlys works on SAVE and CREATE
                return this.password === passwordConfirm
             }, 
             message: 'Password does not match!'
        }
    },
    passwordResetToken: {
        type: String
    },
    passwordResetExpired: Date,
    passwordChangedAt: Date,
    active: {
        type: Boolean,
        default: false,
        select: false
    }
})

userSchema.pre('save', async function(next) {
    //only run this function if password is modified
    if(!this.isModified('password')) return next()

    this.password = await bcrypt.hash(this.password, 12)  //encrypt the password with the cost of 12
    this.passwordConfirm = undefined    //delete the passwordConfirm 
    next()
})

userSchema.pre('save', function(next) {
    if(this.isModified('password') || this.isNew) return next()

    this.passwordChangedAt = Date.now() - 1000
    //This '- 1000' just to make sure that jwt token is 'always' issued after password changes

    next()
})

//This is a query middleware
userSchema.pre('/^find/', function(next) {
    //This points to current query
    this.find({active: {$ne: false}})
    next()
})

//create a instance method to check password. An instance method is a method
//that can be accessible by all documents in the collection
userSchema.methods.correctPassword = async (candidatePassword, userPassword) => {
    return bcrypt.compare(candidatePassword, userPassword)
}          

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
    if(this.passwordChangedAt) {
        const passwordChangedAt = parseInt(this.passwordChangedAt.getTime()/1000, 10) 

        return JWTTimestamp < passwordChangedAt
    }

    return false
}

userSchema.methods.createPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex')

    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex')

    this.passwordResetExpired = Date.now() + 10 * 60 * 1000

    return resetToken
}

const User = mongoose.model('user', userSchema)

module.exports = User
