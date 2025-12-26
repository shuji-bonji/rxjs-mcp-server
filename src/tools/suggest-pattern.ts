import { z } from 'zod';
import { ToolImplementation, ToolResponse } from '../types.js';
import { patterns, adaptPatternForFramework } from '../data/patterns.js';

// Input schema
const inputSchema = z.object({
  useCase: z.enum([
    'http-retry',
    'search-typeahead',
    'polling',
    'websocket-reconnect',
    'form-validation',
    'state-management',
    'cache-refresh',
    'drag-drop',
    'infinite-scroll',
    'auto-save',
    'rate-limiting',
    'error-recovery',
    'loading-states',
    'data-sync',
    'event-aggregation'
  ]).describe('The use case for which to suggest an RxJS pattern'),
  framework: z.enum(['angular', 'react', 'vue', 'vanilla']).optional().default('vanilla').describe('Target framework for the pattern'),
});

// Tool implementation
export const suggestPatternTool: ToolImplementation = {
  definition: {
    name: 'suggest_pattern',
    description: 'Suggest RxJS patterns and best practices for common use cases',
    inputSchema: inputSchema,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  },
  handler: async (args: unknown): Promise<ToolResponse> => {
    const input = inputSchema.parse(args);

    try {
      const basePattern = patterns[input.useCase];

      if (!basePattern) {
        return {
          content: [{
            type: 'text',
            text: `## Pattern not found\n\nNo pattern available for use case: ${input.useCase}`,
          }],
        };
      }

      const pattern = adaptPatternForFramework(basePattern, input.framework);

      const parts: string[] = [
        `## ${pattern.name}`,
        '',
        `**Use Case:** ${pattern.useCase}`,
        `**Framework:** ${input.framework}`,
        '',
        '### Description',
        pattern.description,
        '',
        '### Key Operators',
        pattern.operators.map(op => `- \`${op}\``).join('\n'),
        '',
        '### Implementation',
        '```typescript',
        pattern.code.trim(),
        '```',
        '',
        '### Important Considerations',
        pattern.considerations.map(c => `- ${c}`).join('\n'),
        '',
        '### Related Patterns',
      ];

      // Suggest related patterns
      const relatedPatterns = Object.keys(patterns)
        .filter(key => key !== input.useCase)
        .slice(0, 3);

      relatedPatterns.forEach(key => {
        parts.push(`- **${patterns[key].name}**: ${patterns[key].description}`);
      });

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
          text: `## Error suggesting pattern\n\n${errorMessage}`,
        }],
      };
    }
  },
};
