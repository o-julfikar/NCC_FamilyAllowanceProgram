function encodeSafeJSON(string) {
  try {
    string = JSON.parse(string);
  } catch (e) {
    console.log(string);
    string = {"code": 502, "data": "Error parsing JSON."};
  }
  return string;
}

export {encodeSafeJSON};
