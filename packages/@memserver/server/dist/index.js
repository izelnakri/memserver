import kleur from "kleur";
import FakeXMLHttpRequest from "fake-xml-http-request";
import TargetModel from "@memserver/model";
import RouteRecognizer from "route-recognizer";
import "pretender"; // NOTE: check this
import "./pretender-hacks"; // NOTE: check this
const DEFAULT_PASSTHROUGHS = [
    "http://localhost:0/chromecheckurl",
    "http://localhost:30820/socket.io",
];
class Memserver {
    constructor(options = { logging: true }) {
        this.Models = {};
        const initializer = options.initializer || async function () { };
        const routes = options.routes || function () { };
        const logging = options.hasOwnProperty("logging") ? options.logging : true;
        window.MemserverModel = window.MemserverModel || TargetModel;
        const initializerReturn = initializer();
        this.Models = window.MemserverModel._modelDefinitions;
        window.MemServer = startPretender(routes, Object.assign(options, { logging }), this.Models);
        window.MemServer.Models = this.Models;
        return window.MemServer;
    }
}
export default Memserver;
function startPretender(routes, options, Models) {
    window.FakeXMLHttpRequest = FakeXMLHttpRequest;
    window.RouteRecognizer = RouteRecognizer;
    window.Pretender.prototype.namespace = options.namespace;
    window.Pretender.prototype.urlPrefix = options.urlPrefix;
    window.Pretender.prototype.timing = options.timing;
    let pretender = new window.Pretender(function () {
        const Memserver = kleur.cyan("[Memserver]");
        this.Models = Models;
        if (options.logging) {
            this.handledRequest = function (verb, path, request) {
                const method = verb.toUpperCase();
                console.log(Memserver, colorStatusCode(request.status), method, request.url);
                if (["POST", "PUT"].includes(method)) {
                    console.log(`${method} REQUEST BODY IS:`, request.params);
                }
                console.log(JSON.parse(request.responseText));
            };
            this.passthroughRequest = function (verb, path, request) {
                console.log(Memserver, kleur.yellow("[PASSTHROUGH]"), verb, request.url);
            };
        }
        this.unhandledRequest = function (verb, path, request) {
            console.log(Memserver, kleur.red("[UNHANDLED REQUEST]"), verb, path);
            console.log(kleur.red("UNHANDLED REQUEST WAS:\n"), request);
            console.log(request);
        };
    }, { trackRequests: false });
    // HACK: Pretender this.passthrough for better UX
    // TODO: this doesnt passthrough full http:// https://
    pretender.passthrough = function (url) {
        const parent = window.Pretender.prototype;
        const verbs = ["get", "post", "put", "delete"];
        if (!url) {
            ["/**", "/", "/*"].forEach((path) => {
                verbs.forEach((verb) => pretender[verb](path, parent.passthrough));
            });
            return;
        }
        const fullUrl = (this.urlPrefix || "") + (this.namespace ? "/" + this.namespace : "") + url;
        verbs.forEach((verb) => pretender[verb](fullUrl, parent.passthrough));
    };
    DEFAULT_PASSTHROUGHS.forEach((url) => pretender.passthrough(url));
    // END: Pretender this.passthrough for better UX
    routes.apply(pretender, []);
    return pretender;
}
function colorStatusCode(statusCode) {
    if (statusCode === 200 || statusCode === 201) {
        return kleur.green(statusCode);
    }
    else if (statusCode === 404 || statusCode === 204) {
        return kleur.cyan(statusCode);
    }
    return kleur.red(statusCode);
}
