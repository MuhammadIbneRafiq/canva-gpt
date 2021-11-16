/* eslint-disable */
/* eslint-disable */
require("dotenv").config();
const canvasApiUrl = process.env.CANVAS_API_URL;
const canvasApiToken = process.env.CANVAS_API_TOKEN;
const Canvas = require("../dist/index").default;
const { CanvasApiError } = require("../dist/index");

async function start() {
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
}

start();
