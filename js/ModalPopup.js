class ModalPopup {
  static ERROR_BODY = "error";
  static SUCCESS_BODY = "success";

  constructor() {
    this.closedEvent = new Event("closed");
    this.modalBody = null; // document.getElementsByClassName("modal-popup-body")[0];
    this.modalWindow = null; // document.getElementsByClassName("modal-popup-window")[0];
    this.modalTitle = null; // document.getElementsByClassName("modal-popup-title")[0];
    this.modalContentContainer = null; // document.getElementsByClassName("modal-popup-content-container")[0];
    this.modalInputContainer = null; // document.getElementsByClassName("modal-popup-input-container")[0];
    this.modalButtonContainer = null; // document.getElementsByClassName("modal-popup-button-container")[0];
    this.mouseX = null;
    this.mouseY = null;
    this.drag = false;
    this.cnt = 0;
    this.okButton = null;
    this.refuseButton = null;
    this.cancelButton = null;
    this.fields = {};
    this.modalType = "";

    this.init();
  }

  init() {
    this.modalBody = document.createElement("div");
    this.modalWindow = document.createElement("div");
    this.modalTitle = document.createElement("h2");
    this.modalContentContainer = document.createElement("div");
    this.modalInputContainer = document.createElement("div");
    this.modalButtonContainer = document.createElement("div");

    this.modalBody.classList.add("modal-popup-body")
    this.modalWindow.classList.add("modal-popup-window");
    this.modalTitle.classList.add("modal-popup-title");
    this.modalContentContainer.classList.add("modal-popup-content-container");
    this.modalInputContainer.classList.add("modal-popup-input-container");
    this.modalButtonContainer.classList.add("modal-popup-button-container");

    const modalBodies = document.body.getElementsByClassName("modal-popup-body");
    if (modalBodies.length > 0) this.modalBody = modalBodies[0];

    document.body.append(this.modalBody);
    this.modalBody.append(this.modalWindow);
    this.modalWindow.append(this.modalTitle);
    // this.modalWindow.append(this.modalContentContainer);
    // this.modalWindow.append(this.modalInputContainer);
    // this.modalWindow.append(this.modalButtonContainer);

    setTimeout(() => this.modalWindow.classList.add("active"), 0);
    this.centerWindow()
    window.addEventListener("resize", () => {
      this.centerWindow();
    });
    this.modalBody.classList.add("active");

    this.addWindowDragEvent();
  }

  centerWindow() {
    this.modalWindow.style.left = `${(document.documentElement.scrollWidth / 2) - (this.modalWindow.offsetWidth / 2)}px`;
    this.modalWindow.style.top = `${(document.documentElement.scrollHeight / 2) - (this.modalWindow.offsetHeight / 2)}px`;
  }

  addWindowDragEvent() {
    this.addMouseDownEvent(this.modalWindow, "mousedown");
    this.addMouseDownEvent(this.modalWindow, "touchstart");

    this.addMouseMoveEvent(window, "mousemove");
    this.addMouseMoveEvent(window, "touchmove");

    this.addMouseUpEvent(window, "mouseup");
    this.addMouseUpEvent(this.modalWindow, "mouseup");
    this.addMouseUpEvent(this.modalWindow, "touchend");

    for (let container of [this.modalContentContainer, this.modalInputContainer, this.modalButtonContainer]) {
      container.onmousedown = (e) => {
        e.stopPropagation();
      }
    }
  }

  addMouseDownEvent(htmlElement, eventName) {
    htmlElement.addEventListener(eventName, e => {
      this.mouseX = e.pageX - this.modalWindow.offsetLeft;
      this.mouseY = e.pageY - this.modalWindow.offsetTop;
      this.drag = true;
      this.modalWindow.classList.add("drag");
    });
  }

  addMouseMoveEvent(htmlElement, eventName) {
    htmlElement.addEventListener(eventName, (e) => {
      if (this.drag) {
        if (e.pageY - this.mouseY + this.modalWindow.offsetHeight > document.documentElement.scrollHeight) {
          this.modalWindow.style.top = `${document.documentElement.scrollHeight - this.modalWindow.offsetHeight}px`;
        } else if (e.pageY - this.mouseY > 0) {
          this.modalWindow.style.top = `${e.pageY - this.mouseY}px`;
        } else {
          this.modalWindow.style.top = `${0}px`;
        }
        if (e.pageX - this.mouseX + this.modalWindow.offsetWidth > document.documentElement.scrollWidth) {
          this.modalWindow.style.left = `${document.documentElement.scrollWidth - this.modalWindow.offsetWidth}px`;
        } else if (e.pageX - this.mouseX >= 0) {
          this.modalWindow.style.left = `${e.pageX - this.mouseX}px`;
        } else {
          this.modalWindow.style.left = `${0}px`;
        }

        // TOP LEFT
        if (e.pageY - this.mouseY < 0 && e.pageX - this.mouseX < 0) {
          this.modalWindow.style.borderTopLeftRadius = `${0}px`;
        } else if (e.pageY - this.mouseY < 15 && e.pageX - this.mouseX < 15) {
          this.modalWindow.style.borderTopLeftRadius = `${Math.max(e.pageY - this.mouseY, e.pageX - this.mouseX)}px`;
        } else {
          this.modalWindow.style.borderTopLeftRadius = `${15}px`;
        }

        // TOP RIGHT
        if (
          e.pageY - this.mouseY < 0 &&
          e.pageX - this.mouseX + this.modalWindow.offsetWidth > document.documentElement.scrollWidth
        ) {
          this.modalWindow.style.borderTopRightRadius = `${0}px`;
        } else if (
          e.pageY - this.mouseY < 15 &&
          e.pageX - this.mouseX + this.modalWindow.offsetWidth > document.documentElement.scrollWidth - 15
        ) {
          this.modalWindow.style.borderTopRightRadius = `${
            Math.max(
              e.pageY - this.mouseY,
              document.documentElement.scrollWidth - (e.pageX - this.mouseX + this.modalWindow.offsetWidth)
            )}px`;
        } else {
          this.modalWindow.style.borderTopRightRadius = `${15}px`;
        }

        // BOTTOM RIGHT
        if (
          e.pageY - this.mouseY + this.modalWindow.offsetHeight > document.documentElement.scrollHeight &&
          e.pageX - this.mouseX + this.modalWindow.offsetWidth > document.documentElement.scrollWidth
        ) {
          this.modalWindow.style.borderBottomRightRadius = `${0}px`;
        } else if (
          e.pageY - this.mouseY + this.modalWindow.offsetHeight > document.documentElement.scrollHeight - 15 &&
          e.pageX - this.mouseX + this.modalWindow.offsetWidth > document.documentElement.scrollWidth - 15
        ) {
          this.modalWindow.style.borderBottomRightRadius = `${
            Math.max(
              document.documentElement.scrollHeight - (e.pageY - this.mouseY + this.modalWindow.offsetHeight),
              document.documentElement.scrollWidth - (e.pageX - this.mouseX + this.modalWindow.offsetWidth)
            )}px`;
        } else {
          this.modalWindow.style.borderBottomRightRadius = `${15}px`;
        }

        // BOTTOM LEFT
        if (
          e.pageY - this.mouseY + this.modalWindow.offsetHeight > document.documentElement.scrollHeight &&
          e.pageX - this.mouseX < 0
        ) {
          this.modalWindow.style.borderBottomLeftRadius = `${0}px`;
        } else if (
          e.pageY - this.mouseY + this.modalWindow.offsetHeight > document.documentElement.scrollHeight - 15 &&
          e.pageX - this.mouseX < 15
        ) {
          this.modalWindow.style.borderBottomLeftRadius = `${
            Math.max(
              document.documentElement.scrollHeight - (e.pageY - this.mouseY + this.modalWindow.offsetHeight),
              e.pageX - this.mouseX
            )}px`;
        } else {
          this.modalWindow.style.borderBottomLeftRadius = `${15}px`;
        }

      }
    });
  }

  addMouseUpEvent(htmlElement, eventName) {
    htmlElement.addEventListener(eventName, e => {
      this.drag = false;
      this.modalWindow.classList.remove("drag");
    });
  }

  addDefaultButtonClickEvent(button) {
    button.onclick = () => this.close();
  }

  loadData(title, contents, fields, buttons, modalType) {
    this.modalTitle.innerHTML = title;
    this.modalType = modalType;

    for (const content of contents) {
      this.modalContentContainer.append(content.htmlElement);
    }

    for (const field of fields) {
      const fieldElement = field.createHTML();
      this.modalInputContainer.append(fieldElement);
      this.fields[field.placeholder] = fieldElement;
    }

    for (const button of buttons) {
      const buttonElement = button.createHTML();
      if (button.classifier === ModalButton.APPROVE_TYPE) {
        // console.log(buttonElement);
        this.okButton = buttonElement;
      }      else if (button.classifier === ModalButton.REFUSE_TYPE) {
        // console.log(buttonElement);
        this.refuseButton = buttonElement;
      } else {
        // console.log(buttonElement);
        this.cancelButton = buttonElement;
      }
      this.modalButtonContainer.append(buttonElement);
      this.addDefaultButtonClickEvent(buttonElement);
    }

    if (this.modalContentContainer.innerHTML.trim().length > 0) this.modalWindow.append(this.modalContentContainer);
    if (this.modalInputContainer.children.length > 0) this.modalWindow.append(this.modalInputContainer);
    if (this.modalButtonContainer.children.length > 0) this.modalWindow.append(this.modalButtonContainer);
    if (this.modalType) this.modalWindow.classList.add(this.modalType);
    if (this.modalType === ModalPopup.SUCCESS_BODY) this.modalBody.classList.add("success");
    else if (this.modalType === ModalPopup.ERROR_BODY) this.modalBody.classList.add("error");

    this.centerWindow();
  }

  then(handler) {
    this.modalWindow.addEventListener("closed", () => {
      setTimeout(handler, 0);
    }, {once: true});
    return this;
  }

  close() {
    this.modalWindow.classList.remove("active");
    if (this.modalBody.children.length < 2) this.modalBody.classList.remove("active");
    setTimeout(() => {
      this.modalWindow.dispatchEvent(this.closedEvent);
      this.modalBody.removeChild(this.modalWindow);
      this.modalBody.classList.remove(this.modalType);
      if (this.modalBody.children.length === 0) document.body.removeChild(this.modalBody);
    }, 200);
  }
}

