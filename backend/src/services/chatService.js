import { Groq } from 'groq-sdk';
import { HuggingFaceInferenceEmbeddings } from '@langchain/community/embeddings/hf';
import { ChatGroq } from '@langchain/groq';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { supabase } from '../index.js';
import canvasService from './canvasService.js';
import canvasApiService from './canvasApiService.js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// Initialize HuggingFace embeddings
const hf = new HuggingFaceInferenceEmbeddings({
  apiKey: process.env.HUGGINGFACE_API_KEY,
  model: "sentence-transformers/all-MiniLM-L6-v2",
});

// Initialize LLM model
const llmModel = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "llama3-70b-8192",
});

/**
 * Generate embeddings for text
 * @param {string} text - Text to generate embeddings for
 * @returns {Promise<Array<number>>} - Embedding vector
 */
export async function generateEmbedding(text) {
  if (!text) {
    throw new Error("Text is required for generating embeddings");
  }
  
  try {
    const embedding = await hf.embedQuery(text);
    return embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw error;
  }
}

/**
 * Alternative embedding generation using Groq
 * @param {string} text - Text to generate embeddings for
 * @returns {Promise<Array<number>>} - Embedding vector
 */
export async function generateEmbeddingWithGroq(text) {
  try {
    const response = await groq.embeddings.create({
      model: "text-embedding-ada-002",
      input: text
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding with Groq:', error);
    throw error;
  }
}

/**
 * Store chat in Supabase
 */
async function storeChat(userMessage, aiResponse, userId) {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .insert([
        {
          user_id: userId,
          user_message: userMessage,
          ai_response: aiResponse,
          created_at: new Date().toISOString()
        }
      ]);

    if (error) {
      console.error('Error storing chat in Supabase:', error);
    }
  } catch (error) {
    console.error('Error storing chat:', error);
  }
}

/**
 * Determine which Canvas tools to call based on user message
 */
async function determineCanvasTools(message) {
  try {
    console.log('Determining Canvas tools to call based on user message...');
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are an expert Canvas LMS query analyzer. Your job is to understand natural language queries about Canvas and determine which API tools should be called.

          AVAILABLE TOOLS:
          - getUserCourses: Get all courses the user is enrolled in
          - listAllCourses: Get all courses with pagination (preferred over getUserCourses for comprehensive listing)
          - getCourseAssignments: Get assignments for a specific course
          - getCourseAnnouncements: Get announcements for a specific course
          - getCourseModules: Get modules for a specific course
          - getCourseTabs: Get available tabs for a specific course
          - getAssignmentDetails: Get detailed information about a specific assignment
          - getAnnouncementDetails: Get detailed information about a specific announcement
          - listAllAnnouncements: Get all announcements across all courses (preferred for queries about announcements without specifying a course)

          QUERY UNDERSTANDING:
          - Identify if the user is asking about courses, assignments, announcements, or modules
          - Extract any course names or IDs mentioned
          - Extract any assignment or announcement IDs mentioned
          - Understand time-based queries (upcoming, past, recent, etc.)
          - Identify if the user is asking for a list or specific details

          Return a JSON object with the following structure:
          {
            "tools": [
              {
                "name": "listAllCourses" | "getUserCourses" | "getCourseAssignments" | "getCourseAnnouncements" | "getCourseModules" | "getCourseTabs" | "getAssignmentDetails" | "getAnnouncementDetails" | "listAllAnnouncements",
                "params": {
                  "courseId": "course ID if applicable, null if not needed",
                  "courseName": "course name if mentioned, null if not needed",
                  "assignmentId": "assignment ID if applicable, null if not needed",
                  "announcementId": "announcement ID if applicable, null if not needed",
                  "timeFrame": "upcoming | past | recent | all (if applicable)",
                  "searchTerm": "search term if user is looking for something specific"
                }
              }
            ],
            "reasoning": "Detailed explanation of why these tools were selected and how they will help answer the user's query",
            "queryType": "courses | assignments | announcements | modules | general",
            "needsFollowUp": true | false,
            "followUpQuestion": "Question to ask user if more information is needed"
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
    console.log('Determined tools:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('Error determining Canvas tools:', error);
    return { tools: [] };
  }
}

/**
 * Execute Canvas tool calls
 */
async function executeCanvasTools(tools, accessToken, canvasUrl) {
  console.log('Executing Canvas tools...');
  const results = {};
  
  try {
    // First get courses if needed
    const needsCourses = tools.some(tool => 
      tool.name === 'getUserCourses' || 
      tool.name === 'listAllCourses' ||
      (tool.params && tool.params.courseName)
    );
    
    if (needsCourses) {
      // Use listAllCourses for more comprehensive course listing
      results.courses = await canvasService.listAllCourses(accessToken, canvasUrl);
      console.log(`Retrieved ${results.courses.length} courses`);
    }
    
    // Execute each tool
    for (const tool of tools) {
      console.log(`Executing tool: ${tool.name}`);
      
      switch (tool.name) {
        case 'getUserCourses':
          // Already handled above with listAllCourses
          break;
          
        case 'listAllCourses':
          // Already handled above
          break;
          
        case 'getCourseAssignments':
          if (tool.params.courseId) {
            results.assignments = await canvasService.getCourseAssignments(
              accessToken, 
              tool.params.courseId,
              canvasUrl
            );
          } else if (tool.params.courseName && results.courses) {
            const course = findCourseByName(results.courses, tool.params.courseName);
            
            if (course) {
              results.assignments = await canvasService.getCourseAssignments(
                accessToken,
                course.id,
                canvasUrl
              );
              results.selectedCourse = course;
            }
          } else if (results.courses && results.courses.length > 0) {
            // Get assignments for first course if no specific course mentioned
            const assignments = await canvasService.getCourseAssignments(
              accessToken,
              results.courses[0].id,
              canvasUrl
            );
            results.assignments = assignments;
            results.selectedCourse = results.courses[0];
          }
          
          // Filter assignments based on timeFrame if specified
          if (results.assignments && tool.params.timeFrame) {
            results.assignments = filterByTimeFrame(results.assignments, tool.params.timeFrame);
          }
          
          // Filter assignments based on searchTerm if specified
          if (results.assignments && tool.params.searchTerm) {
            results.assignments = filterBySearchTerm(results.assignments, tool.params.searchTerm);
          }
          break;
          
        case 'getCourseAnnouncements':
          if (tool.params.courseId) {
            results.announcements = await canvasService.getCourseAnnouncements(
              accessToken,
              tool.params.courseId,
              canvasUrl
            );
          } else if (tool.params.courseName && results.courses) {
            const course = findCourseByName(results.courses, tool.params.courseName);
            
            if (course) {
              results.announcements = await canvasService.getCourseAnnouncements(
                accessToken,
                course.id,
                canvasUrl
              );
              results.selectedCourse = course;
            }
          }
          
          // Filter announcements based on timeFrame if specified
          if (results.announcements && tool.params.timeFrame) {
            results.announcements = filterByTimeFrame(results.announcements, tool.params.timeFrame);
          }
          
          // Filter announcements based on searchTerm if specified
          if (results.announcements && tool.params.searchTerm) {
            results.announcements = filterBySearchTerm(results.announcements, tool.params.searchTerm);
          }
          break;
          
        case 'listAllAnnouncements':
          results.allAnnouncements = await canvasService.listAllAnnouncements(accessToken, canvasUrl);
          
          // Filter announcements based on timeFrame if specified
          if (results.allAnnouncements && tool.params.timeFrame) {
            results.allAnnouncements = filterByTimeFrame(results.allAnnouncements, tool.params.timeFrame);
          }
          
          // Filter announcements based on searchTerm if specified
          if (results.allAnnouncements && tool.params.searchTerm) {
            results.allAnnouncements = filterBySearchTerm(results.allAnnouncements, tool.params.searchTerm);
          }
          break;
          
        case 'getCourseModules':
          if (tool.params.courseId) {
            results.modules = await canvasService.getCourseModules(
              accessToken,
              tool.params.courseId,
              canvasUrl
            );
          } else if (tool.params.courseName && results.courses) {
            const course = findCourseByName(results.courses, tool.params.courseName);
            
            if (course) {
              results.modules = await canvasService.getCourseModules(
                accessToken,
                course.id,
                canvasUrl
              );
              results.selectedCourse = course;
            }
          } else if (results.courses && results.courses.length > 0) {
            // Get modules for first course if no specific course mentioned
            const modules = await canvasService.getCourseModules(
              accessToken,
              results.courses[0].id,
              canvasUrl
            );
            results.modules = modules;
            results.selectedCourse = results.courses[0];
          }
          break;
          
        case 'getCourseTabs':
          if (tool.params.courseId) {
            results.tabs = await canvasService.getCourseTabs(
              accessToken,
              tool.params.courseId,
              canvasUrl
            );
          } else if (tool.params.courseName && results.courses) {
            const course = findCourseByName(results.courses, tool.params.courseName);
            
            if (course) {
              results.tabs = await canvasService.getCourseTabs(
                accessToken,
                course.id,
                canvasUrl
              );
              results.selectedCourse = course;
            }
          } else if (results.courses && results.courses.length > 0) {
            // Get tabs for first course if no specific course mentioned
            const tabs = await canvasService.getCourseTabs(
              accessToken,
              results.courses[0].id,
              canvasUrl
            );
            results.tabs = tabs;
            results.selectedCourse = results.courses[0];
          }
          break;
          
        case 'getAssignmentDetails':
          if (tool.params.courseId && tool.params.assignmentId) {
            results.assignmentDetails = await canvasService.getAssignmentDetails(
              accessToken,
              tool.params.courseId,
              tool.params.assignmentId,
              canvasUrl
            );
          }
          break;
          
        case 'getAnnouncementDetails':
          if (tool.params.courseId && tool.params.announcementId) {
            results.announcementDetails = await canvasService.getAnnouncementDetails(
              accessToken,
              tool.params.courseId,
              tool.params.announcementId,
              canvasUrl
            );
          }
          break;
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error executing Canvas tools:', error);
    return {};
  }
}

/**
 * Find a course by name (case-insensitive partial match)
 */
function findCourseByName(courses, courseName) {
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
 * Filter items by time frame
 */
function filterByTimeFrame(items, timeFrame) {
  if (!items || !timeFrame) return items;
  
  const now = new Date();
  
  switch (timeFrame.toLowerCase()) {
    case 'upcoming':
      return items.filter(item => {
        const dueDate = item.due_at || item.posted_at;
        return dueDate && new Date(dueDate) > now;
      });
      
    case 'past':
      return items.filter(item => {
        const dueDate = item.due_at || item.posted_at;
        return dueDate && new Date(dueDate) < now;
      });
      
    case 'recent':
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      return items.filter(item => {
        const date = item.due_at || item.posted_at || item.created_at;
        return date && new Date(date) > oneWeekAgo;
      });
      
    default:
      return items;
  }
}

/**
 * Filter items by search term
 */
function filterBySearchTerm(items, searchTerm) {
  if (!items || !searchTerm) return items;
  
  const term = searchTerm.toLowerCase();
  
  return items.filter(item => {
    const title = item.name || item.title || '';
    const description = item.description || item.message || '';
    
    return title.toLowerCase().includes(term) || 
           description.toLowerCase().includes(term);
  });
}

/**
 * Format Canvas data for LLM consumption
 */
function formatCanvasDataForLLM(data) {
  console.log('Formatting Canvas data for LLM...');
  let formattedData = '';

  try {
    // Format courses
    if (data.courses && data.courses.length > 0) {
      formattedData += '## Your Canvas Courses\n\n';
    data.courses.forEach((course, index) => {
        formattedData += `${index + 1}. **${course.name}** (ID: ${course.id})\n`;
        if (course.course_code) formattedData += `   - Course Code: ${course.course_code}\n`;
        if (course.term) formattedData += `   - Term: ${course.term.name}\n`;
    });
    formattedData += '\n';
  }

    // Format selected course
  if (data.selectedCourse) {
      formattedData += `## Selected Course: ${data.selectedCourse.name}\n\n`;
    }
    
    // Format assignments
    if (data.assignments && data.assignments.length > 0) {
      formattedData += '## Assignments\n\n';
      data.assignments.forEach((assignment, index) => {
        formattedData += `${index + 1}. **${assignment.name}** (ID: ${assignment.id})\n`;
        if (assignment.due_at) {
          const dueDate = new Date(assignment.due_at);
          const now = new Date();
          const isPastDue = dueDate < now;
          
          formattedData += `   - Due: ${dueDate.toLocaleString()} ${isPastDue ? '(Past Due)' : ''}\n`;
        } else {
          formattedData += `   - Due: No due date\n`;
        }
        
        formattedData += `   - Points: ${assignment.points_possible || 'Not specified'}\n`;
        
        if (assignment.submission_types) {
          formattedData += `   - Submission Type: ${assignment.submission_types.join(', ')}\n`;
        }
        
        if (assignment.has_submitted_submissions !== undefined) {
          formattedData += `   - Submitted: ${assignment.has_submitted_submissions ? 'Yes' : 'No'}\n`;
        }
      });
      formattedData += '\n';
    } else if (data.assignments && data.assignments.length === 0) {
      formattedData += '## Assignments\n\nNo assignments found for this course.\n\n';
    }
    
    // Format announcements
    if (data.announcements && data.announcements.length > 0) {
      formattedData += '## Announcements\n\n';
      data.announcements.forEach((announcement, index) => {
        formattedData += `${index + 1}. **${announcement.title}** (ID: ${announcement.id})\n`;
        if (announcement.posted_at) {
          const postedDate = new Date(announcement.posted_at);
          formattedData += `   - Posted: ${postedDate.toLocaleString()}\n`;
        }
        
        // Add a brief excerpt of the message if available
        if (announcement.message) {
          const excerpt = announcement.message.replace(/<[^>]*>/g, '').substring(0, 100);
          formattedData += `   - Excerpt: "${excerpt}..."\n`;
        }
      });
      formattedData += '\n';
    } else if (data.announcements && data.announcements.length === 0) {
      formattedData += '## Announcements\n\nNo announcements found for this course.\n\n';
    }
    
    // Format all announcements across courses
    if (data.allAnnouncements && data.allAnnouncements.length > 0) {
      formattedData += '## All Announcements Across Courses\n\n';
      data.allAnnouncements.forEach((announcement, index) => {
        formattedData += `${index + 1}. **${announcement.title}** (ID: ${announcement.id})\n`;
        formattedData += `   - Course: ${announcement.course_name} (ID: ${announcement.course_id})\n`;
        
        if (announcement.posted_at) {
          const postedDate = new Date(announcement.posted_at);
          formattedData += `   - Posted: ${postedDate.toLocaleString()}\n`;
        }
        
        // Add a brief excerpt of the message if available
        if (announcement.message) {
          const excerpt = announcement.message.replace(/<[^>]*>/g, '').substring(0, 100);
          formattedData += `   - Excerpt: "${excerpt}..."\n`;
        }
      });
      formattedData += '\n';
    } else if (data.allAnnouncements && data.allAnnouncements.length === 0) {
      formattedData += '## All Announcements\n\nNo announcements found across your courses.\n\n';
    }
    
    // Format modules
    if (data.modules && data.modules.length > 0) {
      formattedData += '## Modules\n\n';
      data.modules.forEach((module, index) => {
        formattedData += `${index + 1}. **${module.name}** (ID: ${module.id})\n`;
        if (module.items_count) formattedData += `   - Items: ${module.items_count}\n`;
        if (module.state) formattedData += `   - State: ${module.state}\n`;
      });
      formattedData += '\n';
    } else if (data.modules && data.modules.length === 0) {
      formattedData += '## Modules\n\nNo modules found for this course.\n\n';
    }
    
    // Format tabs
    if (data.tabs && data.tabs.length > 0) {
      formattedData += '## Course Tabs\n\n';
      data.tabs.forEach((tab, index) => {
        formattedData += `${index + 1}. **${tab.label}** (Type: ${tab.type})\n`;
      });
    formattedData += '\n';
  }

    // Format assignment details
    if (data.assignmentDetails) {
      const assignment = data.assignmentDetails;
      formattedData += `## Assignment Details: ${assignment.name}\n\n`;
      formattedData += `- **ID**: ${assignment.id}\n`;
      
      if (assignment.due_at) {
        const dueDate = new Date(assignment.due_at);
        const now = new Date();
        const isPastDue = dueDate < now;
        
        formattedData += `- **Due Date**: ${dueDate.toLocaleString()} ${isPastDue ? '(Past Due)' : ''}\n`;
      } else {
        formattedData += `- **Due Date**: No due date\n`;
      }
      
      formattedData += `- **Points Possible**: ${assignment.points_possible || 'Not specified'}\n`;
      
      if (assignment.submission_types) {
        formattedData += `- **Submission Type**: ${assignment.submission_types.join(', ')}\n`;
      }
      
      if (assignment.description) {
        // Clean HTML tags for better readability
        const cleanDescription = assignment.description.replace(/<[^>]*>/g, '');
        formattedData += `\n**Description**:\n${cleanDescription}\n\n`;
      }
    }
    
    // Format announcement details
    if (data.announcementDetails) {
      const announcement = data.announcementDetails;
      formattedData += `## Announcement Details: ${announcement.title}\n\n`;
      formattedData += `- **ID**: ${announcement.id}\n`;
      
      if (announcement.posted_at) {
        const postedDate = new Date(announcement.posted_at);
        formattedData += `- **Posted**: ${postedDate.toLocaleString()}\n`;
      }
      
      if (announcement.message) {
        // Clean HTML tags for better readability
        const cleanMessage = announcement.message.replace(/<[^>]*>/g, '');
        formattedData += `\n**Message**:\n${cleanMessage}\n\n`;
      }
  }

  return formattedData;
  } catch (error) {
    console.error('Error formatting Canvas data:', error);
    return 'Error formatting Canvas data. Please try again.';
  }
}

/**
 * Extract Canvas token from user message
 */
function extractCanvasToken(message) {
  console.log('Attempting to extract Canvas token from message...');
  
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
      // Log only the first few characters for security
      const tokenPreview = match[1].substring(0, 8) + '...';
      console.log(`Canvas token extracted: ${tokenPreview}`);
      return match[1];
    }
  }

  console.log('No Canvas token found in message');
  return null;
}

/**
 * Process a chat message with the Canvas LLM
 */
export async function processChat(chatHistory, canvasContext = '', userId = null) {
  console.log('\n========== PROCESSING CHAT MESSAGE ==========');
  console.log('Timestamp:', new Date().toISOString());
  try {
    const userMessage = chatHistory[chatHistory.length - 1].content;
    console.log('\nUSER QUERY:', userMessage);
    
    let canvasData = {};
    let contextData = canvasContext || '';
    let accessToken = null;
    let canvasUrl = 'https://canvas.tue.nl';
    let followUpQuestion = null;
    
    // Check if the user provided a Canvas token in the message
    const extractedToken = extractCanvasToken(userMessage);
    if (extractedToken) {
      console.log('\nCanvas token found in message: Present');
      accessToken = extractedToken;
      
      // If we have a userId, store the token for future use
      if (userId) {
        try {
          await canvasService.storeCanvasToken(userId, accessToken, canvasUrl);
          console.log('Canvas token stored for user:', userId);
        } catch (error) {
          console.error('Error storing Canvas token:', error);
        }
      }
    }
    
    // If we have userId, try to get Canvas data
    if (userId) {
      try {
        console.log('\nRetrieving Canvas token for user:', userId);
        const tokenData = await canvasService.getCanvasToken(userId);
        
        if (tokenData) {
          console.log('Canvas token found:', tokenData.access_token ? 'Present' : 'Missing');
          console.log('Canvas URL:', tokenData.canvas_url);
          accessToken = accessToken || tokenData.access_token;
          canvasUrl = tokenData.canvas_url || canvasUrl;
        } else {
          console.log('No Canvas token found for user');
        }
      } catch (error) {
        console.error('Error getting Canvas token:', error);
      }
    }
    
    // If we have an access token, get Canvas data
    if (accessToken) {
      try {
        // Determine which Canvas tools to call
        console.log('\nDetermining Canvas tools to call...');
        
        // Default to listing courses if the user is asking about courses or announcements
        let toolsToCall = { tools: [] };
        
        if (userMessage.toLowerCase().includes('course') || 
            userMessage.toLowerCase().includes('class') ||
            userMessage.toLowerCase().includes('get all') ||
            userMessage.toLowerCase().includes('list all') ||
            userMessage.toLowerCase().includes('show me')) {
          toolsToCall.tools.push({
            name: 'listAllCourses',
            params: {}
          });
        }
        
        if (userMessage.toLowerCase().includes('announcement') || 
            userMessage.toLowerCase().includes('update') ||
            userMessage.toLowerCase().includes('news')) {
          
          // Check if a specific course is mentioned
          const courseMatch = userMessage.match(/from\s+(?:my\s+)?([a-zA-Z0-9\s]+)(?:\s+class|\s+course)?/i);
          if (courseMatch && courseMatch[1]) {
            const courseName = courseMatch[1].trim();
            toolsToCall.tools.push({
              name: 'getCourseAnnouncements',
              params: {
                courseName: courseName
              }
            });
          } else {
            // If no specific course, get all announcements
            toolsToCall.tools.push({
              name: 'listAllAnnouncements',
              params: {}
            });
          }
        }
        
        // If no specific tools were determined, use the LLM to determine tools
        if (toolsToCall.tools.length === 0) {
          toolsToCall = await determineCanvasTools(userMessage);
        }
        
        console.log('Tools to call:', JSON.stringify(toolsToCall, null, 2));
        
        if (toolsToCall.tools && toolsToCall.tools.length > 0) {
          console.log('\nExecuting Canvas tools...');
          // Execute the tools
          canvasData = await executeCanvasTools(
            toolsToCall.tools, 
            accessToken, 
            canvasUrl
          );
          
          // Format the data for the LLM
          contextData = formatCanvasDataForLLM(canvasData);
          console.log('\nCanvas data retrieved and formatted');
          console.log('Canvas data summary:');
          if (canvasData.courses) console.log(`- Courses: ${canvasData.courses.length}`);
          if (canvasData.assignments) console.log(`- Assignments: ${canvasData.assignments.length}`);
          if (canvasData.announcements) console.log(`- Announcements: ${canvasData.announcements.length}`);
          if (canvasData.allAnnouncements) console.log(`- All Announcements: ${canvasData.allAnnouncements.length}`);
          if (canvasData.modules) console.log(`- Modules: ${canvasData.modules.length}`);
          
          // Check if we need a follow-up question
          if (toolsToCall.needsFollowUp && toolsToCall.followUpQuestion) {
            followUpQuestion = toolsToCall.followUpQuestion;
          }
        } else {
          console.log('No Canvas tools to call');
        }
      } catch (error) {
        console.error('Error getting Canvas data:', error);
        contextData = 'Error retrieving Canvas data: ' + error.message;
      }
    } else {
      console.log('No Canvas token available');
      // If no token is available, we'll ask the user to provide one
      if (userMessage.toLowerCase().includes('canvas') || 
          userMessage.toLowerCase().includes('course') || 
          userMessage.toLowerCase().includes('assignment') || 
          userMessage.toLowerCase().includes('announcement')) {
        contextData = 'No Canvas token available. Please provide your Canvas API token to access your Canvas data.';
      }
    }
    
    // Prepare the messages for the LLM
    const messages = [
      {
        role: 'system',
        content: `You are a helpful Canvas LMS assistant that helps students access and understand their Canvas data.
        
        IMPORTANT GUIDELINES:
        1. Be conversational and friendly in your responses.
        2. When presenting Canvas data, format it in a clear and readable way.
        3. If the user asks about Canvas data but no token is available, explain how they can provide their Canvas token.
        4. If the data doesn't contain what the user is looking for, suggest alternative queries they could try.
        5. If you need more specific information from the user, ask follow-up questions.
        6. Always provide context about what data you're showing (e.g., "Here are your upcoming assignments for Course X").
        7. For dates, indicate if assignments are past due or upcoming.
        
        CANVAS CONTEXT:
        ${contextData || 'No Canvas data available.'}
        `
      }
    ];
    
    // Add chat history (up to the last 10 messages to avoid token limits)
    const recentHistory = chatHistory.slice(-10);
    for (const msg of recentHistory) {
      messages.push({
        role: msg.role,
        content: msg.content
      });
    }
    
    // Generate the response
    console.log('\nGenerating LLM response...');
    const completion = await groq.chat.completions.create({
      messages,
      model: "llama3-70b-8192",
      temperature: 0.7,
      max_tokens: 1024
    });
    
    let responseContent = completion.choices[0].message.content;
    
    // If we have a follow-up question, append it to the response
    if (followUpQuestion) {
      responseContent += `\n\n${followUpQuestion}`;
    }
    
    // Store the chat in the database if we have a userId
    if (userId) {
      try {
      await storeChat(userMessage, responseContent, userId);
      } catch (error) {
        console.error('Error storing chat:', error);
      }
    }

    console.log('\nLLM response generated');
    return {
      content: responseContent,
      is_final: true,
      search_needed: false
    };
  } catch (error) {
    console.error('Error in processChat:', error);
    return {
      content: 'I encountered an error processing your request. Please try again.',
      is_final: true,
      search_needed: false
    };
  }
}

export default {
  generateEmbedding,
  generateEmbeddingWithGroq,
  processChat
}; 