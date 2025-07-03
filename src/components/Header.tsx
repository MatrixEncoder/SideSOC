import React, { useState, useEffect } from 'react';
import { Shield, Settings, Download, ChevronDown, X } from 'lucide-react';
import { SettingsModal } from './SettingsModal';


interface HeaderProps {
  hasReports: boolean;
  currentSessionId?: string;
}

export const Header: React.FC<HeaderProps> = ({ hasReports, currentSessionId }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState('json');
  const [error, setError] = useState<string | null>(null);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleExport = async () => {
    if (!hasReports || !currentSessionId) {
      setError('No report data available for export');
      return;
    }
    
    setExporting(true);
    setError(null);
    
    try {
      console.log(`Initiating export with session ID: ${currentSessionId}, format: ${exportFormat}`);
      const response = await fetch(`http://localhost:3001/api/export/${currentSessionId}?format=${exportFormat}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `Export failed with status ${response.status}`;
        console.error('Export error:', errorMessage, errorData);
        throw new Error(errorMessage);
      }
      
      const contentType = response.headers.get('content-type') || '';
      console.log('Export response content type:', contentType);
      
      // Handle HTML response (preview in new tab)
      if (contentType.includes('text/html')) {
        const html = await response.text();
        const newWindow = window.open('', '_blank');
        if (newWindow) {
          newWindow.document.write(html);
          newWindow.document.close();
        } else {
          throw new Error('Pop-up blocked. Please allow pop-ups for this site.');
        }
        return;
      }
      
      // Handle other formats (download)
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Set appropriate filename
      const contentDisposition = response.headers.get('content-disposition') || '';
      let filename = `sidesoc-report-${new Date().toISOString().split('T')[0]}`;
      
      // Extract filename from content-disposition header if available
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, '');
      } else {
        // Fallback to extension based on content type
        let extension = 'bin';
        if (contentType.includes('json')) extension = 'json';
        else if (contentType.includes('csv')) extension = 'csv';
        else if (contentType.includes('markdown')) extension = 'md';
        filename = `${filename}.${extension}`;
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Export failed:', error);
      setError(error instanceof Error ? error.message : 'Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <header className="relative bg-gradient-to-r from-slate-900/80 via-blue-900/40 to-slate-900/80 backdrop-blur-xl border-b border-cyan-500/20 px-6 py-4 shadow-2xl">
        {/* Error Notification */}
        {error && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
            <div className="flex items-center bg-red-600/90 text-white px-4 py-2 rounded-lg shadow-lg">
              <span className="mr-2">{error}</span>
              <button 
                onClick={() => setError(null)}
                className="text-white hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-cyan-500/5 to-purple-600/5"></div>
        
        <div className="relative flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative group">
              <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
              <div className="relative flex items-center space-x-3 bg-slate-900/50 backdrop-blur-sm rounded-full px-4 py-2 border border-cyan-500/30">
                <div className="relative">
                  <Shield className="h-8 w-8 text-cyan-400" />
                  <div className="absolute inset-0 animate-pulse">
                    <Shield className="h-8 w-8 text-cyan-300/50" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                    SideSOC
                  </h1>
                  <p className="text-xs text-cyan-300/70 font-medium">
                    AI-Powered Security Operations
                  </p>
                </div>
              </div>
            </div>
            
            <div className="hidden md:flex items-center space-x-2 bg-slate-800/50 backdrop-blur-sm rounded-full px-4 py-2 border border-emerald-500/20">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-emerald-300 text-sm font-medium">System Online</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="relative group">
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                  disabled={!hasReports || exporting}
                  className={`appearance-none bg-slate-800/50 border ${
                    !hasReports || exporting ? 'border-slate-700/50' : 'border-slate-600/30 hover:border-cyan-500/50'
                  } rounded-lg px-3 py-2 pr-8 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 cursor-pointer transition-colors`}
                >
                  <option value="json">JSON</option>
                  <option value="csv">CSV</option>
                  <option value="html">HTML</option>
                  <option value="md">Markdown</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </div>
              </div>
              
              <button
                onClick={handleExport}
                disabled={!hasReports || exporting}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  !hasReports || exporting
                    ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-500 hover:to-blue-500 shadow-lg hover:shadow-cyan-500/20'
                }`}
              >
                {exporting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Extract Report</span>
                  </>
                )}
              </button>
            </div> 
            <button 
              onClick={() => setShowSettings(true)}
              className="group relative p-3 text-slate-300 hover:text-white bg-slate-800/50 hover:bg-slate-700/50 backdrop-blur-sm rounded-xl border border-slate-600/30 hover:border-slate-500/50 transition-all duration-300 transform hover:scale-105"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <Settings className="h-5 w-5 relative z-10" />
            </button>
          </div>
        </div>
      </header>

      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />
    </>
  );
};