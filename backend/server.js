import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { LogAnalyzer } from './services/logAnalyzer.js';
import { ReportGenerator } from './services/reportGenerator.js';
import sessionManager from './utils/sessionManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.json', '.csv', '.txt', '.log'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JSON, CSV, TXT, and LOG files are allowed.'));
    }
  }
});

// Initialize services
const logAnalyzer = new LogAnalyzer();
const reportGenerator = new ReportGenerator();

// Store for analysis sessions (in-memory cache)
const analysisSessions = new Map();

// Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'online', 
    message: 'SideSOC Backend is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// File upload endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const sessionId = uuidv4();
    const filePath = req.file.path;
    const originalName = req.file.originalname;

    // Store session info using session manager
    const session = sessionManager.create(sessionId, {
      id: sessionId,
      filename: originalName,
      filePath: filePath,
      status: 'uploaded'
    });
    
    // Also store in memory for backward compatibility
    analysisSessions.set(sessionId, session);

    res.json({
      sessionId,
      filename: originalName,
      message: 'File uploaded successfully'
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
});

// Text input endpoint
app.post('/api/text-input', async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'No content provided' });
    }

    const sessionId = uuidv4();
    
    // Save text content to temporary file
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const filePath = path.join(uploadDir, `${sessionId}-text-input.txt`);
    fs.writeFileSync(filePath, content);

    // Store session info with empty incidents array using session manager
    const session = sessionManager.create(sessionId, {
      id: sessionId,
      filename: 'Text Input',
      filePath: filePath,
      status: 'uploaded',
      incidents: [] // Initialize empty incidents array
    });
    
    // Also store in memory for backward compatibility
    analysisSessions.set(sessionId, session);

    res.json({
      sessionId,
      filename: 'Text Input',
      message: 'Text content processed successfully'
    });

  } catch (error) {
    console.error('Text input error:', error);
    res.status(500).json({ error: 'Text processing failed' });
  }
});

// Analysis endpoint (POST for regular HTTP, GET for SSE)
app.post('/api/analyze/:sessionId', handleAnalysis);
app.get('/api/analyze/:sessionId', handleAnalysis);

async function handleAnalysis(req, res) {
  try {
    const { sessionId } = req.params;
    
    // Try to get session from memory first, then from session manager
    let session = analysisSessions.get(sessionId);
    if (!session) {
      session = sessionManager.get(sessionId);
      if (session) {
        // Cache in memory for subsequent requests
        analysisSessions.set(sessionId, session);
      } else {
        console.error('Session not found in memory or storage:', sessionId);
        return res.status(404).json({ error: 'Session not found' });
      }
    }

    // Update session status
    const updates = {
      status: 'analyzing',
      startedAt: new Date().toISOString()
    };
    
    // Update in both memory and persistent storage
    session = { ...session, ...updates };
    analysisSessions.set(sessionId, session);
    sessionManager.update(sessionId, updates);

    // Set up SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, OPTIONS'
    });

    // Send initial connection message
    res.write('data: ' + JSON.stringify({ message: 'Connected' }) + '\n\n');

    const sendProgress = (stage, progress, message) => {
      res.write(`data: ${JSON.stringify({ stage, progress, message })}\n\n`);
    };

    try {
      // Read file content
      const content = fs.readFileSync(session.filePath, 'utf8');
      
      // Perform analysis with progress updates
      const incidents = await logAnalyzer.analyzeContent(content, session.filename, sendProgress);
      
      // Update session with analysis results
      const updates = {
        incidents: incidents,
        status: 'completed',
        completedAt: new Date().toISOString()
      };
      
      // Update in both memory and persistent storage
      session = { ...session, ...updates };
      analysisSessions.set(sessionId, session);
      sessionManager.update(sessionId, updates);

      // Send final results
      res.write(`data: ${JSON.stringify({ 
        stage: 'Complete', 
        progress: 100, 
        message: 'Analysis completed successfully',
        incidents: incidents
      })}\n\n`);

    } catch (analysisError) {
      console.error('Analysis error:', analysisError);
      const updates = {
        status: 'failed',
        error: analysisError.message
      };
      
      // Update in both memory and persistent storage
      session = { ...session, ...updates };
      analysisSessions.set(sessionId, session);
      sessionManager.update(sessionId, updates);
      
      res.write(`data: ${JSON.stringify({ 
        error: 'Analysis failed: ' + analysisError.message 
      })}\n\n`);
    }

    res.end();

  } catch (error) {
    console.error('Analysis endpoint error:', error);
    if (req.method === 'POST') {
      res.status(500).json({ error: 'Analysis failed' });
    } else {
      res.write(`data: ${JSON.stringify({ error: 'Analysis failed' })}\n\n`);
      res.end();
    }
  }
}

