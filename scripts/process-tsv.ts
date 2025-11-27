#!/usr/bin/env node
/**
 * TSV Import Validation CLI Script
 *
 * This script processes a TSV file and validates gestational age calculations,
 * detecting placeholder dates and calculation discrepancies.
 *
 * USAGE:
 *   npx tsx scripts/process-tsv.ts <path-to-tsv-file> [options]
 *
 * OPTIONS:
 *   --dum <index>        Column index for DUM date (default: 10)
 *   --dum-status <index> Column index for DUM status (default: 9)
 *   --usg-date <index>   Column index for USG date (default: 11)
 *   --usg-weeks <index>  Column index for USG weeks (default: 12)
 *   --usg-days <index>   Column index for USG days (default: 13)
 *   --ref-date <index>   Column index for reference date (default: -1, uses today)
 *   --verbose            Show all rows, not just those with warnings
 *   --help               Show this help message
 *
 * EXAMPLES:
 *   npx tsx scripts/process-tsv.ts data/agendamentos.tsv
 *   npx tsx scripts/process-tsv.ts data/agendamentos.tsv --verbose
 *   npx tsx scripts/process-tsv.ts data/agendamentos.tsv --dum 5 --usg-date 7
 *
 * INSTALLATION (if tsx not available):
 *   npm install -D tsx
 *
 * NOTE:
 *   This script is meant for local debugging and validation only.
 *   For production imports, use the importSanitizer functions directly in your pipeline.
 */

import * as fs from 'fs';
import * as path from 'path';

// Import from relative path since this runs outside the Vite context
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { processTsvContent, parseDateSafe, isPlaceholderDate } = require('../src/lib/importSanitizer');

interface CliOptions {
  filePath: string;
  dumIndex: number;
  dumStatusIndex: number;
  usgDateIndex: number;
  usgWeeksIndex: number;
  usgDaysIndex: number;
  referenceDateIndex: number;
  verbose: boolean;
}

function parseArgs(args: string[]): CliOptions | null {
  const options: CliOptions = {
    filePath: '',
    dumIndex: 10,
    dumStatusIndex: 9,
    usgDateIndex: 11,
    usgWeeksIndex: 12,
    usgDaysIndex: 13,
    referenceDateIndex: -1,
    verbose: false
  };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      printHelp();
      return null;
    }

    if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
      i++;
      continue;
    }

    if (arg === '--dum') {
      options.dumIndex = parseInt(args[++i], 10);
      i++;
      continue;
    }

    if (arg === '--dum-status') {
      options.dumStatusIndex = parseInt(args[++i], 10);
      i++;
      continue;
    }

    if (arg === '--usg-date') {
      options.usgDateIndex = parseInt(args[++i], 10);
      i++;
      continue;
    }

    if (arg === '--usg-weeks') {
      options.usgWeeksIndex = parseInt(args[++i], 10);
      i++;
      continue;
    }

    if (arg === '--usg-days') {
      options.usgDaysIndex = parseInt(args[++i], 10);
      i++;
      continue;
    }

    if (arg === '--ref-date') {
      options.referenceDateIndex = parseInt(args[++i], 10);
      i++;
      continue;
    }

    // Positional argument - file path
    if (!arg.startsWith('--') && !arg.startsWith('-')) {
      options.filePath = arg;
    }

    i++;
  }

  return options;
}

function printHelp(): void {
  console.log(`
TSV Import Validation CLI Script

USAGE:
  npx tsx scripts/process-tsv.ts <path-to-tsv-file> [options]

OPTIONS:
  --dum <index>        Column index for DUM date (default: 10)
  --dum-status <index> Column index for DUM status (default: 9)
  --usg-date <index>   Column index for USG date (default: 11)
  --usg-weeks <index>  Column index for USG weeks (default: 12)
  --usg-days <index>   Column index for USG days (default: 13)
  --ref-date <index>   Column index for reference date (default: -1, uses today)
  --verbose            Show all rows, not just those with warnings
  --help               Show this help message

EXAMPLES:
  npx tsx scripts/process-tsv.ts data/agendamentos.tsv
  npx tsx scripts/process-tsv.ts data/agendamentos.tsv --verbose
  npx tsx scripts/process-tsv.ts data/agendamentos.tsv --dum 5 --usg-date 7
`);
}

