import { CanvasApi } from '@kth/canvas-api';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Initialize Canvas API client
 * @param {string} accessToken - Canvas API access token
 * @param {string} canvasUrl - Canvas instance URL
 * @returns {CanvasApi} - Canvas API client
 */
function initCanvasApi(accessToken, canvasUrl = 'https://canvas.tue.nl') {
  // Ensure canvasUrl is properly formatted
  if (!canvasUrl) {
    canvasUrl = 'https://canvas.tue.nl';
  }
  
  // Remove trailing slash if present
  canvasUrl = canvasUrl.replace(/\/$/, '');
  
  // Add /api/v1 if not present
  if (!canvasUrl.endsWith('/api/v1')) {
    canvasUrl = `${canvasUrl}/api/v1`;
  }
  
  console.log(`Initializing Canvas API with URL: ${canvasUrl}`);
  return new CanvasApi(canvasUrl, accessToken);
}

/**
 * Get user's courses
 * @param {string} accessToken - Canvas API access token
 * @param {string} canvasUrl - Canvas instance URL
 * @returns {Promise<Array>} - List of courses
 */
export async function getUserCourses(accessToken, canvasUrl) {
  console.log('Getting user courses...');
  try {
    const canvas = initCanvasApi(accessToken, canvasUrl);
    
    // Make a direct API request instead of using listPages
    const response = await canvas.request('GET', 'courses', {
      params: {
        per_page: 100,
        include: ['term', 'total_students', 'course_image']
      }
    });
    
    // Log the raw response for debugging
    console.log('Raw response:', JSON.stringify(response).substring(0, 200) + '...');
    
    // Extract courses from the response
    let courses = [];
    if (response && response.body) {
      if (Array.isArray(response.body)) {
        courses = response.body;
      } else if (typeof response.body === 'object') {
        courses = [response.body];
      }
    }
    
    // Ensure each course has id and name
    courses = courses.map(course => ({
      id: course.id,
      name: course.name || `Course ${course.id}`,
      course_code: course.course_code,
      term: course.term,
      start_at: course.start_at,
      end_at: course.end_at
    }));
    
    console.log(`Found ${courses.length} courses`);
    return courses;
  } catch (error) {
    console.error('Error getting user courses:', error);
    return [];
  }
}

/**
 * Get course assignments
 * @param {string} accessToken - Canvas API access token
 * @param {string} courseId - Canvas course ID
 * @param {string} canvasUrl - Canvas instance URL
 * @returns {Promise<Array>} - List of assignments
 */
export async function getCourseAssignments(accessToken, courseId, canvasUrl) {
  console.log(`Getting assignments for course ${courseId}...`);
  try {
    const canvas = initCanvasApi(accessToken, canvasUrl);
    const assignments = await canvas.get(`courses/${courseId}/assignments`);
    
    // Ensure we have an array of assignments
    const assignmentsArray = Array.isArray(assignments) ? assignments : 
                            (assignments && assignments.data && Array.isArray(assignments.data)) ? assignments.data : 
                            [];
    
    console.log(`Found ${assignmentsArray.length} assignments for course ${courseId}`);
    return assignmentsArray;
  } catch (error) {
    console.error(`Error getting assignments for course ${courseId}:`, error);
    return [];
  }
}

/**
 * Get assignment details
 * @param {string} accessToken - Canvas API access token
 * @param {string} courseId - Canvas course ID
 * @param {string} assignmentId - Canvas assignment ID
 * @param {string} canvasUrl - Canvas instance URL
 * @returns {Promise<Object>} - Assignment details
 */
export async function getAssignmentDetails(accessToken, courseId, assignmentId, canvasUrl) {
  console.log(`Getting details for assignment ${assignmentId} in course ${courseId}...`);
  try {
    const canvas = initCanvasApi(accessToken, canvasUrl);
    const assignment = await canvas.get(`courses/${courseId}/assignments/${assignmentId}`);
    
    console.log(`Successfully got details for assignment ${assignmentId}`);
    return assignment;
  } catch (error) {
    console.error(`Error getting details for assignment ${assignmentId}:`, error);
    return null;
  }
}

/**
 * Get course announcements
 * @param {string} accessToken - Canvas API access token
 * @param {string} courseId - Canvas course ID
 * @param {string} canvasUrl - Canvas instance URL
 * @returns {Promise<Array>} - List of announcements
 */
