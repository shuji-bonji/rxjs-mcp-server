import { z } from 'zod';

// Tool response structure
export interface ToolResponse {
  content: Array<{
    type: 'text';
    text: string;
  }>;
}

// Tool handler function type
export type ToolHandler = (args: any) => Promise<ToolResponse>;

// Tool definition structure
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: z.ZodType<any>;
  outputSchema?: any;
  annotations?: {
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
    idempotentHint?: boolean;
    openWorldHint?: boolean;
  };
}

// Tool implementation structure
export interface ToolImplementation {
  definition: ToolDefinition;
  handler: ToolHandler;
}

// Common operator information
export interface OperatorInfo {
  name: string;
  category: 'creation' | 'transformation' | 'filtering' | 'combination' | 'utility' | 'error-handling' | 'multicasting';
  description: string;
  marblePattern?: string;
}

// Stream execution result
export interface StreamExecutionResult {
  values: any[];
  errors: any[];
  completed: boolean;
  timeline: Array<{
    time: number;
    type: 'next' | 'error' | 'complete';
    value?: any;
  }>;
  executionTime: number;
  memoryUsage?: {
    before: number;
    after: number;
    peak: number;
  };
}

// Pattern suggestion
export interface PatternSuggestion {
  name: string;
  description: string;
  code: string;
  useCase: string;
  operators: string[];
  considerations: string[];
}

// Memory leak detection result
export interface MemoryLeakResult {
  hasLeak: boolean;
  leakSources: Array<{
    type: 'subscription' | 'subject' | 'operator';
    description: string;
    severity: 'low' | 'medium' | 'high';
    suggestion: string;
  }>;
  recommendations: string[];
}

// Marble diagram result
export interface MarbleDiagramResult {
  diagram: string;
  explanation: string;
  timeline: Array<{
    time: number;
    value?: any;
  }>;
}
