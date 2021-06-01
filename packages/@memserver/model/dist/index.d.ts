declare type RequireOnlyOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> & {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Record<Exclude<Keys, K>, undefined>>;
}[Keys];
export interface InternalModelShape {
    id?: number;
    uuid?: string;
    [propName: string]: any;
}
export declare type InternalModel = RequireOnlyOne<InternalModelShape, "id" | "uuid">;
export default class MemServerModel {
    static _DB: {};
    static _modelDefinitions: {};
    static _attributes: {};
    static _defaultAttributes: {};
    static _embedReferences: {};
    static primaryKey: string | null;
    static get DB(): Array<InternalModel>;
    static get attributes(): Array<string>;
    static set defaultAttributes(value: object);
    static get defaultAttributes(): object;
    static set embedReferences(references: Object);
    static get embedReferences(): Object;
    static resetDatabase(fixtures?: Array<InternalModel>): Array<InternalModel>;
    static count(): number;
    static find(param: Array<number> | number): Array<InternalModel> | InternalModel | undefined;
    static findBy(options: object): InternalModel | undefined;
    static findAll(options?: {}): Array<InternalModel>;
    static insert(options?: InternalModelShape): InternalModel;
    static update(record: InternalModel): InternalModel;
    static delete(record?: InternalModel): InternalModel | InternalModel[];
    static embed(relationship: any): object;
    static serializer(objectOrArray: InternalModel | Array<InternalModel>): ({} & InternalModel) | ({} & InternalModel)[];
    static serialize(object: InternalModel): {} & InternalModel;
    static getRelationship(parentObject: any, relationshipName: string, relationshipModel: InternalModel): any;
}
export {};
