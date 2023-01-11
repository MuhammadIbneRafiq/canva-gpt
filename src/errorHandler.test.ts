/* eslint-disable jest/no-conditional-expect */
import { CanvasApiError } from "./utils";
import { server, ROOT_URL } from "./mocks";
import Canvas from "./index";

// Establish API mocking before all tests.
beforeAll(() => server.listen());

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests.
afterEach(() => server.resetHandlers());

// Clean up after the tests are finished.
afterAll(() => server.close());

test("errorHandler converts HTTPError to CanvasApiError", async () => {
  const canvas = new Canvas(ROOT_URL, "");

  try {
    await canvas.get("unauthorized");
  } catch (err) {
    expect(err).toBeInstanceOf(CanvasApiError);
    expect(err).toMatchInlineSnapshot(
      `[CanvasApiError: Response code 401 (Unauthorized)]`
    );
  }
});
