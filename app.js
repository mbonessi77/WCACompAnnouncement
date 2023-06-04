const config = require('./config')
const { MongoClient } = require('mongodb')
const uri = config.mongoDbUri
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true })
const methodOverride = require('method-override')

var bodyParser = require('body-parser')
var jsonParser = bodyParser.json()
var https = require('https')
var schedule = require('node-schedule')
var nodemailer = require('nodemailer')
var urlencodedParser = bodyParser.urlencoded({ extended: true })
var express = require('express')
var app = express()
app.use(jsonParser)
app.use(methodOverride('X-HTTP-Method-Override'))

var compByCountry = new Map()
var compList = []
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    tls: { rejectUnauthorized: false },
    pool: true,
    auth: {
        type: "OAuth2",
        user: config.user,
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        refreshToken: config.refreshtoken
    }
})

app.use(express.static(__dirname))

/***************
 * SERVER CODE *
 ***************/
var server = app.listen(8080, function () {
    var host = server.address().address
    var port = server.address().port
    
    console.log("Listening on port %s", host, port)
 })

schedule.scheduleJob('59 23 * * *', () => {
    compByCountry = new Map()
    compList = []
    var currentDate = new Date()
    var dateString = currentDate.getFullYear() + "-" + (currentDate.getMonth() + 1) + "-" + (currentDate.getDate())
    fetchCompList(dateString)
})

/**********************
 * NOTIFICATION LOGIC *
 **********************/

function fetchCompList(date) {
    https.get("https://www.worldcubeassociation.org/api/v0/competitions?announced_after=" + date, (resp) => {
        let data = ''

        resp.on('data', (chunk => {
            data += chunk
        }))

        resp.on('end', () => {
            var list = JSON.parse(data)
            
            for (var i = 0; i < list.length; i++) {
                compList.push(list[i])
            }

            sortListIntoMap(compList)
            notifyNewComps()
        })
    }).on('error', (err) => {
        console.log("Error: " + err.message)
    })
}

function sortListIntoMap(list) {
    list.forEach(element => {
        try {
            if (typeof compByCountry !== 'undefined') {
                if (compByCountry.has(element.country_iso2)) {
                    var shouldNotAdd = false
                    compByCountry.get(element.country_iso2).filter((comp, index, self) => {
                        index === self.findIndex((e) => {
                            shouldNotAdd = e.id === element.id
                            return shouldNotAdd
                        })
                    })
                    if(!shouldNotAdd) {
                        compByCountry.get(element.country_iso2).push(element)
                    }
                    
                } else {
                    compByCountry.set(element.country_iso2, [])
                    compByCountry.get(element.country_iso2).push(element)
                }
            }
        } catch(exception) {
            console.log(exception + " at country " + element.country_iso2)
        }
    })
}

function notifyNewComps() {
    client.connect(err => {
        const collection = client.db("UsersDB").collection("EmailCollection")
        // const collection = client.db("UsersDB").collection("QACollection")

        compByCountry.forEach((value, key) => {
            collection.find({ country: key }).toArray(async function (err, result) {
                if (err) {
                    throw err
                }

                var emailText = "A new WCA competition was just announced for your country. Details for the competition(s) are below.\n\n"

                for (var k = 0; k < value.length; k++) {
                    emailText += value[k].name + ": " + value[k].url + "\n\n"
                }

                var emails = ""

                for (var k = 0; k < result.length; k++) {
                    if (k == 0) {
                        emails += result[k].email
                    } else {
                        emails += ", " + result[k].email
                    }
                }

                if (emails != "") {
                    var mailOptions = {
                        from: 'Comp Announcer',
                        to: [],
                        bcc: emails,
                        subject: "New Competition In Your Country!",
                        text: emailText,
                        pool: true,
                        maxMessages: Infinity
                    }
    
                    transporter.sendMail(mailOptions, function (err, info) {
                        if (err) {
                            console.log(err)
                        } else {
                            console.log("Email Sent: " + info.response)
                        }
                    })
                }
            })
        })
    })
}

/*******************
 * API INTEGRATION *
 *******************/

app.get('/', function (req, res) {
    res.sendFile( __dirname + "/" + "index.html")
 })

app.post('/add_user', urlencodedParser, function(req, res) {

    var regex = new RegExp('^.+@.+\..+$')

    if(regex.test(req.body.email)) {
        var body = {
            email:req.body.email,
            country:req.body.country
        }
    
        client.connect(err => {
            var collection = client.db("UsersDB").collection("EmailCollection")
            // var collection = client.db("UsersDB").collection("QACollection")
            collection.insertOne(body)
    
            res.sendFile(__dirname + "/" + "user_added.html")
        })
    }
})

app.post('/remove_user', urlencodedParser, function(req, res) {
    client.connect(err => {
        if(err) {
            throw err
        }

        var collection = client.db("UsersDB").collection("EmailCollection")
        // var collection = client.db("UsersDB").collection("QACollection")

        var query = {
            email: req.body.email
        }

        if(req.body.country == "all") {
            collection.deleteMany(query, function(err, collect) {
                if(err) {
                    throw err
                }

                res.sendFile(__dirname + "/user_removed.html")
                client.close()
            })
        } else {
            query.country = req.body.country
            collection.deleteOne(query, function(err, collect) {
                if (err) {
                    throw err
                }
    
                res.sendFile(__dirname + "/user_removed.html")
                client.close()
            })
        }
    })
})