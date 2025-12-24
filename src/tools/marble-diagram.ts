import { z } from 'zod';
import { ToolImplementation, ToolResponse, MarbleDiagramResult } from '../types.js';

// Input schema
const inputSchema = z.object({
  events: z.array(z.object({
    time: z.number().describe('Time in milliseconds when the event occurs'),
    value: z.any().describe('Value emitted at this time'),
    type: z.enum(['next', 'error', 'complete']).optional().default('next'),
  })).describe('Array of events to visualize'),
  duration: z.number().optional().describe('Total duration to show in the diagram'),
  scale: z.number().optional().default(50).describe('Time scale factor (ms per character)'),
  showValues: z.boolean().optional().default(true).describe('Whether to show values below the timeline'),
});

// Generate ASCII marble diagram
function generateMarbleDiagram(
  events: Array<{ time: number; value?: any; type: string }>,
  duration?: number,
  scale: number = 50,
  showValues: boolean = true
): MarbleDiagramResult {
  // Sort events by time
  const sortedEvents = [...events].sort((a, b) => a.time - b.time);
  
  // Determine diagram duration
  const maxTime = sortedEvents.length > 0 
    ? Math.max(...sortedEvents.map(e => e.time))
    : 0;
  const diagramDuration = duration || maxTime + scale * 2;
  
  // Calculate diagram width
  const width = Math.floor(diagramDuration / scale);
  
  // Build the timeline
  let timeline = '-'.repeat(width);
  const valueMap: { [key: number]: string } = {};
  
  // Place events on timeline
  sortedEvents.forEach(event => {
    const position = Math.floor(event.time / scale);
    if (position < width) {
      let marker: string;
      
      switch (event.type) {
        case 'error':
          marker = '#';
          break;
        case 'complete':
          marker = '|';
          break;
        default:
          // Use letters or numbers for values
          if (typeof event.value === 'string' && event.value.length === 1) {
            marker = event.value;
          } else if (typeof event.value === 'number' && event.value >= 0 && event.value <= 9) {
            marker = event.value.toString();
          } else {
            // Use letters a-z for complex values
            const charCode = 97 + (Object.keys(valueMap).length % 26);
            marker = String.fromCharCode(charCode);
            valueMap[position] = JSON.stringify(event.value);
          }
          break;
      }
      
      // Replace character at position
      timeline = timeline.substring(0, position) + marker + timeline.substring(position + 1);
      
      if (event.type === 'next' && !valueMap[position]) {
        valueMap[position] = JSON.stringify(event.value);
      }
    }
  });
  
  // Build the complete diagram
  const parts: string[] = [];
  
  // Add timeline
  parts.push(timeline);
  
  // Add value references if needed
  if (showValues && Object.keys(valueMap).length > 0) {
    parts.push('');
    parts.push('Values:');
    Object.entries(valueMap).forEach(([pos, value]) => {
      const position = parseInt(pos);
      const marker = timeline[position];
      if (marker && marker !== '-' && marker !== '|' && marker !== '#') {
        parts.push(`  ${marker} = ${value}`);
      }
    });
  }
  
  // Generate explanation
  const explanation = generateExplanation(sortedEvents, scale);
  
  return {
    diagram: parts.join('\n'),
    explanation,
    timeline: sortedEvents.map(e => ({ time: e.time, value: e.value })),
  };
}

// Generate human-readable explanation
function generateExplanation(events: Array<{ time: number; value?: any; type: string }>, scale: number): string {
  const parts: string[] = [];
  
  if (events.length === 0) {
    return 'Empty stream with no emissions';
  }
  
  parts.push(`Stream with ${events.length} event(s):`);
  
  events.forEach((event, index) => {
    const timeStr = `${event.time}ms`;
    switch (event.type) {
      case 'error':
        parts.push(`- Error at ${timeStr}: ${event.value}`);
        break;
      case 'complete':
        parts.push(`- Completed at ${timeStr}`);
        break;
      default:
        parts.push(`- Emitted ${JSON.stringify(event.value)} at ${timeStr}`);
        break;
    }
  });
  
  // Analyze patterns
  if (events.length > 2) {
    const intervals = [];
    for (let i = 1; i < events.length; i++) {
      if (events[i].type === 'next' && events[i - 1].type === 'next') {
        intervals.push(events[i].time - events[i - 1].time);
      }
    }
    
    if (intervals.length > 0) {
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const isRegular = intervals.every(i => Math.abs(i - avgInterval) < scale / 2);
      
      if (isRegular) {
        parts.push(`\nPattern: Regular interval of ~${Math.round(avgInterval)}ms`);
      } else {
        parts.push(`\nPattern: Irregular intervals (avg: ${Math.round(avgInterval)}ms)`);
      }
    }
  }
  
  return parts.join('\n');
}

// Parse RxJS marble syntax
function parseMarbleSyntax(marble: string, values?: Record<string, any>): Array<{ time: number; value: any; type: string }> {
  const events: Array<{ time: number; value: any; type: string }> = [];
  const frameSize = 10; // Each frame is 10ms
  
  for (let i = 0; i < marble.length; i++) {
    const char = marble[i];
    const time = i * frameSize;
    
    switch (char) {
      case '-':
        // Frame boundary, no event
        break;
      case '|':
        events.push({ time, value: undefined, type: 'complete' });
        break;
      case '#':
        events.push({ time, value: 'Error', type: 'error' });
        break;
      case '(':
      case ')':
        // Grouping, ignore for now
        break;
      default:
        // Value emission
        const value = values?.[char] ?? char;
        events.push({ time, value, type: 'next' });
        break;
    }
  }
  
  return events;
}

// Tool implementation
export const generateMarbleTool: ToolImplementation = {
  definition: {
    name: 'generate_marble',
    description: 'Generate ASCII marble diagrams to visualize RxJS stream emissions over time',
    inputSchema: inputSchema,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  },
  handler: async (args: unknown): Promise<ToolResponse> => {
    const input = inputSchema.parse(args);
    
    try {
      const result = generateMarbleDiagram(
        input.events,
        input.duration,
        input.scale,
        input.showValues
      );
      
      const output = [
        '## Marble Diagram',
        '',
        '```',
        result.diagram,
        '```',
        '',
        '### Explanation',
        result.explanation,
        '',
        '### Legend',
        '- `-` : Time frame (each represents ~' + input.scale + 'ms)',
        '- `|` : Stream completion',
        '- `#` : Error',
        '- Letters/Numbers: Emitted values',
      ].join('\n');
      
      return {
        content: [{
          type: 'text',
          text: output,
        }],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        content: [{
          type: 'text',
          text: `## Error generating marble diagram\n\n${errorMessage}`,
        }],
      };
    }
  },
};
