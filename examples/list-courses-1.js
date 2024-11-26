require("dotenv").config();
const canvasApiUrl = process.env.CANVAS_API_URL;
const canvasApiToken = process.env.CANVAS_API_TOKEN;

console.log(canvasApiToken)
console.log(canvasApiUrl)
const Canvas = require("@kth/canvas-api").default;

async function start() {
  if (!canvasApiUrl || !canvasApiToken) {
    throw new Error("Missing CANVAS_API_URL or CANVAS_API_TOKEN in .env file");
  }

  console.log("Using Canvas API URL:", canvasApiUrl);
  
  const canvas = new Canvas(canvasApiUrl, canvasApiToken);

  try {
    const pages = canvas.listPages("accounts/1/courses");

    // Now `pages` is an iterator that goes through every page
    for await (const coursesResponse of pages) {
      // `courses` is the Response object that contains a list of courses
      const courses = coursesResponse.body;

      for (const course of courses) {
        console.log(course.id, course.name);
      }
    }
  } catch (error) {
    if (error.response) {
      console.error("API Error:", error.response.statusCode, error.response.body);
    } else {
      console.error("Error:", error.message);
    }
  }
}

start().catch(console.error);