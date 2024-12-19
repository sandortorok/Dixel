const express = require("express");
const cors = require("cors");
const WebSocket = require("ws");
const puppeteer = require("puppeteer-extra");
const pluginStealth = require("puppeteer-extra-plugin-stealth");
puppeteer.use(pluginStealth());
const ping = require("ping");
const { Page, Browser } = require("puppeteer");
const { updateValues } = require("./modbus-server");
/**
 * beolvasott input.json object
 * @type {Array<{index: number, name: string}>}
 */
const input = require("./input.json");

const app = express();
app.use(cors());
app.use(express.json());

/**
 * http server
 */
const server = require("http").createServer(app);

/**
 * WebSocket Server
 */
const wss = new WebSocket.Server({ server: server });

wss.on("connection", function connection(ws) {
  console.log("A new client Connected!");
  /**
   * Elküldjük a beolvasott input.json-t a frissen bejelentkezett felhasználónak
   */
  ws.send(JSON.stringify({ input: input }));

  ws.on("message", function incoming(message) {
    console.log("received: %s", message);
  });
});

/**
 * Üzenet küldése az összes kliensnek a websocket-en
 * @param {string} message Küldött üzenet
 */
function sendMSG(message) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

app.get("/", (req, res) => {
  res.json({ hello: "This is my backend :))))" });
});

app.post("/start", (req, res) => {
  if (typeof browser == "undefined") {
    start();
    console.log("started");
  }
  res.send("start");
});

app.post("/stop", (req, res) => {
  console.log("stop button pressed");
  if (typeof browser != "undefined") {
    browser.close();
    sendMSG("stopAudio");
    browser = undefined;
    console.log("stopped");
  }
});

app.post("/restart", (req, res) => {
  console.log("restart button pressed");
  if (typeof browser != "undefined") {
    browser.close();
    sendMSG("stopAudio");
    browser = undefined;
    console.log("stopped");
  }
  res.send("restart");
  setTimeout(function () {
    if (typeof browser == "undefined") {
      start();
      console.log("started");
    }
  }, 2000);
});

server.listen(8000, () => {
  console.log("server started at http://localhost:8000");
});

/**
 * Megpróbálja megnyitni a beadott URL-eket, majd beírja a felhasználónevet és a jelszót.
 * Ha sikerül belépni, akkor átmegy a list menüre a Dixell-es weboldalon
 *
 * Az error-t dob az oldal megnyitása, akkor bezárja az oldalt és majd később újra megpróbálja
 *
 * @param {Browser} browser böngésző objektum
 * @param {Array<{URL: string}>} unloadedPages megnyitandó URL címek listája
 */
async function login(browser, unloadedPages) {
  for (let i = 0; i < unloadedPages.length; i++) {
    var currentURL = unloadedPages[i].URL;
    const page = await browser.newPage();
    try {
      await page.goto(currentURL);
      await page.waitForSelector("#login-username", {
        visible: true,
      });
      await page.type("#login-username", "Gepesz", { delay: 30 });
      await page.type("#login-password", "Gepesz1001", { delay: 30 });
      await page.click("#login-button", { waitUntil: "networkidle0" });
      await page.waitForSelector("#desktop-dashboard-view", {
        visible: true,
      });
      await page.select("#desktop-dashboard-view", "list");

      loadedPages.push({ URL: currentURL, page: page });
      console.log("connected to: ", currentURL);
    } catch (err) {
      if (
        err.name == "TimeoutError" ||
        err.message.includes("net::ERR_ADDRESS_UNREACHABLE") ||
        err.message.includes("net::ERR_INTERNET_DISCONNECTED") ||
        err.message.includes("net::ERR_NETWORK_CHANGED")
      ) {
        console.log("Can't connect to site ", currentURL);
        console.log(err.message);
        if (!ElementIsInDictArray(unloadedPages, currentURL))
          unloadedPages.push({ URL: currentURL });
        if (ElementIsInDictArray(loadedPages, currentURL)) {
          idx = GetIndexInDictArray(loadedPages, currentURL);
          loadedPages.splice(idx, 1);
        }
        await delay(5000);
        console.log("closing");
        page.close();
        console.log("closed");
      } else {
        console.log("other error ", err.message);
        console.log("closing");
        page.close();
        console.log("closed");
      }
    }
  }
}
/**
 * Kiveszi az oldalból a piros színű (device-status-alarm class-al rendelkező) sorokat
 * Ezekből csinál egy html <tr></tr> -t és továbbküldi WebSocket-en a csatlakozott weboldalakra
 * Ez fog megjelenni az index.html-en
 * @param {Array<{URL: string, page: Page}>} loadedPages betöltött oldalak listája
 */
