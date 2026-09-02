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
  
  // Determine diagram duration.
  //
  // A stream that ends with `complete` or `error` needs one frame for that
  // marker and nothing after it; anything else gets two frames of tail so the
  // last emission is not flush against the edge.
  const maxTime = sortedEvents.length > 0 
    ? Math.max(...sortedEvents.map(e => e.time))
    : 0;
  const lastEvent = sortedEvents[sortedEvents.length - 1];
  const terminates = lastEvent?.type === 'complete' || lastEvent?.type === 'error';
  const diagramDuration =
    duration !== undefined && duration > 0
      ? duration
      : maxTime + scale * (terminates ? 1 : 2);
  
  // Calculate diagram width
  const width = Math.floor(diagramDuration / scale);
  
  // Build the timeline
  let timeline = '-'.repeat(width);
  
  /** Characters the diagram itself owns — never handed out as a value marker. */
  const RESERVED = new Set(['-', '|', '#', ' ']);
  /** Serialized value → marker, so the same value always draws the same character. */
  const markerForValue = new Map<string, string>();
  /** Every marker already placed, so a letter is never handed out twice. */
  const usedMarkers = new Set<string>();
  /** Marker → serialized value, in the order the markers were allocated. Only
   *  markers that do not show their own value get an entry: `0` needs no legend
   *  line saying `0 = 0`, but `a = {"id":1}` does. */
  const legend = new Map<string, string>();
  let letterIndex = 0;

  /** Next unused letter a–z, wrapping. */
  function nextLetter(): string {
    for (let attempt = 0; attempt < 26; attempt++) {
      const letter = String.fromCharCode(97 + (letterIndex++ % 26));
      if (!usedMarkers.has(letter)) return letter;
    }
    return '?';
  }

  /** The character that stands for this value on the timeline. */
  function markerFor(value: unknown): string {
    const serialized = JSON.stringify(value);
    const existing = markerForValue.get(serialized);
    if (existing) return existing;

    let marker: string;
    if (typeof value === 'string' && value.length === 1 && !RESERVED.has(value) && !usedMarkers.has(value)) {
      marker = value;
    } else if (typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 9 && !usedMarkers.has(String(value))) {
      marker = value.toString();
    } else {
      marker = nextLetter();
      legend.set(marker, serialized);
    }

    markerForValue.set(serialized, marker);
    usedMarkers.add(marker);
    return marker;
  }
  
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
          marker = markerFor(event.value);
          break;
      }
      
      // Replace character at position
      timeline = timeline.substring(0, position) + marker + timeline.substring(position + 1);
    }
  });
  
  // Build the complete diagram
  const parts: string[] = [];
  
  // Add timeline
  parts.push(timeline);
  
  // Add value references if needed
  if (showValues && legend.size > 0) {
    parts.push('');
    parts.push('Values:');
    legend.forEach((value, marker) => {
      parts.push(`  ${marker} = ${value}`);
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
  
  events.forEach((event) => {
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

// Parse RxJS marble syntax.
//
// Currently unused by the public tool surface — kept as an internal helper
// for a future `generate_marble({ marble: '--a-b-|' })` input mode that
// would parse marble strings directly instead of expecting `events`.
// Exported with `_` prefix so the unused-vars rule allows it.
export function _parseMarbleSyntax(
  marble: string,
  values?: Record<string, unknown>,
): Array<{ time: number; value: unknown; type: string }> {
  const events: Array<{ time: number; value: unknown; type: string }> = [];
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
      default: {
        // Value emission
        const value = values?.[char] ?? char;
        events.push({ time, value, type: 'next' });
        break;
      }
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
