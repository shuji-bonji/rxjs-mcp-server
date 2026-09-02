import { PatternSuggestion } from '../types.js';

/**
 * RxJS Pattern Templates Database
 */
export const patterns: Record<string, PatternSuggestion> = {
  'http-retry': {
    name: 'HTTP Request with Retry',
    description: 'Resilient HTTP requests with exponential backoff retry strategy',
    useCase: 'Making API calls that may fail due to network issues or server errors',
    operators: ['retry', 'retryWhen', 'delay', 'catchError', 'timer'],
    code: `// HTTP request with exponential backoff retry
import { throwError, timer, of } from 'rxjs';
import { ajax } from 'rxjs/ajax';
import { retryWhen, mergeMap, catchError, finalize } from 'rxjs';

const apiCall$ = ajax.getJSON('/api/data').pipe(
  retryWhen(errors =>
    errors.pipe(
      mergeMap((error, index) => {
        const retryAttempt = index + 1;
        if (retryAttempt > 3) {
          return throwError(() => error);
        }
        console.log(\`Retry attempt \${retryAttempt} after \${retryAttempt * 1000}ms\`);
        return timer(retryAttempt * 1000); // Exponential backoff
      })
    )
  ),
  catchError(error => {
    console.error('Failed after 3 retries:', error);
    return of({ error: true, message: 'Service unavailable' });
  }),
  finalize(() => console.log('Request completed'))
);`,
    considerations: [
      'Set a maximum retry count to prevent infinite retries',
      'Use exponential backoff to avoid overwhelming the server',
      'Provide fallback data on final failure',
      'Log retry attempts for debugging',
    ],
  },

  'search-typeahead': {
    name: 'Search Typeahead with Debounce',
    description: 'Efficient search implementation with debouncing and cancellation',
    useCase: 'Real-time search suggestions as user types, minimizing API calls',
    operators: ['debounceTime', 'distinctUntilChanged', 'switchMap', 'catchError', 'filter'],
    code: `// Search typeahead implementation
import { fromEvent, of, EMPTY } from 'rxjs';
import { ajax } from 'rxjs/ajax';
import { debounceTime, distinctUntilChanged, switchMap, catchError, filter, map } from 'rxjs';

const searchBox = document.getElementById('search');
const search$ = fromEvent(searchBox, 'input').pipe(
  map(event => (event.target as HTMLInputElement).value),
  filter(query => query.length > 2), // Min 3 characters
  debounceTime(300), // Wait for pause in typing
  distinctUntilChanged(), // Ignore if same as previous
  switchMap(query =>
    ajax.getJSON(\`/api/search?q=\${query}\`).pipe(
      catchError(error => {
        console.error('Search failed:', error);
        return of([]); // Return empty results on error
      })
    )
  )
);

search$.subscribe(results => {
  displaySearchResults(results);
});`,
    considerations: [
      'Use debounceTime to wait for typing pause',
      'distinctUntilChanged prevents duplicate searches',
      'switchMap cancels previous requests automatically',
      'Handle errors gracefully with empty results',
      'Set minimum query length to reduce noise',
    ],
  },

  'polling': {
    name: 'Smart Polling with Backoff',
    description: 'Periodic data fetching with error handling and dynamic intervals',
    useCase: 'Regularly checking for updates while being respectful of server resources',
    operators: ['interval', 'switchMap', 'retry', 'catchError', 'takeWhile', 'expand'],
    code: `// Smart polling with exponential backoff on errors
import { interval, timer, throwError, EMPTY } from 'rxjs';
import { ajax } from 'rxjs/ajax';
import { switchMap, retry, catchError, takeWhile, expand, tap } from 'rxjs';

let errorCount = 0;
const maxErrors = 3;

const polling$ = timer(0, 5000).pipe( // Start immediately, then every 5s
  switchMap(() =>
    ajax.getJSON('/api/status').pipe(
      tap(() => errorCount = 0), // Reset on success
      catchError(error => {
        errorCount++;
        if (errorCount >= maxErrors) {
          console.error('Max errors reached, stopping polling');
          return throwError(() => error);
        }
        console.log(\`Error \${errorCount}, backing off...\`);
        return EMPTY; // Skip this emission
      })
    )
  ),
  takeWhile(() => errorCount < maxErrors)
);

// Alternative: Dynamic polling interval
const dynamicPolling$ = ajax.getJSON('/api/data').pipe(
  expand(data =>
    timer(data.nextPollDelay || 5000).pipe(
      switchMap(() => ajax.getJSON('/api/data'))
    )
  )
);`,
    considerations: [
      'Implement backoff strategy for errors',
      'Allow server to control polling rate',
      'Stop polling after consecutive failures',
      'Consider WebSockets for real-time requirements',
      'Add jitter to prevent thundering herd',
    ],
  },

  'websocket-reconnect': {
    name: 'WebSocket with Auto-Reconnect',
    description: 'Resilient WebSocket connection with automatic reconnection',
    useCase: 'Maintaining persistent real-time connections with fallback',
    operators: ['webSocket', 'retryWhen', 'delay', 'tap', 'catchError'],
    code: `// WebSocket with automatic reconnection
import { webSocket } from 'rxjs/webSocket';
import { retry, retryWhen, delay, tap, catchError } from 'rxjs';
import { EMPTY } from 'rxjs';

const createWebSocketSubject = () =>
  webSocket({
    url: 'ws://localhost:8080',
    openObserver: {
      next: () => console.log('WebSocket connected')
    },
    closeObserver: {
      next: () => console.log('WebSocket disconnected')
    }
  });

let socket$ = createWebSocketSubject();

const resilientSocket$ = socket$.pipe(
  retryWhen(errors =>
    errors.pipe(
      tap(err => console.log('WebSocket error, reconnecting...', err)),
      delay(1000) // Wait before reconnecting
    )
  ),
  catchError(err => {
    console.error('WebSocket failed permanently:', err);
    return EMPTY;
  })
);

// Send messages
const sendMessage = (message: any) => {
  socket$.next(message);
};

// Subscribe to messages
resilientSocket$.subscribe({
  next: msg => console.log('Received:', msg),
  error: err => console.error('Fatal error:', err),
  complete: () => console.log('Connection closed')
});`,
    considerations: [
      'Implement exponential backoff for reconnection',
      'Queue messages during disconnection',
      'Handle connection state in UI',
      'Consider fallback to HTTP polling',
      'Implement heartbeat/ping mechanism',
    ],
  },

  'form-validation': {
    name: 'Reactive Form Validation',
    description: 'Real-time form validation with debouncing and async validators',
    useCase: 'Validating form inputs with instant feedback and async checks',
    operators: ['combineLatest', 'debounceTime', 'distinctUntilChanged', 'switchMap', 'map'],
    code: `// Reactive form validation
import { fromEvent, combineLatest, of, timer } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, map, startWith } from 'rxjs';
import { ajax } from 'rxjs/ajax';

const emailInput = document.getElementById('email') as HTMLInputElement;
const passwordInput = document.getElementById('password') as HTMLInputElement;

const email$ = fromEvent(emailInput, 'input').pipe(
  map(e => (e.target as HTMLInputElement).value),
  startWith(''),
  debounceTime(300),
  distinctUntilChanged(),
  switchMap(email => {
    if (!email) return of({ valid: false, error: 'Email required' });
    if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) {
      return of({ valid: false, error: 'Invalid email format' });
    }
    // Async validation - check if email exists
    return ajax.getJSON(\`/api/check-email?email=\${email}\`).pipe(
      map(result => ({
        valid: !(result as any).exists,
        error: (result as any).exists ? 'Email already taken' : null
      }))
    );
  })
);

const password$ = fromEvent(passwordInput, 'input').pipe(
  map(e => (e.target as HTMLInputElement).value),
  startWith(''),
  map(password => ({
    valid: password.length >= 8,
    error: password.length < 8 ? 'Password must be 8+ characters' : null
  }))
);

const formValid$ = combineLatest([email$, password$]).pipe(
  map(([email, password]) => ({
    valid: email.valid && password.valid,
    errors: {
      email: email.error,
      password: password.error
    }
  }))
);

formValid$.subscribe(validation => {
  updateFormUI(validation);
});`,
    considerations: [
      'Debounce async validators to reduce API calls',
      'Show loading states during validation',
      'Cache validation results when appropriate',
      'Validate on blur for better UX',
      'Consider field dependencies for complex forms',
    ],
  },

  'state-management': {
    name: 'Simple State Management',
    description: 'Centralized state management using RxJS subjects',
    useCase: 'Managing application state without external libraries',
    operators: ['scan', 'shareReplay', 'distinctUntilChanged', 'pluck'],
    code: `// Simple state management with RxJS
import { BehaviorSubject, Subject, merge } from 'rxjs';
import { scan, shareReplay, distinctUntilChanged, map } from 'rxjs';

interface AppState {
  user: { id: string; name: string } | null;
  items: Array<{ id: string; title: string }>;
  loading: boolean;
}

// Initial state
const initialState: AppState = {
  user: null,
  items: [],
  loading: false
};

// Actions
interface Action {
  type: string;
  payload?: any;
}

// Action creators
const actions$ = new Subject<Action>();

const setUser = (user: AppState['user']) =>
  actions$.next({ type: 'SET_USER', payload: user });

const addItem = (item: { id: string; title: string }) =>
  actions$.next({ type: 'ADD_ITEM', payload: item });

const setLoading = (loading: boolean) =>
  actions$.next({ type: 'SET_LOADING', payload: loading });

// Reducer
const reducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'ADD_ITEM':
      return { ...state, items: [...state.items, action.payload] };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
};

// State stream
const state$ = actions$.pipe(
  scan(reducer, initialState),
  shareReplay(1)
);

// Selectors
const user$ = state$.pipe(
  map(state => state.user),
  distinctUntilChanged()
);

const items$ = state$.pipe(
  map(state => state.items),
  distinctUntilChanged()
);

const loading$ = state$.pipe(
  map(state => state.loading),
  distinctUntilChanged()
);

// Subscribe to state changes
state$.subscribe(state => console.log('State updated:', state));`,
    considerations: [
      'Use BehaviorSubject for synchronous state access',
      'Implement selectors with distinctUntilChanged',
      'Consider immutability for predictable updates',
      'Add middleware for side effects',
      'Use shareReplay for multiple subscribers',
    ],
  },

  'cache-refresh': {
    name: 'Cache with Refresh Strategy',
    description: 'Cached data with manual and automatic refresh capabilities',
    useCase: 'Serving cached data instantly while fetching fresh data in background',
    operators: ['shareReplay', 'merge', 'switchMap', 'startWith'],
    code: `// Cache with refresh strategy
import { BehaviorSubject, Subject, timer, merge } from 'rxjs';
import { switchMap, shareReplay, startWith, tap } from 'rxjs';
import { ajax } from 'rxjs/ajax';

class CachedDataService {
  private refreshSubject = new Subject<void>();
  private cache$ = new BehaviorSubject<any>(null);

  // Automatic refresh every 30 seconds
  private autoRefresh$ = timer(0, 30000);

  // Combine manual and auto refresh triggers
  private dataSource$ = merge(
    this.autoRefresh$,
    this.refreshSubject
  ).pipe(
    switchMap(() => ajax.getJSON('/api/data')),
    tap(data => this.cache$.next(data)),
    shareReplay({
      bufferSize: 1,
      refCount: true
    })
  );

  // Public API
  getData() {
    const cached = this.cache$.value;
    if (cached) {
      // Return cached data immediately, fetch fresh in background
      return merge(
        of(cached),
        this.dataSource$
      ).pipe(
        distinctUntilChanged((a, b) =>
          JSON.stringify(a) === JSON.stringify(b)
        )
      );
    }
    return this.dataSource$;
  }

  refresh() {
    this.refreshSubject.next();
  }

  // Cache invalidation
  invalidate() {
    this.cache$.next(null);
    this.refresh();
  }
}`,
    considerations: [
      'Implement cache expiration policies',
      'Handle stale-while-revalidate pattern',
      'Consider memory limits for cache size',
      'Add cache versioning for updates',
      'Implement offline support with persistence',
    ],
  },
};

