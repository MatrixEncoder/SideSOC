import React from 'react';
import { 
  AlertTriangle,
  AlertCircle,
  Activity,
  Shield,
  Users,
  Target,
  FileText
} from 'lucide-react';
import { IncidentReport as IncidentReportType } from '../types';

// Section component has been removed as it's not being used

// Enhanced type definitions to match the backend response
interface MitreTactic {
  id: string;
  name: string;
  reference: string;
}

interface MitreTechnique {
  id: string;
  name: string;
  reference: string;
  tactics: string[];
}

interface BackendMitreMapping {
  tactic: MitreTactic;
  technique: MitreTechnique;
  description: string;
}

interface Asset {
  id: string;
  type: string;
  value: string;
  risk_level?: 'critical' | 'high' | 'medium' | 'low';
  first_seen?: string;
  last_seen?: string;
}

interface TimelineEvent {
  id: string;
  timestamp: string;
  description: string;
  source: string;
  severity?: 'info' | 'low' | 'medium' | 'high' | 'critical';
}

interface Evidence {
  id: string;
  timestamp: string;
  source_ip?: string;
  username?: string;
  hostname?: string;
  event_type?: string;
  message: string;
  severity?: 'info' | 'low' | 'medium' | 'high' | 'critical';
  raw_log?: string;
  confidence?: number;
}

type SeverityLevel = 'critical' | 'high' | 'medium' | 'low';

interface BackendIncidentReport extends Omit<IncidentReportType, 'mitre_mapping' | 'affected_assets' | 'timeline' | 'recommendations' | 'evidence' | 'description' | 'summary' | 'title' | 'severity'> {
  timestamp?: string;
  status?: string;
  mitre_mapping?: BackendMitreMapping;
  affected_assets?: Asset[];
  timeline?: TimelineEvent[];
  recommendations?: string[];
  evidence?: Evidence[];
  description?: string;
  summary?: string;
  title: string;
  severity?: SeverityLevel;
}

interface IncidentReportProps {
  report: BackendIncidentReport;
}

// Add this at the top with other imports

