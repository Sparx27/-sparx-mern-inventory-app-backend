const nodemailer = require('nodemailer')

const sendEmail = async (subject, message, sendto, sentfrom, replyto) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: 587,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  })

  const options = {
    from: sentfrom,
    to: sendto,
    replyTo: replyto,
    subject,
    html: message
  }

  // send email
  transporter.sendMail(options, function (err, info) {
    if (err) {
      console.log(err)
    } else {
      console.log(info)
    }
  })
}

module.exports = sendEmail
