document.addEventListener("click", e => {
  const isDropdownButton = e.target.matches("[dropdown]")
  if (!isDropdownButton && e.target.closest("[dropdown]") != null) return
  
  let currentDropdown
  if (isDropdownButton) {
    currentDropdown = e.target.closest("[dropdown]")
    currentDropdown.classList.toggle("active")
  }
  
  document.querySelectorAll("[dropdown].active").forEach(dropdown => {
    if (dropdown === currentDropdown) return
    dropdown.classList.remove("active")
  })
})
function onSwitch(event){
  pressedButton = event.target
  let otherButton;
  pressedButton.parentElement.childNodes.forEach(child=>{
    if(child.textContent != pressedButton.textContent){
      otherButton = child
    }
  })

  dropdown1 = event.target.parentElement.parentElement.parentElement.parentElement.firstChild
  dropdown2 = event.target.parentElement.parentElement.parentElement.parentElement.lastChild

  ki1 = dropdown1.lastChild.lastChild.firstChild
  be1 = dropdown1.lastChild.lastChild.lastChild

  ki2 = dropdown2.lastChild.lastChild.firstChild
  be2 = dropdown2.lastChild.lastChild.lastChild

  if(pressedButton.textContent == "BE"){
    be2.classList.add("bordered")
    ki2.classList.remove("bordered")
    be1.classList.add("bordered")
    ki1.classList.remove("bordered")
    dropdown1.classList.remove("fekete")
    dropdown2.classList.remove("fekete")
  }
  else if(pressedButton.textContent == "KI"){
    ki1.classList.add("bordered")
    be1.classList.remove("bordered")
    ki2.classList.add("bordered")
    be2.classList.remove("bordered")
    dropdown1.classList.add("fekete")
    dropdown2.classList.add("fekete")
  }
}