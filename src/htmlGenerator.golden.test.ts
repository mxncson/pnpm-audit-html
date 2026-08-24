import { readFileSync } from 'fs';
import { join } from 'path';
import { countAtOrAbove, generateHtml, isSeverity, type AuditData } from './htmlGenerator';

const loadFixture = (name: string): AuditData =>
  JSON.parse(readFileSync(join(__dirname, '../test/fixtures', name), 'utf-8'));

const stripVolatile = (html: string): string =>
  html
    .replace(/<style><\/style>|<style>[\s\S]*?<\/style>/, '<style>/* bootswatch */</style>')
    .replace(/Report generated at [^<]+/, 'Report generated at <timestamp>');

const countOccurrences = (haystack: string, needle: string): number =>
  haystack.split(needle).length - 1;

describe('generateHtml', () => {
  it('inlines the theme instead of linking a CDN', () => {
    const html = generateHtml(loadFixture('pnpm-v10.json'));

    expect(html).not.toContain('cdn.jsdelivr.net');
    expect(html).not.toContain('<link');
    expect(html).toContain('--bs-');
    expect(html.length).toBeGreaterThan(200_000);
  });

  it('renders one card per advisory and one anchor per severity present', () => {
    const html = generateHtml(loadFixture('pnpm-v10.json'));

    expect(countOccurrences(html, 'class="card mb-3"')).toBe(5);
    for (const severity of ['critical', 'high', 'moderate', 'low']) {
      expect(countOccurrences(html, `id="${severity}"`)).toBe(1);
    }
    expect(html).not.toContain('id="info"');
  });

  it('orders advisories from critical down to low', () => {
    const html = generateHtml(loadFixture('pnpm-v10.json'));
    const positions = [
      'Critical issue',
      'High issue',
      'Second high issue',
      'Moderate issue',
      'Low issue',
    ].map((title) => html.indexOf(title));

    expect(positions).not.toContain(-1);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  it('merges the findings of a single advisory and dedupes their paths', () => {
    const html = generateHtml(loadFixture('pnpm-v10.json'));

    expect(html).toContain('Installed versions: 2.0.0, 2.1.0');
    expect(countOccurrences(html, '. &gt; critmod@2.0.0')).toBe(1);
    expect(html).toContain('. &gt; y &gt; critmod@2.1.0');
  });

  it('uses one severity-to-badge mapping for the summary and the cards', () => {
    const html = generateHtml(loadFixture('pnpm-v10.json'));

    expect(html).toContain('badge bg-secondary">Info:');
    expect(html).toContain('badge bg-success">Low:');
    expect(html).toContain('badge text-capitalize bg-success');
  });

  it('recomputes the total from the per-severity counts', () => {
    const html = generateHtml(loadFixture('pnpm-v10.json'));

    expect(html).toContain('5 unique from 6 overall vulnerabilities | 389 dependencies');
  });

  it('does not mutate the audit data it is given', () => {
    const auditData = loadFixture('pnpm-v10.json');
    const before = JSON.stringify(auditData);

    generateHtml(auditData);

    expect(JSON.stringify(auditData)).toBe(before);
  });

  it('handles the pnpm v11 shape: cwe as a string and no overview', () => {
    const html = generateHtml(loadFixture('pnpm-v11.json'));

    expect(html).toContain('CWE: CWE-79, CWE-80');
    expect(html).not.toContain('<h3>Overview</h3>');
    expect(html).toContain('<h3>Remediation</h3>');
  });

  it('strips scripts, event handlers and javascript: urls from advisory markdown', () => {
    const html = generateHtml(loadFixture('xss.json'));

    expect(html).not.toContain('<script');
    expect(html).not.toContain('onerror');
    expect(html).not.toContain('<iframe');
    expect(html).not.toContain('javascript:');
    expect(html).toContain('Intro text with');
    expect(html).toContain('inline');
    expect(html).not.toContain('<b>inline');
    expect(html).toContain('https://example.com');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it('reports a clean project', () => {
    const html = generateHtml(loadFixture('clean.json'));

    expect(html).toContain('No vulnerabilities have been found.');
    expect(html).toContain('0 unique from 0 overall vulnerabilities | 12 dependencies');
  });

  it('matches the golden report structure', () => {
    expect(stripVolatile(generateHtml(loadFixture('pnpm-v10.json')))).toMatchSnapshot();
  });
});

describe('countAtOrAbove', () => {
  const vulnerabilities = { info: 1, low: 2, moderate: 3, high: 4, critical: 5, total: 15 };

  it.each([
    ['critical', 5],
    ['high', 9],
    ['moderate', 12],
    ['low', 14],
    ['info', 15],
  ] as const)('counts %s and above as %i', (threshold, expected) => {
    expect(countAtOrAbove(vulnerabilities, threshold)).toBe(expected);
  });
});

describe('isSeverity', () => {
  it('accepts the pnpm severities and rejects anything else', () => {
    expect(isSeverity('critical')).toBe(true);
    expect(isSeverity('info')).toBe(true);
    expect(isSeverity('Critical')).toBe(false);
    expect(isSeverity('severe')).toBe(false);
  });
});
