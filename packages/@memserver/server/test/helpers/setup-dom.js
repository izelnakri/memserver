import FakeXMLHttpRequest from "fake-xml-http-request";
import RouteRecognizer from "route-recognizer";
import pkg from 'jsdom';

export default async function() {
  const { JSDOM } = pkg;
  const dom = new JSDOM("<p>Hello</p>", {
    url: "http://localhost"
  });

  global.window = dom.window;
  global.document = window.document;
  global.self = global; // NOTE: super important for pretender
  self.FakeXMLHttpRequest = FakeXMLHttpRequest; // pretender reference
  self.XMLHttpRequest = dom.window.XMLHttpRequest; // pretender reference
  self.RouteRecognizer = RouteRecognizer; // pretender reference
  global.location = global.window.location; // removes href of undefined on jquery
}
