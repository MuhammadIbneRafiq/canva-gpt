import dotenv from 'dotenv';
import { Groq } from 'groq-sdk';
import canvasService from './canvasService.js';

// Load environment variables
dotenv.config();

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

/**
 * Canvas Agent
 * This class handles Canvas API requests in a direct way
 */
class CanvasAgent {
  /**
   * Process a chat message related to Canvas
   * @param {Array} chatHistory - Chat history
   * @returns {Promise<Object>} - Response object
   */
  async processChat(chatHistory) {
    console.log('\n========== PROCESSING CANVAS CHAT ==========');
    try {
      const userMessage = chatHistory[chatHistory.length - 1].content;
      console.log('User message:', userMessage);
      
      // Extract Canvas token
      const token = this._extractCanvasToken(userMessage);
      
      if (!token) {
        console.log('No Canvas token found in message');
        return {
          content: "I need your Canvas API token to access your Canvas data. Please provide it in your message. For example: 'My Canvas token is 1234~abcdefg'",
          is_final: true,
          search_needed: false
        };
      }
      
      console.log('Canvas token found:', token.substring(0, 8) + '...');
      
      // Determine what the user is asking for
      const intent = await this._determineIntent(userMessage);
      console.log('Determined intent:', intent);
      
      // Execute the appropriate Canvas API call based on the intent
      let data = {};
      let responseText = '';
      
      switch (intent.action) {
        case 'list_courses':
          data = await this._listCourses(token);
          responseText = this._formatCoursesResponse(data, intent);
          break;
          
        case 'list_announcements':
          if (intent.courseId) {
            data = await this._getCourseAnnouncements(token, intent.courseId);
            responseText = this._formatAnnouncementsResponse(data, intent);
          } else if (intent.courseName) {
            data = await this._getAnnouncementsByCourseName(token, intent.courseName);
            responseText = this._formatAnnouncementsResponse(data, intent);
          } else {
            data = await this._getAllAnnouncements(token);
            responseText = this._formatAnnouncementsResponse(data, intent);
          }
          break;
          
        case 'list_assignments':
          if (intent.courseId) {
            data = await this._getCourseAssignments(token, intent.courseId);
            responseText = this._formatAssignmentsResponse(data, intent);
          } else if (intent.courseName) {
            data = await this._getAssignmentsByCourseName(token, intent.courseName);
            responseText = this._formatAssignmentsResponse(data, intent);
          } else {
            data = await this._getAllAssignments(token);
            responseText = this._formatAssignmentsResponse(data, intent);
          }
          break;
          
        case 'get_modules':
          if (intent.courseId) {
            data = await this._getCourseModules(token, intent.courseId);
            responseText = this._formatModulesResponse(data, intent);
          } else if (intent.courseName) {
            data = await this._getModulesByCourseName(token, intent.courseName);
            responseText = this._formatModulesResponse(data, intent);
          }
          break;
          
        default:
          // Default to listing courses
          data = await this._listCourses(token);
          responseText = this._formatCoursesResponse(data, intent);
          break;
      }
      
      // Generate a conversational response
      const response = await this._generateConversationalResponse(userMessage, responseText);
      
      return {
        content: response,
        is_final: true,
        search_needed: false
      };
    } catch (error) {
      console.error('Error in processChat:', error);
      return {
        content: `I encountered an error while processing your request: ${error.message}. Please try again.`,
        is_final: true,
        search_needed: false
      };
    }
  }
  
