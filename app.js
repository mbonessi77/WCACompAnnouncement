var express = require('express');
var app = express();
var nodemailer = require('nodemailer')
var schedule = require('node-schedule')
var https = require('https')

var compList
var compByCountry = new Map()

var userList = [{
                 user_email: "antoniobonessi@gmail.com",
                 user_country: "US"
                },
                {
                 user_email: "antoniobonessi@yahoo.com",
                 user_country: "NZ"
                 }]

schedule.scheduleJob('* * * * *', () => {
    fetchCompList()
})

function storeCurrentCompList(comp_list) {
    if(compList != null) {
        compList = compList.filter(function(event) {
            var startDate = event.start_date
            var dateArr = startDate.split("-")
            var year = dateArr[0]
            var month = dateArr[1]
            var day = dateArr[2]

            var currentDate = new Date()
            var currentYear = currentDate.getFullYear()
            var currentMonth = currentDate.getMonth() + 1 //Default is 0-11
            var currentDay = currentDate.getDate()

            var isFutureComp = true

            if (year < currentYear) {
                isFutureComp = false
            } else if (month < currentMonth && year <= currentYear) {
                isFutureComp = false
            } else if (day < currentDay && month <= currentMonth && year <= currentYear) {
                isFutureComp = false
            }

            return isFutureComp
        })
    }

    if (JSON.stringify(compList) === JSON.stringify(comp_list)) {
        return
    }

    compList = comp_list

    sortListIntoMap(compList)

    notifyNewComps()
}

function sortListIntoMap(list) {
    list.forEach(element => {
        if (compByCountry.has(element.country_iso2)) {
            compByCountry.get(element.country_iso2).push(element)
        } else {
            compByCountry.set(element.country_iso2, [])
            compByCountry.get(element.country_iso2).push(element)
        }
    });

    compByCountry.forEach(list => {
        list = list.filter(function(event) {
            var startDate = event.start_date
            var dateArr = startDate.split("-")
            var year = dateArr[0]
            var month = dateArr[1]
            var day = dateArr[2]

            var currentDate = new Date()
            var currentYear = currentDate.getFullYear()
            var currentMonth = currentDate.getMonth() + 1 //Default is 0-11
            var currentDay = currentDate.getDate()

            var isFutureComp = true

            if (year < currentYear) {
                isFutureComp = false
            } else if (month < currentMonth && year <= currentYear) {
                isFutureComp = false
            } else if (day < currentDay && month <= currentMonth && year <= currentYear) {
                isFutureComp = false
            }

            return isFutureComp
        })
    })
}

function fetchCompList() {
    https.get("https://www.worldcubeassociation.org/api/v0/competitions", (resp) => {
        let data = ''

        resp.on('data', (chunk => {
            data += chunk
        }))

        resp.on('end', () => {
            storeCurrentCompList(JSON.parse(data))
        })
    }).on('error', (err) => {
        console.log("Error: " + err.message)
    })
}

function notifyNewComps() {

    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: "antoniobonessi@gmail.com",
            pass: ""
        },
        tls:{ rejectUnauthorized: false}
    })

    for (var i = 0; i < userList.length; i++) {
        var compsToNotify = compByCountry.get(userList[i].user_country)

        compsToNotify = compsToNotify.filter(function(comp) {
            return comp.cancelled_at == null
        })

        var emailText = "A new WCA competition was just announced for your country. Details for the competition(s) are below.\n\n"

        for (var k = 0; k < compsToNotify.length; k++) {
            emailText += compsToNotify[k].name + ": " + compsToNotify[k].url + "\n\n"
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