// Get analysis results
app.get('/api/results/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Try to get session from memory first, then from session manager
    let session = analysisSessions.get(sessionId);
    if (!session) {
      session = sessionManager.get(sessionId);
      if (session) {
        // Cache in memory for subsequent requests
        analysisSessions.set(sessionId, session);
      } else {
        console.error('Results: Session not found:', sessionId);
        return res.status(404).json({ error: 'Session not found' });
      }
    }

    if (session.status === 'failed') {
      return res.status(500).json({ 
        error: 'Analysis failed',
        message: session.error 
      });
    }

    if (session.status !== 'completed') {
      return res.status(202).json({ 
        status: session.status || 'pending',
        message: 'Analysis in progress' 
      });
    }

    res.json({
      sessionId: session.id,
      status: session.status,
      incidents: session.incidents || [],
      createdAt: session.createdAt,
      completedAt: session.completedAt
    });

  } catch (error) {
    console.error('Results error:', error);
    res.status(500).json({ error: 'Failed to retrieve results' });
  }
});

// Format incidents for export
function formatIncidentsForExport(incidents) {
  if (!incidents || !incidents.length) return null;
  
  // If there are multiple incidents, create a consolidated report
  if (incidents.length > 1) {
    // Create a summary of all incidents
    const incidentSummaries = incidents.map((incident, index) => ({
      id: incident.id || `incident-${index + 1}`,
      title: incident.title || `Incident ${index + 1}`,
      severity: incident.severity || 'medium',
      status: incident.status || 'open',
      timestamp: incident.timestamp || new Date().toISOString(),
      summary: incident.summary || '',
      description: incident.description || ''
    }));

    // Count incidents by severity
    const severityCounts = incidents.reduce((acc, incident) => {
      const severity = incident.severity?.toLowerCase() || 'unknown';
      acc[severity] = (acc[severity] || 0) + 1;
      return acc;
    }, {});

    // Get all unique assets
    const allAssets = [];
    const assetKeys = new Set();
    
    incidents.forEach(incident => {
      (incident.affected_assets || []).forEach(asset => {
        const key = `${asset.type}:${asset.value}`;
        if (!assetKeys.has(key)) {
          assetKeys.add(key);
          allAssets.push({
            ...asset,
            first_seen: asset.first_seen || incident.timestamp || new Date().toISOString(),
            last_seen: asset.last_seen || incident.timestamp || new Date().toISOString()
          });
        }
      });
    });

    // Get all timeline events
    const allTimelineEvents = incidents.flatMap(incident => 
      (incident.timeline || []).map(event => ({
        ...event,
        incident_id: incident.id,
        incident_title: incident.title
      }))
    );

    // Get all evidence
    const allEvidence = incidents.flatMap(incident => 
      (incident.evidence || []).map(evidence => ({
        ...evidence,
        incident_id: incident.id,
        incident_title: incident.title
      }))
    );

    // Get all recommendations
    const allRecommendations = [
      ...new Set(incidents.flatMap(incident => incident.recommendations || []))
    ];

    // Get all threat intelligence
    const allIOCs = [
      ...new Set(
        incidents.flatMap(incident => 
          incident.threat_intelligence?.iocs || []
        )
      )
    ];

    const allThreatActors = [
      ...new Set(
        incidents.flatMap(incident => 
          incident.threat_intelligence?.threat_actors || []
        )
      )
    ];

    const highestConfidence = incidents.reduce((acc, curr) => {
      const conf = curr.threat_intelligence?.confidence;
      if (!conf) return acc;
      if (conf === 'high') return 'high';
      if (conf === 'medium' && acc !== 'high') return 'medium';
      if (conf === 'low' && !['high', 'medium'].includes(acc)) return 'low';
      return acc;
    }, 'low');

    // Get all response actions
    const allResponseActions = incidents.flatMap((incident, idx) => 
      (incident.response_actions || []).map(action => ({
        ...action,
        id: action.id || `action-${idx}-${Math.random().toString(36).substr(2, 9)}`,
        incident_id: incident.id,
        incident_title: incident.title,
        status: action.status || 'pending',
        timestamp: action.timestamp || new Date().toISOString(),
        priority: action.priority || 'medium'
      }))
    );

    // Get all MITRE mappings
    const mitreTactics = [];
    const mitreTechniques = [];
    const tacticSet = new Set();
    const techniqueSet = new Set();

    incidents.forEach(incident => {
      const mapping = incident.mitre_mapping;
      if (mapping?.tactic && !tacticSet.has(mapping.tactic.id)) {
        tacticSet.add(mapping.tactic.id);
        mitreTactics.push(mapping.tactic);
      }
      if (mapping?.technique && !techniqueSet.has(mapping.technique.id)) {
        techniqueSet.add(mapping.technique.id);
        mitreTechniques.push(mapping.technique);
      }
    });

    // Create a consolidated report
    return {
      id: `report-${uuidv4()}`,
      title: 'Consolidated Security Incident Report',
      severity: Object.entries(severityCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'medium',
      status: 'open',
      timestamp: new Date().toISOString(),
      summary: `This report contains ${incidents.length} security incidents. ` +
               `Severity breakdown: ${Object.entries(severityCounts)
                 .map(([severity, count]) => `${count} ${severity}`)
                 .join(', ')}.`,
      description: 'A consolidated report of multiple security incidents.',
      total_incidents: incidents.length,
      incident_summaries: incidentSummaries,
      incidents: incidents,
      affected_assets: allAssets,
      timeline: allTimelineEvents,
      recommendations: allRecommendations,
      evidence: allEvidence,
      threat_intelligence: allIOCs.length > 0 || allThreatActors.length > 0 ? {
        iocs: allIOCs,
        threat_actors: allThreatActors,
        confidence: highestConfidence
      } : null,
      response_actions: allResponseActions,
      mitre_mapping: {
        tactics: mitreTactics,
        techniques: mitreTechniques
      }
    };
  }
  
  // Single incident case
  const incident = incidents[0];
  const { 
    id, 
    title, 
    severity, 
    status, 
    timestamp, 
    summary, 
    description, 
    affected_assets = [], 
    timeline = [], 
    evidence = [], 
    recommendations = [], 
    mitre_mapping = null,
    threat_intelligence = null,
    response_actions = []
  } = incident;

  return {
    id: id || uuidv4(),
    title: title || 'Security Incident',
    severity: severity || 'medium',
    status: status || 'open',
    timestamp: timestamp || new Date().toISOString(),
    summary: summary || '',
    description: description || '',
    affected_assets: Array.isArray(affected_assets) ? affected_assets : [],
    timeline: Array.isArray(timeline) ? timeline : [],
    evidence: Array.isArray(evidence) ? evidence : [],
    recommendations: Array.isArray(recommendations) ? recommendations : [],
    mitre_mapping: mitre_mapping || null,
    threat_intelligence: threat_intelligence || null,
    response_actions: Array.isArray(response_actions) ? response_actions : [],
    total_incidents: 1
  };
}

// Export results
app.get('/api/export/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const { format = 'json' } = req.query; // Default to JSON
    
    // Try to get session from memory first, then from session manager
    let session = analysisSessions.get(sessionId);
    if (!session) {
      session = sessionManager.get(sessionId);
      if (session) {
        // Cache in memory for subsequent requests
        analysisSessions.set(sessionId, session);
      } else {
        console.error('Session not found for export:', sessionId);
        return res.status(404).json({ error: 'Session not found' });
      }
    }

    console.log('Export request - Session ID:', sessionId);
    console.log('Session data:', JSON.stringify({
      id: session.id,
      status: session.status,
      incidentCount: session.incidents?.length || 0,
      hasThreatIntel: session.incidents?.some(i => i.threat_intelligence),
      hasResponseActions: session.incidents?.some(i => i.response_actions?.length > 0)
    }, null, 2));

    if (!session.incidents || session.incidents.length === 0) {
      console.error('No incidents found in session');
      return res.status(404).json({ 
        error: 'No analysis results found',
        sessionStatus: session.status,
        hasIncidents: !!session.incidents,
        incidentsCount: session.incidents ? session.incidents.length : 0
      });
    }

    // Format the incidents data for export
    const formattedReport = formatIncidentsForExport(session.incidents);
    if (!formattedReport) {
      return res.status(404).json({ error: 'No valid report data available' });
    }

    // Add metadata to the report
    formattedReport.metadata = {
      generated_at: new Date().toISOString(),
      session_id: sessionId,
      total_incidents: formattedReport.total_incidents || 1,
      report_type: session.incidents.length > 1 ? 'consolidated' : 'single'
    };

    // Log report structure for debugging
    console.log('Generated report structure:', JSON.stringify({
      metadata: formattedReport.metadata,
      has_threat_intel: !!formattedReport.threat_intelligence,
      has_response_actions: formattedReport.response_actions?.length > 0,
      has_mitre_mapping: !!formattedReport.mitre_mapping,
      asset_count: formattedReport.affected_assets?.length || 0,
      timeline_events: formattedReport.timeline?.length || 0,
      evidence_count: formattedReport.evidence?.length || 0
    }, null, 2));

    let report, contentType, fileExtension;

    // Generate report in requested format
    try {
      switch (format.toLowerCase()) {
        case 'csv':
          report = reportGenerator.generateCSV([formattedReport]);
          contentType = 'text/csv';
          fileExtension = 'csv';
          break;
        case 'html':
          console.log('Generating HTML report...');
          report = reportGenerator.generateHTML([formattedReport]);
          console.log('HTML report generated successfully');
          contentType = 'text/html';
          fileExtension = 'html';
          res.setHeader('Content-Type', contentType);
          res.setHeader('Content-Disposition', `inline; filename=incident-report-${sessionId}.${fileExtension}`);
          return res.send(report);
        case 'md':
        case 'markdown':
          report = reportGenerator.generateMarkdown([formattedReport]);
          contentType = 'text/markdown';
          fileExtension = 'md';
          break;
        case 'json':
        default:
          report = JSON.stringify(formattedReport, null, 2);
          contentType = 'application/json';
          fileExtension = 'json';
      }
    } catch (genError) {
      console.error('Error generating report:', genError);
      return res.status(500).json({ 
        error: 'Failed to generate report',
        details: genError.message,
        stack: process.env.NODE_ENV === 'development' ? genError.stack : undefined
      });
    }

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Export failed: ' + error.message });
  }
});

