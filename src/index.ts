#!/usr/bin/env node
/* eslint-disable no-console */

import { Command } from 'commander';
import { execSync, ExecSyncOptionsWithStringEncoding } from 'child_process';
import { generateHtml } from './htmlGenerator';
import { writeFileSync } from 'fs';
import { version } from '../package.json';

export const runPnpmAudit = (): string => {
  try {
    return execSync('pnpm audit --json', {
      encoding: 'utf-8',
      stdio: 'pipe',
      maxBuffer: 1024 * 1024 * 20, // 20 MB buffer
    } as ExecSyncOptionsWithStringEncoding);
  } catch (error) {
    if (error instanceof Error && (error as any).stdout) {
      return (error as any).stdout.toString();
    } else {
      throw error;
    }
  }
};

export const generateAuditReport = (auditOutput: string, outputPath: string): void => {
  let auditData;
  try {
    auditData = JSON.parse(auditOutput);
  } catch (error) {
    if (error instanceof Error) {
      console.error('Failed to parse JSON:', error.message);
      console.error('Raw output:', auditOutput);
    }
    throw error;
  }

  const html = generateHtml(auditData);
  writeFileSync(outputPath, html);
};

export const main = (cliArgs: string[] = process.argv): void => {
  const program = new Command();

  program
    .name('pnpm-audit-html')
    .version(version)
    .description('Generate HTML report from pnpm audit')
    .option('-o, --output <file>', 'Output HTML file', 'pnpm-audit-report.html')
    .option('-v, --verbose', 'Print the full error stack on failure', false)
    .action((options) => {
      try {
        console.log('Running pnpm audit...');
        console.time('Audit report generation time');
        const auditOutput = runPnpmAudit();
        console.log('Audit command completed. Parsing output...');
        generateAuditReport(auditOutput, options.output);

        console.timeEnd('Audit report generation time');
        console.log(`Audit report generated: ${options.output}`);
      } catch (error) {
        console.error(
          'Failed to generate audit report:',
          error instanceof Error ? error.message : error
        );
        if (options.verbose) {
          console.error(error);
        } else {
          console.error('Re-run with --verbose for the full stack trace.');
        }
        process.exitCode = 1;
      }
    });

  // Custom help information
  program.on('--help', () => {
    console.log('');
    console.log('Examples:');
    console.log('  $ pnpm-audit-html --output report.html');
    console.log('  $ pnpm-audit-html -o custom-report.html');
    console.log('  $ pnpm-audit-html --verbose');
  });

  program.parse(cliArgs);
};

if (require.main === module) {
  main();
}
