import { runPnpmAudit, generateAuditReport, main } from './index';
import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import { generateHtml } from './htmlGenerator';
import { Command } from 'commander';

jest.mock('child_process');
jest.mock('fs');
jest.mock('./htmlGenerator');
jest.mock('commander');

describe('runPnpmAudit', () => {
  it('should return audit output when the command succeeds', () => {
    const mockOutput = '{"mock": "data"}';
    (execSync as jest.Mock).mockReturnValueOnce(mockOutput);

    const result = runPnpmAudit();
    expect(result).toBe(mockOutput);
  });

  it('should return stdout when the command fails with a non-zero exit code', () => {
    const mockError = new Error('Command failed');
    (mockError as any).stdout = '{"mock": "data"}';
    (execSync as jest.Mock).mockImplementationOnce(() => {
      throw mockError;
    });

    const result = runPnpmAudit();
    expect(result).toBe('{"mock": "data"}');
  });

  it('should throw an error when the command fails without stdout', () => {
    const mockError = new Error('Command failed');
    (execSync as jest.Mock).mockImplementationOnce(() => {
      throw mockError;
    });

    expect(() => runPnpmAudit()).toThrow('Command failed');
  });
});

describe('generateAuditReport', () => {
  it('should generate and write HTML report', () => {
    const mockAuditOutput = '{"mock": "data"}';
    const mockHtml = '<html>Mock Report</html>';
    (generateHtml as jest.Mock).mockReturnValue(mockHtml);

    generateAuditReport(mockAuditOutput, 'output.html');

    expect(generateHtml).toHaveBeenCalledWith(JSON.parse(mockAuditOutput));
    expect(writeFileSync).toHaveBeenCalledWith('output.html', mockHtml);
  });

  it('should handle JSON parsing errors and log raw output', () => {
    const mockAuditOutput = 'invalid json';
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => generateAuditReport(mockAuditOutput, 'output.html')).toThrow(SyntaxError);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to parse JSON:', expect.any(String));
    expect(consoleErrorSpy).toHaveBeenCalledWith('Raw output:', mockAuditOutput);

    consoleErrorSpy.mockRestore();
  });
});

describe('main', () => {
  let commandMock: Command;

  beforeEach(() => {
    jest.clearAllMocks();
    commandMock = new Command();

    (commandMock.name as jest.Mock).mockReturnThis();
    (commandMock.version as jest.Mock).mockReturnThis();
    (commandMock.description as jest.Mock).mockReturnThis();
    (commandMock.option as jest.Mock).mockReturnThis();
    (commandMock.action as jest.Mock).mockImplementation((callback) => {
      callback({ output: 'output.html' });
    });

    (Command as jest.Mock).mockReturnValue(commandMock);
  });

  it('should run the audit, generate the report, and handle successful execution', () => {
    const mockAuditOutput = '{"mock": "data"}';
    const mockHtml = '<html>Mock Report</html>';
    (execSync as jest.Mock).mockReturnValue(mockAuditOutput);
    (generateHtml as jest.Mock).mockReturnValue(mockHtml);

    const consoleTimeSpy = jest.spyOn(console, 'time').mockImplementation(() => {});
    const consoleTimeEndSpy = jest.spyOn(console, 'timeEnd').mockImplementation(() => {});

    main(['node', 'script.js', '--output', 'output.html']);

    expect(execSync).toHaveBeenCalledWith('pnpm audit --json', {
      encoding: 'utf-8',
      stdio: 'pipe',
      maxBuffer: 20971520,
    });
    expect(generateHtml).toHaveBeenCalledWith(JSON.parse(mockAuditOutput));
    expect(writeFileSync).toHaveBeenCalledWith('output.html', mockHtml);
    expect(consoleTimeSpy).toHaveBeenCalledWith('Audit report generation time');
    expect(consoleTimeEndSpy).toHaveBeenCalledWith('Audit report generation time');

    consoleTimeSpy.mockRestore();
    consoleTimeEndSpy.mockRestore();
  });

  it('should handle errors during audit execution', () => {
    const mockError = new Error('Audit command failed');
    (execSync as jest.Mock).mockImplementationOnce(() => {
      throw mockError;
    });

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    main(['node', 'script.js', '--output', 'output.html']);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to generate audit report:',
      'Audit command failed'
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith('Full error:', mockError);

    consoleErrorSpy.mockRestore();
  });
});