class ModalButton {
  static APPROVE_TYPE = "approve";
  static REFUSE_TYPE = "refuse";
  static NORMAL_TYPE = "";

  static OK = (text="OK") => [new ModalButton(text, ModalButton.APPROVE_TYPE, text)];
  static REFUSE = (text="REFUSE") => [new ModalButton(text, ModalButton.REFUSE_TYPE, text)];
  static CANCEL = (text="CANCEL") => [new ModalButton(text, ModalButton.NORMAL_TYPE, text)];
  static OK_REFUSE = (okText="OK", refuseText="NO") => [ModalButton.OK(okText)[0], ModalButton.REFUSE(refuseText)[0]];
  static OK_CANCEL = (okText="OK", cancelText="CANCEL") => [ModalButton.OK(okText)[0], ModalButton.CANCEL(cancelText)[0]];
  static OK_REFUSE_CANCEL = (okText="OK", refuseText="NO", cancelText="CANCEL") => [...ModalButton.OK_REFUSE(okText, refuseText), ModalButton.CANCEL(cancelText)[0]];
  static REFUSE_CANCEL = (refuseText="Refuse", cancelText="CANCEL") => [ModalButton.REFUSE(refuseText)[0], ModalButton.CANCEL(cancelText)[0]];

  static OK_BUTTON = ModalButton.OK();
  static REFUSE_BUTTON = ModalButton.REFUSE();
  static CANCEL_BUTTON = ModalButton.CANCEL();
  static OK_CANCEL_BUTTONS = ModalButton.OK_CANCEL();
  static CONFIRM_CANCEL_BUTTONS = ModalButton.OK_CANCEL("CONFIRM");
  static YES_NO_BUTTONS = ModalButton.OK_REFUSE("YES", "NO");
  static YES_NO_CANCEL_BUTTONS = ModalButton.OK_REFUSE_CANCEL("YES", "NO");
  static SUBMIT_BUTTONS = ModalButton.OK("SUBMIT");
  static SUBMIT_CANCEL_BUTTONS = ModalButton.OK_CANCEL("SUBMIT");
  static DELETE_CANCEL_BUTTONS = ModalButton.REFUSE_CANCEL("DELETE");
  static NONE = [];
  constructor(value, classifier, hint="Click here") {
    this.value = value;
    this.classifier = classifier;
    this.hint = hint;
  }

