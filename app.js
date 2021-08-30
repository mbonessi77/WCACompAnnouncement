var express = require('express');
var app = express();
var nodemailer = require('nodemailer')
var schedule = require('node-schedule')
var https = require('https')

var compList
var userList = [{
                 user_email: "antoniobonessi@gmail.com",
                 user_country: "US"
                },
                {
                 user_email: "antoniobonessi@yahoo.com",
                 user_country: "NZ"
                 }]

https.get("https://www.worldcubeassociation.org/api/v0/competitions", (resp) => {
    let data = ''

    resp.on('data', (chunk => {
        data += chunk
    }))

    resp.on('end', () => {
        compList = JSON.parse(data)
    })
}).on('error', (err) => {
    console.log("Error: " + err.message)
})

schedule.scheduleJob('* * * * *', () => {
    notifyNewComps()
})

function notifyNewComps() {

    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: "antoniobonessi@gmail.com",
            pass: "rwyfrvtcjbpmzmoz"
        },
        tls:{ rejectUnauthorized: false}
    })

    for (var i = 0; i < userList.length; i++) {
        var filteredComps = compList.filter(function(event) {
            return event.country_iso2 == userList[i].user_country
        })

        filteredComps = filteredComps.filter(function(comp) {
            return comp.cancelled_at == null
        })

        var emailText = "A new WCA competition was just announced for your country. Details for the competition(s) are below.\n\n"

        for (var k = 0; k < filteredComps.length; k++) {
            emailText += filteredComps[k].name + ": " + filteredComps[k].url + "\n\n"
        }
        
        var mailOptions = {
            from: 'antoniobonessi@gmail.com',
            to: userList[i].user_email,
            subject: "New Competition In Your Country!",
            text: emailText
        }

        transporter.sendMail(mailOptions, function(err, info) {
            if (err) {
                console.log(err)
            } else {
                console.log("Email Sent: " + info.response)
            }
        })
    }
}

app.get('/', function (req, res) {
    res.sendFile( __dirname + "/" + "index.html" );
 })

var server = app.listen(8080, function () {
    var host = server.address().address
    var port = server.address().port
    
    console.log("Listening on port %s", host, port)
 })