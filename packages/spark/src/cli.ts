#!/usr/bin/env bun
import { defineCommand, runMain } from 'citty';
import { addCommand } from './commands/add.ts';
import { checkCommand } from './commands/check.ts';
import { infoCommand } from './commands/info.ts';
import { listCommand } from './commands/list.ts';
import { presetCommand } from './commands/preset.ts';

const subCommands = {
  list: listCommand,
  info: infoCommand,
  check: checkCommand,
  add: addCommand,
  preset: presetCommand,
};

const mainCommand = defineCommand({
  meta: {
    name: 'spark',
    description: 'Composable spark scaffold pack manager',
  },
  subCommands,
});

function guardUnknownSubcommand(argv: readonly string[]): void {
  const command = argv.find((arg) => !arg.startsWith('-'));
  if (!command || Object.hasOwn(subCommands, command)) {
    return;
  }

  if (command === 'remove' || command === 'uninstall' || command === 'update') {
    console.error(
      `unknown subcommand "${command}". spark does not support uninstall/update in v1; use git revert to undo a pack install.`,
    );
    process.exit(1);
  }

  console.error(`unknown subcommand "${command}".`);
  process.exit(1);
}

if (import.meta.main) {
  guardUnknownSubcommand(process.argv.slice(2));
  await runMain(mainCommand);
}

export { mainCommand };
