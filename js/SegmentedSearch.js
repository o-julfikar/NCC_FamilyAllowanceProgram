class SegmentedSearch {
  constructor(window, searchContainer, querySuggestions, fetchInterval) {
    this.regexKeyValuePair = /^([^:]+:[^:]+)?$/;
    this.regexEmptyKey = /^[^:]+:( )*$/;
    this.inputEvent = new Event("input");
    this.searchEvent = new Event("search");
    this.fetchEvent = new CustomEvent("fetch_suggestions", {
      detail: {
        suggestions: []
      }
    });
    this.suggestionUpdatedEvent = new CustomEvent("suggestion_updated", {
      detail: {
        suggestions: []
      }
    });
    this.suggestionFetchLog = {};
    this.searchAssembleEvent = new Event("searchAssemble");
    this.searchContainer = searchContainer;
    this.searchContainerPlaceHolder = null;
    this.textContainer = null;
    this.suggestionContainer = null;
    this.lstSuggestion = null;
    this.querySpan = null;
    this.queryChunks = [];
    this.querySuggestions = querySuggestions;
    this.fetchInterval = fetchInterval;

    this.init();
    window.onresize = () => {
      this.centerAlignPlaceHolder();
    }
  }

  init() {
    this.textContainer = document.createElement("div");
    this.suggestionContainer = document.createElement("div");
    this.searchContainerPlaceHolder = document.createElement("p");
    this.querySpan = document.createElement("span");
    this.lstSuggestion = document.createElement("ul");
    let dummySuggestionContainer = document.createElement("div");

    this.textContainer.classList.add("search-text-container");
    this.suggestionContainer.classList.add("search-suggestion-container");
    this.searchContainerPlaceHolder.classList.add("search-container-placeholder");
    this.lstSuggestion.classList.add("search-suggestion-list");
    dummySuggestionContainer.classList.add("dummy-suggestion-container");

    this.lstSuggestion.id = "lstSuggestion";

    this.searchContainer.append(this.textContainer);
    this.searchContainer.append(this.suggestionContainer);
    this.searchContainer.append((this.searchContainerPlaceHolder));
    this.textContainer.append((this.querySpan));
    this.suggestionContainer.append(dummySuggestionContainer);
    dummySuggestionContainer.append(this.lstSuggestion);

    this.searchContainerPlaceHolder.onclick = () => this.querySpan.click();
    this.searchContainerPlaceHolder.innerHTML = "Search";
    this.searchContainerPlaceHolder.classList.add("enabled");
    this.searchContainer.tabIndex = 0;

    this.searchContainer.onfocus = () => {
      if (document.activeElement === this.searchContainer) this.querySpan.click()
    };

    const placeHolderAdjustmentInterval = setInterval(() => {
      this.centerAlignPlaceHolder();
      if (this.searchContainer.offsetHeight) clearInterval(placeHolderAdjustmentInterval);
    });

    this.suggestionContainer.onmouseenter = () => this.suggestionContainer.classList.add("mouseover");
    this.suggestionContainer.onmouseleave = () => this.suggestionContainer.classList.remove("mouseover");
    this.textContainer.onclick = () => this.querySpan.click();
    this.querySpan.onclick = () => {
      if (!this.queryChunks.includes(document.activeElement)) {
        if (!this.querySpan.hasChildNodes() || this.querySpan.lastChild.value.length) {
          this.createQueryChunk();
        } else {
          this.querySpan.lastChild.focus();
        }
      }
    }

    this.querySpan.onblur = () => {
      if (this.querySpan.children.length > 1 && this.querySpan.lastChild.value.length === 0) {
        this.querySpan.removeChild(this.querySpan.lastChild);
      }
    }

    this.searchContainer.addEventListener("searchAssemble", () => {
      let queryString = "";
      let sep = "";
      this.updateQueryChunks();
      for (let chunk of this.queryChunks) {
        queryString += sep + chunk.value;
        sep = "\t";
      }

      this.searchContainer.setAttribute("queryString", queryString);
      this.searchContainer.dispatchEvent(this.searchEvent);
    })

    this.suggestionContainer.addEventListener("suggestion_updated", (e) => {
      const suggestionUpdates = e.detail.suggestions;
      e.detail.suggestions = [];
      for (let _suggestion of suggestionUpdates) {
        let [suggestionKey, suggestion] = Object.entries(_suggestion)[0];
        if (document.activeElement === this.querySpan.lastChild) {
          if (this.querySpan.lastChild.value.startsWith(`${suggestionKey}:`)) {
            let [chunkKey, chunkValues] = this.querySpan.lastChild.value.split(":");
            chunkValues = chunkValues.split(",");
            for (let i = 0; i < chunkValues.length; i++) chunkValues[i] = chunkValues[i].trim();
            let chunkLastValue = chunkValues.pop().toLowerCase();
            this.lstSuggestion.replaceChildren();
            for (let value of suggestion.values.slice(0, 20)) {
              value = value.toString();
              if (value.length > 0) {
                if (value.toLowerCase().includes(chunkLastValue) || chunkLastValue.includes(value.toLowerCase())) {
                  const suggestion = document.createElement("li");
                  suggestion.innerHTML = value.toString();
                  this.lstSuggestion.append(suggestion);
                  suggestion.onmousedown = (e) => {
                    e.preventDefault();
                    this.insertInput(this.querySpan.lastChild, `${chunkKey}: ${chunkValues.concat(value).join(", ")}, `);
                    this.querySpan.lastChild.focus();
                  }
                }
              }
            }
          }
          break;
        }
      }
    });
  }

  suggestionUpdated(key, data) {
    this.suggestionUpdatedEvent.detail.suggestions.push({[key]: data});
    this.suggestionContainer.dispatchEvent(this.suggestionUpdatedEvent);
  }

  afterEffects() {
    for (let [paramKey, paramData] of Object.entries(this.querySuggestions)) {
      if (paramData.fetch) {
        this.fetchEvent.detail.suggestions.push({
          key: paramKey,
          param: paramData,
          searchKey: "",
        });
      }
    }
    this.suggestionContainer.dispatchEvent(this.fetchEvent);
  }

  createMultivaluedHintText(hintText, occurrence) {
    let txt = `${hintText}${occurrence > 1 ? 1 : ""}`;
    for (let i = 1; i < occurrence; i++) {
      txt += `, ${hintText}${i + 1}`;
    }

    return txt;
  }

  addChunkEvents(chunk) {
    chunk.oninput = () => {
      if (chunk.value.length) {
        chunk.size = chunk.value.length;
        if (!this.regexKeyValuePair.test(chunk.value)) {
          chunk.classList.add("invalid-pair");
        } else {
          chunk.classList.remove("invalid-pair");
        }
      } else {
        chunk.size = 9;
      }

      this.loadSuggestions(chunk);
    };

    chunk.onkeydown = (e) => {
      if (e.key === "Backspace") {
        if (!chunk.value.length && this.querySpan.childElementCount > 1) {
          let previousChunk = chunk.previousElementSibling;
          previousChunk.focus();
          previousChunk.setSelectionRange(previousChunk.value.length, previousChunk.value.length);
        }
      }
      if (e.key === "Enter" || e.key === "Tab" || e.key === ";") {
        if (chunk.value.length) {
          if (e.key !== "Tab" || this.querySpan.lastChild === chunk) {
            e.preventDefault();
            if (e.key === "Enter") {
              this.querySpan.lastChild.focus();
            }
          }
          if (this.querySpan.lastChild.value.length) {
            this.createQueryChunk(chunk);
            this.searchContainer.dispatchEvent(this.searchAssembleEvent);
          }
        } else if (this.querySpan.childElementCount > 0) {
          if (chunk === this.querySpan.lastChild) {
            this.searchContainer.dispatchEvent(this.searchAssembleEvent);
          } else {
            e.preventDefault();
            this.createQueryChunk();
          }
        }
      }
    }

    chunk.onblur = () => {
      if (!this.regexKeyValuePair.test(chunk.value)) {
        chunk.classList.add("invalid-pair");
      } else {
        chunk.classList.remove("invalid-pair");
      }
      if (chunk.value.length) {
        chunk.classList.add("defined");
      } else {
        chunk.classList.remove("defined");
        if (this.querySpan.lastChild === chunk) {

          if (this.querySpan.childElementCount === 1) {
            this.searchContainerPlaceHolder.classList.add("enabled");
          }
        }
        this.querySpan.removeChild(chunk);
      }
      if (this.suggestionContainer.classList.contains("mouseover")) return;
      this.suggestionContainer.classList.remove("enabled");
    }

    chunk.onfocus = () => {
      this.suggestionContainer.classList.add("enabled");
      if (this.querySpan.childElementCount > 0) {
        this.searchContainerPlaceHolder.classList.remove("enabled");
      }
      if (chunk !== this.querySpan.firstChild && chunk.value.length === 0) {
        this.beautifyQueryChunks(chunk);
      }
      this.suggestionContainer.style.height = "150px";
      this.suggestionContainer.style.width = (this.searchContainer.offsetWidth).toString() + "px";

      this.loadSuggestions(chunk);
    }

    chunk.onclick = (e) => {
      e.stopPropagation();
    }
  }

  beautifyQueryChunks(currentChunk) {
    const queryDict = {};
    const getDefault = (map, key, defaultValue) => key in map ? map[key] : defaultValue;
    for (const chunk of this.updateQueryChunks()) {
      if (chunk !== currentChunk) {
        if (this.regexKeyValuePair.test(chunk.value)) {
          let [key, values] = chunk.value.split(":");
          key = key.trim();
          values = this.trimAll(...values.split(","));

          queryDict[key] = getDefault(queryDict, key, []).concat(values);
        } else {
          queryDict["all"] = getDefault(queryDict, "all", []).concat(chunk.value.replaceAll(":", ""));
        }
      }
    }

    console.log(queryDict);

    for (const chunk of this.updateQueryChunks()) {
      if (chunk !== currentChunk) {
        if (this.regexKeyValuePair.test(chunk.value)) {
          const key = chunk.value.split(":")[0];
          if (key in queryDict) {
            if (queryDict[key]) {
              this.insertInput(chunk, `${key}: ${queryDict[key].join(", ")}`)
              queryDict[key] = false;
            } else {
              this.querySpan.removeChild(chunk);
            }
          }
        } else if (queryDict["all"]) {
          this.insertInput(chunk, `all: ${queryDict["all"].join(", ")}`)
          queryDict["all"] = false;
        } else {
          this.querySpan.removeChild(chunk);
        }
      }
    }
  }

  updateQueryChunks() {
    let x = [];
    this.queryChunks = [].slice.call(this.querySpan.getElementsByTagName("input"));
    return this.queryChunks;
  }

  trimAll(...args) {
    let trimmedList = [];
    for (let i = 0; i < args.length; i++) if (args[i].trim().length > 0) trimmedList.push(args[i].trim());
    return trimmedList;
  }

  createQueryChunk(chunk = null, seekFocus = true) {
    let newInputChunk = document.createElement("input");
    newInputChunk.classList.add("query-chunk");
    newInputChunk.type = "text";
    newInputChunk.id = `q${this.queryChunks.length}`;
    newInputChunk.name = `q${this.queryChunks.length}`;
    newInputChunk.placeholder = "key:value";
    newInputChunk.autocomplete = "off";
    this.addChunkEvents(newInputChunk);
    this.querySpan.append(newInputChunk);
    this.queryChunks.push(newInputChunk);
    if (chunk) {
      chunk.classList.add("defined");
    }
    if (seekFocus) newInputChunk.focus();
    return newInputChunk;
  }

  loadSuggestions(chunk) {

    this.lstSuggestion.replaceChildren();
    for (let [paramKey, param] of Object.entries(this.querySuggestions)) {
      if (chunk.value.startsWith(`${paramKey}:`)) {
        let [chunkKey, chunkValues] = chunk.value.split(":");
        chunkValues = chunkValues.split(",");
        for (let i = 0; i < chunkValues.length; i++) chunkValues[i] = chunkValues[i].trim();
        let chunkLastValue = chunkValues.pop().toLowerCase();
        if (param.fetch) {
          const hasMatch = this.anyStartsWith(param.values, chunkLastValue);
          if (!hasMatch || !(paramKey in this.suggestionFetchLog) || this.now() - this.suggestionFetchLog[paramKey] > this.fetchInterval) {
            this.fetchEvent.detail.suggestions.push({
              key: paramKey,
              param: param,
              searchKey: hasMatch ? "" : chunkLastValue,
            });
            this.suggestionContainer.dispatchEvent(this.fetchEvent);
          }
        }
        for (let value of param.values.slice(0, 20)) {
          value = value.toString();
          if (value.length > 0) {
            if (value.toLowerCase().includes(chunkLastValue) || chunkLastValue.includes(value.toLowerCase())) {
              const suggestion = document.createElement("li");
              suggestion.innerHTML = value.toString();
              this.lstSuggestion.append(suggestion);
              suggestion.onmousedown = (e) => {
                e.preventDefault();
                this.insertInput(chunk, `${chunkKey}: ${chunkValues.concat(value).join(", ")}, `);
                chunk.focus();
              }
            }
          }
        }
      } else if (paramKey.includes(chunk.value)) {
        const suggestion = document.createElement("li");
        let paramHint = param.type;
        if (param.multivalued) paramHint = this.createMultivaluedHintText(param.type, 3) + ", ...";
        suggestion.innerHTML = `${paramKey}: ${paramHint}`;
        this.lstSuggestion.append(suggestion);
        suggestion.onmousedown = (e) => {
          e.preventDefault();
          this.insertInput(chunk, `${paramKey}:`);
          chunk.focus();
        }
      }
    }
  }

  insertInput(inputElement, inputValue) {
    inputElement.value = inputValue;
    inputElement.dispatchEvent(this.inputEvent);
  }

  anyStartsWith(array, key) {
    for (let value of array) if (value.startsWith(key)) return true;
    return false;
  }

  // refreshQuerySpan() {
  //   for (let i in this.queryChunks) {
  //     if (!this.queryChunks[i].value.length && i !== this.queryChunks.length - 1) {
  //       this.querySpan.removeChild(queryChunks[i]);
  //     }
  //   }
  // }

  centerAlignPlaceHolder() {
    this.searchContainerPlaceHolder.style.top = `${this.searchContainer.offsetTop + (this.searchContainer.offsetHeight - this.searchContainerPlaceHolder.offsetHeight) / 2}px`;
    this.searchContainerPlaceHolder.style.left = `${this.searchContainer.offsetLeft + (this.searchContainer.offsetWidth - this.searchContainerPlaceHolder.offsetWidth) / 2}px`;
  }

  now() {
    return new Date().getTime();
  }
}

class SuggestionFetchEvent extends Event {
  constructor(props) {
    super(props);
  }

}

export {SegmentedSearch};
