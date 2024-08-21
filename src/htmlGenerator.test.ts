import { generateHtml, AuditData } from '../src/htmlGenerator';
import { readFileSync } from 'fs';
import ejs from 'ejs';
import { marked } from 'marked';

jest.mock('fs');
jest.mock('ejs');
jest.mock('marked', () => ({
  marked: jest.fn((input: string) => `<p>${input}</p>`), // Mocking marked to wrap input in <p> tags
}));

describe('generateHtml', () => {
  const mockTemplate = '<html><body><%= advisories[0].title %></body></html>';

  beforeEach(() => {
    (readFileSync as jest.Mock).mockReturnValue(mockTemplate);
    (ejs.render as jest.Mock).mockImplementation((template, data) => {
      return template.replace('<%= advisories[0].title %>', data.advisories[0].title);
    });
  });

  it('should generate HTML from the provided audit data', () => {
    const mockAuditData: AuditData = {
      actions: [],
      advisories: {
        '1234': {
          findings: [
            {
              version: '1.0.0',
              paths: ['. > module1@1.0.0'],
            },
          ],
          metadata: {},
          vulnerable_versions: '<1.0.1',
          module_name: 'module1',
          severity: 'high',
          github_advisory_id: 'GHSA-1234-5678',
          cves: ['CVE-2021-1234'],
          access: 'public',
          patched_versions: '>=1.0.1',
          cvss: {
            score: 7.5,
            vectorString: 'AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
          },
          updated: '2023-01-01T00:00:00Z',
          recommendation: 'Update to version 1.0.1 or later.',
          cwe: ['CWE-79'],
          found_by: null,
          deleted: null,
          id: 1234,
          references: '- https://example.com/advisory/1234',
          created: '2023-01-01T00:00:00Z',
          reported_by: null,
          title: 'High Severity Vulnerability in module1',
          npm_advisory_id: null,
          overview: 'This is a test overview.',
          url: 'https://github.com/advisories/GHSA-1234-5678',
        },
      },
      metadata: {
        vulnerabilities: {
          info: 0,
          low: 0,
          moderate: 0,
          high: 1,
          critical: 0,
          total: 1,
        },
        dependencies: 1,
        devDependencies: 0,
        optionalDependencies: 0,
        totalDependencies: 1,
      },
    };

    const expectedHtml = `<html><body>High Severity Vulnerability in module1</body></html>`;
    const result = generateHtml(mockAuditData as any);

    expect(readFileSync).toHaveBeenCalledWith(
      expect.stringContaining('reportTemplate.ejs'),
      'utf-8'
    );
    expect(ejs.render).toHaveBeenCalledWith(mockTemplate, expect.anything());
    expect(result).toBe(expectedHtml);
  });

  it('should correctly parse markdown in overview, recommendation, and references', () => {
    const mockAuditData: AuditData = {
      actions: [],
      advisories: {
        '1234': {
          findings: [
            {
              version: '1.0.0',
              paths: ['. > module1@1.0.0'],
            },
          ],
          metadata: {},
          vulnerable_versions: '<1.0.1',
          module_name: 'module1',
          severity: 'high',
          github_advisory_id: 'GHSA-1234-5678',
          cves: ['CVE-2021-1234'],
          access: 'public',
          patched_versions: '>=1.0.1',
          cvss: {
            score: 7.5,
            vectorString: 'AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
          },
          updated: '2023-01-01T00:00:00Z',
          recommendation: 'Update to version 1.0.1 or later.',
          cwe: ['CWE-79'],
          found_by: null,
          deleted: null,
          id: 1234,
          references: '- https://example.com/advisory/1234',
          created: '2023-01-01T00:00:00Z',
          reported_by: null,
          title: 'High Severity Vulnerability in module1',
          npm_advisory_id: null,
          overview: 'This is a test overview.',
          url: 'https://github.com/advisories/GHSA-1234-5678',
        },
      },
      metadata: {
        vulnerabilities: {
          info: 0,
          low: 0,
          moderate: 0,
          high: 1,
          critical: 0,
          total: 1,
        },
        dependencies: 1,
        devDependencies: 0,
        optionalDependencies: 0,
        totalDependencies: 1,
      },
    };

    generateHtml(mockAuditData);

    expect(marked).toHaveBeenCalledWith('This is a test overview.', {
      async: false,
    });
    expect(marked).toHaveBeenCalledWith('Update to version 1.0.1 or later.', {
      async: false,
    });
    expect(marked).toHaveBeenCalledWith('- https://example.com/advisory/1234', {
      async: false,
    });
  });
});
