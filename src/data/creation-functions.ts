import {
  CreationFunctionInfo,
  buildOfficialUrl,
  buildSourceUrl,
  buildGuideUrl,
} from '../types.js';

/**
 * RxJS Creation Functions Database
 * Three-tier reference: officialUrl (rxjs.dev) / sourceUrl (GitHub) / guideUrl (bilingual site)
 *
 * Based on https://shuji-bonji.github.io/RxJS-with-TypeScript/
 */
export const creationFunctionDatabase: Record<string, CreationFunctionInfo> = {
  // basic
  'of': {
    name: 'of',
    category: 'basic',
    description: 'Emits the arguments you provide, then completes',
    officialUrl: buildOfficialUrl('creation', 'of'),
    sourceUrl: buildSourceUrl('observable/of.ts'),
    guideUrl: buildGuideUrl('creation-functions/basic/of'),
  },
  'from': {
    name: 'from',
    category: 'basic',
    description: 'Creates an Observable from an Array, Promise, or Iterable',
    officialUrl: buildOfficialUrl('creation', 'from'),
    sourceUrl: buildSourceUrl('observable/from.ts'),
    guideUrl: buildGuideUrl('creation-functions/basic/from'),
  },
  'fromEvent': {
    name: 'fromEvent',
    category: 'basic',
    description: 'Creates an Observable from DOM events',
    officialUrl: buildOfficialUrl('creation', 'fromEvent'),
    sourceUrl: buildSourceUrl('observable/fromEvent.ts'),
    guideUrl: buildGuideUrl('creation-functions/basic/fromEvent'),
  },
  'interval': {
    name: 'interval',
    category: 'basic',
    description: 'Emits incremental numbers at specified intervals',
    officialUrl: buildOfficialUrl('creation', 'interval'),
    sourceUrl: buildSourceUrl('observable/interval.ts'),
    guideUrl: buildGuideUrl('creation-functions/basic/interval'),
  },
  'timer': {
    name: 'timer',
    category: 'basic',
    description: 'Emits after a delay, then optionally at intervals',
    officialUrl: buildOfficialUrl('creation', 'timer'),
    sourceUrl: buildSourceUrl('observable/timer.ts'),
    guideUrl: buildGuideUrl('creation-functions/basic/timer'),
  },

  // loop
  'range': {
    name: 'range',
    category: 'loop',
    description: 'Emits a sequence of numbers within a range',
    officialUrl: buildOfficialUrl('creation', 'range'),
    sourceUrl: buildSourceUrl('observable/range.ts'),
    guideUrl: buildGuideUrl('creation-functions/loop/range'),
  },
  'generate': {
    name: 'generate',
    category: 'loop',
    description: 'Creates an Observable with custom iteration logic',
    officialUrl: buildOfficialUrl('creation', 'generate'),
    sourceUrl: buildSourceUrl('observable/generate.ts'),
    guideUrl: buildGuideUrl('creation-functions/loop/generate'),
  },

  // http
  'ajax': {
    name: 'ajax',
    category: 'http',
    description: 'Creates an Observable for AJAX requests',
    officialUrl: 'https://rxjs.dev/api/ajax/ajax',
    sourceUrl: buildSourceUrl('ajax/ajax.ts'),
    guideUrl: buildGuideUrl('creation-functions/http-communication/ajax'),
  },
  'fromFetch': {
    name: 'fromFetch',
    category: 'http',
    description: 'Creates an Observable from Fetch API',
    officialUrl: buildOfficialUrl('creation', 'fromFetch'),
    sourceUrl: buildSourceUrl('observable/dom/fetch.ts'),
    guideUrl: buildGuideUrl('creation-functions/http-communication/fromFetch'),
  },

  // combination
  'concat': {
    name: 'concat',
    category: 'combination',
    description: 'Concatenates Observables in sequence',
    officialUrl: buildOfficialUrl('creation', 'concat'),
    sourceUrl: buildSourceUrl('observable/concat.ts'),
    guideUrl: buildGuideUrl('creation-functions/combination/concat'),
  },
  'merge': {
    name: 'merge',
    category: 'combination',
    description: 'Combines multiple Observables, emitting all values',
    officialUrl: buildOfficialUrl('creation', 'merge'),
    sourceUrl: buildSourceUrl('observable/merge.ts'),
    guideUrl: buildGuideUrl('creation-functions/combination/merge'),
  },
  'combineLatest': {
    name: 'combineLatest',
    category: 'combination',
    description: 'Combines latest values from all Observables',
    officialUrl: buildOfficialUrl('creation', 'combineLatest'),
    sourceUrl: buildSourceUrl('observable/combineLatest.ts'),
    guideUrl: buildGuideUrl('creation-functions/combination/combineLatest'),
  },
  'zip': {
    name: 'zip',
    category: 'combination',
    description: 'Combines values by index into arrays',
    officialUrl: buildOfficialUrl('creation', 'zip'),
    sourceUrl: buildSourceUrl('observable/zip.ts'),
    guideUrl: buildGuideUrl('creation-functions/combination/zip'),
  },
  'forkJoin': {
    name: 'forkJoin',
    category: 'combination',
    description: 'Waits for all to complete, emits final values',
    officialUrl: buildOfficialUrl('creation', 'forkJoin'),
    sourceUrl: buildSourceUrl('observable/forkJoin.ts'),
    guideUrl: buildGuideUrl('creation-functions/combination/forkJoin'),
  },

  // selection
  'race': {
    name: 'race',
    category: 'selection',
    description: 'Emits from the Observable that emits first',
    officialUrl: buildOfficialUrl('creation', 'race'),
    sourceUrl: buildSourceUrl('observable/race.ts'),
    guideUrl: buildGuideUrl('creation-functions/selection/race'),
  },
  'partition': {
    name: 'partition',
    category: 'selection',
    description: 'Splits Observable into two based on predicate',
    officialUrl: buildOfficialUrl('creation', 'partition'),
    sourceUrl: buildSourceUrl('observable/partition.ts'),
    guideUrl: buildGuideUrl('creation-functions/selection/partition'),
  },

  // conditional
  'iif': {
    name: 'iif',
    category: 'conditional',
    description: 'Subscribes to one of two Observables based on condition',
    officialUrl: buildOfficialUrl('creation', 'iif'),
    sourceUrl: buildSourceUrl('observable/iif.ts'),
    guideUrl: buildGuideUrl('creation-functions/conditional/iif'),
  },
  'defer': {
    name: 'defer',
    category: 'conditional',
    description: 'Creates Observable lazily at subscription time',
    officialUrl: buildOfficialUrl('creation', 'defer'),
    sourceUrl: buildSourceUrl('observable/defer.ts'),
    guideUrl: buildGuideUrl('creation-functions/conditional/defer'),
  },

  // control
  'scheduled': {
    name: 'scheduled',
    category: 'control',
    description: 'Creates an Observable with a specific scheduler',
    officialUrl: buildOfficialUrl('creation', 'scheduled'),
    sourceUrl: buildSourceUrl('scheduled/scheduled.ts'),
    guideUrl: buildGuideUrl('creation-functions/control/scheduled'),
  },
  'using': {
    name: 'using',
    category: 'control',
    description: 'Creates Observable with resource management',
    officialUrl: buildOfficialUrl('creation', 'using'),
    sourceUrl: buildSourceUrl('observable/using.ts'),
    guideUrl: buildGuideUrl('creation-functions/control/using'),
  },
};
