import dotenv from 'dotenv';
import readline from 'readline';
import canvasService from './services/canvasService.js';

dotenv.config();

// Create readline interface for CLI interaction
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Get Canvas API token from environment variables
const accessToken = process.env.CANVAS_API_TOKEN;
const canvasUrl = process.env.CANVAS_URL || 'https://canvas.tue.nl';

if (!accessToken) {
  console.error('Error: CANVAS_API_TOKEN is not set in .env file');
  process.exit(1);
}

// Main menu options
const showMenu = () => {
  console.log('\n===== Canvas API Test Bot =====');
  console.log('1. List all courses');
  console.log('2. List all announcements');
  console.log('3. Get course assignments');
  console.log('4. Get course modules');
  console.log('5. Get assignment details');
  console.log('0. Exit');
  rl.question('\nEnter your choice: ', handleMenuChoice);
};

// Handle menu selection
const handleMenuChoice = async (choice) => {
  try {
    switch (choice) {
      case '1':
        await listCourses();
        break;
      case '2':
        await listAnnouncements();
        break;
      case '3':
        await getCourseAssignments();
        break;
      case '4':
        await getCourseModules();
        break;
      case '5':
        await getAssignmentDetails();
        break;
      case '0':
        console.log('Exiting...');
        rl.close();
        return;
      default:
        console.log('Invalid choice. Please try again.');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  // Return to menu after operation completes
  showMenu();
};

// List all courses
const listCourses = async () => {
  console.log('\nFetching all courses...');
  const courses = await canvasService.listAllCourses(accessToken, canvasUrl);
  
  if (courses.length === 0) {
    console.log('No courses found.');
    return;
  }
  
  console.log('\n===== Your Courses =====');
  courses.forEach((course, index) => {
    console.log(`${index + 1}. [ID: ${course.id}] ${course.name}`);
  });
};

// List all announcements
const listAnnouncements = async () => {
  console.log('\nFetching all announcements (this may take a while)...');
  const announcements = await canvasService.listAllAnnouncements(accessToken, canvasUrl);
  
  if (announcements.length === 0) {
    console.log('No announcements found.');
    return;
  }
  
  console.log('\n===== Recent Announcements =====');
  // Sort by posted date (newest first) and show the 10 most recent
  announcements
    .sort((a, b) => new Date(b.posted_at) - new Date(a.posted_at))
    .slice(0, 10)
    .forEach((announcement, index) => {
      console.log(`${index + 1}. [${announcement.course_name}]`);
      console.log(`   Title: ${announcement.title}`);
      console.log(`   Posted: ${new Date(announcement.posted_at).toLocaleString()}`);
      console.log(`   ID: ${announcement.id}`);
      console.log('---');
    });
};

// Get assignments for a specific course
const getCourseAssignments = async () => {
  rl.question('\nEnter course ID: ', async (courseId) => {
    console.log(`\nFetching assignments for course ${courseId}...`);
    const assignments = await canvasService.getCourseAssignments(accessToken, courseId, canvasUrl);
    
    if (assignments.length === 0) {
      console.log('No assignments found for this course.');
      showMenu();
      return;
    }
    
    console.log('\n===== Course Assignments =====');
    assignments.forEach((assignment, index) => {
      console.log(`${index + 1}. [ID: ${assignment.id}] ${assignment.name}`);
      console.log(`   Due: ${assignment.due_at ? new Date(assignment.due_at).toLocaleString() : 'No due date'}`);
      console.log(`   Points: ${assignment.points_possible}`);
      console.log('---');
    });
    
    showMenu();
  });
};

// Get modules for a specific course
const getCourseModules = async () => {
  rl.question('\nEnter course ID: ', async (courseId) => {
    console.log(`\nFetching modules for course ${courseId}...`);
    const modules = await canvasService.getCourseModules(accessToken, courseId, canvasUrl);
    
    if (modules.length === 0) {
      console.log('No modules found for this course.');
      showMenu();
      return;
    }
    
    console.log('\n===== Course Modules =====');
    modules.forEach((module, index) => {
      console.log(`${index + 1}. [ID: ${module.id}] ${module.name}`);
      console.log(`   Status: ${module.state}`);
      console.log('---');
    });
    
    showMenu();
  });
};

// Get details for a specific assignment
const getAssignmentDetails = async () => {
  rl.question('\nEnter course ID: ', (courseId) => {
    rl.question('Enter assignment ID: ', async (assignmentId) => {
      console.log(`\nFetching details for assignment ${assignmentId} in course ${courseId}...`);
      const assignment = await canvasService.getAssignmentDetails(accessToken, courseId, assignmentId, canvasUrl);
      
      if (!assignment) {
        console.log('Assignment not found or error occurred.');
        showMenu();
        return;
      }
      
      console.log('\n===== Assignment Details =====');
      console.log(`Name: ${assignment.name}`);
      console.log(`Description: ${assignment.description ? assignment.description.substring(0, 200) + '...' : 'No description'}`);
      console.log(`Due Date: ${assignment.due_at ? new Date(assignment.due_at).toLocaleString() : 'No due date'}`);
      console.log(`Points: ${assignment.points_possible}`);
      console.log(`Submission Types: ${assignment.submission_types.join(', ')}`);
      
      showMenu();
    });
  });
};

// Start the bot
console.log('Starting Canvas API Test Bot...');
showMenu(); 