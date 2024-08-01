const nodemailer = require('nodemailer')

const SendEmail = async options => {
    //Create a transporter: a server that actually send email
    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }

        //Activate in gmail 'less secure app' option  <optional>

    })

    //Define email options
    const mailOptions = {
        from: 'nhdao640',
        subject: options.subject,
        to: options.email,
        text: options.message
    }

    //Actually send email with node mailer
    await transporter.sendMail(mailOptions)
}

module.exports = SendEmail