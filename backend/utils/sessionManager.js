import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SESSIONS_FILE = path.join(__dirname, '../data/sessions.json');

// Ensure data directory exists
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize sessions file if it doesn't exist
if (!fs.existsSync(SESSIONS_FILE)) {
  fs.writeFileSync(SESSIONS_FILE, '{}', 'utf8');
}

// In-memory cache for sessions
let sessions = loadSessions();

// Load sessions from file
function loadSessions() {
  try {
    const data = fs.readFileSync(SESSIONS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading sessions:', error);
    return {};
  }
}

// Save sessions to file
function saveSessions() {
  try {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving sessions:', error);
  }
}

// Session manager methods
const sessionManager = {
  // Create a new session
  create(sessionId, data) {
    sessions[sessionId] = {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    saveSessions();
    return sessions[sessionId];
  },

  // Get a session by ID
  get(sessionId) {
    return sessions[sessionId];
  },

  // Update a session
  update(sessionId, updates) {
    if (sessions[sessionId]) {
      sessions[sessionId] = {
        ...sessions[sessionId],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      saveSessions();
      return sessions[sessionId];
    }
    return null;
  },

  // Delete a session
  delete(sessionId) {
    if (sessions[sessionId]) {
      delete sessions[sessionId];
      saveSessions();
      return true;
    }
    return false;
  },

  // Get all sessions (for debugging)
  getAll() {
    return { ...sessions };
  }
};

export default sessionManager;
