import { runPnpmAudit, generateAuditReport, main } from './index';
import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import { generateHtml } from './htmlGenerator';
import { Command } from 'commander';
import { version } from '../package.json';

jest.mock('child_process');
jest.mock('fs');
jest.mock('./htmlGenerator', () => ({
  ...jest.requireActual('./htmlGenerator'),
  generateHtml: jest.fn(),
}));
jest.mock('commander');

const vulnerabilities = { info: 0, low: 1, moderate: 0, high: 2, critical: 1, total: 4 };

const auditPayload = JSON.stringify({
  actions: [],
  advisories: {},
  metadata: {
    vulnerabilities,
    dependencies: 10,
    devDependencies: 2,
    optionalDependencies: 0,
    totalDependencies: 12,
  },
});

describe('runPnpmAudit', () => {
  it('should return audit output when the command succeeds', () => {
    (execSync as jest.Mock).mockReturnValueOnce(auditPayload);

    expect(runPnpmAudit()).toBe(auditPayload);
  });

  it('should return stdout when the command fails with a non-zero exit code', () => {
    const mockError = new Error('Command failed');
    (mockError as any).stdout = auditPayload;
    (execSync as jest.Mock).mockImplementationOnce(() => {
      throw mockError;
    });

    expect(runPnpmAudit()).toBe(auditPayload);
  });

  it('should throw an error when the command fails without stdout', () => {
    (execSync as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Command failed');
    });

    expect(() => runPnpmAudit()).toThrow('Command failed');
  });
});

describe('generateAuditReport', () => {
  it('should write the HTML report and return the vulnerability counts', () => {
    const mockHtml = '<html>Mock Report</html>';
    (generateHtml as jest.Mock).mockReturnValue(mockHtml);

    const result = generateAuditReport(auditPayload, 'output.html');

    expect(generateHtml).toHaveBeenCalledWith(JSON.parse(auditPayload));
    expect(writeFileSync).toHaveBeenCalledWith('output.html', mockHtml);
    expect(result).toEqual(vulnerabilities);
  });

  it('should handle JSON parsing errors and log raw output', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => generateAuditReport('invalid json', 'output.html')).toThrow(SyntaxError);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to parse JSON:', expect.any(String));
    expect(consoleErrorSpy).toHaveBeenCalledWith('Raw output:', 'invalid json');

    consoleErrorSpy.mockRestore();
  });
});

describe('main', () => {
  let commandMock: Command;
  let actionOptions: Record<string, unknown>;
  let initialExitCode: typeof process.exitCode;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    initialExitCode = process.exitCode;
    actionOptions = { output: 'output.html' };
    commandMock = new Command();

    (commandMock.name as jest.Mock).mockReturnThis();
    (commandMock.version as jest.Mock).mockReturnThis();
    (commandMock.description as jest.Mock).mockReturnThis();
    (commandMock.option as jest.Mock).mockReturnThis();
    (commandMock.action as jest.Mock).mockImplementation((callback) => {
      callback(actionOptions);
    });

    (Command as jest.Mock).mockReturnValue(commandMock);

    (execSync as jest.Mock).mockReturnValue(auditPayload);
    (generateHtml as jest.Mock).mockReturnValue('<html>Mock Report</html>');

    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'time').mockImplementation(() => {});
    jest.spyOn(console, 'timeEnd').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.exitCode = initialExitCode;
    jest.restoreAllMocks();
  });

  const run = () => main(['node', 'script.js', '--output', 'output.html']);

  it('should run the audit, generate the report, and handle successful execution', () => {
    run();

    expect(commandMock.version).toHaveBeenCalledWith(version);
    expect(execSync).toHaveBeenCalledWith('pnpm audit --json', {
      encoding: 'utf-8',
      stdio: 'pipe',
      maxBuffer: 20971520,
    });
    expect(generateHtml).toHaveBeenCalledWith(JSON.parse(auditPayload));
    expect(writeFileSync).toHaveBeenCalledWith('output.html', '<html>Mock Report</html>');
    expect(process.exitCode).toBe(initialExitCode);
  });

  it('should exit non-zero and hint at --verbose when the audit fails', () => {
    (execSync as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Audit command failed');
    });

    run();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to generate audit report:',
      'Audit command failed'
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith('Re-run with --verbose for the full stack trace.');
    expect(process.exitCode).toBe(1);
  });

  it('should print the full error when --verbose is set', () => {
    const mockError = new Error('Audit command failed');
    actionOptions = { output: 'output.html', verbose: true };
    (execSync as jest.Mock).mockImplementationOnce(() => {
      throw mockError;
    });

    run();

    expect(consoleErrorSpy).toHaveBeenCalledWith(mockError);
    expect(process.exitCode).toBe(1);
  });

  describe('--fail-on', () => {
    it.each([
      ['critical', 1],
      ['high', 3],
      ['moderate', 3],
      ['low', 4],
      ['info', 4],
    ])('exits 2 when %s and above is breached by %i vulnerabilities', (failOn, breaching) => {
      actionOptions = { output: 'output.html', failOn };

      run();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `${breaching} vulnerabilities at or above '${failOn}' severity.`
      );
      expect(process.exitCode).toBe(2);
    });

    it('leaves the exit code untouched when nothing reaches the threshold', () => {
      actionOptions = { output: 'output.html', failOn: 'critical' };
      (execSync as jest.Mock).mockReturnValue(
        JSON.stringify({
          actions: [],
          advisories: {},
          metadata: {
            vulnerabilities: { info: 3, low: 1, moderate: 0, high: 0, critical: 0, total: 4 },
            dependencies: 10,
            devDependencies: 2,
            optionalDependencies: 0,
            totalDependencies: 12,
          },
        })
      );

      run();

      expect(process.exitCode).toBe(initialExitCode);
    });

    it('exits 1 on an unknown severity without running the audit', () => {
      actionOptions = { output: 'output.html', failOn: 'severe' };

      run();

      expect(execSync).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to generate audit report:',
        "Invalid --fail-on value 'severe'. Expected one of: info, low, moderate, high, critical."
      );
      expect(process.exitCode).toBe(1);
    });

    it('does not gate when the flag is absent', () => {
      run();

      expect(process.exitCode).toBe(initialExitCode);
    });
  });
});
