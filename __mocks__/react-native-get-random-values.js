if (!global.crypto) {
  global.crypto = {};
}

global.crypto.getRandomValues = typedArray => {
  for (let index = 0; index < typedArray.length; index += 1) {
    typedArray[index] = index + 1;
  }

  return typedArray;
};
