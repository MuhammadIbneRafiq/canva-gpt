import { expect, test } from "@jest/globals";
import fs from "fs";
import tempy from "tempy";
import Canvas from "./index";
import { server, ROOT_URL } from "./mocks";

// Establish API mocking before all tests.
beforeAll(() => server.listen());

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests.
afterEach(() => server.resetHandlers());

// Clean up after the tests are finished.
afterAll(() => server.close());

test("Token is correctly stripped", async () => {
  const canvas = new Canvas(
    "https://kth.test.instructure.com/api/v1",
    "My token"
  );

  try {
    await canvas.get("/accounts");
  } catch (err) {
    const error = JSON.stringify(err);
    expect(error).not.toMatch(/My token/);
  }
});

test("Cannot use constructor with wrong URLs", async () => {
  try {
    // eslint-disable-next-line no-new
    new Canvas("kth.test.instructure.com/api/v1", "My token");
  } catch (err) {
    expect(err).toMatchInlineSnapshot(
      `[TypeError: You need to pass a valid \`apiUrl\`. You have passed: "kth.test.instructure.com/api/v1"]`
    );
  }
});

test('URLs are correctly "resolved"', async () => {
  /** Define the type of the response */
  interface Course {
    foo: string;
  }

  {
    const canvas = new Canvas(ROOT_URL, "");
    const result = await canvas.get<Course>("index");
    expect(result.body.foo).toBe("bar");
  }
  {
    const canvas = new Canvas(ROOT_URL + "/", "");
    const result = await canvas.get<Course>("index");
    expect(result.body.foo).toBe("bar");
  }
  {
    const canvas = new Canvas(`${ROOT_URL}/api/v1`, "");
    const result = await canvas.get<Course>("courses/1");
    expect(result.body.foo).toBe("bar");
  }
});

test("listItems returns a correct iterable", async () => {
  const canvas = new Canvas(ROOT_URL ?? "", "");
  const result: number[] = [];

  for await (const e of canvas.listItems<number>("page1")) {
    result.push(e);
  }

  expect(result).toEqual([1, 2, 3, 4, 5]);
});

test("listItems returns an Augmented iterable", async () => {
  const canvas = new Canvas(ROOT_URL ?? "", "");
  const result = await canvas.listItems("page1").toArray();

  expect(result).toEqual([1, 2, 3, 4, 5]);
});

test('listItems ignores non-"rel=next" link headers', async () => {
  const canvas = new Canvas(ROOT_URL ?? "", "");
  const result: unknown[] = [];

  for await (const e of canvas.listItems("page0")) {
    result.push(e);
  }
  expect(result).toEqual([1]);
});

test("listItems can handle pagination urls with query strings", async () => {
  const canvas = new Canvas(ROOT_URL ?? "", "");

  const it = canvas.listItems("page1-with-query?with=query_string");
  await it.next();
  const result = await it.next();
  expect(result.value).toBe("correct");
});

test("requestUrl parses the `body` as JSON automatically", async () => {
  const canvas = new Canvas(ROOT_URL ?? "", "");

  const { body } = await canvas.request("create", "POST", { foo: "bar" });
  expect(body).toEqual({ foo: "bar" });
});

test("sisImport fails when file is missing", async () => {
  const canvas = new Canvas(ROOT_URL, "Token");

  try {
    await canvas.sisImport("non-existing-file");
  } catch (err) {
    expect(err).toMatchInlineSnapshot(
      `[Error: ENOENT: no such file or directory, access 'non-existing-file']`
    );
  }
});

test("sisImport returns a parsed JSON object upon success", async () => {
  const canvas = new Canvas(ROOT_URL ?? "", "");
  const tmp = tempy.file();
  fs.writeFileSync(tmp, "hello world");
  const response = await canvas.sisImport(tmp);
  expect(response.body).toEqual({ key: "value" });
});

test("sisImport throws an error if timeout is over", async () => {
  const canvas = new Canvas(ROOT_URL ?? "", "", { timeout: 1 });
  const tmp = tempy.file();
  fs.writeFileSync(tmp, "hello world");

  try {
    await canvas.sisImport(tmp);
  } catch (err) {
    expect(err).toMatchInlineSnapshot(
      `[TimeoutError: Timeout awaiting 'request' for 1ms]`
    );
  }
});

test("listItems() throws an error if the endpoint response is not an array", async () => {
  const canvas = new Canvas(ROOT_URL ?? "", "");
  const it = canvas.listItems("not-a-list");

  await expect(() => it.next()).rejects.toThrowErrorMatchingInlineSnapshot(
    `"The function \\".listItems()\\" should be used with endpoints that return arrays. Use \\"get()\\" or \\"listPages\\" instead with the endpoint [not-a-list]."`
  );
});