const IncidentReport: React.FC<IncidentReportProps> = ({ report }) => {
  console.log('IncidentReport rendering with report:', report);
  
  // Add a null check for report
  if (!report) {
    console.error('No report data provided to IncidentReport');
    return (
      <div className="p-4 bg-yellow-900/30 text-yellow-200 border border-yellow-700/50 rounded-lg">
        <h2 className="text-lg font-bold">No Report Data</h2>
        <p>Unable to display incident report. No data was provided.</p>
      </div>
    );
  }
  // Fallback to current timestamp if not provided
  const timestamp = report.timestamp || new Date().toISOString();
  
  // Log for debugging
  console.log('Rendering IncidentReport with data:', { report, timestamp });
  
  // Format the timestamp for display
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'No date provided';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Define severity type for better type safety
  type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';
  
  // Type guard for SeverityLevel
  const isSeverityLevel = (value: string): value is SeverityLevel => {
    return ['critical', 'high', 'medium', 'low', 'info'].includes(value.toLowerCase());
  };
  
  // Safely get severity level with fallback
  const getSeverityLevel = (level?: string): SeverityLevel => {
    if (!level) return 'medium';
    return isSeverityLevel(level) ? level.toLowerCase() as SeverityLevel : 'medium';
  };

  // Get severity color classes
  const getSeverityColor = (severity: string = 'medium'): string => {
    const severityLower = getSeverityLevel(severity);
    switch (severityLower) {
      case 'critical':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'high':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      case 'low':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
    }
  };

  // Get severity icon
  const getSeverityIcon = (severity: string = 'medium'): JSX.Element => {
    const severityLower = getSeverityLevel(severity);
    switch (severityLower) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-400" />;
      case 'high':
        return <AlertCircle className="h-5 w-5 text-orange-400" />;
      case 'medium':
        return <AlertCircle className="h-5 w-5 text-yellow-400" />;
      case 'low':
        return <Shield className="h-5 w-5 text-blue-400" />;
      default:
        return <Activity className="h-5 w-5 text-gray-400" />;
    }
  };

  // Safely access report properties with defaults
  const {
    affected_assets = [],
    timeline = [],
    evidence = [],
    recommendations = [],
    mitre_mapping: mitreMapping,
    severity: reportSeverity = 'medium',
    id: reportId = 'unknown',
    title = 'Untitled Incident',
    description = 'No description provided',
    summary = 'No summary available'
  } = report || {};

  // This check is now handled at the beginning of the component

  // Helper function to safely render MITRE mapping
  const renderMitreMapping = () => {
    if (!mitreMapping) return null;
    
    return (
      <div className="space-y-2">
        <div className="flex items-center space-x-4 text-gray-200">
          <span className="font-medium">Tactic:</span>
          <span>{mitreMapping.tactic?.name || 'N/A'} ({mitreMapping.tactic?.id || 'N/A'})</span>
        </div>
        <div className="flex items-center space-x-4 text-gray-200">
          <span className="font-medium">Technique:</span>
          <span>{mitreMapping.technique?.name || 'N/A'} ({mitreMapping.technique?.id || 'N/A'})</span>
        </div>
        {mitreMapping.description && (
          <div className="text-sm text-gray-200 leading-relaxed">
            {mitreMapping.description}
          </div>
        )}
      </div>
    );
  };

  // Helper function to render evidence items
  const renderEvidence = (item: Evidence) => (
    <div key={item.id} className="relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div className="relative bg-slate-900/70 backdrop-blur-sm border border-purple-500/30 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between p-3 bg-purple-900/20 border-b border-purple-500/20">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 text-gray-200">
                <span className="text-sm font-medium text-white">{item.source_ip || 'Unknown IP'}</span>
                <span className="text-xs text-gray-400 mx-1">•</span>
                <span className="text-xs text-gray-300">{formatDate(item.timestamp)}</span>
                {item.severity && (
                  <>
                    <span className="text-sm text-gray-300">•</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getSeverityColor(item.severity)}`}>
                      {item.severity}
                    </span>
                  </>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-200">{item.message}</p>
              {item.raw_log && (
                <div className="mt-2 p-2 bg-slate-800 rounded text-xs font-mono text-gray-400 overflow-x-auto">
                  {item.raw_log}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 bg-gray-900 min-h-screen text-gray-100" data-testid="incident-report">
      <div className="bg-gray-800/95 rounded-lg shadow-lg overflow-hidden border border-gray-700 backdrop-blur-sm">
        {/* Header */}
        <div className="bg-blue-900 text-white p-6 border-b border-blue-700">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-white">{title}</h1>
              <p className="text-blue-200 mt-2">{summary}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-blue-100">Report ID: <span className="font-mono">{reportId}</span></div>
              <div className="text-sm text-blue-100">{formatDate(timestamp)}</div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          {/* Incident Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
              <p className="text-sm text-slate-400">Severity</p>
              <div className="mt-1 flex items-center">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(reportSeverity)}`}>
                  {getSeverityIcon(reportSeverity)}
                  <span className="ml-1.5 capitalize">
                    {reportSeverity?.toLowerCase() || 'unknown'}
                  </span>
                </span>
              </div>
            </div>
            
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
              <p className="text-sm text-slate-400">Status</p>
              <div className="mt-1">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  {report.status || 'New'}
                </span>
              </div>
            </div>
            
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
              <p className="text-sm text-slate-400">Reported</p>
              <p className="mt-1 text-white font-medium">
                {timestamp ? formatDate(timestamp) : 'Unknown'}
              </p>
            </div>
          </div>

          {/* Summary Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4 pb-2 border-b border-gray-700">Incident Details</h2>
            <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
              <p className="text-gray-200 leading-relaxed whitespace-pre-line text-base">{description}</p>
            </div>
          </div>

          {/* Affected Assets */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-400" />
              <span>Affected Assets</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {affected_assets.length > 0 ? (
                affected_assets.map((asset: Asset) => (
                  <div key={asset.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center">
                      <Users className="h-4 w-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white capitalize">{asset.type}</p>
                      <p className="text-sm text-gray-300">{asset.value}</p>
                      {asset.risk_level && (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${getSeverityColor(asset.risk_level)}`}>
                          {asset.risk_level}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                  <p className="text-slate-400 text-center">No affected assets identified.</p>
                </div>
              )}
            </div>
          </div>

          {/* Timeline Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4 pb-2 border-b border-gray-700">Timeline of Events</h2>
            <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
              <div className="p-6">
                <div className="space-y-6">
                  {timeline.map((event: TimelineEvent, index: number) => (
                    <div key={event.id} className="flex">
                      <div className="flex flex-col items-center mr-4">
                        <div className="w-3 h-3 rounded-full bg-blue-500 mt-1"></div>
                        {index < timeline.length - 1 && (
                          <div className="w-0.5 h-full bg-gray-600 my-1"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                          <span className="text-sm font-medium text-white">{event.source}</span>
                          <span className="text-xs text-gray-400 sm:ml-4 whitespace-nowrap">
                            {formatDate(event.timestamp)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-300">{event.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* MITRE ATT&CK Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4 pb-2 border-b border-gray-700">Threat Intelligence</h2>
            <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
              {/* MITRE ATT&CK Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                  <Target className="h-5 w-5 text-purple-400" />
                  <span>MITRE ATT&CK Details</span>
                </h3>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                  {renderMitreMapping()}
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4 pb-2 border-b border-gray-700">Response Actions</h2>
            <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
              <div className="p-6">
                <div className="space-y-3">
                  {recommendations.map((recommendation, index) => (
                    <div key={index} className="relative group">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/10 to-green-500/10 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="relative flex items-start space-x-4 p-4 bg-slate-800/50 backdrop-blur-sm rounded-lg border border-emerald-500/30">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center">
                            <FileText className="h-4 w-4 text-green-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-200">{recommendation}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Evidence Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4 pb-2 border-b border-gray-700">Forensic Evidence</h2>
            <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
              <div className="p-6">
                <div className="space-y-3">
                  {evidence.map(renderEvidence)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncidentReport;