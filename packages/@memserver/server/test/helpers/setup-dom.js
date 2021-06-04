import pkg from 'jsdom';

export default async function() {
  const { JSDOM } = pkg;

  const dom = new JSDOM("<p>Hello</p>", {
    url: "http://localhost",
    runScripts: 'dangerously',
    resources: 'usable',
  });

  global.window = dom.window;
  global.document = window.document;
  global.self = window.self;
  global.location = dom.window.location;
  global.XMLHttpRequest = window.XMLHttpRequest;
  // let instance = new window.XMLHttpRequest();

  // console.log("WITH CRED:");
  // console.log(instance.withCredentials);
}
