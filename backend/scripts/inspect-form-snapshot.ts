/**
 * Inspect builder vs published snapshots for a form (dev diagnostics).
 * Usage: bun run scripts/inspect-form-snapshot.ts [formId]
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import {
  analyzeSnapshot,
  type SnapshotScreen,
} from '../src/forms/snapshot.validator';

const formId =
  process.argv[2] ?? '089a3acd-818f-4ae6-9bdb-e3581219bafb';

const pool = new Pool({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

function printSnapshot(label: string, snapshot: unknown) {
  console.log(`\n=== ${label} ===`);
  if (!snapshot || typeof snapshot !== 'object') {
    console.log('(empty or invalid)');
    return;
  }
  const analysis = analyzeSnapshot(snapshot as Record<string, unknown>);
  console.log('Counts:', {
    total: analysis.screenCount,
    intro: analysis.introCount,
    content: analysis.contentCount,
    end: analysis.endCount,
    other: analysis.otherCount,
  });
  if (analysis.contentWithoutConfig.length > 0) {
    console.log('Content screens missing config:', analysis.contentWithoutConfig);
  }
  const screens = (snapshot as { screens?: SnapshotScreen[] }).screens ?? [];
  console.log('Screens:');
  for (const s of screens) {
    const hasConfig =
      s.type !== 'content' ? 'n/a' : s.config != null ? 'yes' : 'NO';
    console.log(
      `  - id=${String(s.id)} type=${s.type ?? '?'} label=${s.label ?? s.name ?? ''} config=${hasConfig}`,
    );
  }
}

async function main() {
  const form = await prisma.form.findUnique({
    where: { id: formId },
    include: { _count: { select: { responses: true } } },
  });

  if (!form) {
    console.error(`Form not found: ${formId}`);
    process.exit(1);
  }

  console.log('Form:', {
    id: form.id,
    title: form.title,
    status: form.status,
    publishedAt: form.publishedAt,
    responseCount: form._count.responses,
  });

  printSnapshot('builderSnapshot', form.builderSnapshot);
  printSnapshot('publishedSnapshot', form.publishedSnapshot);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
