require("dotenv").config();
const canvasApiUrl = "https://canvas.tue.nl/api/v1";
const canvasApiToken = process.env.CANVAS_API_TOKEN;

const { CanvasApi } = require("@kth/canvas-api");
const courseId = 28678 // Use the courseId you provided
const canvas = new CanvasApi(canvasApiUrl, canvasApiToken);

async function start() {
    if (!canvasApiUrl || !canvasApiToken) {
      throw new Error("Missing CANVAS_API_URL or CANVAS_API_TOKEN in .env file");
    }
  
    console.log("Using Canvas API URL:", canvasApiUrl);
    
    const canvas = new CanvasApi(canvasApiUrl, canvasApiToken);
  
    try {
    const pages = canvas.listPages("courses");
  
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
  
// start().catch(console.error);


async function getAnnouncementDetails(canvas, courseId, announcementId) {
    try {
      const announcement = await canvas.get(`courses/${courseId}/discussion_topics/${announcementId}`);
      console.log('this is ann', announcement)
      console.log(`\nAnnouncement Details for ID ${announcementId}:`);
      console.log(`Title: ${announcement.text}`);
    //   console.log(`Message: ${announcement.message}`);
    //   console.log(`Posted At: ${announcement.posted_at}`);
    //   console.log(`Author: ${announcement.author.display_name}`);
      // Add more fields as needed
    } catch (error) {
      console.error(`Error fetching announcement details: ${error.message}`);
    }
  }
  
async function getAssignmentDetails(canvas, courseId, assignmentId) {
    try {
      const assignment = await canvas.get(`courses/${courseId}/assignments/${assignmentId}`);
      console.log(`\nAssignment Details for ID ${assignmentId}:`);
      console.log('this is assgnmtn', assignment)
    //   console.log(`Name: ${assignment.name}`);
    //   console.log(`Description: ${assignment.description}`);
    //   console.log(`Due Date: ${assignment.due_at}`);
    //   console.log(`Points Possible: ${assignment.points_possible}`);
      // Add more fields as needed
    } catch (error) {
      console.error(`Error fetching assignment details: ${error.message}`);
    }
  }
  
async function getAssignments(canvas, courseId) {
    try {
      const pages = canvas.listPages(`courses/${courseId}/assignments`);
      
      console.log(`Assignments for course ${courseId}:`);
      for await (const assignmentsResponse of pages) {
        const assignments = assignmentsResponse.body;
        for (const assignment of assignments) {
          console.log(`ID: ${assignment.id}, Name: ${assignment.name}, Due Date: ${assignment.due_at}`);
          await getAssignmentDetails(canvas, courseId, assignment.id);
        }
      }
    } catch (error) {
      console.error("Error fetching assignments:", error.message);
    }
}
  
async function getAnnouncements(canvas, courseId) {
    try {
      const pages = canvas.listPages(`courses/${courseId}/discussion_topics`, { only_announcements: true });
      
      console.log(`Announcements for course ${courseId}:`);
      for await (const announcementsResponse of pages) {
        const announcements = announcementsResponse.body;
        for (const announcement of announcements) {
          console.log(`ID: ${announcement.id}, Title: ${announcement.title}, Posted: ${announcement.posted_at}`);
        //   await getAnnouncementDetails(canvas, courseId, announcement.id);
        }
      }
    } catch (error) {
      console.error("Error fetching announcements:", error.message);
    }
}

// getAnnouncementDetails(canvas, 28932, 267608)
getAssignmentDetails(canvas, 28932, 129126)

// getAssignments(canvas, 28932);
// getAnnouncements(canvas, 28932)


