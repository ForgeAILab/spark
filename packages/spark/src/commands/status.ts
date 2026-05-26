import { defineCommand } from 'citty';
import { readAllChangeTasks, renderBuildStatus } from '../io/board.ts';
import type { AggregatedTask } from '../io/board.ts';

export async function runStatus(
  projectRoot = process.cwd(),
  opts: { change?: string } = {},
): Promise<string> {
  const all: AggregatedTask[] = await readAllChangeTasks(projectRoot);
  const filtered = opts.change ? all.filter((t) => t.changeId === opts.change) : all;
  const view = renderBuildStatus(filtered);
  console.log(view);
  return view;
}

export const statusCommand = defineCommand({
  meta: {
    name: 'status',
    description: 'Render the build-status view from tasks.md across active changes',
  },
  args: {
    change: {
      type: 'string',
      description: 'Limit to one change id',
    },
  },
  async run({ args }) {
    await runStatus(process.cwd(), {
      change: typeof args.change === 'string' ? args.change : undefined,
    });
  },
});
