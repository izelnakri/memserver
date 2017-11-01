export default JSValueToCode;

function JSObjectToCode(object) {
  if (Array.isArray(object)) {
    return '[' + object.map((element) => JSValueToCode(element)).join(', ') + ']';
  }

  return '{' + Object.keys(object).reduce((result, key) => {
    const codeValue = JSValueToCode(object[key]);
    const pair = `'${key}': ${codeValue}`;

    return result === '' ? pair : [result, pair].join(', ');
  }, '') + '}';
}

function JSValueToCode(value) {
  const valueType = typeof value;

  if (valueType === 'undefined') {
    return 'undefined';
  } else if (value === null) {
    return 'null';
  } else if (valueType === 'number' || valueType === 'boolean') {
    return `${value}` ;
  } else if (valueType === 'string') {
    return `'${value}'`;
  } else if (valueType === 'function') {
    return value.toString();
  }

  return JSObjectToCode(value);
}
