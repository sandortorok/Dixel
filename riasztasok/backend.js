const express = require("express");
const cors = require("cors")
const WebSocket = require('ws')
const puppeteer = require('puppeteer-extra');
const pluginStealth = require('puppeteer-extra-plugin-stealth');
puppeteer.use(pluginStealth());
const ping = require("ping");
const input = require('./input.json')
const app = express();
app.use(cors());
app.use(express.json())

const server = require('http').createServer(app)

const wss = new WebSocket.Server({server:server})

wss.on('connection', function connection(ws) {
    console.log('A new client Connected!');
    ws.send(JSON.stringify({'input' : input}));
    
    ws.on('message', function incoming(message) {
        console.log('received: %s', message);
    });
});


function sendMSG(message){
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);        
        }
    });
}



  

// simple route
app.get("/", (req, res) => {
    res.json({ hello: "This is my backend :))))" });
});

app.post('/start', (req, res) => {
    console.log('start button pressed')
    if (typeof browser == "undefined") {
        start();
        console.log('started')
    }
    res.send("start")
})

app.post('/stop', (req, res) => {
    console.log('stop button pressed')
    if (typeof browser != "undefined") {
        browser.close();
        sendMSG('stopAudio');
        browser = undefined;
        console.log('stopped')
    }
})

app.post('/restart', (req, res) => {
    console.log('restart button pressed')
    if (typeof browser != "undefined") {
        browser.close();
        sendMSG('stopAudio');
        browser = undefined;
        console.log('stopped')

    }
    res.send("restart")
    setTimeout(function () {
        if (typeof browser == "undefined") {
            start();
            console.log('started')

        }
    }, 2000)

})

server.listen(8000, () => {
    console.log('server started at http://localhost:8000')
})

async function login(browser, unloadedPages){
    for (let i = 0; i < unloadedPages.length; i++) {
        var currentURL  = unloadedPages[i].URL;
        const page = await browser.newPage();
        try {
            await page.goto(currentURL),
            await page.waitForSelector('#login-username', {
                visible: true,
            });
            await page.type('#login-username', "Gepesz", { delay: 30 });
            await page.type('#login-password', "Gepesz01", { delay: 30 });
            await page.click('#login-button', { waitUntil: 'networkidle0' })
            await page.waitForSelector('#desktop-dashboard-view', {
                visible: true,
            });
            await page.select('#desktop-dashboard-view', 'list')
            
            loadedPages.push({URL: currentURL, page: page});
            console.log("connected to: ", currentURL) 
            
        }
        catch(err) {
            if
            (
                err.name == 'TimeoutError' || 
                err.message.includes('net::ERR_ADDRESS_UNREACHABLE') || 
                err.message.includes('net::ERR_INTERNET_DISCONNECTED') ||
                err.message.includes('net::ERR_NETWORK_CHANGED')
            ){
                console.log("Can't connect to site ", currentURL);
                console.log(err.message)
                if (!ElementIsInDictArray(unloadedPages,currentURL))
                    unloadedPages.push({URL: currentURL});
                if (ElementIsInDictArray(loadedPages,currentURL)){
                    idx = GetIndexInDictArray(loadedPages,currentURL)
                    loadedPages.splice(idx, 1)
                }
                await delay(1000)
                console.log('closing')
                page.close()
                console.log('closed')
            }
            else{
                console.log('other error ', err.message);
                console.log('closing')
                page.close()
                console.log('closed')   
            }
        }
    }
}
async function getAlarmData(loadedPages){
    mydata = ""
    var time = new Date();
    mydata += `<tr><td colspan="4">Utolsó frissítés: ${time.toLocaleString()}</td></tr>`        
    for (let i = 0; i < loadedPages.length; i++) {
        var currentURL  = loadedPages[i].URL;
        page = loadedPages[i].page;
        const data = await page.evaluate(() => {
            const tds = Array.from(document.querySelectorAll('table tr td'))
            return tds.map(td => {
                if (typeof td.attributes.colspan != "undefined"){
                    str = '<tr>' + td.parentElement.innerHTML + '</tr>'
                    return str
                }
                if(td.innerHTML.includes("alarm")){
                    str = '<tr>' + td.parentElement.innerHTML + '</tr>'
                    return str
                }
            })
        });
        alarmData = []
        for (let x in data){
            if (data[x] != null){
                alarmData.push(data[x])
            }
        }
        for (let y in alarmData){
            mydata += alarmData[y]
        }
        mydata += `<tr><td colspan="4">${currentURL}</td></tr>`        
    }
    sendMSG(mydata)
    console.log('Sent Temp Data')

}
async function getTempData(loadedPages){
    sensorData = []
    for (let i = 0; i < loadedPages.length; i++) {
        var currentURL  = loadedPages[i].URL;
        page = loadedPages[i].page;
        const data = await page.evaluate(() => {
            const tds = Array.from(document.querySelectorAll('table tr td'))
            return tds.map(td => {
                if(td.innerHTML.includes("őmérséklet")){
                    str = '<tr>' + td.parentElement.innerHTML + '</tr>'
                    classnames = td.parentElement.childNodes[0].childNodes[0].className.split(' ')
                    sensorName = td.parentElement.childNodes[2].innerText
                    temperature = td.innerText.split('\n')[0]
                    colorClass = classnames[classnames.length-1]
                    return {name : sensorName, temp: temperature, color: colorClass}
                }
            })
        });
        for (let x in data){
            if (data[x] != null){
                sensorData.push(data[x])
            }
        }
    }

    sendMSG(JSON.stringify(sensorData))
    console.log('Sent Alarm Data')
}
var browser;
async function start(){
    unloadedPages = [
        // {URL: "file:///home/sanyi/Desktop/Panír.5.html"},
        // {URL: "file:///home/sanyi/Desktop/Dixell5.html"},
        // {URL: "file:///home/sanyi/Desktop/Kacsasütő üzem.html"},
        // {URL: "file:///home/sanyi/Desktop/Lev.eh-Csirke feldolgzó.html"},
        // {URL: "file:///home/sanyi/Desktop/300TT.html"}
        {URL: "http://192.168.0.150"},
        {URL: "http://192.168.0.160"},
        {URL: "http://192.168.0.170"},
        {URL: "http://192.168.0.180"},
        {URL: "http://192.168.0.190"},
        {URL: "http://192.168.0.220"},
        {URL: "http://192.168.0.230"}
    ]
    loadedPages = []
    browser = await puppeteer.launch({headless: true});
    while(true){
        try{
            await aliveCheck(loadedPages, unloadedPages)
            await login(browser, unloadedPages);
            removeDictArrayFromDictArray(unloadedPages, loadedPages);
            await getTempData(loadedPages);
            await getAlarmData(loadedPages)
            await delay(10000)
        }
        catch(err) {
            return;
        }
    }
}