async function getAlarmData(loadedPages) {
  mydata = "";
  var time = new Date();
  mydata += `<tr><td colspan="4">Utolsó frissítés: ${time.toLocaleString()}</td></tr>`;
  for (let i = 0; i < loadedPages.length; i++) {
    var currentURL = loadedPages[i].URL;
    page = loadedPages[i].page;
    const data = await page.evaluate(() => {
      const tds = Array.from(document.querySelectorAll("table tr td"));
      return tds.map((td) => {
        if (typeof td.attributes.colspan != "undefined") {
          str = "<tr>" + td.parentElement.innerHTML + "</tr>";
          return str;
        }
        if (td.innerHTML.includes("alarm")) {
          str = "<tr>" + td.parentElement.innerHTML + "</tr>";
          return str;
        }
      });
    });
    alarmData = [];
    for (let x in data) {
      if (data[x] != null) {
        alarmData.push(data[x]);
      }
    }
    for (let y in alarmData) {
      mydata += alarmData[y];
    }
    mydata += `<tr><td colspan="4">${currentURL}</td></tr>`;
  }
  sendMSG(mydata);
  console.log("Sent Alarm Data");
}
/**
 * Kiolvassa az oldalból azoknak a soroknak a hőmérséklet értékeit, ahol van hőmérséklet paraméter
 * ezt belerakja egy JSON Object-be, amit majd WebSocket-en továbbít
 * @param {Array<{URL: string, page: Page}>} loadedPages betöltött oldalak listája
 */
async function getTempData(loadedPages) {
  sensorData = [];
  for (let i = 0; i < loadedPages.length; i++) {
    var currentURL = loadedPages[i].URL;
    page = loadedPages[i].page;
    const data = await page.evaluate(() => {
      const tds = Array.from(document.querySelectorAll("table tr td"));
      return tds.map((td) => {
        if (td.innerHTML.includes("őmérséklet")) {
          let req_temp = undefined;
          classnames =
            td.parentElement.childNodes[0].childNodes[0].className.split(" ");
          sensorName = td.parentElement.childNodes[2].innerText;
          temperature = td.innerText.split("\n")[0];
          lista = td.innerText.split("\n");
          colorClass = classnames[classnames.length - 1];
          lista.forEach((elem) => {
            if (elem == "Alacsony hőmérséklet: ON") {
              colorClass = "device-status-lowtemp";
            } else if (elem == "Magas hőmérséklet: ON") {
              colorClass = "device-status-hightemp";
            } else if (elem.includes("Kért hőmérséklet")) {
              req_temp = elem;
            }
          });
          return {
            name: sensorName,
            temp: temperature,
            color: colorClass,
            req_temp: req_temp,
          };
        }
      });
    });
    for (let x in data) {
      if (data[x] != null) {
        sensorData.push(data[x]);
      }
    }
  }
  updateValues(sensorData);
  sendMSG(JSON.stringify(sensorData));
  console.log("Sent Temp Data");
}
/**
 * Böngésző objektum
 * @type {Browser}
 */
var browser;

/**
 * Fő függvény, megadjuk itt az URL címeket, amiket be kell majd tölteni.
 * Ha valamelyik kikapcsol, akkor bezárjuk és újra megpróbáljuk megnyitni/bejelentkezni.
 * Ha minden rendben megy, akkor 10mp-enként küldi az adatokat a klienseknek
 */
async function start() {
  unloadedPages = [
    // { URL: "file:///home/sanyi/Desktop/dixell-htmls/Panír.5.html" },
    // { URL: "file:///home/sanyi/Desktop/dixell-htmls/Dixell5.html" },
    // { URL: "file:///home/sanyi/Desktop/dixell-htmls/Kacsasütő üzem.html" },
    // {
    //   URL: "file:///home/sanyi/Desktop/dixell-htmls/Lev.eh-Csirke feldolgzó.html",
    // },
    // { URL: "file:///home/sanyi/Desktop/dixell-htmls/300TT.html" },
    { URL: "http://192.168.0.150" },
    { URL: "http://192.168.0.160" },
    { URL: "http://192.168.0.170" },
    { URL: "http://192.168.0.180" },
    { URL: "http://192.168.0.190" },
    { URL: "http://192.168.0.220" },
    { URL: "http://192.168.0.230" },
  ];
  loadedPages = [];
  const options = {
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--single-process", // <- this one doesn't works in Windows
      "--disable-gpu",
    ],
    headless: true,
    executablePath: "/usr/bin/chromium-browser",
  };
  browser = await puppeteer.launch(options);
  while (true) {
    try {
      // await aliveCheck(loadedPages, unloadedPages)
      await login(browser, unloadedPages);
      removeDictArrayFromDictArray(unloadedPages, loadedPages);
      await getTempData(loadedPages);
      await getAlarmData(loadedPages);
      await delay(10000);
    } catch (err) {
      return;
    }
  }
}
/**
 * Visszaadja az URL cím indexét a tömbben
 * @param {Array<{URL: string}>} array url tömb
 * @param {string} URL URL cím
 * @returns {number} URL indexe vagy -1
 */
