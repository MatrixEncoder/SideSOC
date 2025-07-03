import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { FileUpload } from './components/FileUpload';
import { AnalysisProgress as AnalysisProgressComponent } from './components/AnalysisProgress';
import IncidentReport from './components/IncidentReport';
import { ParticleBackground } from './components/ParticleBackground';
import { apiService } from './services/api';
import { IncidentReport as IncidentReportType, AnalysisProgress } from './types';
import { PlayCircle, Zap, Brain, Shield, Target, AlertTriangle } from 'lucide-react';

function App() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState<AnalysisProgress>({
    stage: 'Waiting',
    progress: 0,
    message: 'Ready to analyze logs'
  });
  const [incidents, setIncidents] = useState<IncidentReportType[]>([]);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');

  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  // Check backend health on startup
  useEffect(() => {
    checkBackendHealth();
  }, []);

  const checkBackendHealth = async () => {
    try {
      await apiService.checkHealth();
      setBackendStatus('online');
    } catch (error) {
      setBackendStatus('offline');
      console.error('Backend health check failed:', error);
    }
  };

  const handleFileUpload = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setAnalysisComplete(false);
  };

  const handleTextInput = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setAnalysisComplete(false);
  };

  const startAnalysis = async () => {
    if (!currentSessionId) return;

    setIsAnalyzing(true);
    setAnalysisComplete(false);
    setIncidents([]);

    try {
      const results = await apiService.startAnalysis(currentSessionId, setAnalysisProgress);
      setIncidents(results);
      setAnalysisComplete(true);
    } catch (error) {
      console.error('Analysis failed:', error);
      setAnalysisProgress({
        stage: 'Error',
        progress: 0,
        message: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (backendStatus === 'offline') {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <ParticleBackground />
        
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-red-500/30 via-amber-500/30 to-orange-500/30 rounded-2xl blur-xl opacity-50"></div>
            <div className="relative bg-gradient-to-br from-slate-800/90 via-slate-900/90 to-slate-800/90 backdrop-blur-xl rounded-2xl p-12 border border-red-500/30 text-center shadow-2xl max-w-lg mx-4">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <AlertTriangle className="h-16 w-16 text-red-400" />
                  <div className="absolute inset-0 animate-pulse">
                    <AlertTriangle className="h-16 w-16 text-red-300/30" />
                  </div>
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-red-400 mb-4">Backend Service Unavailable</h2>
              <p className="text-slate-300 mb-6">
                The SideSOC backend service is not running. Please start the backend server to continue.
              </p>
              
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-600/30 mb-6">
                <p className="text-slate-400 text-sm mb-2">To start the backend:</p>
                <code className="text-cyan-400 text-sm font-mono">npm run dev</code>
              </div>
              
              <button
                onClick={checkBackendHealth}
                className="group relative px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl transition-all duration-300 transform hover:scale-105"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-xl blur-xl group-hover:blur-2xl transition-all"></div>
                <span className="relative z-10 font-medium">Retry Connection</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <ParticleBackground />
      
      <div className="relative z-10">
        <Header 
          hasReports={incidents.length > 0} 
          currentSessionId={currentSessionId}
        />
        
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Input */}
            <div className="lg:col-span-1 space-y-6">
              <FileUpload 
                onFileUpload={handleFileUpload}
                onTextInput={handleTextInput}
                isAnalyzing={isAnalyzing}
              />
              
              {currentSessionId && !isAnalyzing && !analysisComplete && (
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/30 via-blue-500/30 to-purple-500/30 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                  <button
                    onClick={startAnalysis}
                    className="relative w-full flex items-center justify-center space-x-3 bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 hover:from-cyan-500 hover:via-blue-500 hover:to-purple-500 text-white py-4 px-6 rounded-2xl transition-all duration-300 font-semibold text-lg shadow-2xl transform hover:scale-105"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 via-blue-400/20 to-purple-400/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
                    <PlayCircle className="h-6 w-6 relative z-10" />
                    <span className="relative z-10">Start AI Analysis</span>
                    <Zap className="h-5 w-5 relative z-10" />
                  </button>
                </div>
              )}
            </div>

            {/* Right Column - Results */}
            <div className="lg:col-span-2 space-y-6">
              {(isAnalyzing || analysisComplete) && (
                <AnalysisProgressComponent
                  progress={analysisProgress}
                  isComplete={analysisComplete}
                  incidentCount={incidents.length}
                />
              )}

              {analysisComplete && incidents.length > 0 && (
                <div className="space-y-6">
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-red-500/20 via-amber-500/20 to-orange-500/20 rounded-2xl blur-xl opacity-50"></div>
                    <div className="relative flex items-center justify-between bg-gradient-to-r from-red-900/30 via-amber-900/30 to-orange-900/30 backdrop-blur-xl rounded-2xl p-6 border border-red-500/30">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <Target className="h-8 w-8 text-red-400" />
                          <div className="absolute inset-0 animate-pulse">
                            <Target className="h-8 w-8 text-red-300/30" />
                          </div>
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold bg-gradient-to-r from-red-400 to-amber-400 bg-clip-text text-transparent">
                            Security Incidents Detected
                          </h2>
                          <p className="text-red-300/80">
                            {incidents.length} threat{incidents.length !== 1 ? 's' : ''} identified requiring immediate attention
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-red-400">{incidents.length}</div>
                        <div className="text-sm text-red-300/60">Incidents</div>
                      </div>
                    </div>
                  </div>
                  
                  {incidents.map((incident) => (
                    <IncidentReport key={incident.id} report={incident} />
                  ))}
                </div>
              )}

              {!currentSessionId && !isAnalyzing && !analysisComplete && (
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 rounded-2xl blur-xl opacity-50"></div>
                  <div className="relative bg-gradient-to-br from-slate-800/90 via-slate-900/90 to-slate-800/90 backdrop-blur-xl rounded-2xl border border-cyan-500/20 p-12 text-center shadow-2xl">
                    <div className="max-w-lg mx-auto space-y-6">
                      <div className="flex justify-center space-x-4 mb-6">
                        <div className="relative">
                          <Brain className="h-12 w-12 text-cyan-400" />
                          <div className="absolute inset-0 animate-pulse">
                            <Brain className="h-12 w-12 text-cyan-300/30" />
                          </div>
                        </div>
                        <div className="relative">
                          <Shield className="h-12 w-12 text-blue-400" />
                          <div className="absolute inset-0 animate-pulse">
                            <Shield className="h-12 w-12 text-blue-300/30" />
                          </div>
                        </div>
                      </div>
                      
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                        Welcome to SideSOC
                      </h3>
                      
                      <p className="text-slate-300 text-lg leading-relaxed">
                        Advanced AI-powered cybersecurity analysis platform for SOC analysts
                      </p>
                      
                      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-600/30">
                        <p className="text-slate-400 mb-4">
                          Upload your SIEM logs or paste log data to begin comprehensive security analysis
                        </p>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="text-cyan-400">✓ Threat Detection</div>
                          <div className="text-blue-400">✓ MITRE ATT&CK Mapping</div>
                          <div className="text-purple-400">✓ Incident Reports</div>
                          <div className="text-emerald-400">✓ Response Actions</div>
                        </div>
                      </div>
                      
                      <p className="text-sm text-slate-500">
                        Supported formats: JSON, CSV, TXT, and LOG files from Splunk, QRadar, ELK, and other SIEM tools
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;