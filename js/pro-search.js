const regexKeyValuePair = /^([^:]+:[^:]+)?$/;
const inputEvent = new Event("input");
const searchEvent = new Event("search");
const searchAssembleEvent = new Event("searchAssemble");
const searchContainer = document.getElementsByClassName("search-container")[0];
let searchContainerPlaceHolder = document.getElementsByClassName("search-container-placeholder");
let textContainer = document.getElementsByClassName("search-text-container");
let suggestionContainer = document.getElementsByClassName("search-suggestion-container");
let lstSuggestion = document.getElementById("lstSuggestion");
let querySpan = null;
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
        previousChunk.setSelectionRange(previousChunk.value.length, previousChunk.value.length);
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
    } else if (querySpan.childElementCount > 1 && e.key === "Enter") {
      searchContainer.dispatchEvent(searchAssembleEvent);
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
      if (querySpan.children.length > 0 && querySpan.lastChild === chunk) {
        querySpan.removeChild(chunk);
        if (querySpan.childElementCount === 0) {
          searchContainerPlaceHolder.classList.add("enabled");
        }
      }
    }
  }

  chunk.onfocus = () => {
    suggestionContainer.classList.toggle("enabled");
    if (querySpan.childElementCount === 1) {
      searchContainerPlaceHolder.classList.remove("enabled");
    }
    suggestionContainer.style.height = "150px";
    suggestionContainer.style.width = (searchContainer.offsetWidth).toString() + "px";

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
  for (let [paramKey, paramData] of Object.entries(queryParams)) {
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

function initSearchContainer() {
  if (searchContainer) {
    if (textContainer.length) {
      textContainer = textContainer[0];
    } else {
      textContainer = document.createElement("div");
    }
    if (suggestionContainer.length) {
      suggestionContainer = suggestionContainer[0];
    } else {
      suggestionContainer = document.createElement("div");
    }
    if (searchContainerPlaceHolder.length) {
      searchContainerPlaceHolder = searchContainerPlaceHolder[0];
    } else {
      searchContainerPlaceHolder = document.createElement("p");
    }

    querySpan = textContainer.getElementsByTagName("span");

    if (querySpan.length) {
      querySpan = querySpan[0];
    } else {
      querySpan = document.createElement("span");
    }

    textContainer.classList.add("search-text-container");
    suggestionContainer.classList.add("search-suggestion-container");
    searchContainerPlaceHolder.classList.add("search-container-placeholder");

    if (!(textContainer in searchContainer.children)) searchContainer.append(textContainer);
    if (!(suggestionContainer in searchContainer.children)) searchContainer.append(suggestionContainer);
    if (!(searchContainerPlaceHolder in searchContainer)) searchContainer.append((searchContainerPlaceHolder));
    if (!(querySpan in textContainer)) textContainer.append((querySpan));

    if (suggestionContainer.childElementCount === 0) {
      let dummySuggestionContainer = document.createElement("div");

      dummySuggestionContainer.classList.add("dummy-suggestion-container");
      suggestionContainer.append(dummySuggestionContainer);

      if (!lstSuggestion) {
        lstSuggestion = document.createElement("ul");
        lstSuggestion.classList.add("search-suggestion-list");
        lstSuggestion.id = "lstSuggestion";
      }

      dummySuggestionContainer.append(lstSuggestion);
    }

    searchContainerPlaceHolder.onclick = () => textContainer.click();
    searchContainerPlaceHolder.innerHTML = "Search";
    searchContainerPlaceHolder.classList.add("enabled");
    searchContainer.tabIndex = 0;

    searchContainer.onfocus = () => {if (document.activeElement === searchContainer) textContainer.click()};

    const placeHolderAdjustmentInterval = setInterval(() => {
      searchContainerPlaceHolder.style.top = `${searchContainer.offsetTop + (searchContainer.offsetHeight - searchContainerPlaceHolder.offsetHeight) / 2}px`;
      searchContainerPlaceHolder.style.left = `${searchContainer.offsetLeft + (searchContainer.offsetWidth - searchContainerPlaceHolder.offsetWidth) / 2}px`;

      if (searchContainer.offsetHeight) clearInterval(placeHolderAdjustmentInterval);

    });

  }
}

window.onload = () => {
  initSearchContainer();
  textContainer.onclick = () => querySpan.click();
  suggestionContainer.onclick = (e) => e.preventDefault();
  // createQueryChunk();
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

  searchContainer.addEventListener("searchAssemble", () => {
    let queryString = "";
    let sep = "";
    queryChunks = [].slice.call(querySpan.getElementsByTagName("input"));
    for (let chunk of queryChunks) {
      queryString += sep + chunk.value;
      sep = "\t";
    }

    searchContainer.setAttribute("queryString", queryString);
    searchContainer.dispatchEvent(searchEvent);
  })
}
