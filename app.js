var bodyParser = require('body-parser')
const methodOverride = require('method-override')
const { promisify } = require('util')
const sleep = promisify(setTimeout)
var jsonParser = bodyParser.json()
var https = require('https')
var schedule = require('node-schedule')
var nodemailer = require('nodemailer')
var urlencodedParser = bodyParser.urlencoded({ extended: true })
var express = require('express')
var app = express()
app.use(jsonParser)
app.use(methodOverride('X-HTTP-Method-Override'))

const { MongoClient } = require('mongodb')
const uri = "mongodb+srv://CompUpdator:K9iZkJPiVBuqWXD5@useremails.t5qbm.mongodb.net/myFirstDatabase?retryWrites=true&w=majority"
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true })

var compByCountry = new Map()
var compList = []

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
    })
}

function notifyNewComps() {
    client.connect(err => {
        const collection = client.db("UsersDB").collection("EmailCollection")
        // const collection = client.db("UsersDB").collection("QACollection")

        var transporter = nodemailer.createTransport({
            service: 'gmail',
            secure: true,
            tls: { rejectUnauthorized: false },
            pool: true,
            maxMessages: 500,
            maxConnections: 20,
            auth: {
                type: "OAuth2",
                user: "cubecompupdates@cubecompupdates.net",
                clientId: "401597408299-7hk9gp48aq92i83467vign5javo95ebc.apps.googleusercontent.com",
                clientSecret: "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",
                refreshToken: "1//04QBcKPtN72aACgYIARAAGAQSNwF-L9Irq_ivxp3rfty8aYC6H2z42GtSDCG4icGIRUFTqvRn63JYUxWhx9vATaB1FcZFOKESZhU"
            }
        })

        compByCountry.forEach((value, key) => {
            collection.find({ country: key }).toArray(async function (err, result) {
                if (err) {
                    throw err
                }

                var emailText = "A new WCA competition was just announced for your country. Details for the competition(s) are below.\n\n"

                for (var k = 0; k < value.length; k++) {
                    emailText += value[k].name + ": " + value[k].url + "\n\n"
                }

                for (var i = 0; i < result.length; i++) {
                    sleep(1000)
                    var mailOptions = {
                        from: 'Comp Announcer',
                        to: result[i].email,
                        subject: "New Competition In Your Country!",
                        text: emailText
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