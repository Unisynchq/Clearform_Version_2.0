export type FormArchetype =
  | 'generic'
  | 'internal-team-review'
  | 'customer-nps'
  | 'academic-research'
  | 'community-club'
  | 'founder-product-discovery';

export type FormContextScreen = {
  screenId: number | string;
  label: string;
  fieldType: string;
  config?: Record<string, unknown>;
  qualityOptions?: Record<string, unknown>;
  /** Owner's free-text AI guidance for this screen (highest authority). */
  customInstructions?: string;
  fields?: Record<string, unknown>[];
};

export type FormContextQuestionSummary = {
  screenId: number | string;
  label: string;
  helperText: string;
  fieldType: string;
};

export type FormContext = {
  formId: string;
  title: string;
  purpose: string;
  /** Who will read responses — form owner first name or fallback label. */
  audienceLabel?: string;
  archetype: FormArchetype;
  screens: FormContextScreen[];
  contentScreens: {
    id: number;
    label: string;
    fields: object[];
    fieldType?: string;
    options?: string[];
  }[];
  /** All content questions in the form (for quality eval context). */
  allQuestions?: FormContextQuestionSummary[];
  /** Active screen when evaluating live keystrokes. */
  currentScreenId?: number | string;
  logicGraph: {
    connections: unknown[];
    ifRulesByEdge: Record<string, unknown>;
  };
  responseStats: {
    count: number;
    processedCount: number;
    completionRate: number;
    avgQuality: number | null;
  };
  recentAnswersExcerpt: string;
  departmentFields?: string[];
  screenLabels: string[];
  snapshot: unknown;
  memoryChunks: string[];
};