/** One `import ... from '...'` line, split into what it brings and where from. */
interface ParsedImport {
  /** Named bindings, for `import { a, b } from 'x'`. Empty for other forms. */
  names: string[];
  /** The module specifier. */
  from: string;
  /** The original line, kept verbatim for forms this does not merge. */
  raw: string;
}

/**
 * Separate the import lines of a pattern from the statements that follow.
 *
 * The framework wrappers put the body inside a class method or a hook, and an
 * `import` is a module-level declaration — leaving them mixed produces code
 * that does not parse. Blank lines left where the imports were are dropped so
 * the body does not start with a gap.
 */
function splitImports(code: string): { imports: ParsedImport[]; body: string } {
  const imports: ParsedImport[] = [];
  const bodyLines: string[] = [];

  for (const line of code.split('\n')) {
    const named = /^\s*import\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]\s*;?\s*$/.exec(line);
    if (named) {
      imports.push({
        names: named[1].split(',').map(n => n.trim()).filter(Boolean),
        from: named[2],
        raw: line.trim(),
      });
      continue;
    }
    if (/^\s*import\s/.test(line)) {
      imports.push({ names: [], from: '', raw: line.trim() });
      continue;
    }
    bodyLines.push(line);
  }

  while (bodyLines.length > 0 && bodyLines[0].trim() === '') bodyLines.shift();
  while (bodyLines.length > 0 && bodyLines[bodyLines.length - 1].trim() === '') bodyLines.pop();

  return { imports, body: bodyLines.join('\n') };
}

