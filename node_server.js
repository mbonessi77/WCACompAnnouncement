var express = require('express');
var app = express();
var nodemailer = require('nodemailer')

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: "antoniobonessi@gmail.com",
        pass: "shhhh. it's secret"
    },
    tls:{ rejectUnauthorized: false}
})

var mailOptions = {
    from: 'antoniobonessi@yahoo.com',
    to: 'antoniobonessi@gmail.com',
    subject: "Test Email",
    text: "Does this work?"
}

transporter.sendMail(mailOptions, function(err, info) {
    if (err) {
        console.log(err)
    } else {
        console.log("Email Sent: " + info.response)
    }
})

app.get('/', function (req, res) {
    res.sendFile( __dirname + "/" + "index.html" );
 })

var server = app.listen(8080, function () {
    var host = server.address().address
    var port = server.address().port
    
    console.log("Example app listening on port %s", host, port)
 })