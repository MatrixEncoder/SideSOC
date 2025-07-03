import { LogEntry, IncidentReport, AnalysisProgress } from '../types';

export class MockLogAnalyzer {
  private incidents: IncidentReport[] = [];
  private progressCallback?: (progress: AnalysisProgress) => void;

  setProgressCallback(callback: (progress: AnalysisProgress) => void) {
    this.progressCallback = callback;
  }

  private updateProgress(stage: string, progress: number, message: string) {
    if (this.progressCallback) {
      this.progressCallback({ stage, progress, message });
    }
  }

  async analyzeFile(content: string, filename: string): Promise<IncidentReport[]> {
    this.incidents = [];
    
    this.updateProgress('Parsing logs', 10, 'Reading and parsing log file...');
    await this.delay(800);

    this.updateProgress('Pattern detection', 30, 'Analyzing patterns and anomalies...');
    await this.delay(1200);

    this.updateProgress('Correlation analysis', 60, 'Correlating events across timeline...');
    await this.delay(1000);

    this.updateProgress('MITRE mapping', 80, 'Mapping findings to MITRE ATT&CK framework...');
    await this.delay(800);

    this.updateProgress('Generating reports', 95, 'Creating incident reports...');
    
    // Mock analysis based on content
    await this.performMockAnalysis(content, filename);
    await this.delay(500);

    this.updateProgress('Complete', 100, 'Analysis completed successfully');
    
    return this.incidents;
  }

  private async performMockAnalysis(content: string, filename: string) {
    const lines = content.split('\n').filter(line => line.trim());
    
    // Mock detection patterns
    const bruteForcePattern = /failed login|authentication failed|invalid password|login attempt/i;
    const privEscPattern = /sudo|privilege|administrator|elevated|runas/i;
    const suspiciousCommandPattern = /powershell|cmd\.exe|base64|encoded|obfuscated/i;
    const networkAnomalyPattern = /unusual traffic|port scan|connection refused|timeout/i;

    // Analyze content for different threat types
    let bruteForceCount = 0;
    let privEscCount = 0;
    let suspiciousCommands = 0;
    let networkAnomalies = 0;

    lines.forEach(line => {
      if (bruteForcePattern.test(line)) bruteForceCount++;
      if (privEscPattern.test(line)) privEscCount++;
      if (suspiciousCommandPattern.test(line)) suspiciousCommands++;
      if (networkAnomalyPattern.test(line)) networkAnomalies++;
    });

    // Generate incidents based on analysis
    if (bruteForceCount > 3 || content.toLowerCase().includes('brute') || 
        content.toLowerCase().includes('failed login')) {
      this.incidents.push(this.generateBruteForceIncident(lines));
    }

    if (privEscCount > 1 || content.toLowerCase().includes('privilege') || 
        content.toLowerCase().includes('sudo')) {
      this.incidents.push(this.generatePrivilegeEscalationIncident(lines));
    }

    if (suspiciousCommands > 0 || content.toLowerCase().includes('powershell') || 
        content.toLowerCase().includes('encoded')) {
      this.incidents.push(this.generateSuspiciousCommandIncident(lines));
    }

    // If no specific patterns, generate a generic incident for demo purposes
    if (this.incidents.length === 0 && lines.length > 5) {
      this.incidents.push(this.generateGenericIncident(lines));
    }
  }

