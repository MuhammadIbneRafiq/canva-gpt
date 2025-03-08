import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to make Canvas API requests
async function makeCanvasRequest(endpoint, accessToken, canvasUrl, params = {}) {
  console.log(`Making Canvas API request to: ${endpoint}`);
  try {
    // Ensure canvasUrl is properly formatted
    if (!canvasUrl) {
      canvasUrl = 'https://canvas.tue.nl';
    }
    
    // Remove trailing slash if present
    canvasUrl = canvasUrl.replace(/\/$/, '');
    
    // Remove /api/v1 if it's already in the URL
    canvasUrl = canvasUrl.replace(/\/api\/v1$/, '');
    
    // Log request details for debugging
    console.log('Request URL:', `${canvasUrl}/api/v1${endpoint}`);
    console.log('Access Token:', accessToken ? 'Present' : 'Missing');
    console.log('Params:', params);

    const response = await axios.get(`${canvasUrl}/api/v1${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      },
      params
    });

    // Log response summary
    console.log(`Successfully fetched data from ${endpoint}`);
    console.log('Response status:', response.status);
    console.log('Data count:', Array.isArray(response.data) ? response.data.length : 'Not an array');
    console.log('Response data:', JSON.stringify(response.data).substring(0, 200) + '...');

    return response.data;
  } catch (error) {
    // Enhanced error logging
    console.error(`Error making Canvas request to ${endpoint}:`);
    console.error('Status:', error.response?.status);
    console.error('Error message:', error.response?.data?.message || error.message);
    
    // If we get a 401, the token is invalid
    if (error.response?.status === 401) {
      console.error('Invalid Canvas token or unauthorized access');
    }
    
    // If we get a 404, the endpoint doesn't exist
    if (error.response?.status === 404) {
      console.error('Canvas endpoint not found. Check the URL and endpoint path');
    }
    
    throw error;
  }
}

/**
 * Get user's Canvas courses with detailed information
 */
export async function getUserCourses(accessToken, canvasUrl = 'https://canvas.tue.nl') {
  console.log('Fetching user courses...');
  try {
    // Try with minimal parameters first
    const courses = await makeCanvasRequest('/courses', accessToken, canvasUrl);
    console.log(`Found ${courses.length} courses`);
    
    // If we got courses, return them
    if (courses && courses.length > 0) {
      return courses;
    }
    
    // If no courses were found, try with different parameters
    console.log('No courses found, trying with different parameters...');
    const coursesWithParams = await makeCanvasRequest('/courses', accessToken, canvasUrl, {
      include: ['term'],
      enrollment_state: 'active'
    });
    
    console.log(`Found ${coursesWithParams.length} courses with parameters`);
    return coursesWithParams;
  } catch (error) {
    console.error('Error fetching user courses:', error);
    // Return empty array instead of throwing to prevent cascading failures
    return [];
  }
}

/**
 * Get course assignments with submissions
 */
export async function getCourseAssignments(accessToken, courseId, canvasUrl = 'https://canvas.tue.nl') {
  console.log(`Fetching assignments for course ${courseId}...`);
  try {
    const assignments = await makeCanvasRequest(
      `/courses/${courseId}/assignments`,
      accessToken,
      canvasUrl
    );
    console.log(`Found ${assignments.length} assignments for course ${courseId}`);
    return assignments;
  } catch (error) {
    console.error(`Error fetching assignments for course ${courseId}:`, error);
    return [];
  }
}

/**
 * Get course announcements
 */
export async function getCourseAnnouncements(accessToken, courseId, canvasUrl = 'https://canvas.tue.nl') {
  console.log(`Fetching announcements for course ${courseId}...`);
  try {
    const announcements = await makeCanvasRequest(
      `/courses/${courseId}/discussion_topics`,
      accessToken,
      canvasUrl,
      { only_announcements: true }
    );
    console.log(`Found ${announcements.length} announcements for course ${courseId}`);
    return announcements;
  } catch (error) {
    console.error(`Error fetching announcements for course ${courseId}:`, error);
    return [];
  }
}

/**
 * Get course modules and items
 */
export async function getCourseModules(accessToken, courseId, canvasUrl = 'https://canvas.tue.nl') {
  console.log(`Fetching modules for course ${courseId}...`);
  try {
    const modules = await makeCanvasRequest(
      `/courses/${courseId}/modules`,
      accessToken,
      canvasUrl
    );
    console.log(`Found ${modules.length} modules for course ${courseId}`);
    return modules;
  } catch (error) {
    console.error(`Error fetching modules for course ${courseId}:`, error);
    return [];
  }
}

/**
 * Get assignment details with submissions
 */
export async function getAssignmentDetails(accessToken, courseId, assignmentId, canvasUrl = 'https://canvas.tue.nl') {
  console.log(`Fetching details for assignment ${assignmentId} in course ${courseId}...`);
  try {
    const assignment = await makeCanvasRequest(
      `/courses/${courseId}/assignments/${assignmentId}`,
      accessToken,
      canvasUrl
    );
    console.log(`Successfully fetched details for assignment ${assignmentId}`);
    return assignment;
  } catch (error) {
    console.error(`Error fetching details for assignment ${assignmentId}:`, error);
    return null;
  }
}

/**
 * Store user's Canvas access token
 */
export async function storeCanvasToken(userId, accessToken, canvasUrl = 'https://canvas.tue.nl') {
  console.log(`Storing Canvas token for user ${userId}...`);
  try {
    const { data, error } = await supabase
      .from('canvas_tokens')
      .upsert([
        { 
          user_id: userId, 
          access_token: accessToken,
          canvas_url: canvasUrl,
          created_at: new Date().toISOString()
        }
      ]);

    if (error) {
      console.error('Error storing Canvas token:', error);
      throw error;
    }
    
    console.log(`Successfully stored Canvas token for user ${userId}`);
    return data;
  } catch (error) {
    console.error('Error storing Canvas token:', error);
    throw error;
  }
}

/**
 * Get user's Canvas access token
 */
export async function getCanvasToken(userId) {
  console.log(`Fetching Canvas token for user ${userId}...`);
  try {
    const { data, error } = await supabase
      .from('canvas_tokens')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error getting Canvas token:', error);
      throw error;
    }
    
    console.log(`Successfully fetched Canvas token for user ${userId}`);
    return data;
  } catch (error) {
    console.error('Error getting Canvas token:', error);
    throw error;
  }
}

/**
 * Get all courses using pagination
 */
export async function listAllCourses(accessToken, canvasUrl = 'https://canvas.tue.nl') {
  console.log('Listing all courses with pagination...');
  try {
    let allCourses = [];
    let page = 1;
    let hasMorePages = true;
    
    while (hasMorePages) {
      const courses = await makeCanvasRequest('/courses', accessToken, canvasUrl, {
        include: ['term'],
        enrollment_state: 'active',
        page: page,
        per_page: 50
      });
      
      if (courses && courses.length > 0) {
        allCourses = [...allCourses, ...courses];
        page++;
      } else {
        hasMorePages = false;
      }
    }
    
    console.log(`Found a total of ${allCourses.length} courses`);
    return allCourses;
  } catch (error) {
    console.error('Error listing all courses:', error);
    return [];
  }
}

/**
 * List all announcements across all courses
 */
export async function listAllAnnouncements(accessToken, canvasUrl = 'https://canvas.tue.nl') {
  console.log('Listing all announcements across courses...');
  try {
    const courses = await listAllCourses(accessToken, canvasUrl);
    let allAnnouncements = [];
    
    for (const course of courses) {
      const announcements = await getCourseAnnouncements(accessToken, course.id, canvasUrl);
      if (announcements && announcements.length > 0) {
        // Add course info to each announcement
        const enhancedAnnouncements = announcements.map(announcement => ({
          ...announcement,
          course_name: course.name,
          course_id: course.id
        }));
        allAnnouncements = [...allAnnouncements, ...enhancedAnnouncements];
      }
    }
    
    console.log(`Found a total of ${allAnnouncements.length} announcements across all courses`);
    return allAnnouncements;
  } catch (error) {
    console.error('Error listing all announcements:', error);
    return [];
  }
}

export default {
  getUserCourses,
  getCourseAssignments,
  getCourseAnnouncements,
  getCourseModules,
  getAssignmentDetails,
  storeCanvasToken,
  getCanvasToken,
  listAllCourses,
  listAllAnnouncements
}; 