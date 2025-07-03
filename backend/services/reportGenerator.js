// Get severity config
function getSeverityConfig(severity) {
  const sev = (severity || 'medium').toLowerCase();
  switch (sev) {
    case 'critical':
      return {
        icon: '🔥',
        colors: 'bg-red-900/30 border-red-500/30 text-red-400',
        gradient: 'from-red-900/20 to-rose-900/20',
        bgColor: 'bg-red-900/10',
        borderColor: 'border-red-500/30'
      };
    case 'high':
      return {
        icon: '⚠️',
        colors: 'bg-orange-900/30 border-orange-500/30 text-orange-400',
        gradient: 'from-orange-900/20 to-amber-900/20',
        bgColor: 'bg-orange-900/10',
        borderColor: 'border-orange-500/30'
      };
    case 'medium':
      return {
        icon: 'ℹ️',
        colors: 'bg-yellow-900/30 border-yellow-500/30 text-yellow-400',
        gradient: 'from-yellow-900/20 to-amber-900/20',
        bgColor: 'bg-yellow-900/10',
        borderColor: 'border-yellow-500/30'
      };
    case 'low':
      return {
        icon: 'ℹ️',
        colors: 'bg-blue-900/30 border-blue-500/30 text-blue-400',
        gradient: 'from-blue-900/20 to-cyan-900/20',
        bgColor: 'bg-blue-900/10',
        borderColor: 'border-blue-500/30'
      };
    default:
      return {
        icon: '❓',
        colors: 'bg-gray-900/30 border-gray-500/30 text-gray-400',
        gradient: 'from-gray-900/20 to-gray-800/20',
        bgColor: 'bg-gray-900/10',
        borderColor: 'border-gray-500/30'
      };
  }
}

export class ReportGenerator {
  generateReport(incidents, session) {
    // Extract threat intelligence from incidents
    const threatIntelligence = {
      iocs: [],
      threat_actors: [],
      confidence: 'medium'
    };

    // Extract response actions from incidents
    const responseActions = [];

    // Process each incident to extract threat intelligence and response actions
    incidents.forEach(incident => {
      // Extract IOCs from incident
      if (incident.iocs && Array.isArray(incident.iocs)) {
        threatIntelligence.iocs = [...new Set([...threatIntelligence.iocs, ...incident.iocs])];
      }

      // Extract threat actors from incident
      if (incident.threat_actors && Array.isArray(incident.threat_actors)) {
        threatIntelligence.threat_actors = [
          ...threatIntelligence.threat_actors,
          ...incident.threat_actors.filter(actor => 
            !threatIntelligence.threat_actors.some(a => a.name === actor.name)
          )
        ];
      }

      // Extract response actions from incident
      if (incident.response_actions && Array.isArray(incident.response_actions)) {
        responseActions.push(...incident.response_actions);
      }
    });

    // Generate the report object with all sections
    const report = {
      id: `RPT-${Date.now()}`,
      timestamp: new Date().toISOString(),
      severity: incidents.reduce((maxSev, incident) => {
        const sevLevels = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1, 'info': 0 };
        const currentSev = sevLevels[maxSev] || 0;
        const incidentSev = sevLevels[incident.severity?.toLowerCase()] || 0;
        return incidentSev > currentSev ? incident.severity : maxSev;
      }, 'info'),
      status: 'open',
      metadata: {
        report_id: `RPT-${Date.now()}`,
        generated_at: new Date().toISOString(),
        analysis_session: session.id,
        source_file: session.filename,
        tool_version: '1.0.0',
        analyst: 'SideSOC AI Engine'
      },
      summary: this.generateExecutiveSummary(incidents).summary_text,
      description: incidents.map(incident => incident.description).join('\n\n'),
      executive_summary: this.generateExecutiveSummary(incidents),
      threat_overview: this.generateThreatOverview(incidents),
      incidents: incidents,
      recommendations: this.generateGlobalRecommendations(incidents),
      threat_intelligence: threatIntelligence,
      response_actions: responseActions,
      affected_assets: this.generateAssetsSummary(incidents).assets || [],
      timeline: this.generateTimelineSummary(incidents).events || [],
      forensic_evidence: incidents.flatMap(incident => 
        (incident.evidence || []).map(evidence => ({
          ...evidence,
          incident_id: incident.id,
          incident_title: incident.title
        }))
      ),
      mitre_mapping: {
        tactic: incidents[0]?.mitre_tactic || { name: 'Initial Access', id: 'TA0001' },
        technique: incidents[0]?.mitre_technique || { name: 'Phishing', id: 'T1566' },
        description: 'Multiple techniques observed across incidents.'
      },
      appendix: {
        mitre_techniques: this.extractMitreTechniques(incidents),
        affected_assets_summary: this.generateAssetsSummary(incidents),
        timeline_summary: this.generateTimelineSummary(incidents)
      }
    };

