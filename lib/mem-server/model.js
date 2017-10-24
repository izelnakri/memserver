import chalk from 'chalk';
import { generateUUID } from './utils';

const targetNamespace = typeof global === 'object' ? global : window;

export default function(options) {
  return Object.assign({}, {
    modelName: '',
    primaryKey: '',
    defaultAttributes: {},
    attributes: [],
    find(param) {
      if (!param) {
        throw new Error(chalk.red(`MemServer ${this.modelName}.find(id) cannot be called without a valid id`));
      } else if (Array.isArray(param)) {
        const models = targetNamespace.MemServer.DB[this.modelName] || [];

        return models.reduce((result, model) => {
          const foundModel = param.includes(model.id) ? model : null;

          return foundModel ? result.concat([foundModel]) : result;
        }, []);
      } else if (typeof param !== 'number') {
        throw new Error(chalk.red(`MemServer ${this.modelName}.find(id) cannot be called without a valid id`));
      }

      const models = targetNamespace.MemServer.DB[this.modelName] || [];

      return models.find((model) => model.id === param);
    },
    findBy(options) {
      if (!options) {
        throw new Error(chalk.red(`MemServer ${this.modelName}.findBy(id) cannot be called without a parameter`));
      }
      const keys = Object.keys(options);
      const models = targetNamespace.MemServer.DB[this.modelName] || [];

      return models.find((model) => comparison(model, options, keys, 0));
    },
    findAll(options={}) {
      const models = targetNamespace.MemServer.DB[this.modelName] || [];
      const keys = Object.keys(options);

      if (keys.length === 0) {
        return models;
      }

      return models.filter((model) => comparison(model, options, keys, 0));
    },
    insert(options) { // NOTE: what if there is same id?
      const models = targetNamespace.MemServer.DB[this.modelName] || [];
      const defaultAttributes = this.attributes.reduce((result, attribute) => {
        if (attribute === this.primaryKey) {
          result[attribute] = this.primaryKey === 'id' ? incrementId(this) : generateUUID();

          return result;
        }

        const target = this.defaultAttributes[attribute];

        result[attribute] = typeof target === 'function' ? target() : target;

        return result;
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
    delete(record) {
      const models = targetNamespace.MemServer.DB[this.modelName];

      if (models.length === 0) {
        throw new Error(`[MemServer] ${this.modelName} has no records in the database to remove`);
      }

      const targetRecord = record.id ? this.find(record.id) : this.findBy({ uuid: record.uuid });

      if (!targetRecord) {
        throw new Error('[MemServer] $Model.destroy(record) requires id or uuid primary key to destroy a record, you have provided this parameter: ${record}');
      }

      const targetIndex = models.indexOf(targetRecord);

      targetNamespace.MemServer.DB[this.modelName] = models.splice(targetIndex, 1);
    },
    bulkDelete() {

    },
    serialize(objectOrArray) {

    }
  }, options);
}

function incrementId(Model) {
  const ids = targetNamespace.MemServer.DB[Model.modelName].map((model) => model.id);

  if (ids === []) {
    return 1;
  }

  return ids.sort((a, b) => a - b).find((id, index, array) => {
    return index === array.length - 1 ? true : id + 1 !== array[index + 1];
  }) + 1;
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
