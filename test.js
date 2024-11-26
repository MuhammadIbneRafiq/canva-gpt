const canvasApiUrl = process.env.CANVAS_API_URL;
const canvasApiToken = process.env.CANVAS_API_TOKEN;
const Canvas = require("@kth/canvas-api").default;

async function listCourses() {
    try {
        if (!canvasApiUrl || !canvasApiToken) {
        throw new Error('Missing required environment variables. Please check your .env file.');
        }

        const canvas = new Canvas(canvasApiUrl, canvasApiToken);
        console.log(canvas)
        const pages = canvas.listPages('accounts/1/courses');
        console.log(pages)

        for await (const coursesResponse of pages) {
        const courses = coursesResponse.body;
        for (const course of courses) {
            console.log(course.id, course.name);
        }
        }
    } catch (error) {
        console.error('Error fetching courses:', error.message);
    }
    }

    listCourses();