  createHTML() {
    const button = document.createElement("button");
    button.innerHTML = this.value;
    button.type = "submit";
    button.title = this.hint;
    if (this.classifier) button.setAttribute(this.classifier, "");

    return button;
  }
}

class ModalField {
  static FIELD_COUNT = 0;
  static TEXT = (placeholder="Text", id=ModalField.FIELD_COUNT) => [new ModalField("text", placeholder, id)];
  static EMAIL = (placeholder="Email", id=ModalField.FIELD_COUNT) => [new ModalField("email", placeholder, id)];
  static PASSWORD = (placeholder="Password", id=ModalField.FIELD_COUNT) => [new ModalField("password", placeholder, id)];

  static TEXT_FIELD = ModalField.TEXT();
  static PASSWORD_FIELD = ModalField.PASSWORD();
  static USERNAME_PASSWORD = [ModalField.TEXT("Username")[0], ModalField.PASSWORD()[0]];
  static EMAIL_PASSWORD_FIELD = [ModalField.EMAIL()[0], ModalField.PASSWORD()[0]];
  static N_TEXT_FIELDS = (...placeholder) => placeholder.map(p => ModalField.TEXT(p)[0]);
  static NONE = []
  constructor(type, placeholder, id=ModalField.FIELD_COUNT) {
    this.type = type;
    this.placeholder = placeholder;
    this.id = `${id}`;

    ModalField.FIELD_COUNT++;
  }

