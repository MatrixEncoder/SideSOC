import React, { useState, useEffect } from 'react';
import { X, Settings, Cpu, Shield, Zap, Database, Globe, Save } from 'lucide-react';
import { apiService, SystemSettings } from '../services/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getSettings();
      setSettings(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    
    setSaving(true);
    try {
      await apiService.updateSettings(settings);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/30 via-blue-500/30 to-purple-500/30 rounded-2xl blur-xl opacity-50"></div>
        
        <div className="relative bg-gradient-to-br from-slate-800/95 via-slate-900/95 to-slate-800/95 backdrop-blur-xl rounded-2xl border border-cyan-500/20 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-600/30">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Settings className="h-6 w-6 text-cyan-400" />
                <div className="absolute inset-0 animate-pulse">
                  <Settings className="h-6 w-6 text-cyan-300/30" />
                </div>
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                System Settings
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all duration-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[70vh] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="relative">
                  <Cpu className="h-8 w-8 text-cyan-400 animate-pulse" />
                  <div className="absolute inset-0">
                    <Cpu className="h-8 w-8 text-cyan-300/50 animate-spin" />
                  </div>
                </div>
                <span className="ml-3 text-slate-300">Loading settings...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-red-400 mb-2">Failed to load settings</div>
                <div className="text-slate-400 text-sm">{error}</div>
                <button
                  onClick={loadSettings}
                  className="mt-4 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : settings ? (
              <div className="space-y-6">
                {/* System Information */}
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl blur opacity-50"></div>
                  <div className="relative bg-gradient-to-r from-blue-900/20 to-cyan-900/20 backdrop-blur-sm rounded-xl p-6 border border-blue-500/30">
                    <div className="flex items-center space-x-3 mb-4">
                      <Cpu className="h-5 w-5 text-blue-400" />
                      <h3 className="text-lg font-semibold text-blue-300">System Information</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Version</label>
                        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-600/30">
                          <span className="text-slate-200 font-mono">{settings.version}</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Analysis Engine</label>
                        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-600/30">
                          <span className="text-slate-200">{settings.analysisEngine}</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">MITRE ATT&CK Version</label>
                        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-600/30">
                          <span className="text-slate-200 font-mono">{settings.mitreVersion}</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Max File Size</label>
                        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-600/30">
                          <span className="text-slate-200">{settings.maxFileSize}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Supported Formats */}
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-green-500/20 rounded-xl blur opacity-50"></div>
                  <div className="relative bg-gradient-to-r from-emerald-900/20 to-green-900/20 backdrop-blur-sm rounded-xl p-6 border border-emerald-500/30">
                    <div className="flex items-center space-x-3 mb-4">
                      <Database className="h-5 w-5 text-emerald-400" />
                      <h3 className="text-lg font-semibold text-emerald-300">Supported Formats</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {settings.supportedFormats.map((format, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-emerald-900/30 text-emerald-300 rounded-full text-sm border border-emerald-500/30"
                        >
                          {format}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl blur opacity-50"></div>
                  <div className="relative bg-gradient-to-r from-purple-900/20 to-pink-900/20 backdrop-blur-sm rounded-xl p-6 border border-purple-500/30">
                    <div className="flex items-center space-x-3 mb-4">
                      <Zap className="h-5 w-5 text-purple-400" />
                      <h3 className="text-lg font-semibold text-purple-300">Active Features</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {settings.features.map((feature, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-3 p-3 bg-purple-900/20 rounded-lg border border-purple-500/20"
                        >
                          <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                          <span className="text-purple-200">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Network Configuration */}
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-xl blur opacity-50"></div>
                  <div className="relative bg-gradient-to-r from-amber-900/20 to-orange-900/20 backdrop-blur-sm rounded-xl p-6 border border-amber-500/30">
                    <div className="flex items-center space-x-3 mb-4">
                      <Globe className="h-5 w-5 text-amber-400" />
                      <h3 className="text-lg font-semibold text-amber-300">Network Configuration</h3>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">API Endpoint</label>
                        <input
                          type="text"
                          value="http://localhost:3001/api"
                          readOnly
                          className="w-full bg-slate-800/50 border border-slate-600/30 rounded-lg p-3 text-slate-200 font-mono"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                        <span className="text-emerald-300 text-sm">Backend Connected</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-slate-600/30">
            <div className="text-sm text-slate-400">
              Last updated: {new Date().toLocaleString()}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className={`group relative flex items-center space-x-2 px-6 py-2 rounded-lg font-medium transition-all duration-300 ${
                  saving
                    ? 'bg-slate-700/50 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white shadow-lg hover:shadow-emerald-500/25 transform hover:scale-105'
                }`}
              >
                {!saving && (
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-cyan-400/20 rounded-lg blur-xl group-hover:blur-2xl transition-all"></div>
                )}
                <Save className="h-4 w-4 relative z-10" />
                <span className="relative z-10">{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};