var express = require('express');
var app = express();
var nodemailer = require('nodemailer')
var schedule = require('node-schedule')
var https = require('https')

const { MongoClient } = require('mongodb');
const uri = "";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

var compList
var compByCountry = new Map()
var storedCompCountryList

schedule.scheduleJob('* * * * *', () => {
    fetchCompList()
})

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

function storeCurrentCompList(comp_list) {
    if(compList != null) {
        compList = compList.filter(function(event) {
           return isFutureComp(event)
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
            if (compByCountry.get(element.country_iso2).filter(e => e.id != element.id)) {
                compByCountry.get(element.country_iso2).push(element)
            }
        } else {
            compByCountry.set(element.country_iso2, [])
            compByCountry.get(element.country_iso2).push(element)
        }
    });

    compByCountry.forEach(list => {
        list = list.filter(function(event) {
            return isFutureComp(event)
        })
    })
}

function notifyNewComps() {

    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: "cubecompupdates@gmail.com",
            pass: ""
        },
        tls:{ rejectUnauthorized: false}
    })

    client.connect(err => {
        const collection = client.db("UsersDB").collection("EmailCollection");

        collection.find().toArray(function(err, result) {
            if (err) {
                throw err
            }

            for (var i = 0; i < result.length; i++) {
                var isCompStored = false
        
                var compsToNotify = compByCountry.get(result[i].country).filter(x => { 
                    if (storedCompCountryList != null) {
                        isCompStored = storedCompCountryList.get(x.country_iso2).includes(x)
                    }
        
                    return !isCompStored && isFutureComp(x)
                 })
        
                compsToNotify = compsToNotify.filter(function(comp) {
                    return comp.cancelled_at == null
                })
        
                var emailText = "A new WCA competition was just announced for your country. Details for the competition(s) are below.\n\n"
        
                for (var k = 0; k < compsToNotify.length; k++) {
                    emailText += compsToNotify[k].name + ": " + compsToNotify[k].url + "\n\n"
                }
                
                var mailOptions = {
                    from: 'cubecompupdates@gmail.com',
                    to: result[i].email,
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
        
            storedCompCountryList = compByCountry
    
            client.close();
        })
      });
}

function isFutureComp(event) {
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
}

app.get('/', function (req, res) {
    res.sendFile( __dirname + "/" + "index.html" );
 })

var server = app.listen(8080, function () {
    var host = server.address().address
    var port = server.address().port
    
    console.log("Listening on port %s", host, port)
 })