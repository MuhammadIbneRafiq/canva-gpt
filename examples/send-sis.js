/* eslint-disable */
require("dotenv").config();
const canvasApiUrl = process.env.CANVAS_API_URL;
const canvasApiToken = process.env.CANVAS_API_TOKEN;
const Canvas = require("../dist/index").default;
const path = require("path");
const fs = require("fs");
const os = require("os");
const csv = require("fast-csv");

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "canvas-api-"));

async function start() {
  console.log("Performing a SIS Import");
  const canvas = new Canvas(canvasApiUrl, canvasApiToken);
  const filePath = path.join(tmpDir, "test.csv");

  console.log(filePath);

  const writer = fs.createWriteStream(filePath);
  const serializer = csv.format({ headers: true });

  serializer.pipe(writer);

  for (let i = 0; i < 100; i++) {
    serializer.write({
      user_id: i,
      section_id: i,
      status: "active",
    });
  }

  serializer.end();

  await new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });

  try {
    const { body } = await canvas.sisImport(filePath);
    console.log(body);
  } catch (err) {
    console.error("Something failed");
    console.error(err.response.statusCode, err.response.body);
  }
}

start();