// System settings endpoint
app.get('/api/settings', (req, res) => {
  res.json({
    version: '1.0.0',
    analysisEngine: 'Advanced AI Pattern Recognition',
    mitreVersion: 'v13.1',
    supportedFormats: ['JSON', 'CSV', 'TXT', 'LOG'],
    maxFileSize: '50MB',
    features: [
      'Real-time Analysis',
      'MITRE ATT&CK Mapping',
      'Threat Intelligence',
      'Automated Response',
      'Forensic Evidence'
    ]
  });
});

// Update settings endpoint
app.post('/api/settings', (req, res) => {
  // In a real implementation, this would update system settings
  res.json({ 
    message: 'Settings updated successfully',
    timestamp: new Date().toISOString()
  });
});

// Cleanup old files periodically
setInterval(() => {
  const uploadDir = path.join(__dirname, 'uploads');
  if (fs.existsSync(uploadDir)) {
    const files = fs.readdirSync(uploadDir);
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    files.forEach(file => {
      const filePath = path.join(uploadDir, file);
      const stats = fs.statSync(filePath);
      if (now - stats.mtime.getTime() > maxAge) {
        fs.unlinkSync(filePath);
        console.log(`Cleaned up old file: ${file}`);
      }
    });
  }
}, 60 * 60 * 1000); // Run every hour

app.listen(PORT, () => {
  console.log(`🔐 SideSOC Backend running on port ${PORT}`);
  console.log(`🚀 Health check: http://localhost:${PORT}/api/health`);
});