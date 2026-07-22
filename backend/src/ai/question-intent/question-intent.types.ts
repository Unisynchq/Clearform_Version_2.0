export type QuestionIntent =
  | 'identity'
  | 'factual_short'
  | 'open_feedback'
  | 'experience_narrative'
  | 'achievement'
  | 'optional_topic'
  | 'yes_no'
  | 'generic';

export type QualityCriterionId =
  | 'length'
  | 'specificity'
  | 'relevance'
  | 'completeness';
