/* eslint-disable */
require("dotenv").config();
const canvasApiUrl = process.env.CANVAS_API_URL;
const canvasApiToken = process.env.CANVAS_API_TOKEN;
const Canvas = require("../dist/index").default;

async function start() {
  console.log("Making a GET request to /accounts/1");
  const canvas = new Canvas(canvasApiUrl, canvasApiToken);

  const { body } = await canvas.get("accounts/1");
  console.log(body);
}

start();
