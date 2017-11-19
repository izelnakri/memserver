import util from 'util';
import chalk from 'chalk';
import Inflector from 'i';
import { classify, underscore } from 'ember-cli-string-utils';
import { primaryKeyTypeSafetyCheck, generateUUID } from './utils';

const { singularize, pluralize } = Inflector();
const targetNamespace = typeof global === 'object' ? global : window;

export default function(options) {
  return Object.assign({}, {
    modelName: null,
    primaryKey: null,
    defaultAttributes: {},
    attributes: [],
    count() {
      const models = Array.from(targetNamespace.MemServer.DB[this.modelName] || []);

      return models.length;
    },
    find(param) {
      if (!param) {
        throw new Error(chalk.red(`[MemServer] ${this.modelName}.find(id) cannot be called without a valid id`));
      } else if (Array.isArray(param)) {
        const models = Array.from(targetNamespace.MemServer.DB[this.modelName] || []);

        return models.reduce((result, model) => {
          const foundModel = param.includes(model.id) ? model : null;

          return foundModel ? result.concat([foundModel]) : result;
        }, []);
      } else if (typeof param !== 'number') {
        throw new Error(chalk.red(`[MemServer] ${this.modelName}.find(id) cannot be called without a valid id`));
      }

      const models = Array.from(targetNamespace.MemServer.DB[this.modelName] || []);

      return models.find((model) => model.id === param);
    },
    findBy(options) {
      if (!options) {
        throw new Error(chalk.red(`[MemServer] ${this.modelName}.findBy(id) cannot be called without a parameter`));
      }

      const keys = Object.keys(options);
      const models = targetNamespace.MemServer.DB[this.modelName] || [];

      return models.find((model) => comparison(model, options, keys, 0));
    },
    findAll(options={}) {
      const models = Array.from(targetNamespace.MemServer.DB[this.modelName] || []);
      const keys = Object.keys(options);

      if (keys.length === 0) {
        return models;
      }

      return models.filter((model) => comparison(model, options, keys, 0));
    },
    insert(options) {
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
      const target = Object.assign(defaultAttributes, options);

      primaryKeyTypeSafetyCheck(this.primaryKey, target[this.primaryKey], this.modelName);

      const existingRecord = target.id ? this.find(target.id) : this.findBy({ uuid: target.uuid });

      if (existingRecord) {
        throw new Error(chalk.red(`[MemServer] ${this.modelName} ${this.primaryKey} ${target[this.primaryKey]} already exists in the database! ${this.modelName}.insert(${util.inspect(options)}) fails`));
      }

      Object.keys(target)
        .filter((attribute) => !this.attributes.includes(attribute))
        .forEach((attribute) => this.attributes.push(attribute));

      models.push(target);

      return target;
    },
    update(record) {
      if (!record || (!record.id && !record.uuid)) {
        throw new Error(chalk.red(`[MemServer] ${this.modelName}.update(record) requires id or uuid primary key to update a record`));
      }

      const targetRecord = record.id ? this.find(record.id) : this.findBy({ uuid: record.uuid });

      if (!targetRecord) {
        throw new Error(chalk.red(`[MemServer] ${this.modelName}.update(record) failed because ${this.modelName} with ${this.primaryKey}: ${record[this.primaryKey]} does not exist`));
      }

      const recordsUnknownAttribute = Object.keys(record)
        .find((attribute) => !this.attributes.includes(attribute));

      if (recordsUnknownAttribute) {
        throw new Error(chalk.red(`[MemServer] ${this.modelName}.update ${this.primaryKey}: ${record[this.primaryKey]} fails, ${this.modelName} model does not have ${recordsUnknownAttribute} attribute to update`));
      }

      return Object.assign(targetRecord, record);
    },
    delete(record) {
      const models = targetNamespace.MemServer.DB[this.modelName] || [];

      if (models.length === 0) {
        throw new Error(chalk.red(`[MemServer] ${this.modelName} has no records in the database to delete. ${this.modelName}.delete(${util.inspect(record)}) failed`));
      } else if (!record) {
        throw new Error(chalk.red(`[MemServer] ${this.modelName}.delete(model) model object parameter required to delete a model`));
      }

      const targetRecord = record.id ? this.find(record.id) : this.findBy({ uuid: record.uuid });

      if (!targetRecord) {
        throw new Error(chalk.red(`[MemServer] Could not find ${this.modelName} with ${this.primaryKey} ${record[this.primaryKey]} to delete. ${this.modelName}.delete(${util.inspect(record)}) failed`));
      }

      const targetIndex = models.indexOf(targetRecord);

      targetNamespace.MemServer.DB[this.modelName].splice(targetIndex, 1);

      return targetRecord;
    },
    embed(relationship) { // EXAMPLE: { comments: Comment }
      if (typeof relationship !== 'object' || relationship.modelName) {
        throw new Error(chalk.red(`[MemServer] ${this.modelName}.embed(relationshipObject) requires an object as a parameter: { relationshipKey: $RelationshipModel }`));
      }

      const key = Object.keys(relationship)[0];

      if (!relationship[key]) {
        throw new Error(chalk.red(`[MemServer] ${this.modelName}.embed() fails: ${key} Model reference is not a valid. Please put a valid $ModelName to ${this.modelName}.embed()`));
      }

      return Object.assign(this.embedReferences, relationship);
    },
    embedReferences: {},
    serializer(objectOrArray) {
      if (!objectOrArray) {
        return;
      } else if (Array.isArray(objectOrArray)) {
        return objectOrArray.map((object) => this.serialize(object), []);
      }

      return this.serialize(objectOrArray);
    },
    serialize(object) { // NOTE: add links object ?
      if (Array.isArray(object)) {
        throw new Error(chalk.red(`[MemServer] ${this.modelName}.serialize(object) expects an object not an array. Use ${this.modelName}.serializer(data) for serializing array of records`));
      }

      const objectWithAllAttributes = this.attributes.reduce((result, attribute) => {
        if (result[attribute] === undefined) {
          result[attribute] = null;
        }

        return result;
      }, object);

      return Object.keys(this.embedReferences).reduce((result, embedKey) => {
        const embedModel = this.embedReferences[embedKey];
        const embeddedRecords = this.getRelationship(object, embedKey, embedModel);

        return Object.assign(result, { [embedKey]: embedModel.serializer(embeddedRecords) });
      }, objectWithAllAttributes);
    },
    getRelationship(parentObject, relationshipName, relationshipModel) {
      if (Array.isArray(parentObject)) {
        throw new Error(chalk.red(`[MemServer] ${this.modelName}.getRelationship expects model input to be an object not an array`));
      }

      const targetRelationshipModel = relationshipModel ||
        targetNamespace.MemServer.Models[classify(singularize(relationshipName))];
      const hasManyRelationship = pluralize(relationshipName) === relationshipName;

      if (!targetRelationshipModel) { // NOTE: test this
        throw new Error(chalk.red(`[MemServer] ${relationshipName} relationship could not be found on ${this.modelName} model. Please put the ${relationshipName} Model object as the third parameter to ${this.modelName}.getRelationship function`));
      } else if (hasManyRelationship) {
        const hasManyRecords = targetRelationshipModel.findAll({
          [`${underscore(this.modelName)}_id`]: parentObject.id
        });

        return hasManyRecords.length > 0 ? hasManyRecords : [];
      }

      const objectsReference = parentObject[`${underscore(targetRelationshipModel.modelName)}_id`];

      if (objectsReference) {
        return targetRelationshipModel.find(objectsReference);
      }

      return targetRelationshipModel.findBy({ // NOTE: id or uuid lookup?
        [`${underscore(this.modelName)}_id`]: parentObject.id
      });
    }
  }, options);
}

function incrementId(Model) {
  const ids = targetNamespace.MemServer.DB[Model.modelName];

  if (ids.length === 0) {
    return 1;
  }

  const lastIdInSequence = ids
    .map((model) => model.id)
    .sort((a, b) => a - b)
    .find((id, index, array) => index === array.length - 1 ? true : id + 1 !== array[index + 1]);

  return lastIdInSequence + 1;
}

// NOTE: if records were ordered by ID, then there could be performance benefit
function comparison(model, options, keys, index=0) {
  const key = keys[index];

  if (keys.length === index) {
    return model[key] === options[key];
  } else if (model[key] === options[key]) {
    return comparison(model, options, keys, index + 1);
  }

  return false;
}
