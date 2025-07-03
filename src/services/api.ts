import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

export interface AnalysisSession {
  sessionId: string;
  filename: string;
  message: string;
}

export interface AnalysisProgress {
  stage: string;
  progress: number;
  message: string;
  incidents?: any[];
  error?: string;
}

export interface SystemSettings {
  version: string;
  analysisEngine: string;
  mitreVersion: string;
  supportedFormats: string[];
  maxFileSize: string;
  features: string[];
}

class ApiService {
  async checkHealth() {
    try {
      const response = await axios.get(`${API_BASE_URL}/health`);
      return response.data;
    } catch (error) {
      throw new Error('Backend service unavailable');
    }
  }

  async uploadFile(file: File): Promise<AnalysisSession> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'File upload failed');
    }
  }

  async submitTextInput(content: string): Promise<AnalysisSession> {
    try {
      const response = await axios.post(`${API_BASE_URL}/text-input`, {
        content
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Text input failed');
    }
  }

  async startAnalysis(sessionId: string, onProgress: (progress: AnalysisProgress) => void): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const eventSource = new EventSource(`${API_BASE_URL}/analyze/${sessionId}`);
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.error) {
            eventSource.close();
            reject(new Error(data.error));
            return;
          }
          
          onProgress(data);
          
          if (data.incidents) {
            eventSource.close();
            resolve(data.incidents);
          }
        } catch (error) {
          eventSource.close();
          reject(new Error('Failed to parse analysis response'));
        }
      };
      
      eventSource.onerror = () => {
        eventSource.close();
        reject(new Error('Analysis connection failed'));
      };
    });
  }

  async getResults(sessionId: string) {
    try {
      const response = await axios.get(`${API_BASE_URL}/results/${sessionId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to get results');
    }
  }

  async exportReport(sessionId: string): Promise<Blob> {
    try {
      const response = await axios.get(`${API_BASE_URL}/export/${sessionId}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Export failed');
    }
  }

  async getSettings(): Promise<SystemSettings> {
    try {
      const response = await axios.get(`${API_BASE_URL}/settings`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to get settings');
    }
  }

  async updateSettings(settings: any) {
    try {
      const response = await axios.post(`${API_BASE_URL}/settings`, settings);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to update settings');
    }
  }
}

export const apiService = new ApiService();