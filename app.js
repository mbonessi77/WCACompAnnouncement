var bodyParser = require('body-parser')
const methodOverride = require('method-override')
const ObjectsToCsv = require('objects-to-csv')
const toJson = require('csvtojson')
const fs = require('fs')
const { promisify } = require('util')
const sleep = promisify(setTimeout)
const {Storage} = require('@google-cloud/storage')
const storage = new Storage()
const bucket = storage.bucket('comp_list_bucket')
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
const uri = ""
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true })

var compList
var compByCountry = new Map()
var tempList = []

app.use(express.static(__dirname))

schedule.scheduleJob('0 0 * * *', () => { //Schedule for midnight UTC
    fetchCompList(1)
})

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
            qaCollection.deleteOne(query, function(err, collect) {
                if (err) {
                    throw err
                }
    
                res.sendFile(__dirname + "/user_removed.html")
                client.close()
            })
        }
    })
})

function fetchCompList(pageNum) {
    https.get("https://www.worldcubeassociation.org/api/v0/competitions?page=" + pageNum, (resp) => {
        let data = ''

        resp.on('data', (chunk => {
            data += chunk
        }))

        resp.on('end', () => {
            var list = JSON.parse(data)
            
            for (var i = 0; i < list.length; i++) {
                tempList.push(list[i])
            }

            if(pageNum < 4) {
                fetchCompList(pageNum + 1)
            } else {
                storeCurrentCompList(tempList)
            }
        })
    }).on('error', (err) => {
        console.log("Error: " + err.message)
    })
}

function storeCurrentCompList(comp_list) {
    if(compList != null) {
        let result = compList.length == comp_list.length &&
            comp_list.every(function(element) {
                return compList.includes(element)
            })

        if (result) {
            return
        }

        compList = compList.filter(function(event) {
           return isFutureComp(event)
        })
    }

    compList = []

    for(var i = 0; i < comp_list.length; i++) {
        compList.push(comp_list[i])
    }

    sortListIntoMap(compList)

    notifyNewComps()
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
            user: "cubecompupdates@cubecompupdates.net",
            pass: ""
        },
        tls:{ rejectUnauthorized: false},
        pool: true
    })

    client.connect(err => {
        const collection = client.db("UsersDB").collection("EmailCollection")
        // const collection = client.db("UsersDB").collection("QACollection")

        for (const [key, value] of compByCountry) {
            readCountryCsv(key).catch(console.error).then(storedList => {
                var compsToNotify = value.filter(x => {
                    var isCompStored = false
                    if (storedList != null) {
                        isCompStored = storedList.some(event => event.id === x.id)
                    }
    
                    return !isCompStored && isFutureComp(x)
                })
    
                compsToNotify = compsToNotify.filter(function (comp) {
                    return comp.cancelled_at == null
                })
    
                if (compsToNotify.length == 0) {
                    return
                }
    
                collection.find({ country: key }).toArray(async function (err, result) {
                    if (err) {
                        throw err
                    }
    
                    var emailText = "A new WCA competition was just announced for your country. Details for the competition(s) are below.\n\n"
    
                    for (var k = 0; k < compsToNotify.length; k++) {
                        emailText += compsToNotify[k].name + ": " + compsToNotify[k].url + "\n\n"
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
    
                    await writeCountryCsv(key, value).catch(console.error)
                })
            })
        }
    })
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

async function writeCountryCsv(countryName, compsInCountry) {
    let csv = new ObjectsToCsv(compsInCountry)
    let path = './' + countryName + '.csv'
    await csv.toDisk(path).catch(console.error)

    await bucket.upload(path, {destination: countryName + '.csv'}).catch(console.error)

    console.log("Upload complete")
}

async function readCountryCsv(countryName) {
    let fileName = countryName + '.csv'
    let path = './' + fileName
    var result

    const options = {
        destination: path
    }

    await bucket.file(fileName).download(options).catch(console.error)

    if (fs.existsSync(path)) {
        await toJson()
        .fromFile(path).then(function(list) {
            result = list
        })
    }

    return result
}

var server = app.listen(8080, function () {
    var host = server.address().address
    var port = server.address().port
    
    console.log("Listening on port %s", host, port)
 })