/**
 * Render import lines with one line per module specifier.
 *
 * A pattern often imports from `'rxjs'` more than once, and the wrapper adds
 * its own imports on top. Emitting them unmerged gives duplicate bindings.
 */
function renderImports(imports: ParsedImport[]): string {
  const byModule = new Map<string, string[]>();
  const verbatim: string[] = [];

  for (const entry of imports) {
    if (entry.names.length === 0) {
      if (!verbatim.includes(entry.raw)) verbatim.push(entry.raw);
      continue;
    }
    const existing = byModule.get(entry.from) ?? [];
    for (const name of entry.names) {
      if (!existing.includes(name)) existing.push(name);
    }
    byModule.set(entry.from, existing);
  }

  const lines = [...verbatim];
  byModule.forEach((names, from) => {
    lines.push(`import { ${names.join(', ')} } from '${from}';`);
  });
  return lines.join('\n');
}

/** Indent every non-empty line of a block. */
function indent(code: string, spaces: number): string {
  const pad = ' '.repeat(spaces);
  return code
    .split('\n')
    .map(line => (line.trim() === '' ? '' : pad + line))
    .join('\n');
}

/**
 * Adapt a pattern for a specific framework.
 *
 * The framework-neutral body is moved into a service method or a hook, and its
 * imports are hoisted above the wrapper. What this does NOT do is rewrite the
 * body: a pattern that reaches the DOM with `document.getElementById` or calls
 * `ajax` still does so after wrapping, and the comment in the output names that
 * as the part to replace. Until each pattern carries a per-framework
 * implementation, saying so is more use than a wrapper that reads as finished
 * Angular but does not compile.
 */
