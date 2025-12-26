/**
 * Framework-specific cleanup examples for memory leak detection
 */
export const cleanupExamples: Record<string, string> = {
  angular: `
// Angular Component with proper cleanup
export class MyComponent implements OnDestroy {
  private destroy$ = new Subject<void>();

  ngOnInit() {
    // Method 1: takeUntil pattern
    this.myService.getData()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => console.log(data));

    // Method 2: Async pipe in template
    this.data$ = this.myService.getData();
    // Template: {{ data$ | async }}
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}`,

  react: `
// React Hook with proper cleanup
function MyComponent() {
  useEffect(() => {
    const subscription = dataStream$
      .pipe(/* operators */)
      .subscribe(data => setData(data));

    // Cleanup function
    return () => {
      subscription.unsubscribe();
    };
  }, [/* dependencies */]);
}`,

  vue: `
// Vue 3 Composition API with proper cleanup
import { onBeforeUnmount } from 'vue';

export default {
  setup() {
    const destroy$ = new Subject();

    // Subscribe with takeUntil
    dataStream$
      .pipe(takeUntil(destroy$))
      .subscribe(data => state.data = data);

    onBeforeUnmount(() => {
      destroy$.next();
      destroy$.complete();
    });
  }
}`,

  none: `
// Generic cleanup pattern
class StreamManager {
  private subscriptions = new Subscription();

  init() {
    // Add subscriptions to composite
    this.subscriptions.add(
      stream1$.subscribe(/* ... */)
    );

    this.subscriptions.add(
      stream2$.subscribe(/* ... */)
    );
  }

  cleanup() {
    // Unsubscribe all at once
    this.subscriptions.unsubscribe();
  }
}`,
};

/**
 * Get cleanup example for a specific framework/lifecycle
 */
export function getCleanupExample(lifecycle: string): string {
  return cleanupExamples[lifecycle] || cleanupExamples.none;
}
