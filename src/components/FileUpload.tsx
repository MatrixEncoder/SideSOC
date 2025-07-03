import React, { useCallback, useState } from 'react';
import { Upload, File, AlertCircle, X, Sparkles, Cpu, CheckCircle } from 'lucide-react';
import { apiService } from '../services/api';

interface FileUploadProps {
  onFileUpload: (sessionId: string, filename: string) => void;
  onTextInput: (sessionId: string) => void;
  isAnalyzing: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ 
  onFileUpload, 
  onTextInput, 
  isAnalyzing 
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const [inputMode, setInputMode] = useState<'file' | 'text'>('file');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFile = async (file: File) => {
    if (!file.name.match(/\.(json|csv|txt|log)$/i)) {
      setError('Please upload a .json, .csv, .txt, or .log file');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const session = await apiService.uploadFile(file);
      setUploadedFile(session.filename);
      onFileUpload(session.sessionId, session.filename);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleTextSubmit = async () => {
    if (!textInput.trim()) return;

    setUploading(true);
    setError(null);

    try {
      const session = await apiService.submitTextInput(textInput);
      setUploadedFile('Text Input');
      onTextInput(session.sessionId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const clearInput = () => {
    setUploadedFile(null);
    setTextInput('');
    setError(null);
  };

  return (
    <div className="relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
      
      <div className="relative bg-gradient-to-br from-slate-800/90 via-slate-900/90 to-slate-800/90 backdrop-blur-xl rounded-2xl p-6 border border-cyan-500/20 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Cpu className="h-6 w-6 text-cyan-400" />
              <div className="absolute inset-0 animate-pulse">
                <Cpu className="h-6 w-6 text-cyan-300/30" />
              </div>
            </div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Log Input
            </h2>
          </div>
          
          <div className="flex bg-slate-700/50 backdrop-blur-sm rounded-xl p-1 border border-slate-600/30">
            <button
              onClick={() => setInputMode('file')}
              className={`relative px-4 py-2 text-sm rounded-lg transition-all duration-300 ${
                inputMode === 'file'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg'
                  : 'text-slate-300 hover:text-white hover:bg-slate-600/50'
              }`}
            >
              {inputMode === 'file' && (
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-lg blur-lg"></div>
              )}
              <span className="relative z-10">File Upload</span>
            </button>
            <button
              onClick={() => setInputMode('text')}
              className={`relative px-4 py-2 text-sm rounded-lg transition-all duration-300 ${
                inputMode === 'text'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg'
                  : 'text-slate-300 hover:text-white hover:bg-slate-600/50'
              }`}
            >
              {inputMode === 'text' && (
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-lg blur-lg"></div>
              )}
              <span className="relative z-10">Text Input</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-red-500/30 to-pink-500/30 rounded-xl blur opacity-50"></div>
            <div className="relative flex items-center space-x-3 p-4 bg-gradient-to-r from-red-900/30 to-pink-900/30 backdrop-blur-sm border border-red-500/30 rounded-xl">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
              <span className="text-red-300">{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-300 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {inputMode === 'file' ? (
          <div>
            {uploadedFile ? (
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/30 to-cyan-500/30 rounded-xl blur opacity-50"></div>
                <div className="relative flex items-center justify-between p-4 bg-gradient-to-r from-emerald-900/30 to-cyan-900/30 backdrop-blur-sm border border-emerald-500/30 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <CheckCircle className="h-5 w-5 text-emerald-400" />
                      <div className="absolute inset-0 animate-pulse">
                        <CheckCircle className="h-5 w-5 text-emerald-300/30" />
                      </div>
                    </div>
                    <span className="text-emerald-300 font-medium">{uploadedFile}</span>
                  </div>
                  <button
                    onClick={clearInput}
                    className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-700/50 rounded-lg"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div
                className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
                  dragActive
                    ? 'border-cyan-400 bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-purple-500/10 scale-105'
                    : 'border-slate-600/50 hover:border-cyan-500/50 hover:bg-slate-800/30'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="relative">
                  <div className={`mx-auto mb-4 transition-all duration-300 ${dragActive ? 'scale-110' : ''}`}>
                    <div className="relative">
                      <Upload className="h-16 w-16 text-cyan-400 mx-auto" />
                      {dragActive && (
                        <div className="absolute inset-0 animate-ping">
                          <Upload className="h-16 w-16 text-cyan-300/50 mx-auto" />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-xl text-slate-200 mb-2 font-medium">
                    Drop your SIEM logs here
                  </p>
                  <p className="text-sm text-slate-400 mb-6">
                    Supports .json, .csv, .txt, and .log files
                  </p>
                  
                  <input
                    type="file"
                    accept=".json,.csv,.txt,.log"
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                    className="hidden"
                    id="file-upload"
                    disabled={isAnalyzing || uploading}
                  />
                  <label
                    htmlFor="file-upload"
                    className={`group relative inline-flex items-center px-6 py-3 border rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                      isAnalyzing || uploading
                        ? 'bg-slate-700/50 text-slate-400 cursor-not-allowed border-slate-600/30'
                        : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white border-transparent shadow-lg hover:shadow-cyan-500/25'
                    }`}
                  >
                    {!isAnalyzing && !uploading && (
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-xl blur-xl group-hover:blur-2xl transition-all"></div>
                    )}
                    <Upload className="h-5 w-5 mr-2 relative z-10" />
                    <span className="relative z-10 font-medium">
                      {uploading ? 'Uploading...' : 'Choose File'}
                    </span>
                  </label>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Paste your log data here..."
                className="w-full h-48 bg-slate-900/50 backdrop-blur-sm border border-slate-600/50 focus:border-cyan-500/50 rounded-xl p-4 text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-cyan-500/20 resize-none transition-all duration-300"
                disabled={isAnalyzing || uploading}
              />
              <div className="absolute top-3 right-3">
                <Sparkles className="h-4 w-4 text-slate-500" />
              </div>
            </div>
            
            <button
              onClick={handleTextSubmit}
              disabled={!textInput.trim() || isAnalyzing || uploading}
              className={`group relative w-full py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                textInput.trim() && !isAnalyzing && !uploading
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg hover:shadow-cyan-500/25'
                  : 'bg-slate-700/50 text-slate-400 cursor-not-allowed'
              }`}
            >
              {textInput.trim() && !isAnalyzing && !uploading && (
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-xl blur-xl group-hover:blur-2xl transition-all"></div>
              )}
              <span className="relative z-10 font-medium">
                {uploading ? 'Processing...' : 'Analyze Logs'}
              </span>
            </button>
          </div>
        )}

        {uploadedFile && (
          <div className="mt-6 relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur opacity-50"></div>
            <div className="relative p-4 bg-gradient-to-r from-blue-900/20 to-purple-900/20 backdrop-blur-sm border border-blue-500/30 rounded-xl">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-300 mb-1">File uploaded successfully</p>
                  <p className="text-blue-400/80">
                    Click "Start Analysis" to begin AI-powered security analysis
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};