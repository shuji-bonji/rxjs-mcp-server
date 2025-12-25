# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.2] - 2025-12-26

### Fixed
- Use `zod-to-json-schema` for proper JSON Schema conversion (MCP SDK compatibility)
- Added unofficial community notice to Japanese README

## [0.1.1] - 2025-12-25

### Added
- Unofficial community project notice in README

### Security
- Code execution now runs in isolated Worker threads
- Dangerous globals (process, require, fs, etc.) are explicitly blocked
- Hard timeout with forced worker termination prevents resource leaks

## [0.1.0] - 2025-12-25

### Added
- Initial release
- `execute_stream` - Execute RxJS code and capture emissions
- `generate_marble` - Generate ASCII marble diagrams
- `analyze_operators` - Analyze operator chains for performance
- `detect_memory_leak` - Detect potential memory leaks
- `suggest_pattern` - Suggest RxJS patterns for common use cases
- Support for Angular, React, Vue frameworks
- Comprehensive test suite (181 unit tests, 7 integration tests)