function GetIndexInDictArray(array, URL) {
    for(var i in array){
        if(array[i].URL == URL){
            return i
        }
    }
    return -1
}
function ElementIsInDictArray(array, URL){
    for(var i in array){
        if(array[i].URL == URL){
            return true
        }
    }
    return false;
}
function removeDictArrayFromDictArray(removeFrom, removableArray){
    for (let i = 0; i < removableArray.length; i++) {
        index = GetIndexInDictArray(removeFrom, removableArray[i].URL);
        if(index != -1){
            removeFrom.splice(index, 1)
        }
    }
}
function delay(time) {
    return new Promise(function(resolve) { 
        setTimeout(resolve, time)
    });
}
async function isAlive(URL) {
    URL = URL.replace(/^https?:\/\//, '');
    const result = await ping.promise.probe(URL, {
        timeout: 2
    });
    return result.alive;
};
async function aliveCheck(loadedPages, unloadedPages){
    for (let i = 0; i < loadedPages.length; i++) {
        let alive = await isAlive(loadedPages[i].URL)
        if(!alive){
            console.log('ping close')
            loadedPages[i].page.close()
            console.log('ping closed')

            delete loadedPages[i]['page']
            unloadedPages.push(loadedPages[i])
        }
        await delay(1000)
    }
    removeDictArrayFromDictArray(loadedPages, unloadedPages);

}
var unloadedPages = []

var loadedPages = []

start()

console.log('started')










async function CreateDB(){
  var mysql = require('mysql');

  var con = mysql.createConnection({
    host: "localhost",
    user: "Sanyi",
    password: "sakkiraly11"
  });

  con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
    con.query("CREATE DATABASE scrapedb", function (err, result) {
      if (err) throw err;
      console.log("Database created");
    });
  });

}

async function createTable(){
  var mysql = require('mysql');

  var con = mysql.createConnection({
    host: "localhost",
    user: "Sanyi",
    password: "sakkiraly11",
    database: "scrapedb"
  });

  con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
    var sql = "CREATE TABLE sensors (sensor_id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), type VARCHAR(255), location VARCHAR(255), last_val FLOAT)";
    con.query(sql, function (err, result) {
      if (err) throw err;
      console.log("Table created");
    });
  });
}
// CreateDB();
// createTable();