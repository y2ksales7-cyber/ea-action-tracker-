import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
const source = ts.transpileModule(readFileSync(new URL('../lib/ranking.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { rankItems, deadlineFlag } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
const item = (id, priority, deadline, status = 'Open') => ({ id, priority, deadline, status });
test('PRD scenario ranks high overdue, medium due soon, then low distant', () => {
  const items = [item('low', 'Low', '2026-11-01'), item('medium', 'Medium', '2026-10-04'), item('high', 'High', '2026-10-01')];
  assert.deepEqual(rankItems(items).map(i => i.id), ['high', 'medium', 'low']);
  assert.equal(deadlineFlag(items[2], '2026-10-02'), 'overdue');
  assert.equal(deadlineFlag(items[1], '2026-10-02'), 'soon');
  assert.equal(deadlineFlag(items[0], '2026-10-02'), 'none');
  assert.equal(items[0].id, 'low', 'sorting must not mutate input');
});
test('earlier deadline breaks priority ties and priority wins over deadline', () => {
  assert.deepEqual(rankItems([item('later', 'High', '2026-10-06'), item('low', 'Low', '2026-09-01'), item('earlier', 'High', '2026-10-03')]).map(i => i.id), ['earlier', 'later', 'low']);
});
test('completed items clear flags; today and exactly seven days are due soon', () => {
  assert.equal(deadlineFlag(item('done', 'High', '2026-09-01', 'Done'), '2026-10-02'), 'none');
  assert.equal(deadlineFlag(item('today', 'High', '2026-10-02'), '2026-10-02'), 'soon');
  assert.equal(deadlineFlag(item('boundary', 'Medium', '2026-10-09'), '2026-10-02'), 'soon');
  assert.equal(deadlineFlag(item('outside', 'Medium', '2026-10-10'), '2026-10-02'), 'none');
  assert.equal(deadlineFlag(item('progress', 'High', '2026-10-01', 'In Progress'), '2026-10-02'), 'overdue');
});