export async function getCourseAnnouncements(accessToken, courseId, canvasUrl) {
  console.log(`Getting announcements for course ${courseId}...`);
  try {
    const canvas = initCanvasApi(accessToken, canvasUrl);
    const announcements = await canvas.get(`courses/${courseId}/discussion_topics`, { only_announcements: true });
    
    // Ensure we have an array of announcements
    const announcementsArray = Array.isArray(announcements) ? announcements : 
                              (announcements && announcements.data && Array.isArray(announcements.data)) ? announcements.data : 
                              [];
    
    console.log(`Found ${announcementsArray.length} announcements for course ${courseId}`);
    return announcementsArray;
  } catch (error) {
    console.error(`Error getting announcements for course ${courseId}:`, error);
    return [];
  }
}

/**
 * Get announcement details
 * @param {string} accessToken - Canvas API access token
 * @param {string} courseId - Canvas course ID
 * @param {string} announcementId - Canvas announcement ID
 * @param {string} canvasUrl - Canvas instance URL
 * @returns {Promise<Object>} - Announcement details
 */
export async function getAnnouncementDetails(accessToken, courseId, announcementId, canvasUrl) {
  console.log(`Getting details for announcement ${announcementId} in course ${courseId}...`);
  try {
    const canvas = initCanvasApi(accessToken, canvasUrl);
    const announcement = await canvas.get(`courses/${courseId}/discussion_topics/${announcementId}`);
    
    console.log(`Successfully got details for announcement ${announcementId}`);
    return announcement;
  } catch (error) {
    console.error(`Error getting details for announcement ${announcementId}:`, error);
    return null;
  }
}

/**
 * Get course modules
 * @param {string} accessToken - Canvas API access token
 * @param {string} courseId - Canvas course ID
 * @param {string} canvasUrl - Canvas instance URL
 * @returns {Promise<Array>} - List of modules
 */
export async function getCourseModules(accessToken, courseId, canvasUrl) {
  console.log(`Getting modules for course ${courseId}...`);
  try {
    const canvas = initCanvasApi(accessToken, canvasUrl);
    const modules = await canvas.get(`courses/${courseId}/modules`);
    
    // Ensure we have an array of modules
    const modulesArray = Array.isArray(modules) ? modules : 
                        (modules && modules.data && Array.isArray(modules.data)) ? modules.data : 
                        [];
    
    console.log(`Found ${modulesArray.length} modules for course ${courseId}`);
    return modulesArray;
  } catch (error) {
    console.error(`Error getting modules for course ${courseId}:`, error);
    return [];
  }
}

/**
 * Get course tabs
 * @param {string} accessToken - Canvas API access token
 * @param {string} courseId - Canvas course ID
 * @param {string} canvasUrl - Canvas instance URL
 * @returns {Promise<Array>} - List of tabs
 */
export async function getCourseTabs(accessToken, courseId, canvasUrl) {
  console.log(`Getting tabs for course ${courseId}...`);
  try {
    const canvas = initCanvasApi(accessToken, canvasUrl);
    const tabs = await canvas.get(`courses/${courseId}/tabs`);
    
    // Ensure we have an array of tabs
    const tabsArray = Array.isArray(tabs) ? tabs : 
                     (tabs && tabs.data && Array.isArray(tabs.data)) ? tabs.data : 
                     [];
    
    console.log(`Found ${tabsArray.length} tabs for course ${courseId}`);
    return tabsArray;
  } catch (error) {
    console.error(`Error getting tabs for course ${courseId}:`, error);
    return [];
  }
}

/**
 * Download assignment PDF
 * @param {string} accessToken - Canvas API access token
 * @param {string} courseId - Canvas course ID
 * @param {string} fileId - Canvas file ID
 * @param {string} canvasUrl - Canvas instance URL
 * @returns {Promise<Buffer>} - File buffer
 */
export async function downloadAssignmentPDF(accessToken, courseId, fileId, canvasUrl) {
  console.log(`Downloading file ${fileId} from course ${courseId}...`);
  try {
    const canvas = initCanvasApi(accessToken, canvasUrl);
    const file = await canvas.get(`courses/${courseId}/files/${fileId}`);
    
    // Get the download URL
    const downloadUrl = file.url;
    
    // Download the file
    const response = await fetch(downloadUrl);
    const buffer = await response.arrayBuffer();
    
    console.log(`Successfully downloaded file ${fileId}`);
    return Buffer.from(buffer);
  } catch (error) {
    console.error(`Error downloading file ${fileId}:`, error);
    return null;
  }
}

export default {
  getUserCourses,
  getCourseAssignments,
  getAssignmentDetails,
  getCourseAnnouncements,
  getAnnouncementDetails,
  getCourseModules,
  getCourseTabs,
  downloadAssignmentPDF
}; 