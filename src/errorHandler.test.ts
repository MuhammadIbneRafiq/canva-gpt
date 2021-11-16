import createTestServer from "create-test-server";
import Canvas from "./index";
import { CanvasApiError } from "./utils";

test("errorHandler converts HTTPError to CanvasApiError", async () => {
  const server = await createTestServer();

  server.get("/something", (req, res) => {
    res.status(401).send({ message: "Unauthorized" });
  });

  const canvas = new Canvas(server.url ?? "", "");
  try {
    await canvas.get("something");
  } catch (err) {
    expect(err).toBeInstanceOf(CanvasApiError);
    expect(err).toMatchInlineSnapshot(
      `[CanvasApiError: Response code 401 (Unauthorized)]`
    );
  }

  await server.close();
});
