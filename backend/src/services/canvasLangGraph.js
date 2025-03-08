import { Groq } from 'groq-sdk';
import dotenv from 'dotenv';
import { MessageGraph } from "@langchain/langgraph";
import { START, END } from "@langchain/langgraph";
import { ChatGroq } from "@langchain/groq";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import canvasService from './canvasService.js';

// Load environment variables
dotenv.config();

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// Initialize LLM model
const llm = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "llama3-70b-8192",
});

/**
 * Canvas LangGraph Agent
 * This class implements a multi-agent graph to handle Canvas API queries
 */
class CanvasAgent {
  constructor() {
    this._model = llm;
    this.graph = new MessageGraph();
    
    // Initialize the graph
    this._initializeGraph();
  }
  
  /**
   * Initialize the nodes and edges in the graph
   */
  _initializeGraph() {
    // Node for query classification
    this.graph.addNode("query_classifier", async (state) => {
      console.log("Running query classifier node...");
      const prompt = ChatPromptTemplate.fromMessages([
        ["system", this._getQueryClassifierTemplate()],
        new MessagesPlaceholder("messages"),
      ]);
      
      const result = await prompt.pipe(this._model).invoke({ messages: state });
      console.log("Query classification result:", result.content);
      return result;
    });
    
    // Node for token extraction
    this.graph.addNode("token_extractor", async (state) => {
      console.log("Running token extractor node...");
      const userMessage = state[state.length - 1].content;
      const token = this._extractCanvasToken(userMessage);
      
      if (token) {
        console.log("Token extracted:", token.substring(0, 8) + "...");
        return new AIMessage(`Canvas token extracted: ${token.substring(0, 8)}...`);
      } else {
        console.log("No token found in message");
        return new AIMessage("No Canvas token found in the message.");
      }
    });
    
    // Node for course listing
    this.graph.addNode("list_courses", async (state) => {
      console.log("Running list courses node...");
      const userMessage = state[state.length - 1].content;
      const token = this._extractCanvasToken(userMessage);
      
      if (!token) {
        return new AIMessage("I need your Canvas API token to list your courses. Please provide it in your message.");
      }
      
      try {
        const courses = await canvasService.listAllCourses(token);
        console.log(`Retrieved ${courses.length} courses`);
        
        let response = "## Your Canvas Courses\n\n";
        if (courses.length === 0) {
          response += "No courses found in your Canvas account.\n";
        } else {
          courses.forEach((course, index) => {
            response += `${index + 1}. **${course.name}** (ID: ${course.id})\n`;
            if (course.course_code) response += `   - Course Code: ${course.course_code}\n`;
            if (course.term) response += `   - Term: ${course.term.name}\n`;
          });
        }
        
        return new AIMessage(response);
      } catch (error) {
        console.error("Error listing courses:", error);
        return new AIMessage(`Error listing courses: ${error.message}`);
      }
    });
    
    // Node for announcement listing
    this.graph.addNode("list_announcements", async (state) => {
      console.log("Running list announcements node...");
      const userMessage = state[state.length - 1].content;
      const token = this._extractCanvasToken(userMessage);
      
      if (!token) {
        return new AIMessage("I need your Canvas API token to list announcements. Please provide it in your message.");
      }
      
      try {
        // Check if a specific course is mentioned
        const courseMatch = userMessage.match(/from\s+(?:my\s+)?([a-zA-Z0-9\s]+)(?:\s+class|\s+course)?/i);
        let announcements = [];
        let courseName = null;
        
        if (courseMatch && courseMatch[1]) {
          courseName = courseMatch[1].trim();
          console.log(`Looking for announcements from course: ${courseName}`);
          
          // Get all courses first
          const courses = await canvasService.listAllCourses(token);
          console.log(`Retrieved ${courses.length} courses`);
          
          // Find the course by name
          const course = this._findCourseByName(courses, courseName);
          
          if (course) {
            console.log(`Found course: ${course.name} (ID: ${course.id})`);
            announcements = await canvasService.getCourseAnnouncements(token, course.id);
            console.log(`Retrieved ${announcements.length} announcements for course ${course.name}`);
          } else {
            return new AIMessage(`I couldn't find a course matching "${courseName}". Please check the course name and try again.`);
          }
        } else {
          // Get all announcements across all courses
          announcements = await canvasService.listAllAnnouncements(token);
          console.log(`Retrieved ${announcements.length} announcements across all courses`);
        }
        
        let response = courseName 
          ? `## Announcements from ${courseName}\n\n` 
          : "## Recent Announcements Across All Courses\n\n";
        
        if (announcements.length === 0) {
          response += "No announcements found.\n";
        } else {
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
        }
        
        return new AIMessage(response);
      } catch (error) {
        console.error("Error listing announcements:", error);
        return new AIMessage(`Error listing announcements: ${error.message}`);
      }
    });
    
    // Node for assignment listing
    this.graph.addNode("list_assignments", async (state) => {
      console.log("Running list assignments node...");
      const userMessage = state[state.length - 1].content;
      const token = this._extractCanvasToken(userMessage);
      
      if (!token) {
        return new AIMessage("I need your Canvas API token to list assignments. Please provide it in your message.");
      }
      
      try {
        // Check if a specific course is mentioned
        const courseMatch = userMessage.match(/from\s+(?:my\s+)?([a-zA-Z0-9\s]+)(?:\s+class|\s+course)?/i);
        let assignments = [];
        let courseName = null;
        
        if (courseMatch && courseMatch[1]) {
          courseName = courseMatch[1].trim();
          console.log(`Looking for assignments from course: ${courseName}`);
          
          // Get all courses first
          const courses = await canvasService.listAllCourses(token);
          console.log(`Retrieved ${courses.length} courses`);
          
          // Find the course by name
          const course = this._findCourseByName(courses, courseName);
          
          if (course) {
            console.log(`Found course: ${course.name} (ID: ${course.id})`);
            assignments = await canvasService.getCourseAssignments(token, course.id);
            console.log(`Retrieved ${assignments.length} assignments for course ${course.name}`);
          } else {
            return new AIMessage(`I couldn't find a course matching "${courseName}". Please check the course name and try again.`);
          }
        } else {
          // Get assignments from all courses
          const courses = await canvasService.listAllCourses(token);
          console.log(`Retrieved ${courses.length} courses`);
          
          for (const course of courses) {
            const courseAssignments = await canvasService.getCourseAssignments(token, course.id);
            assignments = [...assignments, ...courseAssignments.map(a => ({...a, course_name: course.name}))];
          }
          
          console.log(`Retrieved ${assignments.length} assignments across all courses`);
        }
        
        let response = courseName 
          ? `## Assignments from ${courseName}\n\n` 
          : "## Recent Assignments Across All Courses\n\n";
        
        if (assignments.length === 0) {
          response += "No assignments found.\n";
        } else {
          // Check if we should filter by upcoming/past
          const isUpcoming = userMessage.toLowerCase().includes('upcoming');
          const isPast = userMessage.toLowerCase().includes('past');
          
          if (isUpcoming) {
            const now = new Date();
            assignments = assignments.filter(a => a.due_at && new Date(a.due_at) > now);
            response = "## Upcoming Assignments\n\n";
          } else if (isPast) {
            const now = new Date();
            assignments = assignments.filter(a => a.due_at && new Date(a.due_at) < now);
            response = "## Past Assignments\n\n";
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
        }
        
        return new AIMessage(response);
      } catch (error) {
        console.error("Error listing assignments:", error);
        return new AIMessage(`Error listing assignments: ${error.message}`);
      }
    });
    
    // Node for response formatting
    this.graph.addNode("response_formatter", async (state) => {
      console.log("Running response formatter node...");
      const lastMessage = state[state.length - 1].content;
      
      const prompt = ChatPromptTemplate.fromMessages([
        ["system", this._getResponseFormatterTemplate()],
        new MessagesPlaceholder("messages"),
        ["user", `Format this Canvas data into a friendly, conversational response: ${lastMessage}`],
      ]);
      
      return prompt.pipe(this._model).invoke({ messages: state.slice(0, -1) });
    });
    
    // Add conditional edges to route the conversation based on the query classification
    this.graph.addConditionalEdges(
      "query_classifier",
      async (state) => {
        const lastMessage = state[state.length - 1].content.toLowerCase();
        
        if (lastMessage.includes("token")) {
          return "token_extractor";
        } else if (
          lastMessage.includes("course") || 
          lastMessage.includes("class") || 
          lastMessage.includes("get all") ||
          lastMessage.includes("list all") ||
          lastMessage.includes("show me")
        ) {
          return "list_courses";
        } else if (
          lastMessage.includes("announcement") || 
          lastMessage.includes("update") ||
          lastMessage.includes("news")
        ) {
          return "list_announcements";
        } else if (
          lastMessage.includes("assignment") || 
          lastMessage.includes("homework") ||
          lastMessage.includes("due") ||
          lastMessage.includes("task")
        ) {
          return "list_assignments";
        } else {
          // Default to listing courses if we can't determine the intent
          return "list_courses";
        }
      },
      {
        token_extractor: "token_extractor",
        list_courses: "list_courses",
        list_announcements: "list_announcements",
        list_assignments: "list_assignments",
      }
    );
    
    // Add edges from each node to the response formatter
    this.graph.addEdge("token_extractor", "response_formatter");
    this.graph.addEdge("list_courses", "response_formatter");
    this.graph.addEdge("list_announcements", "response_formatter");
    this.graph.addEdge("list_assignments", "response_formatter");
    
    // Add edge from response formatter to the end
    this.graph.addEdge("response_formatter", END);
    
    // Add initial edge from START to the query classifier
    this.graph.addEdge(START, "query_classifier");
  }
  
  /**
   * Template for query classification
   */
  _getQueryClassifierTemplate() {
    return `
    You are an expert Canvas LMS query classifier.
    
    Your task is to analyze the user's message and determine what type of Canvas data they are requesting.
    
    Possible categories:
    1. Token extraction - User is providing their Canvas API token
    2. Course listing - User wants to see their courses
    3. Announcement listing - User wants to see announcements
    4. Assignment listing - User wants to see assignments
    
    Respond with the category that best matches the user's query.
    `;
  }
  
  /**
   * Template for response formatting
   */
  _getResponseFormatterTemplate() {
    return `
    You are a helpful Canvas LMS assistant that helps students access and understand their Canvas data.
    
    Your task is to format Canvas data into a friendly, conversational response.
    
    Guidelines:
    1. Be conversational and friendly in your responses.
    2. When presenting Canvas data, format it in a clear and readable way.
    3. If the data doesn't contain what the user is looking for, suggest alternative queries they could try.
    4. Always provide context about what data you're showing.
    5. For dates, indicate if assignments are past due or upcoming.
    
    The user's query and the raw Canvas data will be provided to you. Format this into a helpful response.
    `;
  }
  
  /**
   * Extract Canvas token from user message
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
   * Find a course by name (case-insensitive partial match)
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
   * Process a chat message
   */
  async processChat(chatHistory) {
    try {
      console.log("Processing chat with LangGraph...");
      const userMessage = chatHistory[chatHistory.length - 1].content;
      console.log("User message:", userMessage);
      
      // Compile the graph
      const runnable = this.graph.compile();
      
      // Create a human message from the user's message
      const message = new HumanMessage(userMessage);
      
      // Stream the response
      const stream = await runnable.stream(message);
      
      let finalResponse = null;
      
      // Process the stream
      for await (const chunk of stream) {
        const [nodeName, output] = Object.entries(chunk)[0];
        console.log(`Node ${nodeName} output:`, output.content.substring(0, 100) + "...");
        
        if (nodeName === "response_formatter") {
          finalResponse = output.content;
        }
      }
      
      return {
        content: finalResponse || "I'm sorry, I couldn't process your request. Please try again.",
        is_final: true,
        search_needed: false
      };
    } catch (error) {
      console.error("Error in processChat:", error);
      return {
        content: "I encountered an error processing your request. Please try again.",
        is_final: true,
        search_needed: false
      };
    }
  }
}

// Export the CanvasAgent class
export default new CanvasAgent(); 