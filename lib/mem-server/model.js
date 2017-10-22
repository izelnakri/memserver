const ENVIRONMENT_IS_NODE = typeof global === 'object';
const targetNamespace = ENVIRONMENT_IS_NODE ? global : window;

export default {
  modelName: '',
  attributes: [],
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
  insert(options) { // NOTE: what if there is same id?
    const models = targetNamespace.MemServer.DB[this.modelName] || [];

    // TODO: auto-increment ids
    const defaultAttributes = this.attributes.reduce((result, attribute) => {
      // TODO: enable functions
      result[attribute] = this[attribute];
    }, {});

    const targetAttributes = Object.assign(defaultAttributes, options);

    models.push(targetAttributes);
  },
  bulkInsert(count, options) {
    return Array.from({ length: count }).map(() => this.insert(options));
  },
  update(record) {
    const targetRecord = record.id ? this.find(record.id) : this.findBy({ uuid: record.uuid });

    if (!targetRecord) {
      throw new Error('[MemServer] $Model.update(record) requires id or uuid primary key to update a record');
    }

    const targetIndex = models.indexOf(targetRecord);

    targetNamespace.MemServer.DB[this.modelName][targetIndex] = Object.assign(targetRecord, record);

    return targetNamespace.MemServer.DB[this.modelName][targetIndex];
  },
  bulkUpdate() {

  },
  destroy(record) {
    const models = targetNamespace.MemServer.DB[this.modelName];

    if (models.length === 0) {
      throw new Error(`[MemServer] ${this.modelName} has no records in the database to remove`);
    }

    const targetRecord = record.id ? this.find(record.id) : this.findBy({ uuid: record.uuid });

    if (!targetRecord) {
      throw new Error('[MemServer] $Model.destroy(record) requires id or uuid primary key to destroy a record');
    }

    const targetIndex = models.indexOf(targetRecord);

    targetNamespace.MemServer.DB[this.modelName] = models.splice(targetIndex, 1);
  },
  bulkDestroy() {

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