# 🚀 PNPM Audit HTML

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Generate beautiful HTML reports from your pnpm audit results. This tool provides a clear and concise view of vulnerabilities in your project, making it easier to track and fix issues.

## ✨ Features

- **Easy to Use**: Simple CLI commands to generate reports.
- **Beautiful Reports**: Generates well-structured and visually appealing HTML reports.
- **Customizable Output**: Choose your output file name and location.

## 📋 Requirements

- **pnpm**: v8.0.0 or higher
- **Node.js**: v14.15.0 or higher

## 📦 Installation

To install `pnpm-audit-html`, follow these steps:

```bash
# Ensure you have pnpm v8+ installed
npm install -g pnpm

# Install pnpm-audit-html globally
pnpm install -g pnpm-audit-html
```

Or, install it as a dev dependency in your project:

```bash
pnpm add -D pnpm-audit-html
```

## 🚀 Usage

After installation, you can generate an HTML report from your `pnpm audit` results with a single command.

### Basic Usage

```bash
pnpm-audit-html
```

This command will generate an HTML report in the current directory with the default name `pnpm-audit-report.html`.

### Custom Output File

To specify a custom output file, use the `-o` or `--output` option:

```bash
pnpm-audit-html --output report.html
```

### Example Commands

```bash
# Generate report with default file name
pnpm-audit-html

# Generate report with a custom file name
pnpm-audit-html --output security-report.html
```

## 🔧 Configuration

`pnpm-audit-html` uses sensible defaults for most configurations. However, you can customize the output file name and other options directly via CLI flags.

### Available Options

- `-o, --output <file>`: Specify the output HTML file (default: pnpm-audit-report.html).
- `-v, --verbose`: Print the full error stack when report generation fails.
- `-V, --version`: Output the version number.
- `-h, --help`: Display help for the command.

### Exit Codes

- `0`: The report was generated successfully.
- `1`: Report generation failed (audit could not run, output could not be parsed, or the
  file could not be written). Re-run with `--verbose` to see the stack trace.

Note that a successful run exits `0` even when vulnerabilities are found — the report is
still generated. Gating a pipeline on severity is not supported yet.

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests on GitHub.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

If you encounter any issues or have questions, please open an issue on the [GitHub repository](https://github.com/mxncson/pnpm-audit-html/issues).

## 🎉 Acknowledgments

Thanks to all contributors and the open-source community for making this project possible.
