# @forgeailab/spark-board

Typed IO helpers for project `.ai/board.md` files.

## API

- `readBoard(projectRoot)` parses `<projectRoot>/.ai/board.md` into epics and tasks while keeping the original markdown available for exact round-trips.
- `seedTasks(projectRoot, packName, tasks)` appends missing tasks under `## <packName>` and is idempotent by task id.
- `updateStatus(projectRoot, taskId, status)` updates only the matching task status marker.

Statuses are exposed as `BoardTaskStatus`: `todo`, `in-progress`, `done`, and `blocked`.