  /**
   * Extract Canvas token from user message
   * @param {string} message - User message
   * @returns {string|null} - Canvas token or null if not found
   */
  _extractCanvasToken(message) {
    // Look for patterns like "token = XYZ" or "token: XYZ" or "token XYZ"
    const tokenPatterns = [
      /token\s*=\s*([a-zA-Z0-9~_-]+)/i,
      /token\s*:\s*([a-zA-Z0-9~_-]+)/i,
      /token\s+([a-zA-Z0-9~_-]+)/i,
      /canvas\s+token\s*=\s*([a-zA-Z0-9~_-]+)/i,
      /canvas\s+token\s*:\s*([a-zA-Z0-9~_-]+)/i,
      /canvas\s+token\s+([a-zA-Z0-9~_-]+)/i,
      /access\s+token\s*=\s*([a-zA-Z0-9~_-]+)/i,
      /access\s+token\s*:\s*([a-zA-Z0-9~_-]+)/i,
      /access\s+token\s+([a-zA-Z0-9~_-]+)/i,
      /accessToken\s*=\s*([a-zA-Z0-9~_-]+)/i,
      /accessToken\s*:\s*([a-zA-Z0-9~_-]+)/i,
      /accessToken\s+([a-zA-Z0-9~_-]+)/i,
      /here\s+is\s+my\s+accessToken\s*:?\s*([a-zA-Z0-9~_-]+)/i,
      /([0-9]+~[a-zA-Z0-9_-]{20,})/i  // Pattern like "7542~kDzezt6ZV7xnTcXHZWr4QWtGWE8AQ27LZQYxBAaMrAhBRMU7ZHHNNE9vwPuHYUUZ"
    ];

    for (const pattern of tokenPatterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }
  
  /**
   * Determine the user's intent
   * @param {string} message - User message
   * @returns {Promise<Object>} - Intent object
   */
  async _determineIntent(message) {
    try {
      // Use a simple rule-based approach first
      const lowerMessage = message.toLowerCase();
      
      // Extract course name or ID if mentioned
      let courseId = null;
      let courseName = null;
      
      // Check for course ID
      const courseIdMatch = message.match(/course\s+id\s*:?\s*(\d+)/i) || 
                           message.match(/course\s+(\d+)/i) ||
                           message.match(/id\s*:?\s*(\d+)/i);
      
      if (courseIdMatch && courseIdMatch[1]) {
        courseId = courseIdMatch[1];
      }
      
      // Check for course name
      const courseNameMatch = message.match(/from\s+(?:my\s+)?([a-zA-Z0-9\s]+)(?:\s+class|\s+course)?/i) ||
                             message.match(/in\s+(?:my\s+)?([a-zA-Z0-9\s]+)(?:\s+class|\s+course)?/i) ||
                             message.match(/for\s+(?:my\s+)?([a-zA-Z0-9\s]+)(?:\s+class|\s+course)?/i);
      
      if (courseNameMatch && courseNameMatch[1]) {
        courseName = courseNameMatch[1].trim();
      }
      
      // Determine the action based on keywords
      if (lowerMessage.includes('announcement') || 
          lowerMessage.includes('news') || 
          lowerMessage.includes('update')) {
        return {
          action: 'list_announcements',
          courseId,
          courseName
        };
      } else if (lowerMessage.includes('assignment') || 
                lowerMessage.includes('homework') || 
                lowerMessage.includes('due') ||
                lowerMessage.includes('task')) {
        return {
          action: 'list_assignments',
          courseId,
          courseName
        };
      } else if (lowerMessage.includes('module') || 
                lowerMessage.includes('content') || 
                lowerMessage.includes('material')) {
        return {
          action: 'get_modules',
          courseId,
          courseName
        };
      } else if (lowerMessage.includes('course') || 
                lowerMessage.includes('class') || 
                lowerMessage.includes('list all') ||
                lowerMessage.includes('show me') ||
                lowerMessage.includes('get all')) {
        return {
          action: 'list_courses'
        };
      }
      
      // If we can't determine the intent, use the LLM
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are an expert Canvas LMS query analyzer. Your task is to analyze the user's message and determine what type of Canvas data they are requesting.
            
            Possible actions:
            - list_courses: User wants to see their courses
            - list_announcements: User wants to see announcements
            - list_assignments: User wants to see assignments
            - get_modules: User wants to see modules
            
            Return a JSON object with the following structure:
            {
              "action": "list_courses" | "list_announcements" | "list_assignments" | "get_modules",
              "courseId": "course ID if mentioned, null if not",
              "courseName": "course name if mentioned, null if not"
            }`
          },
          {
            role: "user",
            content: message
          }
        ],
        model: "llama3-70b-8192",
        temperature: 0,
        response_format: { type: "json_object" }
      });
      
      const result = JSON.parse(completion.choices[0].message.content);
      return result;
    } catch (error) {
      console.error('Error determining intent:', error);
      // Default to listing courses if we can't determine the intent
      return {
        action: 'list_courses'
      };
    }
  }
  
  /**
   * List all courses
   * @param {string} token - Canvas API token
   * @returns {Promise<Array>} - List of courses
   */
  async _listCourses(token) {
    try {
      const courses = await canvasService.listAllCourses(token);
      console.log(`Retrieved ${courses.length} courses`);
      return courses;
    } catch (error) {
      console.error('Error listing courses:', error);
      throw error;
    }
  }
  
  /**
   * Get announcements for a specific course
   * @param {string} token - Canvas API token
   * @param {string} courseId - Course ID
   * @returns {Promise<Array>} - List of announcements
   */
  async _getCourseAnnouncements(token, courseId) {
    try {
      const announcements = await canvasService.getCourseAnnouncements(token, courseId);
      console.log(`Retrieved ${announcements.length} announcements for course ${courseId}`);
      
      // Get course details to add course name
      try {
        const courses = await canvasService.listAllCourses(token);
        const course = courses.find(c => c.id.toString() === courseId.toString());
        
        if (course) {
          return announcements.map(a => ({
            ...a,
            course_name: course.name,
            course_id: course.id
          }));
        }
      } catch (error) {
        console.error('Error getting course details:', error);
      }
      
      return announcements;
    } catch (error) {
      console.error(`Error getting announcements for course ${courseId}:`, error);
      throw error;
    }
  }
  
  /**
   * Get announcements by course name
   * @param {string} token - Canvas API token
   * @param {string} courseName - Course name
   * @returns {Promise<Array>} - List of announcements
   */
  async _getAnnouncementsByCourseName(token, courseName) {
    try {
      // Get all courses first
      const courses = await canvasService.listAllCourses(token);
      console.log(`Retrieved ${courses.length} courses`);
      
      // Find the course by name
      const course = this._findCourseByName(courses, courseName);
      
      if (!course) {
        throw new Error(`Course "${courseName}" not found`);
      }
      
      console.log(`Found course: ${course.name} (ID: ${course.id})`);
      
      // Get announcements for the course
      const announcements = await canvasService.getCourseAnnouncements(token, course.id);
      console.log(`Retrieved ${announcements.length} announcements for course ${course.name}`);
      
      return announcements.map(a => ({
        ...a,
        course_name: course.name,
        course_id: course.id
      }));
    } catch (error) {
      console.error(`Error getting announcements for course ${courseName}:`, error);
      throw error;
    }
  }
  
  /**
   * Get all announcements across all courses
   * @param {string} token - Canvas API token
   * @returns {Promise<Array>} - List of announcements
   */
  async _getAllAnnouncements(token) {
    try {
      const announcements = await canvasService.listAllAnnouncements(token);
      console.log(`Retrieved ${announcements.length} announcements across all courses`);
      return announcements;
    } catch (error) {
      console.error('Error getting all announcements:', error);
      throw error;
    }
  }
  
  /**
   * Get assignments for a specific course
   * @param {string} token - Canvas API token
   * @param {string} courseId - Course ID
   * @returns {Promise<Array>} - List of assignments
   */
  async _getCourseAssignments(token, courseId) {
    try {
      const assignments = await canvasService.getCourseAssignments(token, courseId);
      console.log(`Retrieved ${assignments.length} assignments for course ${courseId}`);
      
      // Get course details to add course name
      try {
        const courses = await canvasService.listAllCourses(token);
        const course = courses.find(c => c.id.toString() === courseId.toString());
        
        if (course) {
          return assignments.map(a => ({
            ...a,
            course_name: course.name,
            course_id: course.id
          }));
        }
      } catch (error) {
        console.error('Error getting course details:', error);
      }
      
      return assignments;
    } catch (error) {
      console.error(`Error getting assignments for course ${courseId}:`, error);
      throw error;
    }
  }
  
  /**
   * Get assignments by course name
   * @param {string} token - Canvas API token
   * @param {string} courseName - Course name
   * @returns {Promise<Array>} - List of assignments
   */
  async _getAssignmentsByCourseName(token, courseName) {
    try {
      // Get all courses first
      const courses = await canvasService.listAllCourses(token);
      console.log(`Retrieved ${courses.length} courses`);
      
      // Find the course by name
      const course = this._findCourseByName(courses, courseName);
      
      if (!course) {
        throw new Error(`Course "${courseName}" not found`);
      }
      
      console.log(`Found course: ${course.name} (ID: ${course.id})`);
      
      // Get assignments for the course
      const assignments = await canvasService.getCourseAssignments(token, course.id);
      console.log(`Retrieved ${assignments.length} assignments for course ${course.name}`);
      
      return assignments.map(a => ({
        ...a,
        course_name: course.name,
        course_id: course.id
      }));
    } catch (error) {
      console.error(`Error getting assignments for course ${courseName}:`, error);
      throw error;
    }
  }
  
  /**
   * Get all assignments across all courses
   * @param {string} token - Canvas API token
   * @returns {Promise<Array>} - List of assignments
   */
  async _getAllAssignments(token) {
    try {
      // Get all courses first
      const courses = await canvasService.listAllCourses(token);
      console.log(`Retrieved ${courses.length} courses`);
      
      // Get assignments for each course
      let allAssignments = [];
      
      for (const course of courses) {
        try {
          const assignments = await canvasService.getCourseAssignments(token, course.id);
          
          // Add course name to each assignment
          const assignmentsWithCourse = assignments.map(a => ({
            ...a,
            course_name: course.name,
            course_id: course.id
          }));
          
          allAssignments = [...allAssignments, ...assignmentsWithCourse];
        } catch (error) {
          console.error(`Error getting assignments for course ${course.name}:`, error);
        }
      }
      
      console.log(`Retrieved ${allAssignments.length} assignments across all courses`);
      return allAssignments;
    } catch (error) {
      console.error('Error getting all assignments:', error);
      throw error;
    }
  }
  
  /**
   * Get modules for a specific course
   * @param {string} token - Canvas API token
   * @param {string} courseId - Course ID
   * @returns {Promise<Array>} - List of modules
   */
  async _getCourseModules(token, courseId) {
    try {
      const modules = await canvasService.getCourseModules(token, courseId);
      console.log(`Retrieved ${modules.length} modules for course ${courseId}`);
      
      // Get course details to add course name
      try {
        const courses = await canvasService.listAllCourses(token);
        const course = courses.find(c => c.id.toString() === courseId.toString());
        
        if (course) {
          return modules.map(m => ({
            ...m,
            course_name: course.name,
            course_id: course.id
          }));
        }
      } catch (error) {
        console.error('Error getting course details:', error);
      }
      
      return modules;
    } catch (error) {
      console.error(`Error getting modules for course ${courseId}:`, error);
      throw error;
    }
  }
  
  /**
   * Get modules by course name
   * @param {string} token - Canvas API token
   * @param {string} courseName - Course name
   * @returns {Promise<Array>} - List of modules
   */
  async _getModulesByCourseName(token, courseName) {
    try {
      // Get all courses first
      const courses = await canvasService.listAllCourses(token);
      console.log(`Retrieved ${courses.length} courses`);
      
      // Find the course by name
      const course = this._findCourseByName(courses, courseName);
      
      if (!course) {
        throw new Error(`Course "${courseName}" not found`);
      }
      
      console.log(`Found course: ${course.name} (ID: ${course.id})`);
      
      // Get modules for the course
      const modules = await canvasService.getCourseModules(token, course.id);
      console.log(`Retrieved ${modules.length} modules for course ${course.name}`);
      
      return modules.map(m => ({
        ...m,
        course_name: course.name,
        course_id: course.id
      }));
    } catch (error) {
      console.error(`Error getting modules for course ${courseName}:`, error);
      throw error;
    }
  }
  
  /**
   * Find a course by name (case-insensitive partial match)
   * @param {Array} courses - List of courses
   * @param {string} courseName - Course name to find
   * @returns {Object|null} - Course object or null if not found
   */
  _findCourseByName(courses, courseName) {
    if (!courses || !courseName) return null;
    
    // Try exact match first
    let course = courses.find(c => 
      c.name.toLowerCase() === courseName.toLowerCase()
    );
    
    // If no exact match, try partial match
    if (!course) {
      course = courses.find(c => 
        c.name.toLowerCase().includes(courseName.toLowerCase())
      );
    }
    
    return course;
  }
  
  /**
   * Format courses response
   * @param {Array} courses - List of courses
   * @param {Object} intent - Intent object
   * @returns {string} - Formatted response
   */
  _formatCoursesResponse(courses, intent) {
    let response = '## Your Canvas Courses\n\n';
    
    if (!courses || courses.length === 0) {
      response += 'No courses found in your Canvas account.\n';
      return response;
    }
    
    courses.forEach((course, index) => {
      response += `${index + 1}. **${course.name}** (ID: ${course.id})\n`;
      if (course.course_code) response += `   - Course Code: ${course.course_code}\n`;
      if (course.term) response += `   - Term: ${course.term.name}\n`;
    });
    
    return response;
  }
  
  /**
   * Format announcements response
   * @param {Array} announcements - List of announcements
   * @param {Object} intent - Intent object
   * @returns {string} - Formatted response
   */
  _formatAnnouncementsResponse(announcements, intent) {
    let response = intent.courseName 
      ? `## Announcements from ${intent.courseName}\n\n` 
      : (intent.courseId 
        ? `## Announcements from Course ID: ${intent.courseId}\n\n` 
        : '## Recent Announcements Across All Courses\n\n');
    
    if (!announcements || announcements.length === 0) {
      response += 'No announcements found.\n';
      return response;
    }
    
    // Sort by posted date (newest first)
    announcements.sort((a, b) => new Date(b.posted_at) - new Date(a.posted_at));
    
    // Show the 10 most recent
    announcements.slice(0, 10).forEach((announcement, index) => {
      response += `${index + 1}. **${announcement.title}** (ID: ${announcement.id})\n`;
      
      if (announcement.course_name) {
        response += `   - Course: ${announcement.course_name}\n`;
      }
      
      if (announcement.posted_at) {
        const postedDate = new Date(announcement.posted_at);
        response += `   - Posted: ${postedDate.toLocaleString()}\n`;
      }
      
      // Add a brief excerpt of the message if available
      if (announcement.message) {
        const excerpt = announcement.message.replace(/<[^>]*>/g, '').substring(0, 100);
        response += `   - Excerpt: "${excerpt}..."\n`;
      }
      
      response += "---\n";
    });
    
    return response;
  }
  
  /**
   * Format assignments response
   * @param {Array} assignments - List of assignments
   * @param {Object} intent - Intent object
   * @returns {string} - Formatted response
   */
  _formatAssignmentsResponse(assignments, intent) {
    let response = intent.courseName 
      ? `## Assignments from ${intent.courseName}\n\n` 
      : (intent.courseId 
        ? `## Assignments from Course ID: ${intent.courseId}\n\n` 
        : '## Assignments Across All Courses\n\n');
    
    if (!assignments || assignments.length === 0) {
      response += 'No assignments found.\n';
      return response;
    }
    
    // Sort by due date
    assignments.sort((a, b) => {
      if (!a.due_at) return 1;
      if (!b.due_at) return -1;
      return new Date(a.due_at) - new Date(b.due_at);
    });
    
    assignments.forEach((assignment, index) => {
      response += `${index + 1}. **${assignment.name}** (ID: ${assignment.id})\n`;
      
      if (assignment.course_name) {
        response += `   - Course: ${assignment.course_name}\n`;
      }
      
      if (assignment.due_at) {
        const dueDate = new Date(assignment.due_at);
        const now = new Date();
        const isPastDue = dueDate < now;
        
        response += `   - Due: ${dueDate.toLocaleString()} ${isPastDue ? '(Past Due)' : ''}\n`;
      } else {
        response += `   - Due: No due date\n`;
      }
      
      response += `   - Points: ${assignment.points_possible || 'Not specified'}\n`;
      
      if (assignment.submission_types) {
        response += `   - Submission Type: ${assignment.submission_types.join(', ')}\n`;
      }
      
      response += "---\n";
    });
    
    return response;
  }
  
  /**
   * Format modules response
   * @param {Array} modules - List of modules
   * @param {Object} intent - Intent object
   * @returns {string} - Formatted response
   */
  _formatModulesResponse(modules, intent) {
    let response = intent.courseName 
      ? `## Modules from ${intent.courseName}\n\n` 
      : (intent.courseId 
        ? `## Modules from Course ID: ${intent.courseId}\n\n` 
        : '## Modules\n\n');
    
    if (!modules || modules.length === 0) {
      response += 'No modules found.\n';
      return response;
    }
    
    modules.forEach((module, index) => {
      response += `${index + 1}. **${module.name}** (ID: ${module.id})\n`;
      
      if (module.course_name) {
        response += `   - Course: ${module.course_name}\n`;
      }
      
      if (module.items_count) {
        response += `   - Items: ${module.items_count}\n`;
      }
      
      if (module.state) {
        response += `   - State: ${module.state}\n`;
      }
      
      response += "---\n";
    });
    
    return response;
  }
  
  /**
   * Generate a conversational response
   * @param {string} userMessage - User message
   * @param {string} data - Formatted data
   * @returns {Promise<string>} - Conversational response
   */
  async _generateConversationalResponse(userMessage, data) {
    try {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are a helpful Canvas LMS assistant that helps students access and understand their Canvas data.
            
            Your task is to format Canvas data into a friendly, conversational response.
            
            Guidelines:
            1. Be conversational and friendly in your responses.
            2. When presenting Canvas data, format it in a clear and readable way.
            3. If the data doesn't contain what the user is looking for, suggest alternative queries they could try.
            4. Always provide context about what data you're showing.
            5. For dates, indicate if assignments are past due or upcoming.
            
            The user's query and the raw Canvas data will be provided to you. Format this into a helpful response.`
          },
          {
            role: "user",
            content: `User query: ${userMessage}\n\nCanvas data:\n${data}`
          }
        ],
        model: "llama3-70b-8192",
        temperature: 0.7,
        max_tokens: 1024
      });
      
      return completion.choices[0].message.content;
    } catch (error) {
      console.error('Error generating conversational response:', error);
      return data;
    }
  }
}

// Export a singleton instance
export default new CanvasAgent(); 