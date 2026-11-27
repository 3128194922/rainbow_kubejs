const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const rulesPath = path.join(root, 'startup_scripts/fishing_journal/rules.js');
const mainPath = path.join(root, 'startup_scripts/fishing_journal/main.js');

function loadRules() {
  const context = { global: {}, console: { log: () => {} } };
  vm.runInNewContext(fs.readFileSync(rulesPath, 'utf8'), context, { filename: rulesPath });
  return context.global;
}

test('里程碑百分比与数量按解锁比例提升', () => {
  const rules = loadRules();
  assert.equal(Array.from(rules.FISH_JOURNAL_MILESTONES, m => m.percent).join(','), '10,25,50,75,100');

  const cases = [
    [0, 101, 0],
    [10, 101, 0],
    [11, 101, 1],
    [25, 101, 1],
    [26, 101, 2],
    [50, 101, 2],
    [51, 101, 3],
    [75, 101, 3],
    [76, 101, 4],
    [100, 101, 4],
    [101, 101, 5],
  ];
  for (const [unlocked, total, expected] of cases) {
    assert.equal(rules.getFishJournalMilestoneCount(unlocked, total), expected,
      `${unlocked}/${total} 应达成 ${expected} 档`);
  }
});

test('总数正好 100 时每档门槛精确命中', () => {
  const rules = loadRules();
  for (const [unlocked, expected] of [[9, 0], [10, 1], [25, 2], [50, 3], [75, 4], [100, 5]]) {
    assert.equal(rules.getFishJournalMilestoneCount(unlocked, 100), expected,
      `${unlocked}/100 应达成 ${expected} 档`);
  }
});

test('无效总数/负数解锁不会发奖', () => {
  const rules = loadRules();
  assert.equal(rules.getFishJournalMilestoneCount(10, 0), 0);
  assert.equal(rules.getFishJournalMilestoneCount(10, null), 0);
  assert.equal(rules.getFishJournalMilestoneCount(-1, 101), 0);
});

test('特殊鱼类只识别 rare/very_rare/legendary', () => {
  const rules = loadRules();
  assert.equal(rules.getFishJournalSpecialTier('rare'), 'rare');
  assert.equal(rules.getFishJournalSpecialTier('very_rare'), 'very_rare');
  assert.equal(rules.getFishJournalSpecialTier('LEGENDARY'), 'legendary');
  for (const key of ['common', 'uncommon', 'epic', '', null]) {
    assert.equal(rules.getFishJournalSpecialTier(key), null);
  }
});

test('奖励表条目格式有效且数量为正', () => {
  const rules = loadRules();
  const all = [];
  for (const milestone of rules.FISH_JOURNAL_MILESTONES) all.push(...milestone.rewards);
  for (const tier of Object.keys(rules.FISH_JOURNAL_SPECIAL_REWARDS)) {
    all.push(...rules.FISH_JOURNAL_SPECIAL_REWARDS[tier].rewards);
  }
  for (const reward of all) {
    assert.equal(reward.length, 2);
    assert.match(reward[0], /^[a-z0-9_.-]+:[a-z0-9_./-]+$/);
    assert.ok(Number.isInteger(reward[1]) && reward[1] > 0, `${reward[0]} 数量必须为正整数`);
  }
});

test('手册实现不再提供幸运，并接入图鉴与钓鱼事件', () => {
  const main = fs.readFileSync(mainPath, 'utf8');
  assert.doesNotMatch(main, /fishing_journal_luck|generic\.luck|modifyAttribute/);
  assert.match(main, /getFishJournalMilestoneCount/);
  assert.match(main, /ItemFishedEvent/);
  assert.match(main, /getFishJournalSpecialTier/);
  assert.match(main, /fish_journal_milestone/);
});
