import { BadRequestException } from '@nestjs/common';

export type SnapshotScreen = {
  id?: unknown;
  type?: string;
  config?: unknown;
  label?: string;
  name?: string;
};

export type SnapshotAnalysis = {
  screenCount: number;
  introCount: number;
  contentCount: number;
  endCount: number;
  otherCount: number;
  contentWithoutConfig: Array<{ id: unknown; label?: string }>;
};

export function analyzeSnapshot(
  snapshot: Record<string, unknown> | null | undefined,
): SnapshotAnalysis {
  const screens = Array.isArray(snapshot?.screens)
    ? (snapshot.screens as SnapshotScreen[])
    : [];

  let introCount = 0;
  let contentCount = 0;
  let endCount = 0;
  let otherCount = 0;
  const contentWithoutConfig: SnapshotAnalysis['contentWithoutConfig'] = [];

  for (const screen of screens) {
    const type = screen?.type ?? 'other';
    if (type === 'intro') introCount += 1;
    else if (type === 'content') {
      contentCount += 1;
      if (screen.config == null || typeof screen.config !== 'object') {
        contentWithoutConfig.push({ id: screen.id, label: screen.label });
      }
    } else if (type === 'end') endCount += 1;
    else otherCount += 1;
  }

  return {
    screenCount: screens.length,
    introCount,
    contentCount,
    endCount,
    otherCount,
    contentWithoutConfig,
  };
}

export type ValidateSnapshotOptions = {
  forPublish?: boolean;
  strictContentConfig?: boolean;
};

export function validateSnapshotStructure(
  snapshot: Record<string, unknown>,
  options: ValidateSnapshotOptions = {},
): SnapshotAnalysis {
  if (!snapshot || typeof snapshot !== 'object') {
    throw new BadRequestException('Snapshot must be a JSON object');
  }

  // Draft autosaves from older clients / template seeds sometimes omit
  // version; treat missing as v1. Publish still requires an explicit version.
  if (snapshot.version == null) {
    if (options.forPublish) {
      throw new BadRequestException('Snapshot must include version');
    }
    (snapshot as { version?: number }).version = 1;
  }

  if (!Array.isArray(snapshot.screens)) {
    throw new BadRequestException('Snapshot must include a screens array');
  }

  const analysis = analyzeSnapshot(snapshot);

  if (options.forPublish && analysis.contentCount < 1) {
    throw new BadRequestException(
      'Publish requires at least one content screen in the snapshot',
    );
  }

  if (
    options.forPublish &&
    options.strictContentConfig &&
    analysis.contentWithoutConfig.length > 0
  ) {
    throw new BadRequestException(
      `Publish requires config on every content screen; missing on: ${analysis.contentWithoutConfig
        .map((s) => String(s.id))
        .join(', ')}`,
    );
  }

  return analysis;
}

export function snapshotTitle(
  snapshot: Record<string, unknown>,
): string | undefined {
  const title = snapshot.formTitle;
  if (typeof title !== 'string') return undefined;
  const trimmed = title.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
