#!/usr/bin/env node
/* eslint-disable no-console */

import { Command } from 'commander';
import { execSync, ExecSyncOptionsWithStringEncoding } from 'child_process';
import { generateHtml } from './htmlGenerator';
import { writeFileSync } from 'fs';

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
    .version('1.0.0')
    .description('Generate HTML report from pnpm audit')
    .option('-o, --output <file>', 'Output HTML file', 'pnpm-audit-report.html')
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
        if (error instanceof Error) {
          console.error('Failed to generate audit report:', error.message);
        }
        console.error('Full error:', error);
      }
    });

  // Custom help information
  program.on('--help', () => {
    console.log('');
    console.log('Examples:');
    console.log('  $ pnpm-audit-html --output report.html');
    console.log('  $ pnpm-audit-html -o custom-report.html');
  });

  program.parse(cliArgs);
};

if (require.main === module) {
  main();
}
