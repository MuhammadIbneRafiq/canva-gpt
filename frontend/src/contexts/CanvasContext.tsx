import { createContext, useContext, useState, ReactNode } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

interface CanvasContextType {
  accessToken: string;
  canvasUrl: string;
  courses: any[];
  loading: boolean;
  error: string | null;
  setAccessToken: (token: string) => void;
  setCanvasUrl: (url: string) => void;
  fetchCourses: () => Promise<void>;
  fetchAssignments: (courseId: string) => Promise<any[]>;
  fetchAssignmentDetails: (courseId: string, assignmentId: string) => Promise<any>;
}

const CanvasContext = createContext<CanvasContextType | undefined>(undefined);

export const CanvasProvider = ({ children }: { children: ReactNode }) => {
  const [accessToken, setAccessToken] = useState('');
  const [canvasUrl, setCanvasUrl] = useState('https://canvas.tue.nl');
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // API base URL
  const apiBaseUrl = 'http://localhost:5000/api';

  // Get auth token for API requests
  const getAuthHeader = () => {
    return {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('supabase.auth.token')}`
      }
    };
  };

  // Save Canvas token to backend
  const saveCanvasToken = async (token: string, url: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post(
        `${apiBaseUrl}/canvas/token`, 
        { accessToken: token, canvasUrl: url },
        getAuthHeader()
      );
      
      return response.data;
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to save Canvas token');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's courses
  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(
        `${apiBaseUrl}/canvas/courses`,
        getAuthHeader()
      );
      
      setCourses(response.data.courses);
      return response.data.courses;
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to fetch courses');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Fetch course assignments
  const fetchAssignments = async (courseId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(
        `${apiBaseUrl}/canvas/courses/${courseId}/assignments`,
        getAuthHeader()
      );
      
      return response.data.assignments;
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to fetch assignments');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Fetch assignment details
  const fetchAssignmentDetails = async (courseId: string, assignmentId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(
        `${apiBaseUrl}/canvas/courses/${courseId}/assignments/${assignmentId}`,
        getAuthHeader()
      );
      
      return response.data.assignment;
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to fetch assignment details');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Handle access token change
  const handleAccessTokenChange = async (token: string) => {
    setAccessToken(token);
    
    if (token && user) {
      try {
        await saveCanvasToken(token, canvasUrl);
        await fetchCourses();
      } catch (error) {
        console.error('Error saving Canvas token:', error);
      }
    }
  };

  // Handle canvas URL change
  const handleCanvasUrlChange = (url: string) => {
    setCanvasUrl(url);
    
    if (accessToken && url && user) {
      saveCanvasToken(accessToken, url)
        .catch(error => console.error('Error saving Canvas token with new URL:', error));
    }
  };

  return (
    <CanvasContext.Provider
      value={{
        accessToken,
        canvasUrl,
        courses,
        loading,
        error,
        setAccessToken: handleAccessTokenChange,
        setCanvasUrl: handleCanvasUrlChange,
        fetchCourses,
        fetchAssignments,
        fetchAssignmentDetails
      }}
    >
      {children}
    </CanvasContext.Provider>
  );
};

export const useCanvas = () => {
  const context = useContext(CanvasContext);
  if (context === undefined) {
    throw new Error('useCanvas must be used within a CanvasProvider');
  }
  return context;
}; 