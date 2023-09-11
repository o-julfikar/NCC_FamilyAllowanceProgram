const BUTTONS = {
  "OK": (text="OK", action=null) => {return [{"text": text, "type": "ok", "action": action}]},
  "CANCEL": (text="Cancel", action=null) => {return [{"text": text, "type": "cancel", "action": action}]},
  "OK_CANCEL": (okText="OK", cancelText="Cancel", okAction=null, cancelAction=null) => {return [{"text": okText, "type": "ok", "action": okAction}, {"text": cancelText, "type": "cancel", "action": cancelAction}]},
  "NONE": [],
}

const FIELDS = (...ARGS) => ARGS;

const INPUT = (type="text", label="") => {return {"type": type, "label": label}};

function showPopup(parent=null, title="Popup", message="Popup message", fields=FIELDS(), buttons=BUTTONS.NONE, htmlElement=null, isErrorMsg=false) {
  let templateDiv = document.createElement("div");
  let popupWindow = document.createElement("div");
  let popupTitle = document.createElement("h2");
  let popupMsg = document.createElement("p");
  let elemInputs = []
  let elemButtons = [];

  for (let i = 0; i < fields.length; i++) {
    let input = document.createElement("input");
    input.setAttribute("type", fields[i].type);
    input.setAttribute("placeholder", fields[i].label);
    input.setAttribute("name", "popupBtn" + fields[i].type + fields[i].label);
    input.setAttribute("id", "popupBtn" + fields[i].type + fields[i].label);
    elemInputs.push(input);
  }

  for (let i = 0; i < buttons.length; i++) {
    let button = document.createElement("button");
    button.setAttribute(`popup-${buttons[i].type}`, "");
    button.setAttribute("type", "submit");
    button.innerHTML = buttons[i].text;
    button.onclick = () => closePopup(parent, popupWindow, templateDiv);

    if (buttons[i].action) {
      button.onclick = () => {
        let args = [];
        for (let inp of elemInputs) args.push(inp.value);
        if (buttons[i].action(...args)) {
          closePopup(parent, popupWindow, templateDiv);
        }
      }
    }
    elemButtons.push(button);
  }

  templateDiv.className = "popup-container";
  popupWindow.className = "popup-window";
  parent.appendChild(templateDiv);
  templateDiv.appendChild(popupWindow);

  popupTitle.innerHTML = title? title : "Popup";
  popupMsg.innerHTML = message? message : "";

  popupWindow.appendChild(popupTitle);
  if (isErrorMsg) popupWindow.classList.add("error")
  if (htmlElement) popupWindow.appendChild(htmlElement);
  if (message) popupWindow.appendChild(popupMsg);
  if (elemInputs) {
    let inputContainer = document.createElement("div");
    inputContainer.className = "popup-input-container";
    for (let input of elemInputs) inputContainer.appendChild(input);
    popupWindow.appendChild(inputContainer);
  }
  if (elemButtons) {
    let buttonContainer = document.createElement("div");
    buttonContainer.className = "popup-button-container";
    for (let button of elemButtons) buttonContainer.appendChild(button);
    popupWindow.appendChild(buttonContainer);
  }

  templateDiv.onclick = () => closePopup(parent, popupWindow, templateDiv);

  popupWindow.onclick = (e) => e.stopPropagation();

  parent.appendChild(templateDiv);
  setTimeout(() => popupWindow.classList.add("popup-open"), 50);
}

function closePopup(parent, popupWindow, templateDiv) {
  popupWindow.classList.remove("popup-open");
  setTimeout(() => parent.removeChild(templateDiv), 50);

  // templateDiv.style.visibility = "hidden";
}

export {BUTTONS, FIELDS, INPUT, showPopup};
