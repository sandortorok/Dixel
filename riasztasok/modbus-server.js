// read from a file
const input = require("./input2.json");
function dec2Bin(dec) {
  const negative = dec < 0;
  dec = Math.abs(dec);
  let binary = Number(dec).toString(2);
  while (binary.length != 16) {
    binary = 0 + binary;
  }
  if (negative) {
    let newBinary = "";
    for (let bit of binary) {
      newBinary += Math.abs(bit - 1);
    }
    binary = newBinary;
    binary = (Number(parseInt(binary, 2)) + Number(parseInt(1, 2))).toString(2);
    binary = "1".concat(binary.slice(1));
    return binary;
  }
  return binary;
}

function updateValues(list) {
  list.forEach((el) => {
    for (let i = 0; i < input.length; i++) {
      if (input[i].name === el.name) {
        if (el.temp) {
          let tempString = el.temp.split(":");
          if (tempString.length > 1) {
            tempString = tempString[1].trim();
            if (tempString.includes("°C")) {
              let temp = parseFloat(tempString.split("°C")[0].trim());
              input[i].value = temp;
            }
          }
        }
        if (el.color) {
          input[i].color = el.color;
        }
        if (el.req_temp) {
          let reqString = el.req_temp.split(":");
          if (reqString.length > 1) {
            reqString = reqString[1].trim();
            if (reqString.includes("°C")) {
              let req_temp = parseFloat(reqString.split("°C")[0].trim());
              input[i].req_temp = req_temp;
            }
          }
        }
        break;
      }
    }
  });
}
// create an empty modbus client
const ModbusRTU = require("modbus-serial");
const vector = {
  getInputRegister: function (addr, unitID) {
    // Synchronous handling
    input.forEach((i) => {
      if (i.address && parseInt(i.address, 16) === addr) {
        binary = i.value.toString(2);
        return i.value;
      }
    });
    return 0;
  },
  getHoldingRegister: function (addr, unitID, callback) {
    // Asynchronous handling (with callback)
    setTimeout(function () {
      // callback = function(err, value)
      let hex = addr.toString(16);
      let searchHex = hex.slice(0, -1) + "0";
      searchHex = "0x" + searchHex;
      let found = false;
      let foundInput = {};
      input.forEach((i) => {
        if (i.address && parseInt(i.address, 16) === parseInt(searchHex)) {
          found = true;
          foundInput = {
            addr: i.address,
            searchHex,
            last: hex[hex.length - 1],
            hex,
          };
          switch (parseInt(hex[hex.length - 1])) {
            case 0:
              if (i.value != undefined) {
                let bin = dec2Bin(i.value * 10);
                callback(null, parseInt(bin, 2));
              } else {
                callback(null, parseInt(dec2Bin(-1000), 2));
              }
              break;
            case 1:
              //ALSÓ KORLÁT
              if (i.min != undefined) {
                callback(null, parseInt(dec2Bin(i.min * 10), 2));
              } else {
                callback(null, parseInt(dec2Bin(-1000), 2));
              }
              break;
            case 2:
              //FELSŐ KORLÁT
              if (i.max != undefined) {
                callback(null, parseInt(dec2Bin(i.max * 10), 2));
              } else {
                callback(null, parseInt(dec2Bin(-1000), 2));
              }
              break;
            case 3:
              if (
                (i.color && i.color === "device-status-on") ||
                i.color === "device-status-alarm" ||
                i.color === "device-status-hightemp" ||
                i.color === "device-status-lowtemp"
              ) {
                callback(null, 1);
              } else if (i.color && i.color === "device-status-off") {
                callback(null, 0);
              } else {
                callback(null, 0);
              }
              break;
            case 4:
              //PIROS
              if (
                (i.color && i.color === "device-status-alarm") ||
                i.color === "device-status-hightemp"
              ) {
                callback(null, 1);
              } else {
                callback(null, 0);
              }
              break;
            case 5:
              //KÉK
              if (i.color && i.color === "device-status-lowtemp") {
                callback(null, 1);
              } else {
                callback(null, 0);
              }
              break;
            case 6:
              if (i.req_temp != undefined) {
                callback(null, parseInt(dec2Bin(i.req_temp * 10), 2));
              } else {
                callback(null, parseInt(dec2Bin(-1000), 2));
              }
              break;
            default:
              callback(null, 0);
              break;
          }
        }
      });
      if (!found) {
        callback(null, 0);
      }
    }, 10);
  },
  getCoil: function (addr, unitID) {
    // Asynchronous handling (with Promises, async/await supported)
    return new Promise(function (resolve) {
      setTimeout(function () {
        resolve(addr % 2 === 0);
      }, 10);
    });
  },
  setRegister: function (addr, value, unitID) {
    // Asynchronous handling supported also here
    console.log("set register", addr, value, unitID);
    return;
  },
  setCoil: function (addr, value, unitID) {
    // Asynchronous handling supported also here
    console.log("set coil", addr, value, unitID);
    return;
  },
  readDeviceIdentification: function (addr) {
    return {
      0x00: "MyVendorName",
      0x01: "MyProductCode",
      0x02: "MyMajorMinorRevision",
      0x05: "MyModelName",
      0x97: "MyExtendedObject1",
      0xab: "MyExtendedObject2",
    };
  },
};

// set the server to answer for modbus requests
console.log("ModbusTCP listening on modbus://0.0.0.0:8502");
const serverTCP = new ModbusRTU.ServerTCP(vector, {
  host: "0.0.0.0",
  port: 8502,
  debug: true,
  unitID: 1,
});

serverTCP.on("socketError", function (err) {
  // Handle socket error if needed, can be ignored
  console.error(err);
});

module.exports = { updateValues };
