function update(objArray){
    objArray.map(obj => {
        console.log(obj.temp)
        newtemp = obj.temp.replace( /^\D+/g, '')
        if(newtemp.length > 0)
            obj.temp = newtemp
        else
            obj.temp = "- °C"
        return obj
    })
    mygrid = document.getElementById('mygrid')
    header1 = (mygrid.childNodes)[0]
    header2 = (mygrid.childNodes)[1]
    header3 = (mygrid.childNodes)[2]
    
    
    objArray.forEach(obj => {
        if (header1.textContent.includes(obj.name) || header1.textContent.includes("---")){
            updateElement(header1, obj)
        }
        else if (header2.textContent.includes(obj.name) || header2.textContent.includes("---")){
            updateElement(header2, obj)
        }
        else if (header3.textContent.includes(obj.name) || header3.textContent.includes("---")){
            updateElement(header3, obj)
        }
        else{
            console.log("nospace")
        }
    });
}
function changeValues(child, obj){
    child.childNodes[0].childNodes[0].data = obj.name
    child.childNodes[1].childNodes[0].data = obj.temp
    
    child.childNodes[0].classList.forEach(cName => {
        if(cName.includes("device-status")){
            child.childNodes[0].classList.replace(cName, obj.color)
            child.childNodes[1].classList.replace(cName, obj.color)
        }
    })
}
function updateElement(header, obj){
    headerItems = Array.from(header.childNodes).slice(1, 31)
    let searchName = ""
    if (header.textContent.includes(obj.name))
    searchName = obj.name
    else 
    searchName = "---"
    
    try{
        headerItems.forEach(child => {
            if(child.childNodes[0].innerText.includes(searchName)){
                changeValues(child, obj)
                throw "Break"
            }
        })
    }
    catch(e){
        if (e !== 'Break') throw e
    }
}
function makeDropdown(item){
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
        update(JSON.parse(event.data));
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

start()

function start(){
    arr = []
    createDivs(arr)
}
function createDivs(objArray){
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
    firstitem.innerHTML = "Utolsó frissítés:"
    mytop.append(firstitem)

    objArray1 = objArray.splice(0, 30)
    objArray1.forEach(obj => {
        addElement(header1, obj)
    })
    leftover = 30 - objArray1.length
    for (i = 0; i < leftover; i++) {
        addElement(header1, {name : "---", color : "device-status-off", temp: "---"})
    }
    //header2

    header2 = document.createElement("div");
    header2.classList.add("right-side")
    mygrid.append(header2)

    mytop = document.createElement("div")
    mytop.classList.add("right-top")
    header2.append(mytop)

    firstitem = document.createElement("div")
    firstitem.classList.add("item")

    var time = new Date();
    firstitem.innerHTML = time.toLocaleString()
    mytop.append(firstitem)

    objArray2 = objArray.splice(0, 30)
    objArray2.forEach(obj => {
        addElement(header2, obj)
    })
    leftover = 30 - objArray2.length
    for (i = 0; i < leftover; i++) {
        addElement(header2, {name : "---", color : "device-status-off", temp: "---"})
    }
    //header3

    header3 = document.createElement("div");
    header3.classList.add("right-side")
    mygrid.append(header3)

    mytop = document.createElement("div")
    mytop.classList.add("right-top")
    header3.append(mytop)

    firstitem = document.createElement("div")
    firstitem.classList.add("item")
    firstitem.innerHTML = "OSZLOP 3"
    mytop.append(firstitem)

    objArray3 = objArray.splice(0, 30)
    objArray3.forEach(obj => {
        addElement(header3, obj)
    })
    leftover = 30 - objArray3.length
    for (i = 0; i < leftover; i++) {
        addElement(header3, {name : "---", color : "device-status-off", temp: "---"})
    }
}
function addElement(header, obj){
    myname = obj.name;
    color = obj.color;
    temp = obj.temp;

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
    seconditem.classList.add(color)
    seconditem.innerHTML = temp
    bottomdiv.append(seconditem)
    
    makeDropdown(firstitem)
    makeDropdown(seconditem)
    //DROPDOWN STUFF
}