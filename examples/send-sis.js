/* eslint-disable */
require("dotenv").config();
const canvasApiUrl = process.env.CANVAS_API_URL;
const canvasApiToken = process.env.CANVAS_API_TOKEN;
const Canvas = require("../dist/index").default;
const path = require("path");

async function start() {
  console.log("Performing a SIS Import");
  const canvas = new Canvas(canvasApiUrl, canvasApiToken);

  const filePath = path.join(__dirname, "test.csv");

  try {
    const { body } = await canvas.sisImport(filePath);
    console.log(body);
  } catch (err) {
    console.error("Something failed");
    console.error(err.response.statusCode, err.response.body);
  }
}

start();
