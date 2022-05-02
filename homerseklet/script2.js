var inputData = []

function update(objArray) {
    objArray.map(obj => {
        if (obj.temp) {
            let temp = obj.temp.split(':')
            if (temp.length>1){
                obj.temp = temp[1].trim()
            }
            else{
                obj.temp = "- °C"
            }
        }
        return obj
    })
    mygrid = document.getElementById('mygrid')
    header1 = (mygrid.childNodes)[0]
    header2 = (mygrid.childNodes)[1]
    header3 = (mygrid.childNodes)[2]


    objArray.forEach(obj => {
        headerItems = Array.from(header1.childNodes).slice(1, 30)
        headerItems.forEach(item =>{
            if (item.childNodes[0].childNodes[0].data == obj.name){
                changeValues(item, obj)
            }
        })
        headerItems = Array.from(header2.childNodes).slice(0, 30)
        headerItems.forEach(item =>{
            if (item.childNodes[0].childNodes[0].data == obj.name){
                changeValues(item, obj)
            }
        })
        headerItems = Array.from(header3.childNodes).slice(0, 30)
        headerItems.forEach(item =>{
            if (item.childNodes[0].childNodes[0].data == obj.name){
                changeValues(item, obj)
            }
        })
    });
}
function changeValues(child, obj) {
    if(obj.header){
        return
    }
    child.childNodes[0].childNodes[0].data = obj.name
    child.childNodes[1].childNodes[0].data = obj.temp

    child.childNodes[0].classList.forEach(cName => {
        if (cName.includes("device-status")) {
            child.childNodes[0].classList.replace(cName, obj.color)
            child.childNodes[1].classList.replace(cName, obj.color)
        }
    })
}
function makeDropdown(item) {
    item.setAttribute('dropdown', '');
    item.classList.add("dropdown")
    dropdown_menu = document.createElement("div")
    dropdown_menu.classList.add("dropdown-menu")
    item.append(dropdown_menu)

    dropdown_heading = document.createElement("div")
    dropdown_heading.classList.add("dropdown-heading")

    dropdown_heading.innerHTML = "MÉRÉS"
    dropdown_menu.append(dropdown_heading)

    dropdown_buttons = document.createElement("div")
    dropdown_buttons.classList.add("dropdown-buttons")
    dropdown_menu.append(dropdown_buttons)

    first_button = document.createElement("p")
    first_button.classList.add("btn")
    first_button.innerHTML = "KI"
    first_button.addEventListener("click", onSwitch)
    dropdown_buttons.append(first_button)

    second_button = document.createElement("p")
    second_button.classList.add("btn")
    second_button.innerHTML = "BE"
    second_button.classList.add("bordered")
    second_button.addEventListener("click", onSwitch)
    dropdown_buttons.append(second_button)
}

// Create WebSocket connection.
const socket = new WebSocket('ws://localhost:8000');

// Connection opened
socket.addEventListener('open', function (event) {
    console.log('Connected to WS Server')
});

// Listen for messages
socket.addEventListener('message', function (event) {
    if (isJsonString(event.data)) {
        sensorData = JSON.parse(event.data)
        if(sensorData.input){
            let data  = sensorData.input;
            data.sort(function (a, b) {
                return parseFloat(a.index) - parseFloat(b.index);
            });
            inputData = data.slice(0);
            createDivs(data)
        }
        else{
            filterData(sensorData)
            update(inputData);
        }
    }
});

const sendMessage = () => {
    socket.send('Hello From Client1!');
}
function isJsonString(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}


function createDivs(objArray) {
    mygrid = document.getElementById('mygrid')
    mygrid.innerHTML = ""

    //header1

    header1 = document.createElement("div");
    header1.classList.add("right-side")
    mygrid.append(header1)
    
    mytop = document.createElement("div")
    mytop.classList.add("right-top")
    header1.append(mytop)
    
    firstitem = document.createElement("div")
    firstitem.classList.add("item")
    var time = new Date();
    firstitem.innerHTML = `Utolsó frissítés: ${time.toLocaleString()}`
    mytop.append(firstitem)

    objArray1 = objArray.splice(0, 29)
    objArray1.forEach(obj => {
        addElement(header1, obj)
    })
    leftover = 29 - objArray1.length
    for (i = 0; i < leftover; i++) {
        addElement(header1, { name: "---"})
    }
    //header2

    header2 = document.createElement("div");
    header2.classList.add("right-side")
    mygrid.append(header2)

    objArray2 = objArray.splice(0, 30)
    objArray2.forEach(obj => {
        addElement(header2, obj)
    })
    leftover = 30 - objArray2.length
    for (i = 0; i < leftover; i++) {
        addElement(header2, { name: "---"})
    }
    //header3

    header3 = document.createElement("div");
    header3.classList.add("right-side")
    mygrid.append(header3)

    objArray3 = objArray.splice(0, 30)
    objArray3.forEach(obj => {
        addElement(header3, obj)
    })
    leftover = 30 - objArray3.length
    for (i = 0; i < leftover; i++) {
        addElement(header3, { name: "---"})
    }

    //header4

    header4 = document.createElement("div");
    header4.classList.add("right-side")
    mygrid.append(header4)

    objArray4 = objArray.splice(0, 30)
    objArray4.forEach(obj => {
        addElement(header4, obj)
    })
    leftover = 30 - objArray4.length
    for (i = 0; i < leftover; i++) {
        addElement(header4, { name: "---"})
    }
}
function addElement(header, obj) {

    myname = obj.name
    color = "device-status-off";
    temp = "---";

    if (obj.header) {
        mytop = document.createElement("div")
        mytop.classList.add("right-top")
        header.append(mytop)

        firstitem = document.createElement("div")
        firstitem.classList.add("item")
        firstitem.innerHTML = obj.name
        mytop.append(firstitem)
    }
    else {
        bottomdiv = document.createElement("div");
        bottomdiv.classList.add("right-bottom")
        header.append(bottomdiv);

        firstitem = document.createElement("div")
        firstitem.classList.add("item")
        firstitem.classList.add(color)
        firstitem.innerHTML = myname
        bottomdiv.append(firstitem)

        seconditem = document.createElement("div")
        seconditem.classList.add("item")
        seconditem.classList.add("temp")
        seconditem.classList.add(color)
        seconditem.innerHTML = temp
        bottomdiv.append(seconditem)

        makeDropdown(firstitem)
        makeDropdown(seconditem)
        //DROPDOWN STUFF
    }
}
function filterData(sensorData) {
    inputData.map(obj => {
        var found = sensorData.filter(function (myobj) { return myobj.name == obj.name; });
        if (found.length > 0) {
            let msgObj = found[0]
            obj.temp = msgObj.temp
            obj.color = msgObj.color
            if (msgObj.header) {
                obj.header = true
            }
        }
        else {
            obj.temp = "+++"
            obj.color = "device-status-off"
        }
        return obj
    })
    inputData.sort(function (a, b) {
        return parseFloat(a.index) - parseFloat(b.index);
    });
}