function GetIndexInDictArray(array, URL) {
  for (var i in array) {
    if (array[i].URL == URL) {
      return i;
    }
  }
  return -1;
}
/**
 * Megnézi, hogy benne van-e a tömbben az URL cím
 * @param {Array<{URL: string}>} array URL tömb
 * @param {string} URL URL cím
 * @returns {boolean} true, ha benne van, egyébként false
 */
function ElementIsInDictArray(array, URL) {
  for (var i in array) {
    if (array[i].URL == URL) {
      return true;
    }
  }
  return false;
}
/**
 * Végigmegyünk a removableArray tömbbön és kitöröljük a removeFrom tömbből azokat az elemeket,
 * amiknek az URL címe megegyezik
 * @param {Array<{URL: string}>} removeFrom Ebből a tömbből törlünk
 * @param {Array<{URL: string}>} removableArray Ezeket az URL-eket töröljük ki a tömbből
 */
function removeDictArrayFromDictArray(removeFrom, removableArray) {
  for (let i = 0; i < removableArray.length; i++) {
    index = GetIndexInDictArray(removeFrom, removableArray[i].URL);
    if (index != -1) {
      removeFrom.splice(index, 1);
    }
  }
}
/**
 * Várunk annyi ms-ot, amennyit megadunk
 * @param {number} time ennyit várunk (ms)
 * @returns {Promise<void>}
 */
function delay(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
}
/**
 * megpingeljük a megadott URL címet hogy megnézzük, hogy él-e
 * @param {string} URL URL cím
 * @returns {Boolean} él-e a cím
 */
async function isAlive(URL) {
  URL = URL.replace(/^https?:\/\//, "");
  const result = await ping.promise.probe(URL, {
    timeout: 2,
  });
  return result.alive;
}
/**
 * pingeljük a loadedPages tömbben lévő elemeket. Ha nem kapunk 2mp-en belül visszajelzést,
 * akkor belerakjuk az unloadedPages tömbbe
 * @param {Array<{URL: string}>} loadedPages Betöltött címek
 * @param {Array<{URL: string}>} unloadedPages Még nem betöltött címek
 */
async function aliveCheck(loadedPages, unloadedPages) {
  for (let i = 0; i < loadedPages.length; i++) {
    let alive = await isAlive(loadedPages[i].URL);
    if (!alive) {
      console.log("ping close");
      loadedPages[i].page.close();
      console.log("ping closed");

      delete loadedPages[i]["page"];
      unloadedPages.push(loadedPages[i]);
    }
    await delay(1000);
  }
  removeDictArrayFromDictArray(loadedPages, unloadedPages);
}
/**
 * Nem betöltött URL oldalak
 * @type {Array<{URL: string}>}
 */
var unloadedPages = [];
/**
 * Betöltött URL oldalak
 * @type {Array<{URL: string, page: Page}>}
 */
var loadedPages = [];

//PROGRAM KEZDÉSE
start();

console.log("started");

//NEM HASZNÁLJUK TOVÁBB

async function CreateDB() {
  var mysql = require("mysql");

  var con = mysql.createConnection({
    host: "localhost",
    user: "Sanyi",
    password: "sakkiraly11",
  });

  con.connect(function (err) {
    if (err) throw err;
    console.log("Connected!");
    con.query("CREATE DATABASE scrapedb", function (err, result) {
      if (err) throw err;
      console.log("Database created");
    });
  });
}

async function createTable() {
  var mysql = require("mysql");

  var con = mysql.createConnection({
    host: "localhost",
    user: "Sanyi",
    password: "sakkiraly11",
    database: "scrapedb",
  });

  con.connect(function (err) {
    if (err) throw err;
    console.log("Connected!");
    var sql =
      "CREATE TABLE sensors (sensor_id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), type VARCHAR(255), location VARCHAR(255), last_val FLOAT)";
    con.query(sql, function (err, result) {
      if (err) throw err;
      console.log("Table created");
    });
  });
}
// CreateDB();
// createTable();