function main(): void {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Error: No file path provided.');
    console.error('Run with --help for usage information.');
    process.exit(1);
  }

  const options = parseArgs(args);
  if (!options) {
    process.exit(0); // Help was shown
  }

  if (!options.filePath) {
    console.error('Error: No file path provided.');
    process.exit(1);
  }

  const absolutePath = path.resolve(options.filePath);

  if (!fs.existsSync(absolutePath)) {
    console.error(`Error: File not found: ${absolutePath}`);
    process.exit(1);
  }

  console.log(`\n📂 Processing file: ${absolutePath}\n`);
  console.log(`Column mapping:`);
  console.log(`  - DUM: column ${options.dumIndex}`);
  console.log(`  - DUM Status: column ${options.dumStatusIndex}`);
  console.log(`  - USG Date: column ${options.usgDateIndex}`);
  console.log(`  - USG Weeks: column ${options.usgWeeksIndex}`);
  console.log(`  - USG Days: column ${options.usgDaysIndex}`);
  console.log(`  - Reference Date: ${options.referenceDateIndex >= 0 ? `column ${options.referenceDateIndex}` : 'today'}`);
  console.log('');

  const content = fs.readFileSync(absolutePath, 'utf-8');
  const lines = content.split('\n');

  console.log(`📊 Total lines: ${lines.length} (including header)\n`);

  // Check if it's really TSV
  const firstDataLine = lines[1];
  if (firstDataLine && !firstDataLine.includes('\t')) {
    console.warn('⚠️  Warning: File does not appear to be tab-separated. Check delimiter.\n');
  }

  // Process the file
  try {
    const results = processTsvContent(content, {
      dumIndex: options.dumIndex,
      dumStatusIndex: options.dumStatusIndex,
      usgDateIndex: options.usgDateIndex,
      usgWeeksIndex: options.usgWeeksIndex,
      usgDaysIndex: options.usgDaysIndex,
      referenceDateIndex: options.referenceDateIndex
    });

    // Statistics
    let totalRows = results.length;
    let validDum = 0;
    let validUsg = 0;
    let invalidRows = 0;
    let placeholderDum = 0;
    let placeholderUsg = 0;

    const issueRows: typeof results = [];

    for (const row of results) {
      if (row.result.source === 'DUM') validDum++;
      if (row.result.source === 'USG') validUsg++;
      if (row.result.source === 'INVALID') invalidRows++;
      if (row.dumRaw && isPlaceholderDate(row.dumRaw)) placeholderDum++;
      if (row.usgDateRaw && isPlaceholderDate(row.usgDateRaw)) placeholderUsg++;

      if (row.warnings.length > 0 || row.result.source === 'INVALID') {
        issueRows.push(row);
      }
    }

    // Print summary
    console.log('📈 Summary:');
    console.log(`  - Total data rows processed: ${totalRows}`);
    console.log(`  - Valid calculations using DUM: ${validDum}`);
    console.log(`  - Valid calculations using USG: ${validUsg}`);
    console.log(`  - Invalid/uncalculable rows: ${invalidRows}`);
    console.log(`  - Placeholder DUM dates detected: ${placeholderDum}`);
    console.log(`  - Placeholder USG dates detected: ${placeholderUsg}`);
    console.log('');

    if (options.verbose) {
      console.log('📋 All rows:\n');
      for (const row of results) {
        printRow(row);
      }
    } else if (issueRows.length > 0) {
      console.log(`⚠️  Rows with issues (${issueRows.length}):\n`);
      for (const row of issueRows) {
        printRow(row);
      }
    } else {
      console.log('✅ No issues detected!\n');
    }

  } catch (error) {
    console.error('Error processing file:', error);
    process.exit(1);
  }
}

function printRow(row: {
  lineNumber: number;
  dumRaw: string | null;
  usgDateRaw: string | null;
  result: { source: string; gaFormatted: string; reason: string; dpp: Date | null };
  warnings: string[];
}): void {
  console.log(`Line ${row.lineNumber}:`);
  console.log(`  DUM: ${row.dumRaw || '(empty)'}`);
  console.log(`  USG Date: ${row.usgDateRaw || '(empty)'}`);
  console.log(`  Source: ${row.result.source}`);
  console.log(`  IG: ${row.result.gaFormatted}`);
  console.log(`  DPP: ${row.result.dpp ? row.result.dpp.toISOString().split('T')[0] : 'N/A'}`);
  console.log(`  Reason: ${row.result.reason}`);
  if (row.warnings.length > 0) {
    console.log(`  ⚠️  Warnings: ${row.warnings.join('; ')}`);
  }
  console.log('');
}

main();
