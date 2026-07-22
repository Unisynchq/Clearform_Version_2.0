type QualityCriterionId =
  | 'length'
  | 'specificity'
  | 'relevance'
  | 'completeness';

type NestedQualityOptions = {
  enabled?: boolean;
  minWords?: number;
  sensitivity?: 'Low' | 'Medium' | 'High';
  vagueWords?: string;
  keywords?: string;
  topicKeywords?: string;
  matchThreshold?: number;
  keywordThreshold?: number;
  detectTrailing?: boolean;
  requiredSentences?: number;
};

export interface EvaluateQualityDto {
  screenId: string;
  fieldId: string;
  /**
   * Respondent-generated session id (sessionStorage UUID) — scopes trial
   * accounting and session memory. Client-supplied; validated server-side.
   */
  sessionId?: string;
  text?: string;
  answerText?: string;
  questionText?: string;
  helperText?: string;
  formTitle?: string;
  formPurpose?: string;
  nextScreenLabels?: string[];
  informationRequirements?: string[];
  conversationHistory?: Array<{ role: 'ai' | 'user'; content: string }>;
  customInstructions?: string;
  /** Field character cap — when answer is near limit, do not nudge for more length. */
  maxChars?: number;
  answerCharCount?: number;
  /** Facets a complete answer should cover (derived from helper or owner guidance). */
  facetsRequested?: string[];
  /** Server-built compact rendering of the form's branching logic. */
  logicSummary?: string;
  options?: Record<string, unknown> & {
    minWords?: number;
    sensitivity?: 'Low' | 'Medium' | 'High';
    vagueWords?: string;
    topicKeywords?: string;
    keywordThreshold?: number;
    criteria?: string[];
    length?: NestedQualityOptions;
    specificity?: NestedQualityOptions;
    relevance?: NestedQualityOptions;
    completeness?: NestedQualityOptions;
  };
}

export interface GenerateLogicDto {
  screens: Array<Record<string, unknown>>;
  contentScreens: Array<Record<string, unknown>>;
  formTitle?: string;
}

export interface NormalizedQualityOptions {
  minWords: number;
  sensitivity: 'Low' | 'Medium' | 'High';
  vagueWords?: string;
  topicKeywords?: string;
  keywordThreshold: number;
  criteria: QualityCriterionId[];
  completeness?: {
    detectTrailing: boolean;
    requiredSentences: number;
  };
}

export interface QualityResult {
  level: 'green' | 'amber' | 'red';
  message: string;
  failedIds: string[];
  suggestions?: string[];
  followUpQuestion?: string | null;
  /** Debug/observability: which pipeline stage produced the verdict. */
  meta?: {
    source?: 'cache' | 'violation' | 'rules' | 'llm' | 'finalize' | string;
    tier?: string;
    [key: string]: unknown;
  };
}
