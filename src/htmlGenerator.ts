import ejs from 'ejs';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Marked } from 'marked';

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
  cwe: string[] | string;
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

export interface Vulnerabilities {
  info: number;
  low: number;
  moderate: number;
  high: number;
  critical: number;
  total: number;
}

export const SEVERITIES = ['info', 'low', 'moderate', 'high', 'critical'] as const;

export type Severity = (typeof SEVERITIES)[number];

export const isSeverity = (value: string): value is Severity =>
  (SEVERITIES as readonly string[]).includes(value);

export const countAtOrAbove = (vulnerabilities: Vulnerabilities, threshold: Severity): number =>
  SEVERITIES.slice(SEVERITIES.indexOf(threshold)).reduce(
    (total, severity) => total + (vulnerabilities[severity] ?? 0),
    0
  );

interface AdvisoryView {
  severity: string;
  title: string;
  moduleName: string;
  installedVersions: string[];
  vulnerableVersions: string;
  patchedVersions: string;
  created: string;
  cves: string[];
  cwe: string[];
  overview: string;
  recommendation: string;
  references: string;
  paths: string[];
  url: string;
}

const SAFE_URL_SCHEME = /^(?:https?:|mailto:)/i;

const escapeHtml = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const markdown = new Marked({
  async: false,
  renderer: {
    html: () => '',
    image: () => '',
    link({ href, title, tokens }) {
      const text = this.parser.parseInline(tokens);
      if (!SAFE_URL_SCHEME.test(href)) {
        return text;
      }
      const titleAttribute = title ? ` title="${escapeHtml(title)}"` : '';
      return `<a href="${escapeHtml(href)}"${titleAttribute} target="_blank" rel="noopener noreferrer">${text}</a>`;
    },
  },
});

const renderMarkdown = (source: string): string => markdown.parse(source) as string;

const loadThemeCss = (): string =>
  readFileSync(require.resolve('bootswatch/dist/morph/bootstrap.min.css'), 'utf-8');

const toCweList = (cwe: string[] | string): string[] =>
  Array.isArray(cwe)
    ? cwe
    : cwe
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);

const toAdvisoryView = (advisory: Advisory): AdvisoryView => {
  const findings = advisory.findings ?? [];

  return {
    severity: advisory.severity,
    title: advisory.title,
    moduleName: advisory.module_name,
    installedVersions: [...new Set(findings.map((finding) => finding.version))],
    vulnerableVersions: advisory.vulnerable_versions,
    patchedVersions: advisory.patched_versions,
    created: advisory.created,
    cves: advisory.cves ?? [],
    cwe: advisory.cwe ? toCweList(advisory.cwe) : [],
    overview: advisory.overview ? renderMarkdown(advisory.overview) : '',
    recommendation: advisory.recommendation ? renderMarkdown(advisory.recommendation) : '',
    references: advisory.references ? renderMarkdown(advisory.references) : '',
    paths: [...new Set(findings.flatMap((finding) => finding.paths ?? []))],
    url: advisory.url,
  };
};

export const generateHtml = (auditData: AuditData): string => {
  const templatePath = join(__dirname, '../templates/reportTemplate.ejs');
  const template = readFileSync(templatePath, 'utf-8');

  const counts = auditData.metadata.vulnerabilities;
  const vulnerabilities: Vulnerabilities = {
    ...counts,
    total: SEVERITIES.reduce((total, severity) => total + (counts[severity] ?? 0), 0),
  };

  const advisories = Object.values(auditData.advisories ?? {})
    .sort(
      (a, b) =>
        SEVERITIES.indexOf(b.severity as Severity) - SEVERITIES.indexOf(a.severity as Severity)
    )
    .map(toAdvisoryView);

  return ejs.render(template, {
    css: loadThemeCss(),
    vulnerabilities,
    advisories,
    dependencies: { total: auditData.metadata.totalDependencies },
  });
};
