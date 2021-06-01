import inspect from "object-inspect";
import kleur from "kleur";
import { underscore } from "@emberx/string";
import { pluralize } from "inflected";
import { insertFixturesWithTypechecks, primaryKeyTypeSafetyCheck, generateUUID } from "./utils";
export default class MemServerModel {
    static get DB() {
        if (!this._DB[this.name]) {
            this._DB[this.name] = [];
            return this._DB[this.name];
        }
        return this._DB[this.name];
    }
    static get attributes() {
        if (!this._attributes[this.name]) {
            this._attributes[this.name] = [];
            this._modelDefinitions[this.name] = this;
            return this._attributes[this.name];
        }
        return this._attributes[this.name];
    }
    static set defaultAttributes(value) {
        Object.keys(value).forEach((key) => {
            if (!this.attributes.includes(key)) {
                this.attributes.push(key);
            }
        });
        this._defaultAttributes = value;
    }
    static get defaultAttributes() {
        return this._defaultAttributes;
    }
    static set embedReferences(references) {
        this._embedReferences[this.name] = references;
    }
    static get embedReferences() {
        // NOTE: serializer concern
        if (!this._embedReferences[this.name]) {
            this._embedReferences[this.name] = {};
            return this._embedReferences[this.name];
        }
        return this._embedReferences[this.name];
    }
    static resetDatabase(fixtures) {
        this.DB.length = 0;
        this.attributes.length = 0;
        this.defaultAttributes = this.defaultAttributes;
        if (fixtures) {
            insertFixturesWithTypechecks(this, fixtures);
        }
        return this.DB;
    }
    static count() {
        return this.DB.length;
    }
    static find(param) {
        // NOTE: turn param into an interface with id or uuid
        if (!param) {
            throw new Error(kleur.red(`[Memserver] ${this.name}.find(id) cannot be called without a valid id`));
        }
        else if (Array.isArray(param)) {
            return Array.from(this.DB).reduce((result, model) => {
                const foundModel = param.includes(model.id) ? model : null;
                return foundModel ? result.concat([foundModel]) : result;
            }, []);
        }
        else if (typeof param !== "number") {
            throw new Error(kleur.red(`[Memserver] ${this.name}.find(id) cannot be called without a valid id`));
        }
        return Array.from(this.DB).find((model) => model.id === param);
    }
    static findBy(options) {
        if (!options) {
            throw new Error(kleur.red(`[Memserver] ${this.name}.findBy(id) cannot be called without a parameter`));
        }
        const keys = Object.keys(options);
        return this.DB.find((model) => comparison(model, options, keys, 0));
    }
    static findAll(options = {}) {
        const keys = Object.keys(options);
        if (keys.length === 0) {
            return Array.from(this.DB);
        }
        return Array.from(this.DB).filter((model) => comparison(model, options, keys, 0));
    }
    static insert(options) {
        options = options || {};
        if (this.DB.length === 0) {
            this.primaryKey = this.primaryKey || (options.uuid ? "uuid" : "id");
            this.attributes.push(this.primaryKey);
        }
        if (!options.hasOwnProperty(this.primaryKey)) {
            options[this.primaryKey] =
                this.primaryKey === "id" ? incrementId(this.DB, this) : generateUUID();
        }
        primaryKeyTypeSafetyCheck(this.primaryKey, options[this.primaryKey], this.name);
        const target = this.attributes.reduce((result, attribute) => {
            if (typeof result[attribute] === "function") {
                result[attribute] = result[attribute].apply(result);
            }
            else if (!result.hasOwnProperty(attribute)) {
                result[attribute] = undefined;
            }
            return result;
        }, Object.assign({}, this.defaultAttributes, options));
        const existingRecord = target.id ? this.find(target.id) : this.findBy({ uuid: target.uuid });
        if (existingRecord) {
            throw new Error(kleur.red(`[Memserver] ${this.name} ${this.primaryKey} ${target[this.primaryKey]} already exists in the database! ${this.name}.insert(${inspect(options)}) fails`));
        }
        Object.keys(target)
            .filter((attribute) => !this.attributes.includes(attribute))
            .forEach((attribute) => this.attributes.push(attribute));
        this.DB.push(target);
        return target;
    }
    static update(record) {
        if (!record || (!record.id && !record.uuid)) {
            throw new Error(kleur.red(`[Memserver] ${this.name}.update(record) requires id or uuid primary key to update a record`));
        }
        const targetRecord = record.id ? this.find(record.id) : this.findBy({ uuid: record.uuid });
        if (!targetRecord) {
            throw new Error(kleur.red(`[Memserver] ${this.name}.update(record) failed because ${this.name} with ${this.primaryKey}: ${record[this.primaryKey]} does not exist`));
        }
        const recordsUnknownAttribute = Object.keys(record).find((attribute) => !this.attributes.includes(attribute));
        if (recordsUnknownAttribute) {
            throw new Error(kleur.red(`[Memserver] ${this.name}.update ${this.primaryKey}: ${record[this.primaryKey]} fails, ${this.name} model does not have ${recordsUnknownAttribute} attribute to update`));
        }
        return Object.assign(targetRecord, record);
    }
    static delete(record) {
        if (this.DB.length === 0) {
            throw new Error(kleur.red(`[Memserver] ${this.name} has no records in the database to delete. ${this.name}.delete(${inspect(record)}) failed`));
        }
        else if (!record) {
            throw new Error(kleur.red(`[Memserver] ${this.name}.delete(model) model object parameter required to delete a model`));
        }
        const targetRecord = record.id ? this.find(record.id) : this.findBy({ uuid: record.uuid });
        if (!targetRecord) {
            throw new Error(kleur.red(`[Memserver] Could not find ${this.name} with ${this.primaryKey} ${record[this.primaryKey]} to delete. ${this.name}.delete(${inspect(record)}) failed`));
        }
        if (Array.isArray(targetRecord)) {
            targetRecord.forEach((record) => {
                const targetIndex = this.DB.indexOf(record);
                this.DB.splice(targetIndex, 1);
            });
            return targetRecord;
        }
        const targetIndex = this.DB.indexOf(targetRecord);
        this.DB.splice(targetIndex, 1);
        return targetRecord;
    }
    static embed(relationship) {
        // EXAMPLE: { comments: Comment }
        if (typeof relationship !== "object" || relationship.name) {
            throw new Error(kleur.red(`[Memserver] ${this.name}.embed(relationshipObject) requires an object as a parameter: { relationshipKey: $RelationshipModel }`));
        }
        const key = Object.keys(relationship)[0];
        if (!relationship[key]) {
            throw new Error(kleur.red(`[Memserver] ${this.name}.embed() fails: ${key} Model reference is not a valid. Please put a valid $ModelName to ${this.name}.embed()`));
        }
        return Object.assign(this.embedReferences, relationship);
    }
    static serializer(objectOrArray) {
        if (!objectOrArray) {
            return;
        }
        else if (Array.isArray(objectOrArray)) {
            return objectOrArray.map((object) => this.serialize(object));
        }
        return this.serialize(objectOrArray);
    }
    static serialize(object) {
        // NOTE: add links object ?
        if (Array.isArray(object)) {
            throw new Error(kleur.red(`[Memserver] ${this.name}.serialize(object) expects an object not an array. Use ${this.name}.serializer(data) for serializing array of records`));
        }
        const objectWithAllAttributes = this.attributes.reduce((result, attribute) => {
            if (result[attribute] === undefined) {
                result[attribute] = null;
            }
            return result;
        }, Object.assign({}, object));
        return Object.keys(this.embedReferences).reduce((result, embedKey) => {
            const embedModel = this.embedReferences[embedKey];
            const embeddedRecords = this.getRelationship(object, embedKey, embedModel);
            return Object.assign({}, result, { [embedKey]: embedModel.serializer(embeddedRecords) });
        }, objectWithAllAttributes);
    }
    static getRelationship(parentObject, relationshipName, relationshipModel) {
        if (Array.isArray(parentObject)) {
            throw new Error(kleur.red(`[Memserver] ${this.name}.getRelationship expects model input to be an object not an array`));
        }
        const targetRelationshipModel = relationshipModel || this.embedReferences[relationshipName];
        const hasManyRelationship = pluralize(relationshipName) === relationshipName;
        if (!targetRelationshipModel) {
            throw new Error(kleur.red(`[Memserver] ${relationshipName} relationship could not be found on ${this.name} model. Please put the ${relationshipName} Model object as the third parameter to ${this.name}.getRelationship function`));
        }
        else if (hasManyRelationship) {
            if (parentObject.id) {
                const hasManyIDRecords = targetRelationshipModel.findAll({
                    [`${underscore(this.name)}_id`]: parentObject.id,
                });
                return hasManyIDRecords.length > 0 ? hasManyIDRecords : [];
            }
            else if (parentObject.uuid) {
                const hasManyUUIDRecords = targetRelationshipModel.findAll({
                    [`${underscore(this.name)}_uuid`]: parentObject.uuid,
                });
                return hasManyUUIDRecords.length > 0 ? hasManyUUIDRecords : [];
            }
        }
        const objectRef = parentObject[`${underscore(relationshipName)}_id`] ||
            parentObject[`${underscore(relationshipName)}_uuid`] ||
            parentObject[`${underscore(targetRelationshipModel.name)}_id`] ||
            parentObject[`${underscore(targetRelationshipModel.name)}_uuid`];
        if (objectRef && typeof objectRef === "number") {
            return targetRelationshipModel.find(objectRef);
        }
        else if (objectRef) {
            return targetRelationshipModel.findBy({ uuid: objectRef });
        }
        if (parentObject.id) {
            return targetRelationshipModel.findBy({
                [`${underscore(this.name)}_id`]: parentObject.id,
            });
        }
        else if (parentObject.uuid) {
            return targetRelationshipModel.findBy({
                [`${underscore(this.name)}_uuid`]: parentObject.uuid,
            });
        }
    }
}
MemServerModel._DB = {};
MemServerModel._modelDefinitions = {};
MemServerModel._attributes = {};
MemServerModel._defaultAttributes = {}; // NOTE: probably a decorator here in future
MemServerModel._embedReferences = {}; // NOTE: serializer concern
MemServerModel.primaryKey = null;
function incrementId(DB, Model) {
    if (!DB || DB.length === 0) {
        return 1;
    }
    const lastIdInSequence = DB.map((model) => model.id)
        .sort((a, b) => a - b)
        .find((id, index, array) => (index === array.length - 1 ? true : id + 1 !== array[index + 1]));
    return lastIdInSequence + 1;
}
// NOTE: if records were ordered by ID, then there could be performance benefit
function comparison(model, options, keys, index = 0) {
    const key = keys[index];
    if (keys.length === index) {
        return model[key] === options[key];
    }
    else if (model[key] === options[key]) {
        return comparison(model, options, keys, index + 1);
    }
    return false;
}
