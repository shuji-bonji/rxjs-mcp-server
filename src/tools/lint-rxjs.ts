import { z } from 'zod';
import { ToolImplementation, ToolResponse } from '../types.js';
import {
  LintConfig,
  LintDiagnostic,
  FrameworkContext,
  allLintRules,
  getRulesForConfig,
} from '../data/lint-rules.js';

// Input schema
const inputSchema = z.object({
  code: z.string().describe('RxJS code to lint'),
  config: z.enum(['recommended', 'strict']).optional().default('recommended')
    .describe('Lint config level: recommended (default) or strict (includes all rules)'),
  framework: z.enum(['angular', 'react', 'vue', 'none']).optional().default('none')
    .describe('Framework context for framework-specific rules'),
  rules: z.array(z.string()).optional()
    .describe('Specific rule names to check (overrides config). Example: ["no-nested-subscribe", "no-async-subscribe"]'),
});

// Severity icons
const severityIcon: Record<string, string> = {
  error: '🔴',
  warning: '🟡',
  info: '🔵',
};

// Tool implementation
export const lintRxjsTool: ToolImplementation = {
  definition: {
    name: 'lint_rxjs',
    description:
      'Lint RxJS code for common issues and best practices. ' +
      'Based on eslint-plugin-rxjs-x rules. ' +
      'Checks for nested subscribes, memory leaks, deprecated patterns, and more. ' +
      'Supports framework-specific rules for Angular, React, and Vue.',
    inputSchema: inputSchema,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  },
  handler: async (args: unknown): Promise<ToolResponse> => {
    const input = inputSchema.parse(args);
    const { code, config, framework, rules: ruleFilter } = input;

    try {
      // Determine which rules to run
      let rulesToRun = getRulesForConfig(config as LintConfig);

      // If specific rules are requested, filter to only those
      if (ruleFilter && ruleFilter.length > 0) {
        rulesToRun = allLintRules.filter(r => ruleFilter.includes(r.name));
        if (rulesToRun.length === 0) {
          const available = allLintRules.map(r => r.name).join(', ');
          return {
            content: [{
              type: 'text',
              text: `## No matching rules found\n\nSpecified rules not recognized. Available rules:\n${available}`,
            }],
          };
        }
      }

      // Run all applicable rules
      const diagnostics: LintDiagnostic[] = [];
      for (const rule of rulesToRun) {
        const results = rule.check(code, framework as FrameworkContext);
        diagnostics.push(...results);
      }

      // Sort by severity (error > warning > info), then by line
      const severityOrder = { error: 0, warning: 1, info: 2 };
      diagnostics.sort((a, b) => {
        const sevDiff = severityOrder[a.severity] - severityOrder[b.severity];
        if (sevDiff !== 0) return sevDiff;
        return (a.line ?? 0) - (b.line ?? 0);
      });

      // Build output
      const parts: string[] = [];

      if (diagnostics.length === 0) {
        parts.push('## ✅ No issues found');
        parts.push('');
        parts.push(`Checked ${rulesToRun.length} rules (config: \`${config}\`, framework: \`${framework}\`).`);
        parts.push('');
        parts.push('Your RxJS code looks good!');
      } else {
        // Summary
        const errors = diagnostics.filter(d => d.severity === 'error').length;
        const warnings = diagnostics.filter(d => d.severity === 'warning').length;
        const infos = diagnostics.filter(d => d.severity === 'info').length;

        parts.push('## RxJS Lint Results');
        parts.push('');
        parts.push(`**Config:** \`${config}\` | **Framework:** \`${framework}\` | **Rules checked:** ${rulesToRun.length}`);
        parts.push('');

        const summaryParts: string[] = [];
        if (errors > 0) summaryParts.push(`🔴 ${errors} error(s)`);
        if (warnings > 0) summaryParts.push(`🟡 ${warnings} warning(s)`);
        if (infos > 0) summaryParts.push(`🔵 ${infos} info(s)`);
        parts.push(`**Summary:** ${summaryParts.join(' | ')}`);
        parts.push('');

        // Details
        parts.push('### Diagnostics');
        parts.push('');

        for (const diag of diagnostics) {
          const icon = severityIcon[diag.severity];
          const lineInfo = diag.line ? ` (line ${diag.line})` : '';
          parts.push(`${icon} **${diag.rule}**${lineInfo}`);
          parts.push(`   ${diag.message}`);
          if (diag.suggestion) {
            parts.push(`   💡 *${diag.suggestion}*`);
          }
          parts.push(`   📖 [Rule docs](${diag.docUrl})`);
          parts.push('');
        }
      }

      // Footer
      parts.push('---');
      parts.push('📚 Reference: [eslint-plugin-rxjs-x](https://github.com/JasonWeinzierl/eslint-plugin-rxjs-x)');
      if (framework === 'angular') {
        parts.push(' | [eslint-plugin-rxjs-angular-x](https://github.com/JasonWeinzierl/eslint-plugin-rxjs-angular-x)');
      }

      return {
        content: [{
          type: 'text',
          text: parts.join('\n'),
        }],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        content: [{
          type: 'text',
          text: `## Error during linting\n\n${errorMessage}`,
        }],
      };
    }
  },
};