  createHTML() {
    const field = document.createElement("input");
    field.type = this.type;
    field.placeholder = this.placeholder;
    field.title = this.placeholder;
    field.name = this.placeholder.replaceAll(/[^A-Za-z_]/g, "");
    field.id = this.id;

    return field;
  }
}

class ModalContent {

  static TEXT = (text = "") => [ModalContent.createTextElement(text)];
  static N_TEXTS = (...texts) => texts.map(text => ModalContent.TEXT(text)[0]);
  static SINGLE_ROW_TABLE = (...columns) => [ModalContent.createSingleRowTable(...columns)];
  static SINGLE_ROW_TABLE_COLUMN = (header, cell) => [header, cell];
  static CUSTOM = (htmlElement) => [new ModalContent(htmlElement)];
  static NONE = [];
  constructor(htmlElement=null) {
    this.htmlElement = htmlElement;
  }

  static createTextElement(text) {
    const content = new ModalContent();
    content.htmlElement = document.createElement("p");
    content.htmlElement.innerHTML = text;
    return content;
  }

  static createRowElement(...cells) {
    const content = new ModalContent();
    content.htmlElement = document.createElement("tr");
    for (let cell of cells) content.htmlElement.insertCell(-1).innerHTML = cell;
    return content;
  }

  static createSingleRowTable(...columns) {
    const content = new ModalContent();
    content.htmlElement = document.createElement("table");
    const header = content.htmlElement.insertRow(-1);
    const row = content.htmlElement.insertRow(-1);

    for (let [head, cell] of columns) {
      header.insertCell(-1).innerHTML = head;
      row.insertCell(-1).innerHTML = cell;
    }

    return content;
  }
}

function show(title, contents=[], fields = [], buttons = [], modalType = null) {
  const msgBox = new ModalPopup();
  msgBox.loadData(title, contents, fields, buttons, modalType);

  return msgBox;
}

// let modalPopup = new ModalPopup();

// modalPopup.show("Hello world", ModalContent.NONE, ModalField.NONE, ModalButton.YES_NO_CANCEL_BUTTONS);

export {ModalPopup, ModalButton, ModalContent, ModalField, show};
