const regexKeyValuePair = /^([^:]+:[^:]+)?$/;
const inputEvent = new Event("input");
let textContainer = document.getElementsByClassName("search-text-container")[0];
let suggestionContainer = document.getElementsByClassName("search-suggestion-container")[0];
let lstSuggestion = document.getElementById("lstSuggestion");
let querySpan = textContainer.getElementsByTagName("span")[0];
let queryChunks = [].slice.call(document.getElementsByClassName("query-chunk"));
let queryParams = {
  "all": "string1, string2, string3, ...",
  "city-corporation": "string1, string2, string3, ...",
  "ward": "number1, number2, number3, ...",
  "area": "string1, string2, string3, ...",
  "beneficiary-name": "string1, string2, string3, ...",
  "beneficiary-nid": "number1, number2, number3, ...",
  "phone": "number1, number2, number3, ...",
  "birthdate": "date1, date2, date3, ...",
  "birthdate-before": "date",
  "birthdate-after": "date",
  "spouse-nid": "number1, number2, number3, ...",
  "parent-nid": "number1, number2, number3, ...",
  "nid-matches": "number1, number2, number3, ...",
  "nid-from": "number1, number2, number3..",
}

for (let inp of queryChunks) {
  addChunkEvents(inp);
}

function addChunkEvents(chunk) {
  chunk.oninput = () => {
    if (chunk.value.length) {
      chunk.size = chunk.value.length;
    } else {
      chunk.size = 9;
    }

    loadSuggestions(chunk);
  };

  chunk.onkeydown = function (e) {
    if (e.key === "Backspace") {
      if (!chunk.value.length && querySpan.childElementCount > 1) {
        let previousChunk = chunk.previousElementSibling;
        previousChunk.focus();
      }
    }
    if (chunk.value.length) {
      if (e.key === "Enter" || e.key === "Tab" || e.key === ";") {
        if (e.key !== "Tab" || querySpan.lastChild === chunk) {
          e.preventDefault();
          if (e.key === "Enter") {
            querySpan.lastChild.focus();
          }
        }
        if (querySpan.lastChild.value.length) {
          createQueryChunk(chunk);
        }
      }
    }
  }

  chunk.onblur = () => {
    suggestionContainer.classList.toggle("enabled");
    if (!regexKeyValuePair.test(chunk.value)) {
      chunk.classList.add("invalid-pair");
    } else {
      chunk.classList.remove("invalid-pair");
    }
    if (chunk.value.length) {
      chunk.classList.add("defined");
    } else {
      chunk.classList.remove("defined");
      if (querySpan.children.length > 1 && querySpan.lastChild === chunk) {
        querySpan.removeChild(chunk);
      }
    }
  }

  chunk.onfocus = () => {
    suggestionContainer.classList.toggle("enabled");
    // suggestionContainer.
    suggestionContainer.style.height = "150px";
    suggestionContainer.style.width = (textContainer.offsetWidth).toString() + "px";

    loadSuggestions(chunk);
  }

  chunk.onclick = (e) => {
    e.stopPropagation();
  }
}

function createQueryChunk(chunk = null) {
  let newInputChunk = document.createElement("input");
  newInputChunk.classList.add("query-chunk");
  newInputChunk.type = "text";
  newInputChunk.id = `q${queryChunks.length}`;
  newInputChunk.name = `q${queryChunks.length}`;
  newInputChunk.placeholder = "key:value";
  newInputChunk.autocomplete = "off";
  addChunkEvents(newInputChunk);
  querySpan.append(newInputChunk);
  queryChunks.push(newInputChunk);
  if (chunk) {
    chunk.classList.add("defined");
  }
  newInputChunk.focus();
}

function loadSuggestions(chunk) {
  lstSuggestion.replaceChildren();
  for(let [paramKey, paramData] of Object.entries(queryParams)) {
    if (paramKey.startsWith(chunk.value)) {
      let suggestion = document.createElement("li");
      suggestion.innerHTML = `${paramKey}:${paramData}`;
      lstSuggestion.append(suggestion);
      suggestion.onmousedown = (e) => {
        e.preventDefault();
        insertInput(chunk, `${paramKey}:`);
        chunk.focus();
      }
    }
  }
}

function insertInput(inputElement, inputValue) {
  inputElement.value = inputValue;
  inputElement.dispatchEvent(inputEvent);
}

function refreshQuerySpan() {
  for (let i in queryChunks) {
    if (!queryChunks[i].value.length && i !== queryChunks.length - 1) {
      querySpan.removeChild(queryChunks[i]);
    }
  }
}

window.onload = () => {
  textContainer.onclick = () => querySpan.click();
  suggestionContainer.onclick = (e) => e.preventDefault();
  createQueryChunk();
  querySpan.onclick = () => {
    if (!querySpan.hasChildNodes() || querySpan.lastChild.value.length) {
      createQueryChunk();
    } else {
      querySpan.lastChild.focus();
    }
  }

  querySpan.onblur = () => {
    if (querySpan.children.length > 1 && querySpan.lastChild.value.length === 0) {
      querySpan.removeChild(querySpan.lastChild);
    }
    console.log("hi");
  }
}
