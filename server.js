//START THE SERVER
const dotenv = require('dotenv')
const port = process.env.PORT || 5500
dotenv.config({path: './config.env'})
//console.log(process.env)
const mongoose = require('mongoose')
const DB = process.env.DATABASE.replace(
    '<PASSWORD>', 
    process.env.DATABASE_PASSWORD
)

mongoose.connect(DB, {
    //useNewUrlParser: true,
    //useCreateIndex: true,
   // useFindandModify: false
}).then(() => console.log("DB connection successfully"))

const app = require('./app')
const server = app.listen(port, () => {
    console.log(`App running on port ${port}`)
})

process.on('unhandledRejection', err => {
    console.log(err.name, err.message)
    console.log('UNHANDLED REJECTION')
    server.close(() => process.exit(1))
})

process.on('uncaughtException', err => {
    console.log(err.name, err.message)
    console.log('UNHANDLED EXCEPTION')
    server.close(() => process.exit(1))
})