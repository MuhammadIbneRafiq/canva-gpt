/* eslint-disable import/no-extraneous-dependencies */
import { rest } from "msw";
import { setupServer } from "msw/node";

export const ROOT_URL = "http://example.instructure.com";

export const handlers = [
  rest.get(`${ROOT_URL}/unauthorized`, (req, res, ctx) =>
    res(ctx.status(401), ctx.json({ message: "Unauthorized" }))
  ),

  rest.get(`${ROOT_URL}/index`, (req, res, ctx) =>
    res(ctx.status(200), ctx.json({ foo: "bar" }))
  ),

  rest.get(`${ROOT_URL}/api/v1/courses/1`, (req, res, ctx) =>
    res(ctx.status(200), ctx.json({ foo: "bar" }))
  ),

  rest.get(`${ROOT_URL}/page1`, (req, res, ctx) =>
    res(
      ctx.status(200),
      ctx.set(
        "link",
        `<${ROOT_URL}/page2>; rel="next", <irrelevant>; rel="first"`
      ),
      ctx.json([1, 2, 3])
    )
  ),

  rest.get(`${ROOT_URL}/page2`, (req, res, ctx) =>
    res(ctx.status(200), ctx.json([4, 5]))
  ),

  rest.get(`${ROOT_URL}/page0`, (req, res, ctx) =>
    res(
      ctx.status(200),
      ctx.set(
        "link",
        '<irrelevant>; rel="last", <also_irrelevant>; rel="first"'
      ),
      ctx.json([1])
    )
  ),

  rest.get(`${ROOT_URL}/page1-with-query`, (req, res, ctx) =>
    res(
      ctx.status(200),
      ctx.set(
        "link",
        `<${ROOT_URL}/page2-with-query?query=string>; rel="next"`
      ),
      ctx.json(["skip"])
    )
  ),

  rest.get(`${ROOT_URL}/page2-with-query`, (req, res, ctx) => {
    if (req.url.searchParams.get("query") === "string") {
      return res(ctx.status(200), ctx.json(["correct"]));
    }

    return res(ctx.status(200), ctx.json(["nope"]));
  }),

  rest.post(`${ROOT_URL}/create`, (req, res, ctx) =>
    res(ctx.status(200), ctx.json({ foo: "bar" }))
  ),

  rest.post(`${ROOT_URL}/accounts/1/sis_imports`, (req, res, ctx) =>
    res(ctx.status(200), ctx.json({ key: "value" }))
  ),

  rest.get(`${ROOT_URL}/not-a-list`, (req, res, ctx) =>
    res(ctx.status(200), ctx.json({ msg: "this is not a list" }))
  ),
];

export const server = setupServer(...handlers);