  private generateBruteForceIncident(logs: string[]): IncidentReport {
    return {
      id: `INC-${Date.now()}-001`,
      title: 'Brute Force Login Attack Detected',
      summary: 'Multiple failed login attempts detected from suspicious IP addresses, indicating a potential brute force attack against user accounts.',
      severity: 'high',
      timeline: [
        {
          timestamp: '2025-01-11 14:32:15',
          description: 'First failed login attempt detected',
          source: '192.168.1.100'
        },
        {
          timestamp: '2025-01-11 14:32:18',
          description: 'Rapid succession of failed logins',
          source: '192.168.1.100'
        },
        {
          timestamp: '2025-01-11 14:32:45',
          description: 'Login attempts from different user accounts',
          source: '192.168.1.100'
        }
      ],
      affected_assets: [
        { type: 'ip', value: '192.168.1.100', risk_level: 'high' },
        { type: 'username', value: 'admin', risk_level: 'critical' },
        { type: 'username', value: 'user01', risk_level: 'medium' },
        { type: 'hostname', value: 'web-server-01', risk_level: 'high' }
      ],
      mitre_mapping: {
        tactic: 'Credential Access',
        technique_id: 'T1110',
        technique_name: 'Brute Force',
        description: 'Adversaries may use brute force techniques to gain access to accounts when passwords are unknown or when password hashes are obtained.'
      },
      recommendations: [
        'Immediately block the source IP address 192.168.1.100',
        'Force password reset for affected user accounts',
        'Implement account lockout policies to prevent future brute force attempts',
        'Enable multi-factor authentication for all user accounts',
        'Monitor for additional suspicious activity from related IP ranges'
      ],
      evidence: logs.slice(0, 3).map((log, index) => ({
        timestamp: `2025-01-11 14:32:${15 + index * 3}`,
        source_ip: '192.168.1.100',
        username: index === 0 ? 'admin' : `user0${index}`,
        event_type: 'authentication_failure',
        message: 'Login attempt failed',
        severity: 'high' as const,
        raw_log: log || `[2025-01-11 14:32:${15 + index * 3}] AUTH_FAILURE src=192.168.1.100 user=${index === 0 ? 'admin' : `user0${index}`} msg="Invalid password"`
      })),
      created_at: new Date().toISOString()
    };
  }

  private generatePrivilegeEscalationIncident(logs: string[]): IncidentReport {
    return {
      id: `INC-${Date.now()}-002`,
      title: 'Privilege Escalation Attempt',
      summary: 'Unauthorized attempt to gain elevated privileges detected. User account attempted to execute commands with administrative rights.',
      severity: 'critical',
      timeline: [
        {
          timestamp: '2025-01-11 15:45:22',
          description: 'User executed sudo command',
          source: 'workstation-05'
        },
        {
          timestamp: '2025-01-11 15:45:35',
          description: 'Attempted to access restricted directories',
          source: 'workstation-05'
        },
        {
          timestamp: '2025-01-11 15:45:58',
          description: 'Failed privilege escalation blocked by system',
          source: 'workstation-05'
        }
      ],
      affected_assets: [
        { type: 'username', value: 'jdoe', risk_level: 'critical' },
        { type: 'hostname', value: 'workstation-05', risk_level: 'high' },
        { type: 'ip', value: '10.0.1.25', risk_level: 'medium' }
      ],
      mitre_mapping: {
        tactic: 'Privilege Escalation',
        technique_id: 'T1548',
        technique_name: 'Abuse Elevation Control Mechanism',
        description: 'Adversaries may circumvent mechanisms designed to control elevate privileges to gain higher-level permissions.'
      },
      recommendations: [
        'Immediately suspend user account "jdoe" pending investigation',
        'Review and audit all recent activities for this user account',
        'Check for any successful privilege escalations in system logs',
        'Verify the legitimacy of sudo access for this user role',
        'Implement additional monitoring for privilege escalation attempts'
      ],
      evidence: logs.slice(0, 3).map((log, index) => ({
        timestamp: `2025-01-11 15:45:${22 + index * 13}`,
        hostname: 'workstation-05',
        username: 'jdoe',
        event_type: 'privilege_escalation',
        message: 'Privilege escalation attempt',
        severity: 'critical' as const,
        raw_log: log || `[2025-01-11 15:45:${22 + index * 13}] PRIV_ESC host=workstation-05 user=jdoe cmd="sudo /bin/bash" result=DENIED`
      })),
      created_at: new Date().toISOString()
    };
  }

