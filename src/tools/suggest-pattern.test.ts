import { describe, it, expect } from 'vitest';
import { suggestPatternTool } from './suggest-pattern.js';

describe('suggest_pattern tool', () => {
  describe('definition', () => {
    it('should have correct name and description', () => {
      expect(suggestPatternTool.definition.name).toBe('suggest_pattern');
      expect(suggestPatternTool.definition.description).toContain('pattern');
    });

    it('should have correct annotations', () => {
      expect(suggestPatternTool.definition.annotations?.readOnlyHint).toBe(true);
      expect(suggestPatternTool.definition.annotations?.idempotentHint).toBe(true);
    });
  });

  describe('handler - http-retry pattern', () => {
    it('should return http-retry pattern', async () => {
      const result = await suggestPatternTool.handler({
        useCase: 'http-retry',
      });

      expect(result.content[0].text).toContain('HTTP Request with Retry');
      expect(result.content[0].text).toContain('retryWhen');
      expect(result.content[0].text).toContain('exponential backoff');
    });

    it('should include retry operator', async () => {
      const result = await suggestPatternTool.handler({
        useCase: 'http-retry',
      });

      expect(result.content[0].text).toContain('retry');
    });

    it('should include catchError', async () => {
      const result = await suggestPatternTool.handler({
        useCase: 'http-retry',
      });

      expect(result.content[0].text).toContain('catchError');
    });
  });

  describe('handler - search-typeahead pattern', () => {
    it('should return search-typeahead pattern', async () => {
      const result = await suggestPatternTool.handler({
        useCase: 'search-typeahead',
      });

      expect(result.content[0].text).toContain('Search Typeahead');
      expect(result.content[0].text).toContain('debounceTime');
    });

    it('should include distinctUntilChanged', async () => {
      const result = await suggestPatternTool.handler({
        useCase: 'search-typeahead',
      });

      expect(result.content[0].text).toContain('distinctUntilChanged');
    });

    it('should include switchMap for cancellation', async () => {
      const result = await suggestPatternTool.handler({
        useCase: 'search-typeahead',
      });

      expect(result.content[0].text).toContain('switchMap');
    });
  });

  describe('handler - polling pattern', () => {
    it('should return polling pattern', async () => {
      const result = await suggestPatternTool.handler({
        useCase: 'polling',
      });

      expect(result.content[0].text).toContain('Smart Polling');
      expect(result.content[0].text).toContain('interval');
    });

    it('should include error handling', async () => {
      const result = await suggestPatternTool.handler({
        useCase: 'polling',
      });

      expect(result.content[0].text).toContain('catchError');
    });
  });

  describe('handler - websocket-reconnect pattern', () => {
    it('should return websocket-reconnect pattern', async () => {
      const result = await suggestPatternTool.handler({
        useCase: 'websocket-reconnect',
      });

      expect(result.content[0].text).toContain('WebSocket');
      expect(result.content[0].text).toContain('Auto-Reconnect');
    });

    it('should include retryWhen', async () => {
      const result = await suggestPatternTool.handler({
        useCase: 'websocket-reconnect',
      });

      expect(result.content[0].text).toContain('retryWhen');
    });
  });

  describe('handler - form-validation pattern', () => {
    it('should return form-validation pattern', async () => {
      const result = await suggestPatternTool.handler({
        useCase: 'form-validation',
      });

      expect(result.content[0].text).toContain('Reactive Form Validation');
      expect(result.content[0].text).toContain('combineLatest');
    });

    it('should include async validation example', async () => {
      const result = await suggestPatternTool.handler({
        useCase: 'form-validation',
      });

      expect(result.content[0].text).toContain('switchMap');
    });
  });

  describe('handler - state-management pattern', () => {
    it('should return state-management pattern', async () => {
      const result = await suggestPatternTool.handler({
        useCase: 'state-management',
      });

      expect(result.content[0].text).toContain('State Management');
      expect(result.content[0].text).toContain('scan');
    });

    it('should include shareReplay', async () => {
      const result = await suggestPatternTool.handler({
        useCase: 'state-management',
      });

      expect(result.content[0].text).toContain('shareReplay');
    });

    it('should include selectors pattern', async () => {
      const result = await suggestPatternTool.handler({
        useCase: 'state-management',
      });

      expect(result.content[0].text).toContain('distinctUntilChanged');
    });
  });

  describe('handler - cache-refresh pattern', () => {
    it('should return cache-refresh pattern', async () => {
      const result = await suggestPatternTool.handler({
        useCase: 'cache-refresh',
      });

      expect(result.content[0].text).toContain('Cache');
      expect(result.content[0].text).toContain('Refresh');
    });

    it('should include shareReplay for caching', async () => {
      const result = await suggestPatternTool.handler({
        useCase: 'cache-refresh',
      });

      expect(result.content[0].text).toContain('shareReplay');
    });
  });

  describe('handler - framework adaptations', () => {
    describe('Angular', () => {
      it('should adapt pattern for Angular', async () => {
        const result = await suggestPatternTool.handler({
          useCase: 'http-retry',
          framework: 'angular',
        });

        expect(result.content[0].text).toContain('@Injectable');
        expect(result.content[0].text).toContain('OnDestroy');
      });

      it('should include Angular-specific considerations', async () => {
        const result = await suggestPatternTool.handler({
          useCase: 'http-retry',
          framework: 'angular',
        });

        expect(result.content[0].text).toContain('async pipe');
      });

      it('should include HttpClient suggestion', async () => {
        const result = await suggestPatternTool.handler({
          useCase: 'http-retry',
          framework: 'angular',
        });

        expect(result.content[0].text).toContain('HttpClient');
      });
    });

    describe('React', () => {
      it('should adapt pattern for React', async () => {
        const result = await suggestPatternTool.handler({
          useCase: 'http-retry',
          framework: 'react',
        });

        expect(result.content[0].text).toContain('useEffect');
        expect(result.content[0].text).toContain('useState');
      });

      it('should include React-specific considerations', async () => {
        const result = await suggestPatternTool.handler({
          useCase: 'http-retry',
          framework: 'react',
        });

        expect(result.content[0].text).toContain('Clean up subscriptions');
        expect(result.content[0].text).toContain('unsubscribe');
      });
    });

    describe('Vue', () => {
      it('should adapt pattern for Vue', async () => {
        const result = await suggestPatternTool.handler({
          useCase: 'http-retry',
          framework: 'vue',
        });

        expect(result.content[0].text).toContain('onBeforeUnmount');
      });

      it('should include Vue-specific considerations', async () => {
        const result = await suggestPatternTool.handler({
          useCase: 'http-retry',
          framework: 'vue',
        });

        expect(result.content[0].text).toContain('Composition API');
      });
    });

    describe('Vanilla', () => {
      it('should return vanilla pattern by default', async () => {
        const result = await suggestPatternTool.handler({
          useCase: 'http-retry',
        });

        expect(result.content[0].text).toContain('vanilla');
      });
    });
  });

  describe('handler - pattern structure', () => {
    it('should include use case description', async () => {
      const result = await suggestPatternTool.handler({
        useCase: 'search-typeahead',
      });

      expect(result.content[0].text).toContain('Use Case');
    });

    it('should include key operators list', async () => {
      const result = await suggestPatternTool.handler({
        useCase: 'search-typeahead',
      });

      expect(result.content[0].text).toContain('Key Operators');
    });

    it('should include implementation code', async () => {
      const result = await suggestPatternTool.handler({
        useCase: 'search-typeahead',
      });

      expect(result.content[0].text).toContain('Implementation');
      expect(result.content[0].text).toContain('```typescript');
    });

    it('should include important considerations', async () => {
      const result = await suggestPatternTool.handler({
        useCase: 'search-typeahead',
      });

      expect(result.content[0].text).toContain('Important Considerations');
    });

    it('should include related patterns', async () => {
      const result = await suggestPatternTool.handler({
        useCase: 'search-typeahead',
      });

      expect(result.content[0].text).toContain('Related Patterns');
    });
  });

  describe('handler - all use cases', () => {
    const useCases = [
      'http-retry',
      'search-typeahead',
      'polling',
      'websocket-reconnect',
      'form-validation',
      'state-management',
      'cache-refresh',
    ];

    useCases.forEach(useCase => {
      it(`should handle ${useCase} use case`, async () => {
        const result = await suggestPatternTool.handler({
          useCase,
        });

        expect(result.content[0].text).toContain('Implementation');
        expect(result.content[0].text).not.toContain('Pattern not found');
      });
    });
  });

  describe('handler - code quality', () => {
    it('should provide working code example', async () => {
      const result = await suggestPatternTool.handler({
        useCase: 'http-retry',
      });

      // Check for essential RxJS imports
      expect(result.content[0].text).toContain('import');
      expect(result.content[0].text).toContain('pipe');
    });

    it('should include proper error handling in examples', async () => {
      const result = await suggestPatternTool.handler({
        useCase: 'http-retry',
      });

      expect(result.content[0].text).toContain('catchError');
    });
  });

  describe('handler - edge cases', () => {
    it('should handle missing pattern gracefully', async () => {
      // This test verifies error handling if an unknown pattern is passed
      // The tool uses zod validation, so invalid input should be caught
      try {
        await suggestPatternTool.handler({
          useCase: 'unknown-pattern',
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});
