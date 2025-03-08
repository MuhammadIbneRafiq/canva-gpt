import express from 'express';
import { 
  storeCanvasToken, 
  getUserCourses, 
  getCourseAssignments, 
  getAssignmentDetails,
  getCourseAnnouncements,
  getCourseModules
} from '../controllers/canvasController.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all Canvas routes
router.use(authenticateUser);

// POST /api/canvas/token - Store Canvas access token
router.post('/token', storeCanvasToken);

// GET /api/canvas/courses - Get user's Canvas courses with all details
router.get('/courses', getUserCourses);

// GET /api/canvas/courses/:courseId/assignments - Get course assignments
router.get('/courses/:courseId/assignments', getCourseAssignments);

// GET /api/canvas/courses/:courseId/assignments/:assignmentId - Get assignment details
router.get('/courses/:courseId/assignments/:assignmentId', getAssignmentDetails);

// GET /api/canvas/courses/:courseId/announcements - Get course announcements
router.get('/courses/:courseId/announcements', getCourseAnnouncements);

// GET /api/canvas/courses/:courseId/modules - Get course modules
router.get('/courses/:courseId/modules', getCourseModules);

export default router; 