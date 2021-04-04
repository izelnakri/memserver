import express from 'memserver/express';
import User from "./models/user";

const app = express({ mock: !!process.env.MOCK_SERVER });

app.get("/users", ({ params: OptionalParamInterface, query: QueryParamInterface, headers: CertainHeadersType }, { body, headers, status }) => {
  return res.json({ users: User.serializer(User.findAll()) });
});

export default app;

app.listen(process.env.HTTP_PORT);

// AREAS TO CONSIDER for rewriting express api:
// 1 - noop-ing express-specific middleware or other code(non-blocking)
// 2 - openapi doc generation for express endpoints tests should gen openapi docs? -> best is tests:
  // analyze response types via advanced res.json(interface) parsing
  // tests to generate the example and if req -> then response examples
  // headers? res.append() API/yikes, many methods mutate header, Best is from tests/examples

  // descriptions? Left Link names(CreateUser) etc(from test cases?)
  // lint cli tool to show missing endpoint tests
// 3 - res.json() vs return $model, background jobs res.json() required (non-blocking)


// passthrough(proxy) external link?, namespace, urlPrefix, timing, logging

import { api, endpoint, request, response, body } from "@airtasker/spot";

@api({
  name: "My API"
})
class Api {}

@endpoint({
  method: "POST",
  path: "/users"
})
class CreateUser {
  @request
  request(@body body: CreateUserRequest) {}

  @response({ status: 201 })
  response(@body body: CreateUserResponse) {}
}

interface CreateUserRequest {
  firstName: string;
  lastName: string;
}

interface CreateUserResponse {
  firstName: string;
  lastName: string;
  role: string;
}



// api info name, description

// HTTP TYPE | endpoint string | params, description(md)
// request Types -> response Types header, queryParams, requestBody
// response status codes, response header, response body // description for each type?

import User from "./models/user";
import PhotoComment from './models/photo-comment';

export default function() {
  this.get("/users", ({ params, queryParams, headers }) => {
    return { users: User.serializer(User.findAll()) };
  });

  this.get('/photo-comments', PhotoComment);
}

// GET /users ? where to description
// all parameter parsing
// response returns



