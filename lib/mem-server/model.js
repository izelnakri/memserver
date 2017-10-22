const ENVIRONMENT_IS_NODE = typeof global === 'object';
const targetNamespace = ENVIRONMENT_IS_NODE ? global : window;

export default {
  modelName: '',
  insert(options) {
    // const attributes = Object.keys(this);

  },
  bulkInsert(count, options) {

  },
  find(id) {
    const models = targetNamespace.MemServer.DB[this.modelName] || [];

    return models.find((model) => model.id === id);
  },
  findAll(options={}) {
    const keys = Object.keys(options);
    const models = targetNamespace.MemServer.DB[this.modelName] || [];

    if (keys.length === 0) {
      return models;
    }

    return models.filter((model) => comparison(model, options, keys, 0));
  },
  findBy(options) {
    const keys = Object.keys(options);
    const models = targetNamespace.MemServer.DB[this.modelName] || [];
    console.log('models are:', models);

    return models.find((model) => comparison(model, options, keys, 0));
  },
  update(record) {

  },
  destroy(record) {

  },
  serialize(objectOrArray) {

  }
}

// NOTE: if records were ordered by ID, then there could be performance benefit
function comparison(model, options, keys, index=0) {
  const key = keys[index];

  if (keys.length === index) {
    return model[key] === options[key];
  }

  if (model[key] === options[key]) {
    return comparison(model, options, keys, index + 1)
  }

  return false;
}