export function adaptPatternForFramework(
  pattern: PatternSuggestion,
  framework: string
): PatternSuggestion {
  const adapted = { ...pattern };
  const { imports, body } = splitImports(pattern.code);

  if (framework === 'angular') {
    const header = renderImports([
      { names: ['Injectable', 'OnDestroy'], from: '@angular/core', raw: '' },
      { names: ['Subject'], from: 'rxjs', raw: '' },
      ...imports,
    ]);
    adapted.code = `// Angular — the framework-neutral pattern, moved into a service.
// Replace the DOM access with a template binding or a signal, and \`ajax\` with
// HttpClient. End each pipe with \`takeUntil(this.destroy$)\` so it stops with
// the service.
${header}

@Injectable({ providedIn: 'root' })
export class RxJSPatternService implements OnDestroy {
  private readonly destroy$ = new Subject<void>();

  start(): void {
${indent(body, 4)}
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}`;
    adapted.considerations = [
      ...pattern.considerations,
      'Use async pipe in templates for auto-unsubscribe',
      'Inject HttpClient instead of ajax',
      'Consider using NgRx for complex state management',
    ];
  } else if (framework === 'react') {
    const header = renderImports([
      { names: ['useEffect', 'useState', 'useRef'], from: 'react', raw: '' },
      { names: ['Subscription'], from: 'rxjs', raw: '' },
      ...imports,
    ]);
    adapted.code = `// React — the framework-neutral pattern, moved into a hook.
// Replace the DOM access with a ref or controlled input, and \`ajax\` with your
// data-fetching layer. Subscribe the stream the body builds where the comment
// below says so, and the cleanup will tear it down.
${header}

export function useRxJSPattern() {
  const [data, setData] = useState(null);
  const subscription = useRef<Subscription>();

  useEffect(() => {
${indent(body, 4)}

    // subscription.current = <the stream built above>.subscribe(setData);

    return () => {
      subscription.current?.unsubscribe();
    };
  }, []);

  return data;
}`;
    adapted.considerations = [
      ...pattern.considerations,
      'Clean up subscriptions in useEffect return',
      'Consider using a state management library',
      'Be careful with closure stale values',
    ];
  } else if (framework === 'vue') {
    const header = renderImports([
      { names: ['ref', 'onBeforeUnmount'], from: 'vue', raw: '' },
      { names: ['Subject', 'takeUntil'], from: 'rxjs', raw: '' },
      ...imports,
    ]);
    adapted.code = `// Vue 3 Composition API — the framework-neutral pattern, moved into a composable.
// Replace the DOM access with a template ref, and \`ajax\` with your data-fetching
// layer. End each pipe with \`takeUntil(destroy$)\` so it stops with the component.
${header}

export function useRxJSPattern() {
  const destroy$ = new Subject<void>();
  const data = ref(null);

${indent(body, 2)}

  // <the stream built above>.pipe(takeUntil(destroy$)).subscribe(value => {
  //   data.value = value;
  // });

  onBeforeUnmount(() => {
    destroy$.next();
    destroy$.complete();
  });

  return { data };
}`;
    adapted.considerations = [
      ...pattern.considerations,
      'Use Composition API for better TypeScript support',
      'Clean up in onBeforeUnmount',
      'Consider Pinia for state management',
    ];
  }

  return adapted;
}
