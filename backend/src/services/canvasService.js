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
    const response = await axios.get(`${canvasUrl}/api/v1${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      params: {
        per_page: 100,
        ...params
      }
    });
    console.log(`Successfully fetched data from ${endpoint}`);
    return response.data;
  } catch (error) {
    console.error(`Error making Canvas request to ${endpoint}:`, error.response?.data || error.message);
    throw error;
  }
}

/**
 * Get user's Canvas courses with detailed information
 */
export async function getUserCourses(accessToken, canvasUrl = 'https://canvas.tue.nl') {
  console.log('Fetching user courses...');
  try {
    const courses = await makeCanvasRequest('/courses', accessToken, canvasUrl, {
      include: ['term', 'total_students', 'course_image', 'syllabus_body'],
      state: ['available']
    });
    console.log(`Found ${courses.length} courses`);
    return courses;
  } catch (error) {
    console.error('Error fetching user courses:', error);
    throw error;
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
      canvasUrl,
      { include: ['submission', 'rubric', 'description'] }
    );
    console.log(`Found ${assignments.length} assignments for course ${courseId}`);
    return assignments;
  } catch (error) {
    console.error(`Error fetching assignments for course ${courseId}:`, error);
    throw error;
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
    throw error;
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
      canvasUrl,
      { include: ['items', 'content_details'] }
    );
    console.log(`Found ${modules.length} modules for course ${courseId}`);
    return modules;
  } catch (error) {
    console.error(`Error fetching modules for course ${courseId}:`, error);
    throw error;
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
      canvasUrl,
      { include: ['submission', 'rubric', 'description'] }
    );
    console.log(`Successfully fetched details for assignment ${assignmentId}`);
    return assignment;
  } catch (error) {
    console.error(`Error fetching details for assignment ${assignmentId}:`, error);
    throw error;
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

export default {
  getUserCourses,
  getCourseAssignments,
  getCourseAnnouncements,
  getCourseModules,
  getAssignmentDetails,
  storeCanvasToken,
  getCanvasToken
}; 