import { describe, it, expect } from 'vitest';
import { generateMarbleTool } from './marble-diagram.js';

describe('generate_marble tool', () => {
  describe('definition', () => {
    it('should have correct name and description', () => {
      expect(generateMarbleTool.definition.name).toBe('generate_marble');
      expect(generateMarbleTool.definition.description).toContain('marble diagram');
    });

    it('should have correct annotations', () => {
      expect(generateMarbleTool.definition.annotations?.readOnlyHint).toBe(true);
      expect(generateMarbleTool.definition.annotations?.idempotentHint).toBe(true);
    });
  });

  describe('handler - basic diagrams', () => {
    it('should generate diagram for single emission', async () => {
      const result = await generateMarbleTool.handler({
        events: [
          { time: 0, value: 1, type: 'next' },
        ],
      });

      expect(result.content[0].text).toContain('Marble Diagram');
      expect(result.content[0].text).toContain('1');
    });

    it('should generate diagram for multiple emissions', async () => {
      const result = await generateMarbleTool.handler({
        events: [
          { time: 0, value: 'a', type: 'next' },
          { time: 50, value: 'b', type: 'next' },
          { time: 100, value: 'c', type: 'next' },
        ],
      });

      expect(result.content[0].text).toContain('a');
      expect(result.content[0].text).toContain('b');
      expect(result.content[0].text).toContain('c');
    });

    it('should generate diagram with completion', async () => {
      const result = await generateMarbleTool.handler({
        events: [
          { time: 0, value: 1, type: 'next' },
          { time: 100, value: undefined, type: 'complete' },
        ],
      });

      expect(result.content[0].text).toContain('|');
    });

    it('should generate diagram with error', async () => {
      const result = await generateMarbleTool.handler({
        events: [
          { time: 0, value: 1, type: 'next' },
          { time: 100, value: 'Error', type: 'error' },
        ],
      });

      expect(result.content[0].text).toContain('#');
    });

    it('should show values section when showValues is true', async () => {
      const result = await generateMarbleTool.handler({
        events: [
          { time: 0, value: { name: 'test' }, type: 'next' },
        ],
        showValues: true,
      });

      expect(result.content[0].text).toContain('Values');
      expect(result.content[0].text).toContain('name');
    });

    it('should not show values section when showValues is false', async () => {
      const result = await generateMarbleTool.handler({
        events: [
          { time: 0, value: { name: 'test' }, type: 'next' },
        ],
        showValues: false,
      });

      expect(result.content[0].text).not.toContain('Values:');
    });
  });

  describe('handler - numeric values', () => {
    it('should use numbers 0-9 directly for single digit values', async () => {
      const result = await generateMarbleTool.handler({
        events: [
          { time: 0, value: 0, type: 'next' },
          { time: 50, value: 5, type: 'next' },
          { time: 100, value: 9, type: 'next' },
        ],
      });

      expect(result.content[0].text).toContain('0');
      expect(result.content[0].text).toContain('5');
      expect(result.content[0].text).toContain('9');
    });
  });

  describe('handler - scale', () => {
    it('should respect custom scale', async () => {
      const result = await generateMarbleTool.handler({
        events: [
          { time: 0, value: 'a', type: 'next' },
          { time: 100, value: 'b', type: 'next' },
        ],
        scale: 100,
      });

      // With scale 100, events at 0 and 100 should be 1 character apart
      expect(result.content[0].text).toContain('Marble Diagram');
    });

    it('should use default scale of 50', async () => {
      const result = await generateMarbleTool.handler({
        events: [
          { time: 0, value: 'a', type: 'next' },
          { time: 100, value: 'b', type: 'next' },
        ],
      });

      // Default scale is 50, so events at 0 and 100 should be 2 characters apart
      expect(result.content[0].text).toContain('Marble Diagram');
    });
  });

  describe('handler - duration', () => {
    it('should respect custom duration', async () => {
      const result = await generateMarbleTool.handler({
        events: [
          { time: 0, value: 'a', type: 'next' },
        ],
        duration: 500,
        scale: 50,
      });

      expect(result.content[0].text).toContain('Marble Diagram');
    });

    it('should auto-calculate duration based on events', async () => {
      const result = await generateMarbleTool.handler({
        events: [
          { time: 0, value: 'a', type: 'next' },
          { time: 200, value: 'b', type: 'next' },
        ],
        scale: 50,
      });

      expect(result.content[0].text).toContain('Marble Diagram');
    });
  });

  describe('handler - explanation', () => {
    it('should include explanation', async () => {
      const result = await generateMarbleTool.handler({
        events: [
          { time: 0, value: 1, type: 'next' },
          { time: 100, value: 2, type: 'next' },
        ],
      });

      expect(result.content[0].text).toContain('Explanation');
      expect(result.content[0].text).toContain('event');
    });

    it('should explain emissions with time', async () => {
      const result = await generateMarbleTool.handler({
        events: [
          { time: 50, value: 'test', type: 'next' },
        ],
      });

      expect(result.content[0].text).toContain('50ms');
    });

    it('should explain errors', async () => {
      const result = await generateMarbleTool.handler({
        events: [
          { time: 100, value: 'Error message', type: 'error' },
        ],
      });

      expect(result.content[0].text).toContain('Error');
    });

    it('should explain completion', async () => {
      const result = await generateMarbleTool.handler({
        events: [
          { time: 100, value: undefined, type: 'complete' },
        ],
      });

      expect(result.content[0].text).toContain('Completed');
    });

    it('should detect regular intervals', async () => {
      const result = await generateMarbleTool.handler({
        events: [
          { time: 0, value: 1, type: 'next' },
          { time: 100, value: 2, type: 'next' },
          { time: 200, value: 3, type: 'next' },
          { time: 300, value: 4, type: 'next' },
        ],
      });

      expect(result.content[0].text).toContain('Regular interval');
    });
  });

  describe('handler - legend', () => {
    it('should include legend', async () => {
      const result = await generateMarbleTool.handler({
        events: [
          { time: 0, value: 1, type: 'next' },
        ],
      });

      expect(result.content[0].text).toContain('Legend');
      expect(result.content[0].text).toContain('-');
      expect(result.content[0].text).toContain('|');
      expect(result.content[0].text).toContain('#');
    });
  });

  describe('handler - complex objects', () => {
    it('should handle object values', async () => {
      const result = await generateMarbleTool.handler({
        events: [
          { time: 0, value: { id: 1, name: 'test' }, type: 'next' },
        ],
        showValues: true,
      });

      expect(result.content[0].text).toContain('Values');
    });

    it('should handle array values', async () => {
      const result = await generateMarbleTool.handler({
        events: [
          { time: 0, value: [1, 2, 3], type: 'next' },
        ],
        showValues: true,
      });

      expect(result.content[0].text).toContain('Values');
    });

    it('should handle string values', async () => {
      const result = await generateMarbleTool.handler({
        events: [
          { time: 0, value: 'x', type: 'next' },
        ],
      });

      expect(result.content[0].text).toContain('x');
    });
  });

  describe('handler - edge cases', () => {
    it('should handle empty events array', async () => {
      const result = await generateMarbleTool.handler({
        events: [],
      });

      expect(result.content[0].text).toContain('Marble Diagram');
      expect(result.content[0].text).toContain('Empty stream');
    });

    it('should handle events at same time', async () => {
      const result = await generateMarbleTool.handler({
        events: [
          { time: 0, value: 'a', type: 'next' },
          { time: 0, value: 'b', type: 'next' },
        ],
      });

      expect(result.content[0].text).toContain('Marble Diagram');
    });

    it('should handle large time values', async () => {
      const result = await generateMarbleTool.handler({
        events: [
          { time: 0, value: 'start', type: 'next' },
          { time: 10000, value: 'end', type: 'next' },
        ],
        scale: 1000,
      });

      expect(result.content[0].text).toContain('Marble Diagram');
    });

    it('should sort events by time', async () => {
      const result = await generateMarbleTool.handler({
        events: [
          { time: 100, value: 'b', type: 'next' },
          { time: 0, value: 'a', type: 'next' },
          { time: 50, value: 'c', type: 'next' },
        ],
      });

      expect(result.content[0].text).toContain('Explanation');
    });
  });

  describe('handler - real world scenarios', () => {
    it('should visualize interval emissions', async () => {
      const result = await generateMarbleTool.handler({
        events: [
          { time: 0, value: 0, type: 'next' },
          { time: 100, value: 1, type: 'next' },
          { time: 200, value: 2, type: 'next' },
          { time: 300, value: undefined, type: 'complete' },
        ],
        scale: 50,
      });

      expect(result.content[0].text).toContain('0');
      expect(result.content[0].text).toContain('1');
      expect(result.content[0].text).toContain('2');
      expect(result.content[0].text).toContain('|');
    });

    it('should visualize error scenario', async () => {
      const result = await generateMarbleTool.handler({
        events: [
          { time: 0, value: 'data', type: 'next' },
          { time: 100, value: 'Network Error', type: 'error' },
        ],
        scale: 50,
      });

      expect(result.content[0].text).toContain('#');
      expect(result.content[0].text).toContain('Error');
    });

    it('should visualize debounce pattern', async () => {
      const result = await generateMarbleTool.handler({
        events: [
          { time: 0, value: 'a', type: 'next' },
          { time: 10, value: 'ab', type: 'next' },
          { time: 20, value: 'abc', type: 'next' },
          { time: 320, value: 'abc', type: 'next' }, // After 300ms debounce
        ],
        scale: 50,
      });

      expect(result.content[0].text).toContain('Marble Diagram');
    });
  });
  describe('handler - marker allocation', () => {
    // Letters used to be numbered from the size of the value map, and that map
    // also held values drawn as their own digit. A stream starting with 0
    // therefore skipped `a`, and the legend carried a line reading `0 = 0`.
    it('starts letters at a even when a digit value came first', async () => {
      const result = await generateMarbleTool.handler({
        events: [
          { time: 0, value: 0, type: 'next' },
          { time: 100, value: 20, type: 'next' },
          { time: 200, value: 60, type: 'next' },
        ],
        scale: 25,
      });

      const text = result.content[0].text;
      expect(text).toContain('a = 20');
      expect(text).toContain('b = 60');
      expect(text).not.toContain('0 = 0');
    });

    it('gives the same marker to the same value', async () => {
      const result = await generateMarbleTool.handler({
        events: [
          { time: 0, value: { id: 1 }, type: 'next' },
          { time: 50, value: { id: 2 }, type: 'next' },
          { time: 100, value: { id: 1 }, type: 'next' },
        ],
        scale: 25,
      });

      const diagram = result.content[0].text.split('```')[1].split('\n')[1];
      expect(diagram.startsWith('a-b-a')).toBe(true);
      expect(result.content[0].text).not.toContain('c = ');
    });

    it('never hands out a character the diagram itself uses', async () => {
      const result = await generateMarbleTool.handler({
        events: [
          { time: 0, value: '|', type: 'next' },
          { time: 50, value: '#', type: 'next' },
        ],
        scale: 25,
      });

      const diagram = result.content[0].text.split('```')[1].split('\n')[1];
      expect(diagram).not.toContain('|');
      expect(diagram).not.toContain('#');
      expect(result.content[0].text).toContain('a = "|"');
      expect(result.content[0].text).toContain('b = "#"');
    });

    it('does not reuse a letter already taken by a single-character value', async () => {
      const result = await generateMarbleTool.handler({
        events: [
          { time: 0, value: 'a', type: 'next' },
          { time: 50, value: { id: 1 }, type: 'next' },
        ],
        scale: 25,
      });

      const diagram = result.content[0].text.split('```')[1].split('\n')[1];
      expect(diagram.startsWith('a-b')).toBe(true);
    });
  });

  describe('handler - diagram width', () => {
    // The tail was a flat two frames, so a stream ending in `complete` drew a
    // dash after the completion marker.
    it('ends at the completion marker', async () => {
      const result = await generateMarbleTool.handler({
        events: [
          { time: 0, value: 1, type: 'next' },
          { time: 100, value: null, type: 'complete' },
        ],
        scale: 25,
      });

      const diagram = result.content[0].text.split('```')[1].split('\n')[1];
      expect(diagram).toBe('1---|');
    });

    it('ends at the error marker', async () => {
      const result = await generateMarbleTool.handler({
        events: [
          { time: 0, value: 1, type: 'next' },
          { time: 50, value: 'boom', type: 'error' },
        ],
        scale: 25,
      });

      const diagram = result.content[0].text.split('```')[1].split('\n')[1];
      expect(diagram).toBe('1-#');
    });

    it('keeps a tail when the stream does not terminate', async () => {
      const result = await generateMarbleTool.handler({
        events: [{ time: 0, value: 1, type: 'next' }],
        scale: 25,
      });

      const diagram = result.content[0].text.split('```')[1].split('\n')[1];
      expect(diagram).toBe('1-');
    });
  });
});
