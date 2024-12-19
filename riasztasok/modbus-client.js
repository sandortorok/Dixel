// create an empty modbus client
const ModbusRTU = require("modbus-serial");
const client = new ModbusRTU();

// open connection to a tcp line
client.connectTCP("192.168.0.14", { port: 8502 });
client.setID(1);

// read the values of 10 registers starting at address 0
// on device number 1. and log the values to the console.
setInterval(function () {
  client.readHoldingRegisters(0x360, 10, function (err, data) {
    console.log(
      data.data.map((d) => {
        if (d > 32768) {
          return convertBack(d) / 10;
        }
        return d;
      })
    );
    console.log(err);
  });
}, 1000);
function convertBack(dec) {
  let binary = Number(dec).toString(2);
  let newBinary = "";
  for (let bit of binary) {
    newBinary += Math.abs(bit - 1);
  }
  binary = newBinary;
  return -parseInt(binary, 2) - 1;
}
