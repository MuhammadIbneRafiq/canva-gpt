import canvasService from '../services/canvasService.js';

/**
 * Store user's Canvas access token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export const storeCanvasToken = async (req, res) => {
  try {
    const { accessToken, canvasUrl } = req.body;
    const userId = req.user.id;
    
    if (!accessToken) {
      return res.status(400).json({ error: 'Access token is required' });
    }

    // Store the token
    await canvasService.storeCanvasToken(userId, accessToken, canvasUrl);

    // Verify the token by fetching courses
    const courses = await canvasService.getUserCourses(accessToken, canvasUrl);

    res.status(200).json({ 
      message: 'Canvas token stored successfully',
      courses_count: courses.length
    });
  } catch (error) {
    console.error('Error in storeCanvasToken:', error);
    res.status(error.response?.status || 500).json({ 
      error: error.response?.data?.message || 'Failed to store Canvas token' 
    });
  }
};

/**
 * Get user's Canvas courses with all related data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export const getUserCourses = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Getting courses for user:', userId);
    
    // Get the stored token
    const tokenData = await canvasService.getCanvasToken(userId);
    
    if (!tokenData) {
      return res.status(404).json({ error: 'Canvas token not found' });
    }

    // Fetch courses
    const courses = await canvasService.getUserCourses(
      tokenData.access_token, 
      tokenData.canvas_url
    );

    // For each course, fetch additional data
    const coursesWithDetails = await Promise.all(courses.map(async (course) => {
      try {
        const [assignments, announcements, modules] = await Promise.all([
          canvasService.getCourseAssignments(tokenData.access_token, course.id, tokenData.canvas_url),
          canvasService.getCourseAnnouncements(tokenData.access_token, course.id, tokenData.canvas_url),
          canvasService.getCourseModules(tokenData.access_token, course.id, tokenData.canvas_url)
        ]);

        return {
          ...course,
          assignments,
          announcements,
          modules
        };
      } catch (error) {
        console.error(`Error fetching details for course ${course.id}:`, error);
        return {
          ...course,
          assignments: [],
          announcements: [],
          modules: [],
          error: 'Failed to fetch some course details'
        };
      }
    }));

    console.log(`Successfully fetched details for ${coursesWithDetails.length} courses`);
    res.status(200).json({ courses: coursesWithDetails });
  } catch (error) {
    console.error('Error in getUserCourses:', error);
    res.status(error.response?.status || 500).json({ 
      error: error.response?.data?.message || 'Failed to get Canvas courses' 
    });
  }
};

/**
 * Get course assignments with details
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export const getCourseAssignments = async (req, res) => {
  try {
    const userId = req.user.id;
    const { courseId } = req.params;
    console.log(`Getting assignments for course ${courseId}`);

    const tokenData = await canvasService.getCanvasToken(userId);
    if (!tokenData) {
      return res.status(404).json({ error: 'Canvas token not found' });
    }

    const assignments = await canvasService.getCourseAssignments(
      tokenData.access_token,
      courseId,
      tokenData.canvas_url
    );

    console.log(`Successfully fetched ${assignments.length} assignments`);
    res.status(200).json({ assignments });
  } catch (error) {
    console.error('Error in getCourseAssignments:', error);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to get course assignments'
    });
  }
};

/**
 * Get assignment details
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export const getAssignmentDetails = async (req, res) => {
  try {
    const userId = req.user.id;
    const { courseId, assignmentId } = req.params;
    console.log(`Getting details for assignment ${assignmentId} in course ${courseId}`);

    const tokenData = await canvasService.getCanvasToken(userId);
    if (!tokenData) {
      return res.status(404).json({ error: 'Canvas token not found' });
    }

    const assignment = await canvasService.getAssignmentDetails(
      tokenData.access_token,
      courseId,
      assignmentId,
      tokenData.canvas_url
    );

    console.log('Successfully fetched assignment details');
    res.status(200).json({ assignment });
  } catch (error) {
    console.error('Error in getAssignmentDetails:', error);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to get assignment details'
    });
  }
};

/**
 * Get course announcements
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export const getCourseAnnouncements = async (req, res) => {
  try {
    const userId = req.user.id;
    const { courseId } = req.params;
    console.log(`Getting announcements for course ${courseId}`);

    const tokenData = await canvasService.getCanvasToken(userId);
    if (!tokenData) {
      return res.status(404).json({ error: 'Canvas token not found' });
    }

    const announcements = await canvasService.getCourseAnnouncements(
      tokenData.access_token,
      courseId,
      tokenData.canvas_url
    );

    console.log(`Successfully fetched ${announcements.length} announcements`);
    res.status(200).json({ announcements });
  } catch (error) {
    console.error('Error in getCourseAnnouncements:', error);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to get course announcements'
    });
  }
};

/**
 * Get course modules
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export const getCourseModules = async (req, res) => {
  try {
    const userId = req.user.id;
    const { courseId } = req.params;
    console.log(`Getting modules for course ${courseId}`);

    const tokenData = await canvasService.getCanvasToken(userId);
    if (!tokenData) {
      return res.status(404).json({ error: 'Canvas token not found' });
    }

    const modules = await canvasService.getCourseModules(
      tokenData.access_token,
      courseId,
      tokenData.canvas_url
    );

    console.log(`Successfully fetched ${modules.length} modules`);
    res.status(200).json({ modules });
  } catch (error) {
    console.error('Error in getCourseModules:', error);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to get course modules'
    });
  }
};

export default {
  storeCanvasToken,
  getUserCourses,
  getCourseAssignments,
  getAssignmentDetails,
  getCourseAnnouncements,
  getCourseModules
}; 