import dotenv from 'dotenv';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

// Canvas API token from .env
const CANVAS_API_TOKEN = process.env.CANVAS_API_TOKEN;
const CANVAS_API_URL = process.env.CANVAS_API_URL || 'https://canvas.tue.nl';

// Supabase credentials
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Test Canvas API endpoints
async function testCanvasAPI() {
  console.log('Testing Canvas API endpoints...');
  console.log('Canvas API URL:', CANVAS_API_URL);
  console.log('Canvas API Token:', CANVAS_API_TOKEN ? 'Token exists' : 'Token missing');

  try {
    // Test getting courses
    console.log('\n1. Testing getUserCourses endpoint...');
    const coursesResponse = await axios.get(`${CANVAS_API_URL}/api/v1/courses`, {
      headers: {
        'Authorization': `Bearer ${CANVAS_API_TOKEN}`
      },
      params: {
        per_page: 10
      }
    });
    
    console.log(`Success! Found ${coursesResponse.data.length} courses.`);
    
    if (coursesResponse.data.length > 0) {
      const courseId = coursesResponse.data[0].id;
      console.log(`Using course ID: ${courseId} for further tests.`);
      
      // Test getting assignments for a course
      console.log('\n2. Testing getCourseAssignments endpoint...');
      const assignmentsResponse = await axios.get(`${CANVAS_API_URL}/api/v1/courses/${courseId}/assignments`, {
        headers: {
          'Authorization': `Bearer ${CANVAS_API_TOKEN}`
        },
        params: {
          per_page: 10
        }
      });
      
      console.log(`Success! Found ${assignmentsResponse.data.length} assignments.`);
      
      if (assignmentsResponse.data.length > 0) {
        const assignmentId = assignmentsResponse.data[0].id;
        console.log(`Using assignment ID: ${assignmentId} for further tests.`);
        
        // Test getting assignment details
        console.log('\n3. Testing getAssignmentDetails endpoint...');
        const assignmentResponse = await axios.get(`${CANVAS_API_URL}/api/v1/courses/${courseId}/assignments/${assignmentId}`, {
          headers: {
            'Authorization': `Bearer ${CANVAS_API_TOKEN}`
          }
        });
        
        console.log('Success! Assignment details retrieved:');
        console.log(`- Name: ${assignmentResponse.data.name}`);
        console.log(`- Due Date: ${assignmentResponse.data.due_at}`);
        console.log(`- Points: ${assignmentResponse.data.points_possible}`);
      }
    }
  } catch (error) {
    console.error('Error testing Canvas API:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
    console.error('Headers:', error.response?.headers);
  }
}

// Test Supabase connection
async function testSupabaseConnection() {
  console.log('\nTesting Supabase connection...');
  console.log('Supabase URL:', supabaseUrl);
  console.log('Supabase Key:', supabaseKey ? 'Key exists' : 'Key missing');

  try {
    // Check if we can connect to Supabase
    const { data, error } = await supabase.from('conversations').select('count').limit(1);
    
    if (error) {
      throw error;
    }
    
    console.log('Success! Connected to Supabase.');
    
    // Check if required tables exist
    console.log('\nChecking if required tables exist...');
    
    // Check conversations table
    const { data: conversationsData, error: conversationsError } = await supabase
      .from('conversations')
      .select('*')
      .limit(1);
    
    if (conversationsError && conversationsError.code === '42P01') {
      console.log('Conversations table does not exist. You need to create it.');
    } else if (conversationsError) {
      console.error('Error checking conversations table:', conversationsError);
    } else {
      console.log('Conversations table exists.');
    }
    
    // Check canvas_tokens table
    const { data: tokensData, error: tokensError } = await supabase
      .from('canvas_tokens')
      .select('*')
      .limit(1);
    
    if (tokensError && tokensError.code === '42P01') {
      console.log('Canvas_tokens table does not exist. You need to create it.');
    } else if (tokensError) {
      console.error('Error checking canvas_tokens table:', tokensError);
    } else {
      console.log('Canvas_tokens table exists.');
    }
    
    // Check profiles table
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (profilesError && profilesError.code === '42P01') {
      console.log('Profiles table does not exist. You need to create it.');
    } else if (profilesError) {
      console.error('Error checking profiles table:', profilesError);
    } else {
      console.log('Profiles table exists.');
    }
  } catch (error) {
    console.error('Error testing Supabase connection:', error);
  }
}

// Run tests
async function runTests() {
  console.log('=== CANVAS API AND SUPABASE CONNECTION TEST ===\n');
  
  await testCanvasAPI();
  await testSupabaseConnection();
  
  console.log('\n=== TEST COMPLETED ===');
}

runTests(); 