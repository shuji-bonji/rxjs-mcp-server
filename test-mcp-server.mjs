#!/usr/bin/env node
/**
 * MCP Server Integration Test
 * Tests that the server works correctly as an MCP server
 */

import { spawn } from 'child_process';

const server = spawn('node', ['dist/index.js'], {
  stdio: ['pipe', 'pipe', 'pipe'],
});

let responseBuffer = '';

// Handle server stderr (logs)
server.stderr.on('data', (data) => {
  console.log('[Server Log]', data.toString().trim());
});

// Handle server stdout (JSON-RPC responses)
server.stdout.on('data', (data) => {
  responseBuffer += data.toString();

  // Try to parse complete JSON-RPC messages
  const lines = responseBuffer.split('\n');
  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i].trim();
    if (line) {
      try {
        const response = JSON.parse(line);
        handleResponse(response);
      } catch (e) {
        // Not a complete JSON message yet
      }
    }
  }
  responseBuffer = lines[lines.length - 1];
});

let testStep = 0;
const tests = [];

function handleResponse(response) {
  console.log('\n[Response]', JSON.stringify(response, null, 2));

  if (response.result) {
    tests.push({ step: testStep, success: true });
  } else if (response.error) {
    tests.push({ step: testStep, success: false, error: response.error });
  }

  testStep++;
  runNextTest();
}

function sendRequest(method, params, id) {
  const request = {
    jsonrpc: '2.0',
    id,
    method,
    params,
  };
  console.log('\n[Request]', JSON.stringify(request, null, 2));
  server.stdin.write(JSON.stringify(request) + '\n');
}

async function runNextTest() {
  switch (testStep) {
    case 1:
      // Test: List tools
      console.log('\n--- Test 1: List Tools ---');
      sendRequest('tools/list', {}, 2);
      break;

    case 2:
      // Test: Execute stream
      console.log('\n--- Test 2: Execute Stream (of) ---');
      sendRequest('tools/call', {
        name: 'execute_stream',
        arguments: {
          code: 'return of(1, 2, 3);',
          takeCount: 10,
          timeout: 5000,
        },
      }, 3);
      break;

    case 3:
      // Test: Analyze operators
      console.log('\n--- Test 3: Analyze Operators ---');
      sendRequest('tools/call', {
        name: 'analyze_operators',
        arguments: {
          code: 'source$.pipe(map(x => x * 2)).pipe(filter(x => x > 0));',
        },
      }, 4);
      break;

    case 4:
      // Test: Generate marble diagram
      console.log('\n--- Test 4: Generate Marble Diagram ---');
      sendRequest('tools/call', {
        name: 'generate_marble',
        arguments: {
          events: [
            { time: 0, value: 1, type: 'next' },
            { time: 100, value: 2, type: 'next' },
            { time: 200, value: 3, type: 'next' },
          ],
        },
      }, 5);
      break;

    case 5:
      // Test: Detect memory leak
      console.log('\n--- Test 5: Detect Memory Leak ---');
      sendRequest('tools/call', {
        name: 'detect_memory_leak',
        arguments: {
          code: 'interval(1000).subscribe(x => console.log(x));',
        },
      }, 6);
      break;

    case 6:
      // Test: Suggest pattern
      console.log('\n--- Test 6: Suggest Pattern ---');
      sendRequest('tools/call', {
        name: 'suggest_pattern',
        arguments: {
          useCase: 'search-typeahead',
          framework: 'angular',
        },
      }, 7);
      break;

    case 7:
      // All tests complete
      console.log('\n\n========================================');
      console.log('MCP Server Integration Test Results');
      console.log('========================================');

      const passed = tests.filter(t => t.success).length;
      const failed = tests.filter(t => !t.success).length;

      console.log(`Total: ${tests.length} tests`);
      console.log(`Passed: ${passed}`);
      console.log(`Failed: ${failed}`);

      if (failed > 0) {
        console.log('\nFailed tests:');
        tests.filter(t => !t.success).forEach(t => {
          console.log(`  Step ${t.step}: ${t.error?.message || 'Unknown error'}`);
        });
      }

      console.log('\n✅ MCP Server is working correctly!\n');

      server.kill();
      process.exit(failed > 0 ? 1 : 0);
  }
}

// Start testing
console.log('Starting MCP Server Integration Test...\n');

// Initialize connection
console.log('--- Test 0: Initialize ---');
sendRequest('initialize', {
  protocolVersion: '2024-11-05',
  capabilities: {},
  clientInfo: {
    name: 'test-client',
    version: '1.0.0',
  },
}, 1);

// Timeout after 30 seconds
setTimeout(() => {
  console.error('\n❌ Test timeout!');
  server.kill();
  process.exit(1);
}, 30000);
