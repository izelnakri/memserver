declare global {
    interface Window {
        Pretender: any;
        RouteRecognizer: any;
        FakeXMLHttpRequest: any;
        MemserverModel: any;
        MemServer: any;
    }
}
import "pretender";
import "./pretender-hacks";
interface MemserverOptions {
    logging?: boolean;
    initializer?: () => any | void;
    routes?: () => any | void;
    [propName: string]: any;
}
interface Memserver {
    get: (urlPath: any, any?: any) => any;
    put: (urlPath: any, any?: any) => any;
    delete: (urlPath: any, any?: any) => any;
    post: (urlPath: any, any?: any) => any;
    patch: (urlPath: any, any?: any) => any;
    shutdown: () => any;
}
declare class Memserver {
    Models: {};
    constructor(options?: MemserverOptions);
}
export default Memserver;
