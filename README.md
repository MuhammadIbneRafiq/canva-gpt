# Canvas API (for TypeScript and JavaScript)

```shell
npm i @kth/canvas-api
```

Node.JS HTTP client (for both TypeScript and JavaScript) based on [got](https://github.com/sindresorhus/got) for the [Canvas LMS API](https://canvas.instructure.com/doc/api/)

## Getting Started

First, generate a token by going to `«YOUR CANVAS INSTANCE»/profile/settings`. For example https://canvas.kth.se/profile/settings. Then you can do something like:

```js
const canvasApiUrl = process.env.CANVAS_API_URL;
const canvasApiToken = process.env.CANVAS_API_TOKEN;
const Canvas = require("@kth/canvas-api").default;

async function start() {
  console.log("Making a GET request to /accounts/1");
  const canvas = new Canvas(canvasApiUrl, canvasApiToken);

  const { body } = await canvas.get("accounts/1");
  console.log(body);
}

start();
```

In TypeScript, use `import`:

```ts
import Canvas from "@kth/canvas-api";

console.log("Making a GET request to /accounts/1");
const canvas = new Canvas(canvasApiUrl, canvasApiToken);

const { body } = await canvas.get("accounts/1");
console.log(body);
```

## Concepts

### 🆕 New from v4. SIS Imports

This package implements one function to perform SIS Imports (i.e. call the [POST sis_imports] endpoint).

> Note: this is the only function that calls a **specific** endpoint. For other endpoints you should use `canvas.get`, `canvas.requestUrl`, `canvas.listItems` and `canvas.listPages`

[post sis_imports]: https://canvas.instructure.com/doc/api/sis_imports.html#method.sis_imports_api.create

### `listItems` and `listPages`

This package does have pagination support which is offered in two methods: `listItems` and `listPages`. Let's see an example by using the `[GET /accounts/1/courses]` endpoint.

If you want to get all **pages** you can use `listPages`:

```js
const canvas = new Canvas(canvasApiUrl, canvasApiToken);

const pages = canvas.listPages("accounts/1/courses");

// Now `pages` is an iterator that goes through every page
for await (const coursesResponse of pages) {
  // `courses` is the Response object that contains a list of courses
  const courses = coursesResponse.body;

  for (const course of courses) {
    console.log(course.id, course.name);
  }
}
```

To avoid writing two `for` loops like above, you can call `listItems`, that iterates elements instead of pages. The following code does exactly the same as before. Note that in this case, you will not have the `Response` object:

```js
const canvas = new Canvas(canvasApiUrl, canvasApiToken);

const courses = canvas.listItems("accounts/1/courses");

// Now `courses` is an iterator that goes through every course
for await (const course of courses) {
  console.log(course.id, course.name);
}
```

[get /accounts/1/courses]: https://canvas.instructure.com/doc/api/accounts.html#method.accounts.courses_api

### Typescript support

This package does not contain type definitions to the objects returned by Canvas. If you want such types, you must define them yourself and pass it as type parameter to the methods in this library.

For example, to get typed "account" objects:

```ts
// First you define the "Account" type (or interface)
// following the Canvas API docs: https://canvas.instructure.com/doc/api/accounts.html
interface CanvasAccount {
  id: number;
  name: string;
  workflow_state: string;
}

// Then, you can call our methods by passing your custom type as type parameter
const { body } = await canvas.get<CanvasAccount>("accounts/1");

console.log(body);
```

### Error handling

By default, this library throws `CanvasApiError` exceptions when it gets a non-200 HTTP response from the Canvas API. You can catch those exceptions with any of the methods:

```ts
const canvas = new Canvas(canvasApiUrl, "-------");
const pages = canvas.listPages("accounts/1/courses");

// Now `pages` is an iterator that goes through every page
try {
  for await (const coursesResponse of pages) {
    // `courses` is the Response object that contains a list of courses
    const courses = coursesResponse.body;

    for (const course of courses) {
      console.log(course.id, course.name);
    }
  }
} catch (err) {
  if (err instanceof CanvasApiError) {
    console.log(err.options.url);
    console.log(err.response.statusCode);
    console.log(err.message);
  }
}
```

## Design philosophy

1. **Do not implement every endpoint**. This package does **not** implement every endpoint in Canvas API This package also does not implement type definitions for objects returned by any endpoint nor definition for parameters. That would make it unmaintainable.

2. **Offer "lower-level" API** instead of trying to implement every possible feature, expose the "internals" to make it easy to extend.

   Example: you can use `.client` to get the `Got` instance that is used internally. With such object, you have access to all options given by the library [got](https://github.com/sindresorhus/got)