  private generateSuspiciousCommandIncident(logs: string[]): IncidentReport {
    return {
      id: `INC-${Date.now()}-003`,
      title: 'Suspicious PowerShell Activity',
      summary: 'Encoded PowerShell commands detected that may indicate malicious activity or attempted code obfuscation.',
      severity: 'medium',
      timeline: [
        {
          timestamp: '2025-01-11 16:15:10',
          description: 'PowerShell launched with encoded command',
          source: 'desktop-07'
        },
        {
          timestamp: '2025-01-11 16:15:12',
          description: 'Base64 encoded payload executed',
          source: 'desktop-07'
        },
        {
          timestamp: '2025-01-11 16:15:18',
          description: 'Network connection established to external IP',
          source: 'desktop-07'
        }
      ],
      affected_assets: [
        { type: 'hostname', value: 'desktop-07', risk_level: 'high' },
        { type: 'username', value: 'msmith', risk_level: 'medium' },
        { type: 'ip', value: '203.0.113.45', risk_level: 'high' }
      ],
      mitre_mapping: {
        tactic: 'Defense Evasion',
        technique_id: 'T1027',
        technique_name: 'Obfuscated Files or Information',
        description: 'Adversaries may attempt to make an executable or file difficult to discover or analyze by encrypting, encoding, or otherwise obfuscating its contents.'
      },
      recommendations: [
        'Isolate affected workstation "desktop-07" from network',
        'Perform full malware scan on the affected system',
        'Decode and analyze the Base64 payload for malicious content',
        'Block communication to external IP 203.0.113.45',
        'Review PowerShell execution policies and logging'
      ],
      evidence: logs.slice(0, 3).map((log, index) => ({
        timestamp: `2025-01-11 16:15:${10 + index * 2}`,
        hostname: 'desktop-07',
        username: 'msmith',
        event_type: 'process_creation',
        message: 'Suspicious PowerShell execution',
        severity: 'medium' as const,
        raw_log: log || `[2025-01-11 16:15:${10 + index * 2}] PROC_CREATE host=desktop-07 user=msmith cmd="powershell.exe -EncodedCommand SQBuAHYAbwBrAGUALQBXAGUAYgBSAGUAcQB1AGUAcwB0AA=="`
      })),
      created_at: new Date().toISOString()
    };
  }

  private generateGenericIncident(logs: string[]): IncidentReport {
    return {
      id: `INC-${Date.now()}-004`,
      title: 'Security Anomaly Detected',
      summary: 'Unusual activity patterns detected in the log data that warrant further investigation.',
      severity: 'low',
      timeline: [
        {
          timestamp: '2025-01-11 17:30:00',
          description: 'Anomalous log patterns identified',
          source: 'system-monitor'
        },
        {
          timestamp: '2025-01-11 17:30:15',
          description: 'Pattern correlation completed',
          source: 'system-monitor'
        }
      ],
      affected_assets: [
        { type: 'hostname', value: 'unknown', risk_level: 'low' }
      ],
      mitre_mapping: {
        tactic: 'Discovery',
        technique_id: 'T1083',
        technique_name: 'File and Directory Discovery',
        description: 'Adversaries may enumerate files and directories or may search in specific locations of a host or network share for certain information within a file system.'
      },
      recommendations: [
        'Review logs for additional context and patterns',
        'Correlate with other security events in the timeframe',
        'Monitor for escalation of suspicious activities',
        'Verify the legitimacy of detected activities'
      ],
      evidence: logs.slice(0, 2).map((log, index) => ({
        timestamp: `2025-01-11 17:30:${index * 15}`,
        event_type: 'anomaly',
        message: 'Security anomaly detected',
        severity: 'low' as const,
        raw_log: log || `[2025-01-11 17:30:${index * 15}] ANOMALY detected in log patterns`
      })),
      created_at: new Date().toISOString()
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}