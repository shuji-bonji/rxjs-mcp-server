import { CreationFunctionInfo, DOC_BASE_URL } from '../types.js';

/**
 * RxJS Creation Functions Database
 * Based on https://shuji-bonji.github.io/RxJS-with-TypeScript/
 */
export const creationFunctionDatabase: Record<string, CreationFunctionInfo> = {
  // basic
  'of': {
    name: 'of',
    category: 'basic',
    description: 'Emits the arguments you provide, then completes',
    docUrl: `${DOC_BASE_URL}/creation-functions/basic/of`,
  },
  'from': {
    name: 'from',
    category: 'basic',
    description: 'Creates an Observable from an Array, Promise, or Iterable',
    docUrl: `${DOC_BASE_URL}/creation-functions/basic/from`,
  },
  'fromEvent': {
    name: 'fromEvent',
    category: 'basic',
    description: 'Creates an Observable from DOM events',
    docUrl: `${DOC_BASE_URL}/creation-functions/basic/fromEvent`,
  },
  'interval': {
    name: 'interval',
    category: 'basic',
    description: 'Emits incremental numbers at specified intervals',
    docUrl: `${DOC_BASE_URL}/creation-functions/basic/interval`,
  },
  'timer': {
    name: 'timer',
    category: 'basic',
    description: 'Emits after a delay, then optionally at intervals',
    docUrl: `${DOC_BASE_URL}/creation-functions/basic/timer`,
  },

  // loop
  'range': {
    name: 'range',
    category: 'loop',
    description: 'Emits a sequence of numbers within a range',
    docUrl: `${DOC_BASE_URL}/creation-functions/loop/range`,
  },
  'generate': {
    name: 'generate',
    category: 'loop',
    description: 'Creates an Observable with custom iteration logic',
    docUrl: `${DOC_BASE_URL}/creation-functions/loop/generate`,
  },

  // http
  'ajax': {
    name: 'ajax',
    category: 'http',
    description: 'Creates an Observable for AJAX requests',
    docUrl: `${DOC_BASE_URL}/creation-functions/http/ajax`,
  },
  'fromFetch': {
    name: 'fromFetch',
    category: 'http',
    description: 'Creates an Observable from Fetch API',
    docUrl: `${DOC_BASE_URL}/creation-functions/http/fromFetch`,
  },

  // combination
  'concat': {
    name: 'concat',
    category: 'combination',
    description: 'Concatenates Observables in sequence',
    docUrl: `${DOC_BASE_URL}/creation-functions/combination/concat`,
  },
  'merge': {
    name: 'merge',
    category: 'combination',
    description: 'Combines multiple Observables, emitting all values',
    docUrl: `${DOC_BASE_URL}/creation-functions/combination/merge`,
  },
  'combineLatest': {
    name: 'combineLatest',
    category: 'combination',
    description: 'Combines latest values from all Observables',
    docUrl: `${DOC_BASE_URL}/creation-functions/combination/combineLatest`,
  },
  'zip': {
    name: 'zip',
    category: 'combination',
    description: 'Combines values by index into arrays',
    docUrl: `${DOC_BASE_URL}/creation-functions/combination/zip`,
  },
  'forkJoin': {
    name: 'forkJoin',
    category: 'combination',
    description: 'Waits for all to complete, emits final values',
    docUrl: `${DOC_BASE_URL}/creation-functions/combination/forkJoin`,
  },

  // selection
  'race': {
    name: 'race',
    category: 'selection',
    description: 'Emits from the Observable that emits first',
    docUrl: `${DOC_BASE_URL}/creation-functions/selection/race`,
  },
  'partition': {
    name: 'partition',
    category: 'selection',
    description: 'Splits Observable into two based on predicate',
    docUrl: `${DOC_BASE_URL}/creation-functions/selection/partition`,
  },

  // conditional
  'iif': {
    name: 'iif',
    category: 'conditional',
    description: 'Subscribes to one of two Observables based on condition',
    docUrl: `${DOC_BASE_URL}/creation-functions/conditional/iif`,
  },
  'defer': {
    name: 'defer',
    category: 'conditional',
    description: 'Creates Observable lazily at subscription time',
    docUrl: `${DOC_BASE_URL}/creation-functions/conditional/defer`,
  },

  // control
  'scheduled': {
    name: 'scheduled',
    category: 'control',
    description: 'Creates an Observable with a specific scheduler',
    docUrl: `${DOC_BASE_URL}/creation-functions/control/scheduled`,
  },
  'using': {
    name: 'using',
    category: 'control',
    description: 'Creates Observable with resource management',
    docUrl: `${DOC_BASE_URL}/creation-functions/control/using`,
  },
};
