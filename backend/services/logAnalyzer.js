export class LogAnalyzer {
  constructor() {
    this.threatPatterns = {
      bruteForce: {
        patterns: [
          /failed login|authentication failed|invalid password|login attempt|auth.*fail/i,
          /multiple.*failed.*attempts|repeated.*login.*failures/i,
          /brute.*force|password.*spray|credential.*stuffing/i
        ],
        threshold: 3,
        severity: 'high'
      },
      privilegeEscalation: {
        patterns: [
          /sudo|privilege|administrator|elevated|runas|su\s/i,
          /escalat|privesc|admin.*access|root.*access/i,
          /whoami|id\s|groups\s|net.*user.*admin/i
        ],
        threshold: 2,
        severity: 'critical'
      },
      suspiciousCommands: {
        patterns: [
          /powershell.*-enc|powershell.*-encoded|cmd\.exe.*\/c/i,
          /base64|encoded|obfuscat|bypass.*execution.*policy/i,
          /invoke.*expression|iex|downloadstring|webclient/i,
          /certutil.*-decode|bitsadmin.*\/transfer/i
        ],
        threshold: 1,
        severity: 'medium'
      },
      lateralMovement: {
        patterns: [
          /psexec|wmic.*process|schtasks.*\/create/i,
          /net.*use|net.*share|copy.*\$|xcopy.*\$/i,
          /rdp|remote.*desktop|terminal.*services/i,
          /winrm|powershell.*remoting|enter.*pssession/i
        ],
        threshold: 2,
        severity: 'high'
      },
      dataExfiltration: {
        patterns: [
          /ftp.*upload|sftp.*put|scp.*-r|rsync/i,
          /curl.*-T|wget.*--post|http.*upload/i,
          /compress|zip|rar|7z.*a|tar.*czf/i,
          /cloud.*sync|dropbox|onedrive|google.*drive/i
        ],
        threshold: 2,
        severity: 'critical'
      },
      networkAnomalies: {
        patterns: [
          /port.*scan|nmap|masscan|zmap/i,
          /unusual.*traffic|suspicious.*connection|anomalous.*network/i,
          /connection.*refused|timeout|unreachable/i,
          /tor|proxy|vpn|tunnel/i
        ],
        threshold: 3,
        severity: 'medium'
      }
    };

    this.mitreMapping = {
      bruteForce: {
        tactic: 'Credential Access',
        technique_id: 'T1110',
        technique_name: 'Brute Force',
        description: 'Adversaries may use brute force techniques to gain access to accounts when passwords are unknown or when password hashes are obtained.'
      },
      privilegeEscalation: {
        tactic: 'Privilege Escalation',
        technique_id: 'T1548',
        technique_name: 'Abuse Elevation Control Mechanism',
        description: 'Adversaries may circumvent mechanisms designed to control elevate privileges to gain higher-level permissions.'
      },
      suspiciousCommands: {
        tactic: 'Defense Evasion',
        technique_id: 'T1027',
        technique_name: 'Obfuscated Files or Information',
        description: 'Adversaries may attempt to make an executable or file difficult to discover or analyze by encrypting, encoding, or otherwise obfuscating its contents.'
      },
      lateralMovement: {
        tactic: 'Lateral Movement',
        technique_id: 'T1021',
        technique_name: 'Remote Services',
        description: 'Adversaries may use valid accounts to log into a service specifically designed to accept remote connections.'
      },
      dataExfiltration: {
        tactic: 'Exfiltration',
        technique_id: 'T1041',
        technique_name: 'Exfiltration Over C2 Channel',
        description: 'Adversaries may steal data by exfiltrating it over an existing command and control channel.'
      },
      networkAnomalies: {
        tactic: 'Discovery',
        technique_id: 'T1046',
        technique_name: 'Network Service Scanning',
        description: 'Adversaries may attempt to get a listing of services running on remote hosts and local network infrastructure devices.'
      }
    };
  }

  async analyzeContent(content, filename, progressCallback) {
    const incidents = [];
    
    try {
      // Stage 1: Parse logs
      progressCallback('Parsing logs', 10, 'Reading and parsing log file...');
      await this.delay(800);
      
      const logs = this.parseLogContent(content, filename);
      
      // Stage 2: Pattern detection
      progressCallback('Pattern detection', 30, 'Analyzing patterns and anomalies...');
      await this.delay(1200);
      
      const detections = this.detectThreats(logs);
      
      // Stage 3: Correlation analysis
      progressCallback('Correlation analysis', 60, 'Correlating events across timeline...');
      await this.delay(1000);
      
      const correlatedEvents = this.correlateEvents(detections, logs);
      
      // Stage 4: MITRE mapping
      progressCallback('MITRE mapping', 80, 'Mapping findings to MITRE ATT&CK framework...');
      await this.delay(800);
      
      // Stage 5: Generate reports
      progressCallback('Generating reports', 95, 'Creating incident reports...');
      
      for (const [threatType, events] of Object.entries(correlatedEvents)) {
        if (events.length > 0) {
          const incident = this.generateIncident(threatType, events, logs);
          incidents.push(incident);
        }
      }
      
      await this.delay(500);
      
      return incidents;
      
    } catch (error) {
      console.error('Analysis error:', error);
      throw new Error(`Analysis failed: ${error.message}`);
    }
  }

  parseLogContent(content, filename) {
    const logs = [];
    const lines = content.split('\n').filter(line => line.trim());
    
    lines.forEach((line, index) => {
      try {
        let logEntry;
        
        if (filename.endsWith('.json')) {
          // Try to parse as JSON
          try {
            logEntry = JSON.parse(line);
          } catch {
            // If not valid JSON, treat as plain text
            logEntry = this.parseTextLog(line, index);
          }
        } else {
          // Parse as text log
          logEntry = this.parseTextLog(line, index);
        }
        
        if (logEntry) {
          logs.push(logEntry);
        }
      } catch (error) {
        // Skip malformed lines
        console.warn(`Skipping malformed log line ${index + 1}:`, error.message);
      }
    });
    
    return logs;
  }

  parseTextLog(line, index) {
    // Extract timestamp, IP addresses, usernames, etc.
    const timestampMatch = line.match(/(\d{4}-\d{2}-\d{2}[\s\T]\d{2}:\d{2}:\d{2})/);
    const ipMatch = line.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
    const userMatch = line.match(/user[=:\s]+([a-zA-Z0-9_-]+)/i);
    const hostMatch = line.match(/host[=:\s]+([a-zA-Z0-9_.-]+)/i);
    
    return {
      id: `log_${index}`,
      timestamp: timestampMatch ? timestampMatch[1] : new Date().toISOString(),
      source_ip: ipMatch ? ipMatch[1] : null,
      username: userMatch ? userMatch[1] : null,
      hostname: hostMatch ? hostMatch[1] : null,
      message: line,
      raw_log: line,
      event_type: this.classifyEventType(line)
    };
  }

  classifyEventType(message) {
    const msg = message.toLowerCase();
    
    if (msg.includes('login') || msg.includes('auth')) return 'authentication';
    if (msg.includes('process') || msg.includes('exec')) return 'process_creation';
    if (msg.includes('network') || msg.includes('connection')) return 'network';
    if (msg.includes('file') || msg.includes('access')) return 'file_access';
    if (msg.includes('privilege') || msg.includes('sudo')) return 'privilege_escalation';
    
    return 'general';
  }

  detectThreats(logs) {
    const detections = {};
    
    for (const [threatType, config] of Object.entries(this.threatPatterns)) {
      detections[threatType] = [];
      
      logs.forEach(log => {
        const matchCount = config.patterns.reduce((count, pattern) => {
          return count + (pattern.test(log.message) ? 1 : 0);
        }, 0);
        
        if (matchCount > 0) {
          detections[threatType].push({
            ...log,
            matchCount,
            severity: config.severity
          });
        }
      });
    }
    
    return detections;
  }

  correlateEvents(detections, logs) {
    const correlatedEvents = {};
    
    for (const [threatType, events] of Object.entries(detections)) {
      const config = this.threatPatterns[threatType];
      
      if (events.length >= config.threshold) {
        correlatedEvents[threatType] = events;
      }
    }
    
    return correlatedEvents;
  }

  generateIncident(threatType, events, allLogs) {
    const config = this.threatPatterns[threatType];
    const mitre = this.mitreMapping[threatType];
    
    // Extract affected assets
    const affectedAssets = this.extractAffectedAssets(events);
    
    // Generate timeline
    const timeline = this.generateTimeline(events);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(threatType, events);
    
    // Get evidence logs
    const evidence = events.slice(0, 5).map(event => ({
      timestamp: event.timestamp,
      source_ip: event.source_ip,
      username: event.username,
      hostname: event.hostname,
      event_type: event.event_type,
      message: event.message,
      severity: event.severity,
      raw_log: event.raw_log
    }));

    return {
      id: `INC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: this.generateIncidentTitle(threatType, events),
      summary: this.generateIncidentSummary(threatType, events),
      severity: config.severity,
      timeline,
      affected_assets: affectedAssets,
      mitre_mapping: mitre,
      recommendations,
      evidence,
      created_at: new Date().toISOString()
    };
  }

  generateIncidentTitle(threatType, events) {
    const titles = {
      bruteForce: 'Brute Force Attack Detected',
      privilegeEscalation: 'Privilege Escalation Attempt',
      suspiciousCommands: 'Suspicious Command Execution',
      lateralMovement: 'Lateral Movement Activity',
      dataExfiltration: 'Data Exfiltration Detected',
      networkAnomalies: 'Network Anomaly Detected'
    };
    
    return titles[threatType] || 'Security Incident Detected';
  }

  generateIncidentSummary(threatType, events) {
    const summaries = {
      bruteForce: `Multiple failed authentication attempts detected (${events.length} events). Potential brute force attack against user accounts.`,
      privilegeEscalation: `Unauthorized privilege escalation attempts detected (${events.length} events). User attempting to gain elevated system access.`,
      suspiciousCommands: `Suspicious command execution detected (${events.length} events). Potentially malicious scripts or encoded commands identified.`,
      lateralMovement: `Lateral movement activity detected (${events.length} events). Attacker may be moving through the network infrastructure.`,
      dataExfiltration: `Data exfiltration activity detected (${events.length} events). Sensitive data may be leaving the network.`,
      networkAnomalies: `Network anomalies detected (${events.length} events). Unusual network traffic patterns identified.`
    };
    
    return summaries[threatType] || `Security anomaly detected with ${events.length} related events.`;
  }

  extractAffectedAssets(events) {
    const assets = new Set();
    
    events.forEach(event => {
      if (event.source_ip) {
        assets.add({ type: 'ip', value: event.source_ip, risk_level: event.severity });
      }
      if (event.username) {
        assets.add({ type: 'username', value: event.username, risk_level: event.severity });
      }
      if (event.hostname) {
        assets.add({ type: 'hostname', value: event.hostname, risk_level: event.severity });
      }
    });
    
    return Array.from(assets);
  }

  generateTimeline(events) {
    return events.slice(0, 5).map(event => ({
      timestamp: event.timestamp,
      description: event.message.substring(0, 100) + (event.message.length > 100 ? '...' : ''),
      source: event.hostname || event.source_ip || 'unknown'
    }));
  }

  generateRecommendations(threatType, events) {
    const recommendations = {
      bruteForce: [
        'Immediately block the source IP addresses involved in the attack',
        'Force password reset for all affected user accounts',
        'Implement account lockout policies to prevent future brute force attempts',
        'Enable multi-factor authentication for all user accounts',
        'Monitor for additional suspicious activity from related IP ranges'
      ],
      privilegeEscalation: [
        'Immediately suspend the affected user account pending investigation',
        'Review and audit all recent activities for this user account',
        'Check for any successful privilege escalations in system logs',
        'Verify the legitimacy of sudo/admin access for this user role',
        'Implement additional monitoring for privilege escalation attempts'
      ],
      suspiciousCommands: [
        'Isolate affected systems from the network immediately',
        'Perform full malware scan on all affected systems',
        'Decode and analyze any Base64 or encoded payloads',
        'Block communication to any external IPs identified',
        'Review PowerShell execution policies and logging'
      ],
      lateralMovement: [
        'Isolate affected systems to prevent further lateral movement',
        'Reset credentials for all accounts used in the movement',
        'Review network segmentation and access controls',
        'Monitor for additional unauthorized access attempts',
        'Implement network monitoring for unusual traffic patterns'
      ],
      dataExfiltration: [
        'Immediately block all external communications from affected systems',
        'Identify and classify the data that may have been exfiltrated',
        'Review data loss prevention (DLP) policies and controls',
        'Notify relevant stakeholders and compliance teams',
        'Implement additional monitoring for data movement'
      ],
      networkAnomalies: [
        'Investigate the source and nature of the anomalous traffic',
        'Review network logs for additional suspicious activities',
        'Verify the legitimacy of detected network communications',
        'Implement additional network monitoring and alerting',
        'Consider network segmentation improvements'
      ]
    };
    
    return recommendations[threatType] || [
      'Investigate the detected security anomaly',
      'Review related logs for additional context',
      'Monitor for escalation of suspicious activities',
      'Implement appropriate security controls'
    ];
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}