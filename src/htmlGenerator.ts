import ejs from 'ejs';
import { readFileSync } from 'fs';
import { join } from 'path';
import { marked } from 'marked';

interface Finding {
  version: string;
  paths: string[];
}

export interface AuditData {
  actions: Action[];
  advisories: { [key: string]: Advisory };
  metadata: Metadata;
}

interface Action {
  action: string;
  module: string;
  resolves: Resolve[];
}

interface Resolve {
  id: number;
  path: string;
  dev: boolean;
  optional: boolean;
  bundled: boolean;
}

interface Advisory {
  findings: Finding[];
  metadata: unknown;
  vulnerable_versions: string;
  module_name: string;
  severity: string;
  github_advisory_id: string;
  cves: string[];
  access: string;
  patched_versions: string;
  cvss: Cvss;
  updated: string;
  recommendation: string;
  cwe: string[];
  found_by: unknown;
  deleted: unknown;
  id: number;
  references: string;
  created: string;
  reported_by: unknown;
  title: string;
  npm_advisory_id: unknown;
  overview: string;
  url: string;
}

interface Cvss {
  score: number;
  vectorString: string;
}

interface Metadata {
  vulnerabilities: Vulnerabilities;
  dependencies: number;
  devDependencies: number;
  optionalDependencies: number;
  totalDependencies: number;
}

interface Vulnerabilities {
  info: number;
  low: number;
  moderate: number;
  high: number;
  critical: number;
  total: number;
}

export const generateHtml = (auditData: AuditData): string => {
  const templatePath = join(__dirname, '../templates/reportTemplate.ejs');
  const template = readFileSync(templatePath, 'utf-8');

  const vulnerabilities = auditData.metadata.vulnerabilities;
  vulnerabilities.total =
    vulnerabilities.info +
    vulnerabilities.low +
    vulnerabilities.moderate +
    vulnerabilities.high +
    vulnerabilities.critical;

  const dependencies = {
    total: auditData.metadata.totalDependencies,
  };

  // Sort advisories by severity
  const severityOrder = ['critical', 'high', 'moderate', 'low', 'info'];
  const sortedAdvisories = Object.values(auditData.advisories).sort(
    (a, b) => severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity)
  );

  // Parse markdown in advisories
  sortedAdvisories.forEach((advisory) => {
    advisory.overview = marked(advisory.overview, { async: false });
    if (advisory.recommendation) {
      advisory.recommendation = marked(advisory.recommendation, {
        async: false,
      });
    }
    if (advisory.references) {
      advisory.references = marked(advisory.references, { async: false });
    }
  });

  const html = ejs.render(template, {
    theme: 'morph',
    vulnerabilities,
    advisories: sortedAdvisories,
    dependencies,
  });

  return html;
};
