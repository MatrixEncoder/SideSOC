import React from 'react';
import { Loader2, CheckCircle, AlertTriangle, Zap, Brain, Shield } from 'lucide-react';
import { AnalysisProgress as AnalysisProgressType } from '../types';

interface AnalysisProgressProps {
  progress: AnalysisProgressType;
  isComplete: boolean;
  incidentCount: number;
}

export const AnalysisProgress: React.FC<AnalysisProgressProps> = ({
  progress,
  isComplete,
  incidentCount
}) => {
  const getIcon = () => {
    if (isComplete) {
      return incidentCount > 0 ? (
        <div className="relative">
          <AlertTriangle className="h-6 w-6 text-amber-400" />
          <div className="absolute inset-0 animate-pulse">
            <AlertTriangle className="h-6 w-6 text-amber-300/30" />
          </div>
        </div>
      ) : (
        <div className="relative">
          <CheckCircle className="h-6 w-6 text-emerald-400" />
          <div className="absolute inset-0 animate-pulse">
            <CheckCircle className="h-6 w-6 text-emerald-300/30" />
          </div>
        </div>
      );
    }
    return (
      <div className="relative">
        <Brain className="h-6 w-6 text-cyan-400 animate-pulse" />
        <div className="absolute inset-0">
          <Loader2 className="h-6 w-6 text-cyan-300/50 animate-spin" />
        </div>
      </div>
    );
  };

  const getGradientColors = () => {
    if (isComplete) {
      return incidentCount > 0 
        ? 'from-amber-500/20 via-orange-500/20 to-red-500/20' 
        : 'from-emerald-500/20 via-cyan-500/20 to-blue-500/20';
    }
    return 'from-cyan-500/20 via-blue-500/20 to-purple-500/20';
  };

  const getBorderColors = () => {
    if (isComplete) {
      return incidentCount > 0 ? 'border-amber-500/30' : 'border-emerald-500/30';
    }
    return 'border-cyan-500/30';
  };

  const getTextColor = () => {
    if (isComplete) {
      return incidentCount > 0 ? 'text-amber-300' : 'text-emerald-300';
    }
    return 'text-cyan-300';
  };

  return (
    <div className="relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
      
      <div className={`relative bg-gradient-to-br ${getGradientColors()} backdrop-blur-xl rounded-2xl p-6 border ${getBorderColors()} shadow-2xl`}>
        <div className="flex items-center space-x-4 mb-6">
          {getIcon()}
          <div className="flex-1">
            <h3 className={`text-xl font-bold ${getTextColor()}`}>
              {isComplete 
                ? incidentCount > 0 
                  ? `Analysis Complete - ${incidentCount} Threat${incidentCount !== 1 ? 's' : ''} Detected`
                  : 'Analysis Complete - All Clear'
                : 'AI Security Analysis in Progress'
              }
            </h3>
            {!isComplete && (
              <div className="flex items-center space-x-2 mt-1">
                <Zap className="h-4 w-4 text-cyan-400" />
                <span className="text-cyan-400 text-sm font-medium">Powered by Advanced AI</span>
              </div>
            )}
          </div>
          
          {isComplete && (
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-slate-400" />
              <span className="text-slate-400 text-sm">Secure Analysis</span>
            </div>
          )}
        </div>

        {!isComplete && (
          <div className="space-y-4">
            <div className="flex justify-between text-sm text-slate-300 mb-2">
              <span className="font-medium">{progress.stage}</span>
              <span className="font-bold">{progress.progress}%</span>
            </div>
            
            <div className="relative w-full bg-slate-800/50 rounded-full h-3 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-slate-700/50 to-slate-600/50 rounded-full"></div>
              <div
                className="relative h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-full transition-all duration-500 shadow-lg"
                style={{ width: `${progress.progress}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/50 to-purple-400/50 rounded-full animate-pulse"></div>
              </div>
            </div>
            
            <p className="text-slate-300 text-sm bg-slate-800/30 backdrop-blur-sm rounded-lg p-3 border border-slate-600/30">
              {progress.message}
            </p>
          </div>
        )}

        {isComplete && (
          <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-4 border border-slate-600/30">
            <div className="text-sm text-slate-300">
              {incidentCount > 0 ? (
                <div className="space-y-2">
                  <p className="font-medium text-amber-300">⚠️ Security threats detected in your logs</p>
                  <p>Review the detailed incident reports below for analysis and recommended response actions.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="font-medium text-emerald-300">✅ No security threats detected</p>
                  <p>Your logs appear clean with no suspicious activities or security incidents identified.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};