    // Add incident summaries if there are multiple incidents
    if (incidents.length > 1) {
      report.incident_summaries = incidents.map(incident => ({
        id: incident.id,
        title: incident.title,
        severity: incident.severity,
        status: incident.status || 'open',
        summary: incident.description?.substring(0, 150) + (incident.description?.length > 150 ? '...' : '')
      }));
      report.total_incidents = incidents.length;
    }

    return report;
  }

  generateMarkdown(reports) {
    if (!reports || reports.length === 0) return '# No report data found';
    
    const report = reports[0];
    let markdown = `# ${report.title || 'Security Incident Report'}\n\n`;
    
    // Add metadata
    markdown += `- **Severity:** ${report.severity || 'Not specified'}\n`;
    markdown += `- **Status:** ${report.status || 'Open'}\n`;
    markdown += `- **Report ID:** ${report.id || 'N/A'}\n`;
    markdown += `- **Total Incidents:** ${report.total_incidents || 1}\n`;
    markdown += `- **Generated:** ${new Date(report.timestamp || Date.now()).toLocaleString()}\n\n`;
    
    // Add summary and description
    if (report.summary) markdown += `## Executive Summary\n${report.summary}\n\n`;
    if (report.description) markdown += `## Description\n${report.description}\n\n`;

    // Handle multiple incidents
    if (report.incident_summaries?.length > 0) {
      markdown += '## Incident Overview\n';
      markdown += '| ID | Title | Severity | Status |\n';
      markdown += '|----|-------|----------|--------|\n';
      report.incident_summaries.forEach(incident => {
        markdown += `| ${incident.id} | ${incident.title} | ${incident.severity} | ${incident.status} |\n`;
      });
      markdown += '\n';
    }
    
    // Add affected assets
    if (report.affected_assets?.length > 0) {
      markdown += '## Affected Assets\n';
      markdown += '| Type | Name | IP | Description |\n';
      markdown += '|------|------|----|-------------|\n';
      report.affected_assets.forEach(asset => {
        markdown += `| ${asset.type || 'N/A'} | ${asset.name || 'N/A'} | ${asset.ip || 'N/A'} | ${asset.description || 'N/A'} |\n`;
      });
      markdown += '\n';
    }
    
    // Add recommendations
    if (report.recommendations && report.recommendations.length > 0) {
      markdown += '## Recommendations\n';
      report.recommendations.forEach((rec, index) => {
        markdown += `${index + 1}. ${rec}\n`;
      });
      markdown += '\n';
    }
    
    // Add MITRE ATT&CK mapping
    if (report.mitre_mapping) {
      markdown += '## MITRE ATT&CK\n';
      if (report.mitre_mapping.tactic) {
        markdown += `- **Tactic:** ${report.mitre_mapping.tactic.name || 'N/A'} (${report.mitre_mapping.tactic.id || 'N/A'})\n`;
      }
      if (report.mitre_mapping.technique) {
        markdown += `- **Technique:** ${report.mitre_mapping.technique.name || 'N/A'} (${report.mitre_mapping.technique.id || 'N/A'})\n`;
      }
      if (report.mitre_mapping.description) {
        markdown += `- **Description:** ${report.mitre_mapping.description}\n`;
      }
      markdown += '\n';
    }
    
    // Add footer
    markdown += `---\n*Report generated by SideSOC on ${new Date().toLocaleString()}*`;
    
    return markdown;
  }

  generateCSV(reports) {
    if (!reports || reports.length === 0) return 'No report data found';
    
    const report = reports[0];
    const isMultiIncident = report.incident_summaries?.length > 0;
    
    // Create CSV rows
    const rows = [
      'Report Title,Value',
      `Title,${report.title || 'Security Incident Report'}`,
      `Severity,${report.severity || 'N/A'}`,
      `Status,${report.status || 'N/A'}`,
      `Total Incidents,${report.total_incidents || 1}`,
      `Generated,${report.timestamp || new Date().toISOString()}`,
      `Report ID,${report.id || 'N/A'}`
    ];

    // Add summary and description
    if (report.summary) rows.push(`\nSummary,"${report.summary.replace(/"/g, '""')}"`);
    if (report.description) rows.push(`Description,"${report.description.replace(/"/g, '""')}"`);

    // Add incident summaries if multiple incidents
    if (isMultiIncident) {
      rows.push('\nIncident Overview');
      rows.push('ID,Title,Severity,Status,Summary');
      report.incident_summaries.forEach(incident => {
        rows.push([
          `"${(incident.id || 'N/A').replace(/"/g, '""')}"`,
          `"${(incident.title || 'Untitled Incident').replace(/"/g, '""')}"`,
          `"${(incident.severity || 'N/A').replace(/"/g, '""')}"`,
          `"${(incident.status || 'N/A').replace(/"/g, '""')}"`,
          `"${(incident.summary || '').replace(/"/g, '""')}"`
        ].join(','));
      });
    }
    
    // Add affected assets
    if (report.affected_assets?.length > 0) {
      rows.push('\nAffected Assets');
      rows.push('Type,Name,IP,Description');
      report.affected_assets.forEach(asset => {
        rows.push([
          `"${(asset.type || 'N/A').replace(/"/g, '""')}"`,
          `"${(asset.name || 'N/A').replace(/"/g, '""')}"`,
          `"${(asset.ip || 'N/A').replace(/"/g, '""')}"`,
          `"${(asset.description || '').replace(/"/g, '""')}"`
        ].join(','));
      });
    }
    
    // Add recommendations
    if (report.recommendations?.length > 0) {
      rows.push('\nRecommendations');
      rows.push('Priority,Description');
      report.recommendations.forEach((rec, index) => {
        rows.push([
          `"${index + 1}"`,
          `"${(rec || '').replace(/"/g, '""')}"`
        ].join(','));
      });
    }
    
    // Add MITRE ATT&CK mapping
    if (report.mitre_mapping) {
      rows.push('\nMITRE ATT&CK');
      rows.push('Category,Details');
      if (report.mitre_mapping.tactic) {
        rows.push(`Tactic,${report.mitre_mapping.tactic.name || 'N/A'} (${report.mitre_mapping.tactic.id || 'N/A'})`);
      }
      if (report.mitre_mapping.technique) {
        rows.push(`Technique,${report.mitre_mapping.technique.name || 'N/A'} (${report.mitre_mapping.technique.id || 'N/A'})`);
      }
      if (report.mitre_mapping.description) {
        rows.push(`Description,${report.mitre_mapping.description.replace(/"/g, '""')}`);
      }
    }
    
    return rows.join('\n');
  }

  generateHTML(reports) {
    if (!reports || reports.length === 0) {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <title>No Report Found</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6; 
              margin: 0; 
              padding: 20px;
              background-color: #0f172a;
              color: #e2e8f0;
            }
            .container { 
              max-width: 1200px; 
              margin: 0 auto; 
              padding: 20px;
            }
            .no-report {
              text-align: center;
              padding: 40px 20px;
              background: rgba(30, 41, 59, 0.5);
              border-radius: 12px;
              margin-top: 40px;
              border: 1px solid rgba(255, 255, 255, 0.1);
            }
            h1 { 
              color: #60a5fa;
              font-size: 2.5rem;
              margin-bottom: 1rem;
              text-align: center;
            }
            p { 
              color: #94a3b8; 
              margin: 10px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <header>
              <h1>Security Incident Report</h1>
              <p style="text-align: center; color: #94a3b8;">No report data was found for the specified session.</p>
            </header>
            <div class="no-report">
              <p>Please ensure you have a valid session with analyzed data before generating a report.</p>
            </div>
          </div>
        </body>
        </html>
      `;
    }

    // Get the report (handles both single and multiple incidents)
    const report = reports[0];
    const isMultiIncident = report.incident_summaries?.length > 0;
    
    // Format timestamp
    const formattedDate = report.timestamp 
      ? new Date(report.timestamp).toLocaleString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        })
      : 'N/A';
      
    // Generate incident summary cards if multiple incidents
    let incidentsOverview = '';
    if (isMultiIncident) {
      incidentsOverview = `
        <div class="mb-8">
          <h2 class="text-2xl font-bold text-slate-200 mb-4">Incident Overview</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            ${report.incident_summaries.map(incident => {
              const sevConfig = getSeverityConfig(incident.severity);
              return `
                <div class="bg-slate-800/50 rounded-lg p-4 border ${sevConfig.borderColor}">
                  <div class="flex justify-between items-start mb-2">
                    <h3 class="text-lg font-semibold text-slate-200">${incident.title}</h3>
                    <span class="px-2 py-1 rounded-full text-xs font-medium ${sevConfig.colors}">
                      ${incident.severity || 'Unknown'}
                    </span>
                  </div>
                  <p class="text-sm text-slate-400 mb-2">${incident.summary || 'No summary available'}</p>
                  <div class="flex justify-between items-center text-xs text-slate-500">
                    <span>${incident.status || 'Status: Unknown'}</span>
                    <span>ID: ${incident.id || 'N/A'}</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    const severityConfig = getSeverityConfig(report.severity);

    // Generate HTML for each section
    const renderSection = (title, content, isDangerous = false) => {
      if (!content) return '';
      return `
        <div class="section">
          <h2 class="text-xl font-semibold mb-4 text-${severityConfig.colors.split(' ')[2]}">${title}</h2>
          <div class="bg-slate-800/50 rounded-lg p-4 border ${severityConfig.borderColor}">
            ${isDangerous ? content : content.replace(/\n/g, '<br>')}
          </div>
        </div>
      `;
    };

    const renderList = (title, items, key = null) => {
      if (!items || items.length === 0) return '';
      
      const listItems = items.map((item, index) => {
        if (key && typeof item === 'object' && item !== null) {
          return `<li class="mb-2">${item[key] || 'N/A'}</li>`;
        }
        return `<li class="mb-2">${item || 'N/A'}</li>`;
      }).join('');
      
      return `
        <div class="section">
          <h2 class="text-xl font-semibold mb-4 text-${severityConfig.colors.split(' ')[2]}">${title}</h2>
          <div class="bg-slate-800/50 rounded-lg p-4 border ${severityConfig.borderColor}">
            <ul class="list-disc pl-5 space-y-1">
              ${listItems}
            </ul>
          </div>
        </div>
      `;
    };

    const renderTable = (title, headers, rows) => {
      if (!rows || rows.length === 0) return '';
      
      const headerCells = headers.map(h => `<th class="px-4 py-2 text-left">${h}</th>`).join('');
      const tableRows = rows.map(row => {
        const cells = row.map(cell => 
          `<td class="px-4 py-2 border-t border-slate-700">${cell || 'N/A'}</td>`
        ).join('');
        return `<tr>${cells}</tr>`;
      }).join('');
      
      return `
        <div class="section">
          <h2 class="text-xl font-semibold mb-4 text-${severityConfig.colors.split(' ')[2]}">${title}</h2>
          <div class="overflow-x-auto">
            <table class="min-w-full bg-slate-800/50 rounded-lg overflow-hidden border ${severityConfig.borderColor}">
              <thead>
                <tr class="bg-slate-700/50">
                  ${headerCells}
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
          </div>
        </div>
      `;
    };

    // Generate HTML content for each section
    const summarySection = report.summary ? renderSection('Executive Summary', report.summary) : '';
    const descriptionSection = report.description ? renderSection('Description', report.description) : '';
    
    // Affected Assets Table
    const assetsTable = report.affected_assets?.length > 0
      ? renderTable(
          'Affected Assets',
          ['Type', 'Value', 'Risk Level'],
          report.affected_assets.map(asset => [
            asset.type || 'N/A',
            asset.value || 'N/A',
            asset.risk_level || 'N/A'
          ])
        )
      : '';
    
    // Recommendations List
    const recommendationsSection = report.recommendations?.length > 0
      ? renderList('Recommendations', report.recommendations)
      : '';
    
    // MITRE ATT&CK Mapping
    let mitreSection = '';
    if (report.mitre_mapping) {
      mitreSection = `
        <div class="section">
          <h2 class="text-xl font-semibold mb-4 text-${severityConfig.colors.split(' ')[2]}">MITRE ATT&CK</h2>
          <div class="bg-slate-800/50 rounded-lg p-4 border ${severityConfig.borderColor} space-y-4">
            ${report.mitre_mapping.tactic 
              ? `<div>
                  <h3 class="font-medium text-slate-300">Tactic</h3>
                  <p>${report.mitre_mapping.tactic.name || 'N/A'} (${report.mitre_mapping.tactic.id || 'N/A'})</p>
                </div>` 
              : ''}
            ${report.mitre_mapping.technique 
              ? `<div>
                  <h3 class="font-medium text-slate-300">Technique</h3>
                  <p>${report.mitre_mapping.technique.name || 'N/A'} (${report.mitre_mapping.technique.id || 'N/A'})</p>
                </div>` 
              : ''}
            ${report.mitre_mapping.description 
              ? `<div>
                  <h3 class="font-medium text-slate-300">Description</h3>
                  <p>${report.mitre_mapping.description}</p>
                </div>` 
              : ''}
          </div>
        </div>
      `;
    }

    // Generate HTML for each section
    const generateSection = (title, content, icon, gradient = 'from-slate-700/30 to-slate-600/30') => {
      return `
        <div class="mb-6">
          <div class="flex items-center mb-4">
            <div class="text-2xl mr-2">${icon}</div>
            <h2 class="text-xl font-semibold text-slate-200">${title}</h2>
          </div>
          <div class="bg-slate-800/50 backdrop-blur-sm border border-slate-700/30 rounded-xl p-6 mb-6">
            ${content}
          </div>
        </div>
      `;
    };

    // Generate timeline items
    const timelineItems = report.timeline?.map(event => `
      <div class="relative pl-8 pb-6 border-l-2 border-slate-700 last:border-transparent">
        <div class="absolute w-3 h-3 rounded-full bg-blue-500 -left-1.5 mt-1"></div>
        <div class="text-sm text-slate-400">${new Date(event.timestamp).toLocaleString()}</div>
        <h4 class="text-slate-200 font-medium">${event.title}</h4>
        <p class="text-slate-400">${event.description}</p>
      </div>
    `).join('') || '<p class="text-slate-400">No timeline events available</p>';

    // Generate affected assets
    const affectedAssets = report.affected_assets?.map(asset => `
      <div class="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
        <div class="font-medium text-slate-200">${asset.name || 'Unnamed Asset'}</div>
        <div class="text-sm text-slate-400">${asset.type} • ${asset.ip || 'No IP'}</div>
        <div class="mt-2 text-sm text-slate-500">${asset.description || 'No additional details'}</div>
      </div>
    `).join('') || '<p class="text-slate-400">No affected assets identified</p>';

    // Generate forensic evidence
    const forensicEvidence = report.forensic_evidence?.map((evidence, idx) => `
      <div class="mb-4 group">
        <div class="flex justify-between items-center mb-2">
          <span class="text-sm text-slate-400">Evidence #${idx + 1}</span>
          <button onclick="navigator.clipboard.writeText('${evidence.raw_log.replace(/'/g, "\\'")}')"
            class="opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 text-xs bg-slate-700/50 hover:bg-slate-600/50 rounded text-slate-300">
            Copy
          </button>
        </div>
        <pre class="bg-slate-900/50 p-4 rounded-lg overflow-x-auto text-sm text-slate-300 font-mono">
${evidence.raw_log}
        </pre>
      </div>
    `).join('') || '<p class="text-slate-400">No forensic evidence available</p>';

    // Generate threat intelligence section
    let threatIntelSection = '';
    if (report.threat_intelligence) {
      threatIntelSection = `
        <div class="mb-6">
          <h2 class="text-xl font-semibold mb-4 text-${severityConfig.colors.split(' ')[2]}">Threat Intelligence</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${report.threat_intelligence.iocs?.length > 0 ? `
              <div class="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                <h3 class="font-medium text-slate-200 mb-2">Indicators of Compromise (IOCs)</h3>
                <ul class="list-disc pl-5 space-y-1 text-sm text-slate-300">
                  ${report.threat_intelligence.iocs.map(ioc => `<li>${ioc}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
            ${report.threat_intelligence.threat_actors?.length > 0 ? `
              <div class="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                <h3 class="font-medium text-slate-200 mb-2">Threat Actors</h3>
                <ul class="list-disc pl-5 space-y-1 text-sm text-slate-300">
                  ${report.threat_intelligence.threat_actors.map(actor => `<li>${actor}</li>`).join('')}
                </ul>
                ${report.threat_intelligence.confidence ? `
                  <div class="mt-3 text-sm">
                    <span class="text-slate-400">Confidence:</span>
                    <span class="ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                      report.threat_intelligence.confidence === 'high' ? 'bg-red-900/30 text-red-400' :
                      report.threat_intelligence.confidence === 'medium' ? 'bg-yellow-900/30 text-yellow-400' :
                      'bg-blue-900/30 text-blue-400'
                    }">
                      ${report.threat_intelligence.confidence.charAt(0).toUpperCase() + report.threat_intelligence.confidence.slice(1)}
                    </span>
                  </div>
                ` : ''}
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }

    // Generate response actions
    let responseActionsSection = '';
    if (report.response_actions?.length > 0) {
      responseActionsSection = `
        <div class="mb-6">
          <h2 class="text-xl font-semibold mb-4 text-${severityConfig.colors.split(' ')[2]}">Response Actions</h2>
          <div class="space-y-4">
            ${report.response_actions.map(action => `
              <div class="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                <div class="flex justify-between items-start">
                  <h3 class="font-medium text-slate-200">${action.action || 'No action specified'}</h3>
                  <span class="px-2 py-1 rounded-full text-xs font-medium ${
                    action.status === 'completed' ? 'bg-green-900/30 text-green-400' :
                    action.status === 'in-progress' ? 'bg-blue-900/30 text-blue-400' :
                    'bg-yellow-900/30 text-yellow-400'
                  }">
                    ${action.status || 'pending'}
                  </span>
                </div>
                ${action.details ? `
                  <p class="mt-2 text-sm text-slate-300">${action.details}</p>
                ` : ''}
                <div class="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                  ${action.assigned_to ? `
                    <div class="flex items-center">
                      <span class="mr-1">👤</span>
                      ${action.assigned_to}
                    </div>
                  ` : ''}
                  ${action.priority ? `
                    <div class="flex items-center">
                      <span class="mr-1">${action.priority === 'high' ? '🔴' : action.priority === 'medium' ? '🟡' : '🔵'}</span>
                      ${action.priority}
                    </div>
                  ` : ''}
                  ${action.completed_at ? `
                    <div class="flex items-center">
                      <span class="mr-1">✅</span>
                      Completed: ${new Date(action.completed_at).toLocaleString()}
                    </div>
                  ` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // Response actions section is already defined above
    // The following is a template string that was accidentally uncommented
    // It's now properly commented out to prevent syntax errors
    /*
    <div class="mb-6">
      <h2 class="text-xl font-semibold mb-4 text-${severityConfig.colors.split(' ')[2]}">Response Actions</h2>
      <div class="space-y-4">
        ${report.response_actions.map(action => `
          <div class="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
            <div class="flex justify-between items-start">
              <h3 class="font-medium text-slate-200">${action.action || 'No action specified'}</h3>
              <span class="px-2 py-1 rounded-full text-xs font-medium ${
                action.status === 'completed' ? 'bg-green-900/30 text-green-400' :
                action.status === 'in-progress' ? 'bg-blue-900/30 text-blue-400' :
                'bg-yellow-900/30 text-yellow-400'
              }">
                ${action.status || 'pending'}
              </span>
            </div>
            ${action.details ? `
              <p class="mt-2 text-sm text-slate-300">${action.details}</p>
            ` : ''}
            <div class="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
              ${action.assigned_to ? `
                <div class="flex items-center">
                  <span class="mr-1">👤</span>
                  ${action.assigned_to}
                </div>
              ` : ''}
              ${action.priority ? `
                <div class="flex items-center">
                  <span class="mr-1">${action.priority === 'high' ? '🔴' : action.priority === 'medium' ? '🟡' : '🔵'}</span>
                  ${action.priority}
                </div>
              ` : ''}
              ${action.completed_at ? `
                <div class="flex items-center">
                  <span class="mr-1">✅</span>
                  Completed: ${new Date(action.completed_at).toLocaleString()}
                </div>
              ` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
    */
    
    // Response actions section is already defined above with the variable responseActionsSection

    // Main HTML template
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Security Incident Report - ${report.id || 'Untitled'}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
          body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #0f172a;
            color: #e2e8f0;
          }
          .gradient-text {
            background: linear-gradient(90deg, #60a5fa, #818cf8);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            text-fill-color: transparent;
          }
          pre {
            white-space: pre-wrap;
            word-wrap: break-word;
          }
        </style>
      </head>
      <body class="min-h-screen p-4 md:p-8">
        <div class="max-w-6xl mx-auto">
          <!-- Header -->
          <div class="mb-8 p-6 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 class="text-2xl md:text-3xl font-bold gradient-text">
                  Security Incident Report
                </h1>
                <div class="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-400">
                  <span class="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 mr-1.5 text-cyan-400">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    ${formattedDate}
                  </span>
                  <span class="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 mr-1.5 text-blue-400">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    </svg>
                    ID: ${report.id}
                  </span>
                </div>
              </div>
              <div class="mt-4 md:mt-0 px-4 py-2 rounded-full text-sm font-bold border backdrop-blur-sm ${severityConfig.colors}">
                <span class="mr-1">${severityConfig.icon}</span>
                ${report.severity?.toUpperCase() || 'UNKNOWN'}
              </div>
            </div>
          </div>

          <!-- Main Content -->
          <div class="space-y-6">
            ${isMultiIncident ? incidentsOverview : ''}
            
            ${generateSection(
              'Executive Summary',
              `<div class="prose prose-invert max-w-none">
                <p class="text-slate-300">${report.summary || 'No summary available.'}</p>
                ${report.description ? `
                  <div class="mt-4 p-4 bg-slate-800/30 border border-slate-700/50 rounded-lg">
                    <h3 class="text-slate-200 font-medium mb-2">Detailed Description</h3>
                    <p class="text-slate-300">${report.description}</p>
                  </div>
                ` : ''}
                ${report.recommendations?.length > 0 ? `
                  <div class="mt-4 p-4 bg-blue-900/20 border border-blue-500/20 rounded-lg">
                    <h3 class="text-blue-400 font-medium mb-2">Key Recommendations</h3>
                    <ul class="list-disc pl-5 space-y-1">
                      ${report.recommendations.map(rec => 
                        `<li class="text-blue-300">${rec}</li>`
                      ).join('')}
                    </ul>
                  </div>
                ` : ''}
              </div>`,
              '📋',
              'from-blue-900/20 to-indigo-900/20'
            )}

            ${generateSection(
              'Attack Timeline',
              `<div class="relative">
                <div class="space-y-1">
                  ${timelineItems}
                </div>
              </div>`,
              '🕒',
              'from-amber-900/20 to-yellow-900/20'
            )}

            ${generateSection(
              'Compromised Assets',
              `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                ${affectedAssets}
              </div>`,
              '💻',
              'from-emerald-900/20 to-teal-900/20'
            )}

            ${generateSection(
              'MITRE ATT&CK Framework',
              mitreSection || '<p class="text-slate-400">No MITRE ATT&CK mappings available</p>',
              '🎯',
              'from-red-900/20 to-pink-900/20'
            )}

            ${generateSection(
              'Threat Intelligence',
              report.threat_intelligence ? `
                <div class="space-y-4">
                  ${report.threat_intelligence.iocs?.length > 0 ? `
                    <div class="mb-4">
                      <h3 class="text-lg font-semibold text-slate-200 mb-2">Indicators of Compromise (IOCs)</h3>
                      <div class="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
                        <ul class="list-disc pl-5 space-y-1">
                          ${report.threat_intelligence.iocs.map(ioc => 
                            `<li class="text-slate-300">${ioc}</li>`
                          ).join('')}
                        </ul>
                      </div>
                    </div>
                  ` : ''}
                  
                  ${report.threat_intelligence.threat_actors?.length > 0 ? `
                    <div>
                      <h3 class="text-lg font-semibold text-slate-200 mb-2">Threat Actors</h3>
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        ${report.threat_intelligence.threat_actors.map(actor => `
                          <div class="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
                            <h4 class="font-medium text-slate-200">${actor.name || 'Unknown'}</h4>
                            ${actor.description ? `<p class="text-sm text-slate-400 mt-1">${actor.description}</p>` : ''}
                            ${actor.confidence ? `
                              <div class="mt-2">
                                <span class="inline-block px-2 py-1 text-xs rounded-full 
                                  ${actor.confidence === 'high' ? 'bg-red-900/30 text-red-400' : 
                                    actor.confidence === 'medium' ? 'bg-yellow-900/30 text-yellow-400' : 
                                    'bg-blue-900/30 text-blue-400'}">
                                  Confidence: ${actor.confidence}
                                </span>
                              </div>
                            ` : ''}
                          </div>
                        `).join('')}
                      </div>
                    </div>
                  ` : ''}
                </div>
              ` : '<p class="text-slate-400">No threat intelligence data available</p>',
              '🕵️',
              'from-amber-900/20 to-orange-900/20'
            )}

            ${generateSection(
              'Response Actions',
              report.response_actions?.length > 0 ? `
                <div class="space-y-4">
                  ${report.response_actions.map(action => `
                    <div class="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
                      <div class="flex justify-between items-start">
                        <div>
                          <h3 class="text-slate-200 font-medium">${action.action}</h3>
                          <p class="text-sm text-slate-400 mt-1">Status: 
                            <span class="inline-flex items-center">
                              <span class="w-2 h-2 rounded-full mr-1.5 ${
                                action.status === 'completed' ? 'bg-green-500' :
                                action.status === 'failed' ? 'bg-red-500' :
                                'bg-yellow-500'
                              }"></span>
                              ${action.status}
                            </span>
                          </p>
                        </div>
                        <span class="text-xs text-slate-500">
                          ${new Date(action.timestamp).toLocaleString()}
                        </span>
                      </div>
                      ${action.details ? `
                        <div class="mt-2 p-3 bg-slate-800/50 rounded text-sm text-slate-300">
                          ${action.details}
                        </div>
                      ` : ''}
                    </div>
                  `).join('')}
                </div>
              ` : '<p class="text-slate-400">No response actions have been taken yet.</p>',
              '🔧',
              'from-purple-900/20 to-violet-900/20'
            )}

            ${generateSection(
              'Forensic Evidence',
              `<div class="space-y-4">
                ${forensicEvidence}
              </div>`,
              '🔍',
              'from-slate-700/30 to-slate-600/30'
            )}
          </div>

          <!-- Footer -->
          <footer class="mt-12 pt-6 border-t border-slate-800 text-center text-sm text-slate-500">
            <p>Report generated by SideSOC on ${new Date().toLocaleString()}</p>
            <p class="mt-1">This is an automated security report. Please review all findings with your security team.</p>
          </footer>
        </div>
      </body>
      </html>
    `;
  }

  generateMarkdown(incidents) {
    let markdown = `# Security Incident Report\n\n`;
    markdown += `**Generated on**: ${new Date().toLocaleString()}\n\n`;
    markdown += `## Summary\n\n`;
    markdown += `- Total Incidents: ${incidents.length}\n\n`;

    incidents.forEach((incident, index) => {
      markdown += `## Incident #${index + 1}: ${incident.title || 'Untitled'}\n\n`;
      markdown += `- **Severity**: ${incident.severity || 'N/A'}\n`;
      markdown += `- **Timestamp**: ${new Date(incident.timestamp || Date.now()).toLocaleString()}\n`;
      markdown += `- **Description**: ${incident.description || 'No description'}\n`;
      
      if (incident.source) {
        markdown += `- **Source**: ${incident.source}\n`;
      }
      
      if (incident.recommendation) {
        markdown += `\n### Recommendation\n${incident.recommendation}\n\n`;
      }
      
      markdown += '---\n\n';
    });

    return markdown;
  }

  generateExecutiveSummary(incidents) {
    const totalIncidents = incidents.length;
    const severityCounts = this.countBySeverity(incidents);
    const threatTypes = [...new Set(incidents.map(i => this.extractThreatType(i.title)))];

    return {
      total_incidents: totalIncidents,
      severity_breakdown: severityCounts,
      threat_types_detected: threatTypes,
      summary_text: totalIncidents > 0 
        ? `Analysis identified ${totalIncidents} security incident${totalIncidents > 1 ? 's' : ''} requiring immediate attention. ${severityCounts.critical || 0} critical and ${severityCounts.high || 0} high severity threats detected.`
        : 'No security threats detected in the analyzed logs. All activities appear to be within normal parameters.'
    };
  }

  generateThreatOverview(incidents) {
    const overview = {
      attack_vectors: [],
      compromised_assets: 0,
      timeline_span: null,
      geographic_indicators: []
    };

    if (incidents.length > 0) {
      // Extract attack vectors
      overview.attack_vectors = [...new Set(incidents.map(i => i.mitre_mapping.tactic))];
      
      // Count unique compromised assets
      const allAssets = incidents.flatMap(i => i.affected_assets);
      overview.compromised_assets = new Set(allAssets.map(a => `${a.type}:${a.value}`)).size;
      
      // Calculate timeline span
      const timestamps = incidents.flatMap(i => i.timeline.map(t => new Date(t.timestamp)));
      if (timestamps.length > 0) {
        const earliest = new Date(Math.min(...timestamps));
        const latest = new Date(Math.max(...timestamps));
        overview.timeline_span = {
          start: earliest.toISOString(),
          end: latest.toISOString(),
          duration_hours: Math.round((latest - earliest) / (1000 * 60 * 60))
        };
      }
    }

    return overview;
  }

  generateGlobalRecommendations(incidents) {
    const recommendations = [
      'Implement continuous monitoring and alerting for detected threat patterns',
      'Review and update incident response procedures based on findings',
      'Conduct security awareness training for affected user groups',
      'Perform vulnerability assessment on compromised systems'
    ];

    if (incidents.some(i => i.severity === 'critical')) {
      recommendations.unshift('Initiate emergency incident response procedures immediately');
    }

    return recommendations;
  }

  extractMitreTechniques(incidents) {
    const techniques = {};
    
    incidents.forEach(incident => {
      const mitre = incident.mitre_mapping;
      if (!techniques[mitre.technique_id]) {
        techniques[mitre.technique_id] = {
          technique_id: mitre.technique_id,
          technique_name: mitre.technique_name,
          tactic: mitre.tactic,
          description: mitre.description,
          incidents_count: 0
        };
      }
      techniques[mitre.technique_id].incidents_count++;
    });

    return Object.values(techniques);
  }

  generateAssetsSummary(incidents) {
    const assetTypes = { ip: new Set(), username: new Set(), hostname: new Set() };
    const riskLevels = { critical: 0, high: 0, medium: 0, low: 0 };
    const allAssets = [];

    // Process each incident to extract and count assets
    incidents.forEach(incident => {
      (incident.affected_assets || []).forEach(asset => {
        // Add to type-specific sets for counting
        if (asset.type && asset.value && assetTypes[asset.type]) {
          assetTypes[asset.type].add(asset.value);
        }
        
        // Count risk levels
        if (asset.risk_level) {
          riskLevels[asset.risk_level] = (riskLevels[asset.risk_level] || 0) + 1;
        }
        
        // Add to the detailed assets list if not already present
        const assetKey = `${asset.type}:${asset.value}`;
        if (!allAssets.some(a => `${a.type}:${a.value}` === assetKey)) {
          allAssets.push({
            type: asset.type || 'unknown',
            value: asset.value || 'unknown',
            risk_level: asset.risk_level || 'medium',
            first_seen: asset.timestamp || new Date().toISOString(),
            last_seen: asset.timestamp || new Date().toISOString(),
            related_incidents: [incident.id || 'unknown']
          });
        } else {
          // Update last seen time if this is a more recent sighting
          const existing = allAssets.find(a => `${a.type}:${a.value}` === assetKey);
          if (existing) {
            existing.last_seen = asset.timestamp || existing.last_seen;
            if (incident.id && !existing.related_incidents.includes(incident.id)) {
              existing.related_incidents.push(incident.id);
            }
          }
        }
      });
    });

    return {
      unique_ips: assetTypes.ip.size,
      unique_usernames: assetTypes.username.size,
      unique_hostnames: assetTypes.hostname.size,
      risk_distribution: riskLevels,
      // Add the detailed assets array
      assets: allAssets
    };
  }

  generateTimelineSummary(incidents) {
    // Extract all timeline events from incidents
    const allEvents = incidents.flatMap(i => i.timeline || []);
    const eventsByHour = {};
    
    // Process events to get hourly counts and format for display
    const formattedEvents = allEvents.map(event => ({
      timestamp: event.timestamp,
      title: event.title || 'Security Event',
      description: event.description || 'No description available',
      source: event.source || 'Unknown',
      severity: event.severity || 'medium'
    }));

    // Count events by hour for statistics
    allEvents.forEach(event => {
      if (event.timestamp) {
        const hour = new Date(event.timestamp).getHours();
        eventsByHour[hour] = (eventsByHour[hour] || 0) + 1;
      }
    });

    // Sort events by timestamp (newest first)
    const sortedEvents = [...formattedEvents].sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );

    return {
      total_events: allEvents.length,
      peak_activity_hour: Object.keys(eventsByHour).reduce((a, b) => 
        eventsByHour[a] > eventsByHour[b] ? a : b, '0'),
      events_by_hour: eventsByHour,
      // Add the events array with formatted event data
      events: sortedEvents
    };
  }

  countBySeverity(incidents) {
    return incidents.reduce((counts, incident) => {
      counts[incident.severity] = (counts[incident.severity] || 0) + 1;
      return counts;
    }, {});
  }

  extractThreatType(title) {
    if (title.toLowerCase().includes('brute force')) return 'Brute Force';
    if (title.toLowerCase().includes('privilege')) return 'Privilege Escalation';
    if (title.toLowerCase().includes('lateral')) return 'Lateral Movement';
    if (title.toLowerCase().includes('exfiltration')) return 'Data Exfiltration';
    if (title.toLowerCase().includes('command')) return 'Malicious Commands';
    return 'Security Anomaly';
  }
}