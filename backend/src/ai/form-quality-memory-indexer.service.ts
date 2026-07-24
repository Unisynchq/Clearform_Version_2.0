import { Injectable, Logger } from '@nestjs/common';
import { parseSnapshotScreens } from '../responses/answer-format.util';
import { FormMemoryService } from './form-memory.service';
import { QuestionIntentService } from './question-intent/question-intent.service';
import {
  resolveHelperTextFromScreen,
  resolveQuestionTextFromScreen,
} from './snapshot-screen.util';

@Injectable()
export class FormQualityMemoryIndexer {
  private readonly logger = new Logger(FormQualityMemoryIndexer.name);

  constructor(
    private readonly memory: FormMemoryService,
    private readonly questionIntent: QuestionIntentService,
  ) {}

  async indexPublishedForm(
    formId: string,
    snapshot: Record<string, unknown>,
  ): Promise<void> {
    const screens = parseSnapshotScreens(snapshot).filter(
      (s) => s.type === 'content' && s.id != null,
    );

    for (const screen of screens) {
      const questionText = resolveQuestionTextFromScreen(screen);
      const helperText = resolveHelperTextFromScreen(screen);
      if (!questionText.trim()) continue;

      const intent = this.questionIntent.classifyHeuristic({
        questionText,
        helperText,
        screenId: String(screen.id),
        fieldId: 'quality-index',
      });

      const content = [
        `Question: ${questionText}`,
        helperText ? `Helper: ${helperText}` : null,
      ]
        .filter(Boolean)
        .join('\n');

      try {
        await this.memory.storeChunk(
          formId,
          'question_pattern',
          content,
          {
            screenId: String(screen.id),
            intent,
          },
          'free',
        );
      } catch (err) {
        this.logger.warn(
          `question_pattern index skipped screen ${screen.id}: ${err instanceof Error ? err.message : err}`,
        );
      }
    }
  }
}
