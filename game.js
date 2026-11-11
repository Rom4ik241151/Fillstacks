'use strict';
/* =========================================================================
   Монстроферма / Monster Ranch — idle-игра для Яндекс Игр
   Модули: CONFIG, BN, I18N, State, Save, Platform, SFX, Economy, Prestige,
           Meta (достижения/задания), Ads, Scene/FX, UI, Game
   ========================================================================= */

// ===================== CONFIG: все константы баланса =====================
const CONFIG = {
  saveVersion: 2,
  saveKey: 'monster_ranch_save',
  autosaveSec: 30,          // автосохранение
  cloudMinSec: 30,          // не чаще раза в N сек в облако
  uiTickSec: 0.2,           // частота обновления DOM
  maxActiveGapSec: 60,      // разрыв больше — считаем как оффлайн
  maxTapsPerSec: 20,        // защита от автокликеров

  tap: {
    base: 1,
    comboWindow: 0.45,      // сек между тапами, чтобы комбо росло
    comboStep: 0.04,        // +4% за тап в серии
    comboMax: 1,            // макс. прибавка (x2), расширяется апгрейдами
    comboDrain: 20,         // скорость спада комбо (тапов/сек)
  },

  // Здания: cost = base * growth^n
  generators: [
    { id: 'worm',   icon: '🐛', color: '#8be37a', base: 10,     prod: 0.5,   growth: 1.15 },
    { id: 'shroom', icon: '🍄', color: '#ff8a7a', base: 120,    prod: 3.5,   growth: 1.15 },
    { id: 'bat',    icon: '🦇', color: '#a596ff', base: 1500,   prod: 25,    growth: 1.15 },
    { id: 'toad',   icon: '🐸', color: '#5fd38a', base: 2e4,    prod: 160,   growth: 1.15 },
    { id: 'spider', icon: '🕷️', color: '#c9c3e6', base: 3e5,    prod: 1000,  growth: 1.15 },
    { id: 'ghost',  icon: '👻', color: '#e6f0ff', base: 4.5e6,  prod: 6500,  growth: 1.16 },
    { id: 'octo',   icon: '🐙', color: '#ff7ab8', base: 7e7,    prod: 4.2e4, growth: 1.17 },
    { id: 'zombie', icon: '🧟', color: '#9fd17a', base: 1.1e9,  prod: 2.7e5, growth: 1.18 },
    { id: 'dino',   icon: '🦖', color: '#6fd6a0', base: 1.8e10, prod: 1.8e6, growth: 1.19 },
    { id: 'dragon', icon: '🐲', color: '#7af0c0', base: 3e11,   prod: 1.2e7, growth: 1.2 },
    { id: 'ogre',   icon: '👹', color: '#ff6b6b', base: 1e13,   prod: 6e7,   growth: 1.21 },
    { id: 'kraken', icon: '🦑', color: '#ff9f6b', base: 4e14,   prod: 3e8,   growth: 1.22 },
    { id: 'alien',  icon: '👾', color: '#c08bff', base: 2e16,   prod: 1.5e9, growth: 1.23 },
    { id: 'golem',  icon: '🌋', color: '#ffb35c', base: 1e18,   prod: 7.5e9, growth: 1.24 },
    { id: 'void',   icon: '🌌', color: '#7aa8ff', base: 6e19,   prod: 3.5e10, growth: 1.25 },
  ],

  // Апгрейды зданий: пороги и множители
  genUpgrades: {
    thresholds: [10, 25, 50, 100, 200, 400],
    mults:      [2, 2, 2, 3, 3, 3],
    costFactor: 6,          // цена = цена здания на пороге * factor
  },

  globalUpgrades: [
    { id: 'g1',  icon: '🧪', cost: 5e3,    mult: 2 },
    { id: 'g2',  icon: '🌿', cost: 1e5,    mult: 2 },
    { id: 'g3',  icon: '🎵', cost: 5e6,    mult: 2 },
    { id: 'g4',  icon: '🧲', cost: 2.5e8,  mult: 2 },
    { id: 'g5',  icon: '🌕', cost: 1e10,   mult: 2 },
    { id: 'g6',  icon: '🛸', cost: 1e13,   mult: 2 },
    { id: 'g7',  icon: '🧬', cost: 1e16,   mult: 2 },
    { id: 'g8',  icon: '⚗️', cost: 1e20,   mult: 2 },
    { id: 'g9',  icon: '🔮', cost: 1e25,   mult: 3 },
    { id: 'g10', icon: '🌀', cost: 1e31,   mult: 3 },
    { id: 'g11', icon: '☄️', cost: 1e38,   mult: 4 },
    { id: 'g12', icon: '🪐', cost: 1e46,   mult: 5 },
  ],

  clickUpgrades: [
    { id: 'c1',  icon: '👆', cost: 200,    type: 'mult',  v: 2 },
    { id: 'c2',  icon: '🧤', cost: 2500,   type: 'mult',  v: 2 },
    { id: 'c3',  icon: '💪', cost: 8e3,    type: 'pct',   v: 0.01 },
    { id: 'c4',  icon: '⚡', cost: 1.5e5,  type: 'combo', v: 0.5 },
    { id: 'c5',  icon: '🔨', cost: 4e6,    type: 'mult',  v: 3 },
    { id: 'c6',  icon: '🦾', cost: 2e8,    type: 'pct',   v: 0.02 },
    { id: 'c7',  icon: '🌩️', cost: 2e10,   type: 'mult',  v: 5 },
    { id: 'c8',  icon: '🖐️', cost: 5e12,   type: 'pct',   v: 0.03 },
    { id: 'c9',  icon: '💥', cost: 1e16,   type: 'combo', v: 0.5 },
    { id: 'c10', icon: '🪄', cost: 1e20,   type: 'pct',   v: 0.05 },
  ],
  upgradeRevealFrac: 0.3,   // апгрейд виден, когда денег >= cost*frac

  autoClick: { costBase: 500, costGrowth: 9, rates: [0, 1, 2, 3, 4, 6, 8, 10, 12, 15, 20] },
  managers: { costMult: 150, tickSec: 0.5, maxPerTick: 10, revealOwned: 1 },

  // Престиж 1: Перерождение → Мутаген
  rebirth: { divisor: 1e12, bonusPerPoint: 0.01 },
  // Престиж 2: Вознесение → Лунные камни: floor((lg(мутаген/need)+1)^power)
  ascension: { minRebirths: 8, need: 3e4, power: 1.5, bonusPerPoint: 0.25 },
  // Престиж 3: Пробуждение Древних → Руны: floor((lg(камни/need)+1)^power)
  awakening: { minAscensions: 5, need: 1000, power: 1.5, bonusPerPoint: 1.0 },

  // Деревья престижа: x,y — позиция в сетке, req — зависимости
  tree1: [
    { id: 'root', icon: '💚', x: 2, y: 0, cost: 1,     eff: { t: 'prod', v: 2 } },
    { id: 't1',   icon: '👆', x: 1, y: 1, cost: 1,     req: ['root'], eff: { t: 'click', v: 3 } },
    { id: 't2',   icon: '💪', x: 0, y: 2, cost: 3,     req: ['t1'], eff: { t: 'tapPct', v: 0.02 } },
    { id: 't3',   icon: '⚡', x: 1, y: 3, cost: 8,     req: ['t1'], eff: { t: 'comboMax', v: 1 } },
    { id: 't4',   icon: '🤖', x: 0, y: 4, cost: 20,    req: ['t2'], eff: { t: 'autoClick', v: 3 } },
    { id: 't5',   icon: '🔨', x: 1, y: 5, cost: 60,    req: ['t3'], eff: { t: 'click', v: 10 } },
    { id: 't6',   icon: '🦾', x: 0, y: 6, cost: 200,   req: ['t4', 't5'], eff: { t: 'tapPct', v: 0.05 } },
    { id: 'p1',   icon: '🌱', x: 2, y: 1, cost: 3,     req: ['root'], eff: { t: 'prod', v: 1.5 } },
    { id: 'p2',   icon: '🐛', x: 2, y: 2, cost: 8,     req: ['p1'], eff: { t: 'genRange', a: 0, b: 4, v: 2 } },
    { id: 'p3',   icon: '🌿', x: 2, y: 3, cost: 25,    req: ['p2'], eff: { t: 'prod', v: 1.5 } },
    { id: 'p4',   icon: '👻', x: 2, y: 4, cost: 80,    req: ['p3'], eff: { t: 'genRange', a: 5, b: 9, v: 2 } },
    { id: 'p5',   icon: '👹', x: 2, y: 5, cost: 250,   req: ['p4'], eff: { t: 'genRange', a: 10, b: 14, v: 2 } },
    { id: 'p6',   icon: '🧪', x: 2, y: 6, cost: 700,   req: ['p5'], eff: { t: 'mutBonus', v: 0.01 } },
    { id: 'p7',   icon: '🌳', x: 1, y: 7, cost: 2000,  req: ['p6', 't6'], eff: { t: 'prod', v: 2 } },
    { id: 'p8',   icon: '⚗️', x: 1, y: 8, cost: 6000,  req: ['p7'], eff: { t: 'mutGain', v: 1.5 } },
    { id: 'u1',   icon: '🌙', x: 3, y: 1, cost: 2,     req: ['root'], eff: { t: 'offlineCap', v: 2 } },
    { id: 'u2',   icon: '🥚', x: 4, y: 2, cost: 5,     req: ['u1'], eff: { t: 'goldenFreq', v: 0.8 } },
    { id: 'u3',   icon: '💰', x: 3, y: 3, cost: 12,    req: ['u1'], eff: { t: 'startMoney', v: 1e6 } },
    { id: 'u4',   icon: '📋', x: 4, y: 4, cost: 30,    req: ['u2'], eff: { t: 'keepManagers', v: 1 } },
    { id: 'u5',   icon: '✨', x: 3, y: 5, cost: 90,    req: ['u3', 'u4'], eff: { t: 'goldenPow', v: 2 } },
    { id: 'u6',   icon: '😴', x: 4, y: 6, cost: 300,   req: ['u5'], eff: { t: 'offlineEff', v: 0.25 } },
    { id: 'u7',   icon: '🏷️', x: 3, y: 7, cost: 1000,  req: ['u5'], eff: { t: 'costMult', v: 0.9 } },
    { id: 'u8',   icon: '🏆', x: 3, y: 8, cost: 3000,  req: ['u6', 'u7'], eff: { t: 'achBonus', v: 2 } },
    { id: 'cap',  icon: '👑', x: 2, y: 9, cost: 20000, req: ['p8', 'u8'], eff: { t: 'prod', v: 3 } },
  ],
  tree2: [
    { id: 'm_root',  icon: '🌕', x: 2, y: 0, cost: 1,  eff: { t: 'prod', v: 3 } },
    { id: 'm_mut',   icon: '🧪', x: 1, y: 1, cost: 1,  req: ['m_root'], eff: { t: 'mutGain', v: 2 } },
    { id: 'm_off',   icon: '🛌', x: 3, y: 1, cost: 1,  req: ['m_root'], eff: { t: 'offlineCap', v: 6 } },
    { id: 'm_click', icon: '🖐️', x: 0, y: 2, cost: 2,  req: ['m_mut'], eff: { t: 'click', v: 25 } },
    { id: 'm_start', icon: '🎒', x: 2, y: 2, cost: 2,  req: ['m_mut', 'm_off'], eff: { t: 'startMutagen', v: 10 } },
    { id: 'm_gold',  icon: '🥇', x: 4, y: 2, cost: 3,  req: ['m_off'], eff: { t: 'goldenDur', v: 2 } },
    { id: 'm_auto',  icon: '💼', x: 1, y: 3, cost: 4,  req: ['m_click'], eff: { t: 'freeManagers', v: 1 } },
    { id: 'm_upg',   icon: '📜', x: 3, y: 3, cost: 5,  req: ['m_gold'], eff: { t: 'upgCost', v: 0.5 } },
    { id: 'm_moonB', icon: '🌗', x: 2, y: 4, cost: 8,  req: ['m_start'], eff: { t: 'moonBonus', v: 0.15 } },
    { id: 'm_cost',  icon: '🏷️', x: 0, y: 4, cost: 10, req: ['m_auto'], eff: { t: 'costMult', v: 0.85 } },
    { id: 'm_prod',  icon: '🌠', x: 4, y: 4, cost: 12, req: ['m_upg'], eff: { t: 'prod', v: 4 } },
    { id: 'm_moonG', icon: '💎', x: 2, y: 5, cost: 25, req: ['m_moonB', 'm_cost', 'm_prod'], eff: { t: 'moonGain', v: 1.5 } },
    { id: 'm_cap',   icon: '🌌', x: 2, y: 6, cost: 60, req: ['m_moonG'], eff: { t: 'prod', v: 10 } },
  ],
  tree3: [
    { id: 'r_root',  icon: '🔮', x: 2, y: 0, cost: 1,  eff: { t: 'prod', v: 3 } },
    { id: 'r_mut',   icon: '🧪', x: 1, y: 1, cost: 1,  req: ['r_root'], eff: { t: 'mutGain', v: 3 } },
    { id: 'r_moon',  icon: '🌙', x: 3, y: 1, cost: 2,  req: ['r_root'], eff: { t: 'moonGain', v: 2 } },
    { id: 'r_off',   icon: '⏳', x: 0, y: 2, cost: 2,  req: ['r_mut'], eff: { t: 'offlineCap', v: 12 } },
    { id: 'r_keep',  icon: '📚', x: 2, y: 2, cost: 3,  req: ['r_mut', 'r_moon'], eff: { t: 'keepTree1', v: 1 } },
    { id: 'r_click', icon: '☝️', x: 4, y: 2, cost: 3,  req: ['r_moon'], eff: { t: 'click', v: 100 } },
    { id: 'r_prod',  icon: '🌟', x: 2, y: 3, cost: 6,  req: ['r_keep'], eff: { t: 'prod', v: 10 } },
    { id: 'r_rune',  icon: '🗿', x: 2, y: 4, cost: 12, req: ['r_prod'], eff: { t: 'runeGain', v: 2 } },
  ],

  achievementBonus: 0.01,   // +1% дохода за каждое достижение

  golden: {
    firstSec: 45, minSec: 60, maxSec: 180, lifeSec: 13,
    frenzyChance: 0.5, frenzyMult: 3, frenzySec: 30,
    instantSec: 300, instantTapMin: 30,  // мгновенно: доход за 5 минут
    restoreWindowSec: 12,                // окно «вернуть за рекламу»
  },

  offline: { minSec: 60, capHours: 2, efficiency: 0.5, maxEff: 1 },

  daily: {
    count: 3, rewardMinutes: 15, rewardMinMoney: 500,
    templates: [
      { type: 'tap', min: 150, max: 400 },
      { type: 'buy', min: 20, max: 50 },
      { type: 'golden', min: 2, max: 4 },
      { type: 'upgrade', min: 3, max: 6 },
      { type: 'earn', minutes: 30, minMoney: 2000 },
      { type: 'combo', min: 1, max: 3 },
    ],
  },
  weekly: {
    boostHours: 2, rewardMinutes: 60, rewardMinMoney: 1e4,
    templates: [
      { type: 'golden', v: 25 }, { type: 'buy', v: 1500 }, { type: 'tap', v: 6000 },
      { type: 'rebirth', v: 2 }, { type: 'upgrade', v: 60 },
    ],
  },
  login: {
    minutes:  [5, 10, 20, 30, 45, 60, 120],
    minMoney: [100, 300, 1e3, 3e3, 1e4, 3e4, 1e5],
    day7BoostHours: 1,
  },

  ads: {
    interMinSec: 210,       // полноэкранная не чаще раза в 3.5 мин
    interFirstSec: 180,     // и не раньше 3 мин после старта
    boost: { hours: 4, maxHours: 24, cd: 300 },
    instant: { minutes: 30, minMoney: 1000, cd: 240 },
    summon: { cd: 300 },
    restore: { cd: 180 },
  },

  tutorialSec: 60,
  tipEverySec: 45,
};

// ===================== BN: большие числа без библиотек =====================
// Представление: m * 10^e, 1 <= |m| < 10 (или 0)
class BN {
  constructor(m = 0, e = 0) {
    this.m = m; this.e = e;
    this._norm();
  }
  _norm() {
    let m = this.m, e = this.e;
    if (!Number.isFinite(m) || !Number.isFinite(e) || m === 0) { this.m = 0; this.e = 0; return; }
    // дробную часть порядка переносим в мантиссу
    const fe = Math.floor(e);
    if (fe !== e) { m *= Math.pow(10, e - fe); e = fe; }
    const k = Math.floor(Math.log10(Math.abs(m)));
    if (k !== 0) { m /= Math.pow(10, k); e += k; }
    if (Math.abs(m) >= 10) { m /= 10; e += 1; } else if (Math.abs(m) < 1) { m *= 10; e -= 1; }
    this.m = m; this.e = e;
  }
  static from(v) {
    if (v instanceof BN) return v;
    if (typeof v === 'number') return new BN(v, 0);
    if (typeof v === 'string') {
      const i = v.indexOf('e');
      if (i >= 0) return new BN(parseFloat(v.slice(0, i)), parseInt(v.slice(i + 1), 10));
      return new BN(parseFloat(v), 0);
    }
    if (v && typeof v === 'object' && 'm' in v) return new BN(Number(v.m), Number(v.e));
    return new BN(0, 0);
  }
  static fromLog10(l) {
    if (Number.isNaN(l) || l === -Infinity) return new BN(0, 0);
    if (l === Infinity) return new BN(9.99, 1e15);
    const e = Math.floor(l);
    return new BN(Math.pow(10, l - e), e);
  }
  isZero() { return this.m === 0; }
  neg() { return new BN(-this.m, this.e); }
  add(b) {
    b = BN.from(b);
    if (b.m === 0) return this;
    if (this.m === 0) return b;
    const d = this.e - b.e;
    if (d > 16) return this;
    if (d < -16) return b;
    return new BN(this.m + b.m * Math.pow(10, -d), this.e);
  }
  sub(b) { return this.add(BN.from(b).neg()); }
  mul(b) { b = BN.from(b); return new BN(this.m * b.m, this.e + b.e); }
  div(b) { b = BN.from(b); if (b.m === 0) return new BN(0, 0); return new BN(this.m / b.m, this.e - b.e); }
  cmp(b) {
    b = BN.from(b);
    const sa = Math.sign(this.m), sb = Math.sign(b.m);
    if (sa !== sb) return sa > sb ? 1 : -1;
    if (sa === 0) return 0;
    if (this.e !== b.e) return (this.e > b.e ? 1 : -1) * sa;
    if (this.m === b.m) return 0;
    return this.m > b.m ? 1 : -1;
  }
  gte(b) { return this.cmp(b) >= 0; }
  gt(b) { return this.cmp(b) > 0; }
  lt(b) { return this.cmp(b) < 0; }
  lte(b) { return this.cmp(b) <= 0; }
  log10() { return this.m > 0 ? Math.log10(this.m) + this.e : -Infinity; }
  pow(n) {
    if (n === 0) return new BN(1, 0);
    if (this.m <= 0) return new BN(0, 0);
    return BN.fromLog10(this.log10() * n);
  }
  sqrt() { return this.pow(0.5); }
  floor() {
    if (this.e >= 15) return this;
    const x = this.toNumber();
    // эпсилон гасит ошибки округления (1.9999999 → 2)
    return new BN(Math.floor(x + Math.abs(x) * 1e-10), 0);
  }
  toNumber() {
    if (this.m === 0) return 0;
    if (this.e > 308) return this.m > 0 ? Number.MAX_VALUE : -Number.MAX_VALUE;
    if (this.e < -300) return 0;
    return this.m * Math.pow(10, this.e);
  }
  toString() { return this.m === 0 ? '0' : (+this.m.toPrecision(15)) + 'e' + this.e; }
  toJSON() { return this.toString(); }
  static max(a, b) { a = BN.from(a); b = BN.from(b); return a.gte(b) ? a : b; }
  static min(a, b) { a = BN.from(a); b = BN.from(b); return a.lte(b) ? a : b; }
}
BN.ZERO = new BN(0, 0);
BN.ONE = new BN(1, 0);

// ===================== Утилиты =====================
const U = {
  clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
  safeNum(v, def = 0) { return Number.isFinite(v) ? v : def; },
  rand: (a, b) => a + Math.random() * (b - a),
  // детерминированный ГСЧ для ежедневных заданий
  seeded(seed) {
    let t = seed >>> 0;
    return function () {
      t += 0x6D2B79F5;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  },
  dayNumber(ts = Date.now()) {
    const d = new Date(ts);
    return Math.floor((ts - d.getTimezoneOffset() * 60000) / 86400000);
  },
  weekNumber(day) { return Math.floor((day + 3) / 7); }, // неделя с понедельника
  now: () => Date.now(),
};

// ===================== I18N: все тексты =====================
const I18N = {
  ru: {
    title: 'Монстроферма',
    subtitle: 'Разводи монстров — собирай слизь!',
    loading: 'Кормим монстров…',
    suffixes: ['', 'К', 'М', 'Млрд', 'Трлн', 'Квдр', 'Квнт', 'Скст', 'Сптл', 'Октл', 'Нонл', 'Дцл'],
    t_d: 'д', t_h: 'ч', t_m: 'м', t_s: 'с',
    per_sec: '{v}/сек',
    cur_money: 'Слизь', cur_mut: 'Мутаген', cur_moon: 'Лунные камни', cur_rune: 'Руны',
    tab_farm: 'Ферма', tab_upg: 'Апгрейд', tab_mgr: 'Найм', tab_prest: 'Престиж', tab_tasks: 'Задачи', tab_more: 'Ещё',
    buy: 'Купить', max: 'Макс', owned: 'шт.',
    next_tier: 'x{m} на {n} шт.', all_tiers: 'Все улучшения куплены',
    locked_gen: '???', locked_hint: 'Новый монстр! Стоимость: {v}',
    not_enough: 'Не хватает слизи 💧',
    g_names: ['Слизевик', 'Грибной гоблин', 'Мышиный курятник', 'Жабозавр', 'Паучья ткацкая', 'Призрачная дойка', 'Щупальцевый сад', 'Зомби-сад', 'Дино-ранчо', 'Драконий инкубатор', 'Мельница огров', 'Аквариум кракена', 'Инопланетный амбар', 'Лавовая кузня', 'Левиафан Пустоты'],
    g_descs: [
      'Ползает, хлюпает, производит слизь. Сотрудник месяца.',
      'Выращивает грибы прямо на голове. Экономит на грядках.',
      'Летучие мыши несут яйца вверх ногами.',
      'Квакает так, что слизь вытекает сама.',
      'Вяжет свитера из слизи. Стильно и липко.',
      'Призрачные коровы дают эктоплазменное молоко.',
      'Восемь рук — восемь грядок.',
      'Работают за мозги. Профсоюз обеспокоен.',
      'Вымерли? Только по выходным.',
      'Подогрев яиц бесплатный. Страховка от пожара — нет.',
      'Мелют всё подряд. Особенно слизь.',
      'Чтобы покормить, нужен корабль.',
      'Похищают коров и возвращают их слизистыми.',
      'Големы куют слизь при 3000°C.',
      'Ест звёзды, выделяет слизь. Круговорот жизни.',
    ],
    tiers: ['Витамины', 'Тёплые лежанки', 'Монстро-йога', 'Генная магия', 'Лунный корм', 'Космо-ДНК'],
    gu_name: '{tier}: {g}', gu_desc: '«{g}» производит x{m}',
    glob_names: ['Монстро-удобрение', 'Болотная диета', 'Колыбельные для монстров', 'Слиземагнит', 'Смена в полнолуние', 'НЛО-доставка', 'Генный коктейль', 'Алхимический котёл', 'Хрустальный шар', 'Портал в болото', 'Метеоритный дождь', 'Межпланетная ферма'],
    glob_desc: 'Весь доход x{m}',
    click_names: ['Острый палец', 'Перчатка фермера', 'Накачанный тап', 'Разряд энтузиазма', 'Слизе-молот', 'Робо-рука', 'Громовой тык', 'Пятерня силы', 'Взрывное комбо', 'Волшебная палочка'],
    click_mult: 'Сила тапа x{v}', click_pct: 'Тап: +{v}% от дохода/сек', click_combo: 'Макс. комбо +x{v}',
    upg_empty: 'Пока нет улучшений — копите слизь!', upg_buy_all: 'Купить всё доступное', upg_next: 'Скоро: {name} — {v}',
    sec_click: 'Тапы', sec_global: 'Глобальные', sec_gen: 'Здания',
    mgr_title: 'Менеджер: {g}', mgr_desc: 'Сам покупает это здание, когда хватает слизи',
    mgr_hire: 'Нанять', mgr_on: 'ВКЛ', mgr_off: 'ВЫКЛ', mgr_locked: 'Откроется после покупки здания',
    ac_title: 'Автотапер', ac_desc: '{r} тап./сек без вашего участия', ac_max: 'Максимум', ac_lvl: 'Ур. {n}', ac_upgrade: 'Улучшить',
    mgr_intro: 'Наймите помощников — ферма будет работать сама.',
    rb_title: 'Перерождение', rb_desc: 'Сбросьте ферму и получите Мутаген 🧪. Каждый мутаген навсегда даёт +{p}% к доходу.',
    rb_gain: 'Получите: {v} 🧪', rb_btn: 'Переродиться', rb_need: 'Заработайте {v} слизи за забег',
    rb_next: 'До следующего: {v}', bonus: 'Бонус: x{v} к доходу', have: 'Есть: {v}', total_got: 'Всего получено: {v}',
    rb_confirm: 'Ферма, здания и улучшения сбросятся. Вы получите {v} 🧪 мутагена. Продолжить?',
    asc_title: 'Вознесение', asc_desc: 'Сбрасывает перерождения и Дерево мутаций. Даёт Лунные камни 🌙: +{p}% к доходу каждый.',
    asc_gain: 'Получите: {v} 🌙', asc_btn: 'Вознестись', asc_need: 'Нужно перерождений: {n}/{m}', asc_need2: 'Нужно больше мутагена: {v}',
    asc_confirm: 'Мутаген, Дерево мутаций и перерождения сбросятся. Вы получите {v} 🌙. Продолжить?',
    aw_title: 'Пробуждение Древних', aw_desc: 'Сбрасывает всё, кроме рун и достижений. Руны 🔮: +{p}% к доходу каждая.',
    aw_gain: 'Получите: {v} 🔮', aw_btn: 'Пробудить', aw_need: 'Нужно вознесений: {n}/{m}', aw_need2: 'Нужно больше лунных камней: {v}',
    aw_confirm: 'Сбросится всё, кроме рун и достижений. Вы получите {v} 🔮. Продолжить?',
    locked: 'Закрыто', tree_btn: 'Дерево',
    tree1_title: 'Дерево мутаций 🧪', tree2_title: 'Лунное древо 🌙', tree3_title: 'Древние руны 🔮',
    node_owned: 'Изучено ✔', node_locked: 'Сначала изучите связанные узлы', node_buy: 'Изучить',
    node_tap: 'Нажмите на узел, чтобы узнать подробности',
    n: {
      root: 'Сердце мутанта', t1: 'Цепкие пальцы', t2: 'Силовой тап', t3: 'Нервный тик', t4: 'Робо-тапер', t5: 'Кулак гиганта', t6: 'Бионическая рука',
      p1: 'Плодородная слизь', p2: 'Детский сад', p3: 'Болотный бум', p4: 'Призрачный цех', p5: 'Гигантомания', p6: 'Концентрат мутагена', p7: 'Древо жизни', p8: 'Мутационный взрыв',
      u1: 'Сонное зелье', u2: 'Золотая приманка', u3: 'Наследство', u4: 'Верные помощники', u5: 'Золотое безумие', u6: 'Лунатизм', u7: 'Оптовые цены', u8: 'Зал славы', cap: 'Король монстров',
      m_root: 'Лунный свет', m_mut: 'Лунная мутация', m_off: 'Долгий сон', m_click: 'Лунный тап', m_start: 'Рюкзак мутагена', m_gold: 'Золотая луна', m_auto: 'Кадровое агентство',
      m_upg: 'Свиток скидок', m_moonB: 'Фазы луны', m_cost: 'Лунный рынок', m_prod: 'Звездопад', m_moonG: 'Лунная шахта', m_cap: 'Галактическая ферма',
      r_root: 'Руна силы', r_mut: 'Руна мутаций', r_moon: 'Руна луны', r_off: 'Руна времени', r_keep: 'Руна памяти', r_click: 'Руна касания', r_prod: 'Руна изобилия', r_rune: 'Руна рун',
    },
    e_prod: 'Весь доход x{v}', e_click: 'Сила тапа x{v}', e_tapPct: 'Тап: +{v}% дохода/сек', e_comboMax: 'Макс. комбо +x{v}',
    e_autoClick: 'Автотапер: +{v} ур. бесплатно', e_genRange: 'Здания {a}–{b}: x{v}', e_mutBonus: 'Каждый мутаген: ещё +{v}% дохода',
    e_mutGain: 'Получение мутагена x{v}', e_offlineCap: 'Оффлайн-лимит +{v} ч', e_goldenFreq: 'Золотые слизни на {v}% чаще',
    e_startMoney: 'Старт забега с {v} слизи', e_keepManagers: 'Помощники остаются после перерождения', e_goldenPow: 'Безумие сильнее: +x{v}',
    e_offlineEff: 'Оффлайн-доход +{v}%', e_costMult: 'Здания дешевле на {v}%', e_achBonus: 'Бонус достижений x{v}',
    e_startMutagen: 'После вознесения: +{v} мутагена', e_freeManagers: 'Все менеджеры наняты сразу', e_upgCost: 'Улучшения дешевле на {v}%',
    e_moonBonus: 'Каждый лунный камень: ещё +{v}% дохода', e_moonGain: 'Получение лунных камней x{v}', e_keepTree1: 'Дерево мутаций сохраняется при вознесении',
    e_runeGain: 'Получение рун x{v}', e_goldenDur: 'Безумие длится x{v} дольше',
    daily_title: 'Задания дня', weekly_title: 'Испытание недели', login_title: 'Ежедневный бонус',
    claim: 'Забрать', claimed: 'Получено ✔', day_n: 'День {n}', login_text: 'Заходите каждый день — награда растёт!',
    login_come_back: 'Возвращайтесь завтра за днём {n}!', reward: 'Награда: {v}',
    task_tap: 'Сделайте {n} тапов', task_buy: 'Купите {n} зданий', task_golden: 'Поймайте {n} золотых слизней',
    task_upgrade: 'Купите {n} улучшений', task_earn: 'Заработайте {v} слизи', task_combo: 'Разгоните комбо до максимума {n} раз',
    task_rebirth: 'Переродитесь {n} раз',
    extra_slot: 'Ещё одно задание', extra_slot_desc: 'Дополнительное задание дня за просмотр рекламы',
    time_left: 'Осталось: {t}', weekly_reward: 'x2 доход на {h} ч + {v}', new_tasks_in: 'Новые задания через {t}',
    ach_title: 'Достижения', stats_title: 'Статистика', settings_title: 'Настройки',
    ach_progress: 'Открыто {n} из {m} · бонус +{p}% к доходу', ach_unlocked: 'Достижение!',
    a_first: '{g} на ферме', a_first_d: 'Купите первое здание «{g}»',
    a_own50: 'Стадо: {g}', a_own50_d: 'Соберите 50 шт. «{g}»',
    a_earn: ['Первая лужица', 'Слизистый миллион', 'Миллиард капель', 'Триллионная трясина', 'Квадриллион бульков', 'Океан слизи', 'Слизистая галактика', 'Вселенная хлюпает'],
    a_earn_d: 'Заработайте всего {v} слизи',
    a_taps: ['Тык-тык', 'Палец-молния', 'Неутомимый тапер'], a_taps_d: 'Сделайте {v} тапов',
    a_gold: ['Золотая лихорадка', 'Ловец удачи', 'Золотой магнат'], a_gold_d: 'Поймайте {v} золотых слизней',
    a_combo: 'Комбо-маньяк', a_combo_d: 'Разгоните комбо до максимума',
    a_rb: ['Новая жизнь', 'Мутант со стажем', 'Бессмертная слизь'], a_rb_d: 'Переродитесь {v} раз',
    a_asc: ['К звёздам', 'Лунный фермер'], a_asc_d: 'Вознеситесь {v} раз',
    a_aw: 'Древний пробуждён', a_aw_d: 'Пробудите Древних',
    a_streak: 'Верный фермер', a_streak_d: 'Заходите 7 дней подряд',
    a_upg: ['Энтузиаст апгрейдов', 'Безумный учёный'], a_upg_d: 'Купите {v} улучшений',
    a_gens: ['Ферма растёт', 'Монстрополис', 'Мегаферма'], a_gens_d: 'Имейте {v} зданий одновременно',
    st_play: 'Время в игре', st_run: 'Текущий забег', st_total: 'Заработано всего', st_runEarned: 'Заработано в забеге',
    st_pps: 'Доход в секунду', st_mult: 'Множитель престижа', st_taps: 'Тапов', st_golden: 'Золотых слизней',
    st_buys: 'Куплено зданий', st_rebirths: 'Перерождений (всего)', st_asc: 'Вознесений (всего)', st_awak: 'Пробуждений',
    st_mut: 'Мутагена в этом вознесении', st_moon: 'Лунных камней получено', st_runes: 'Рун получено', st_ach: 'Достижений',
    st_combo: 'Макс. комбо', st_streak: 'Серия входов',
    sound: 'Звуки', music: 'Музыка', language: 'Язык', on: 'Вкл', off: 'Выкл',
    reset: 'Сбросить прогресс', reset_q: 'Точно удалить весь прогресс? Это нельзя отменить!', reset_q2: 'Совсем-совсем точно? Монстры будут грустить 😢',
    reset_done: 'Прогресс сброшен', yes: 'Да', no: 'Нет', cancel: 'Отмена', ok: 'Ок', close: 'Закрыть', open_settings: 'Настройки',
    ads_title: 'Бонусы', ads_intro: 'Посмотрите рекламу по желанию — монстры скажут спасибо!',
    ad_boost: 'x2 доход на {h} ч', ad_boost_desc: 'Время суммируется (до {m} ч)', ad_instant: 'Мгновенная награда',
    ad_instant_desc: 'Доход за {m} минут: {v}', ad_summon: 'Позвать золотого слизня', ad_summon_desc: 'Появится прямо сейчас',
    ad_watch: '▶ Смотреть', ad_cd: 'через {t}', ad_unavailable: 'Реклама сейчас недоступна. Попробуйте чуть позже 🙏',
    ad_no_reward: 'Награда выдаётся только за полный просмотр', ad_thanks: 'Спасибо! Награда получена 🎉',
    boost_left: 'x2 ещё {t}',
    off_title: 'Пока вас не было', off_text: 'Монстры трудились {t} и накопили:', off_claim: 'Забрать', off_claim2: '▶ Забрать x2',
    off_cap: 'Лимит оффлайна: {h} ч · эффективность {p}%',
    gold_frenzy: 'Безумие! Доход x{m} на {s} сек', gold_instant: 'Золотая слизь! +{v}', gold_missed: 'Золотой слизень убежал!',
    gold_restore: '▶ Вернуть', frenzy: 'x{m} {t}',
    combo: 'Комбо x{v}', combo_max: 'МАКС!',
    tut_tap: '👆 Тапайте по монстру, чтобы собирать слизь!',
    tut_buy: '🐛 Купите Слизевика — он будет давать слизь сам!',
    tut_more: '📈 Покупайте здания и апгрейды!',
    tips: [
      'Совет: быстрые тапы разгоняют комбо до x2 и выше.',
      'Совет: ловите золотых слизней — они дают безумный доход!',
      'Совет: улучшения зданий открываются на 10, 25, 50, 100, 200 и 400 шт.',
      'Совет: помощники сами покупают здания, пока вы отдыхаете.',
      'Совет: перерождение даёт мутаген — постоянный бонус к доходу.',
      'Совет: загляните в «Задачи» — там награды каждый день.',
      'Совет: даже без вас монстры работают — до {h} ч оффлайна.',
      'Совет: режим «Макс» покупает столько зданий, сколько хватит слизи.',
    ],
    saved: 'Сохранено',
    sdk_local: 'Локальный режим',
  },
  en: {
    title: 'Monster Ranch',
    subtitle: 'Raise monsters — harvest goo!',
    loading: 'Feeding the monsters…',
    suffixes: ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'],
    t_d: 'd', t_h: 'h', t_m: 'm', t_s: 's',
    per_sec: '{v}/sec',
    cur_money: 'Goo', cur_mut: 'Mutagen', cur_moon: 'Moonstones', cur_rune: 'Runes',
    tab_farm: 'Ranch', tab_upg: 'Upgrade', tab_mgr: 'Hire', tab_prest: 'Prestige', tab_tasks: 'Tasks', tab_more: 'More',
    buy: 'Buy', max: 'Max', owned: 'pcs',
    next_tier: 'x{m} at {n}', all_tiers: 'All upgrades bought',
    locked_gen: '???', locked_hint: 'New monster! Cost: {v}',
    not_enough: 'Not enough goo 💧',
    g_names: ['Goo Worm', 'Shroom Goblin', 'Bat Coop', 'Toadzilla', 'Spider Loom', 'Ghost Dairy', 'Tentacle Garden', 'Zombie Orchard', 'Dino Ranch', 'Dragon Hatchery', 'Ogre Mill', 'Kraken Tank', 'Alien Barn', 'Lava Forge', 'Void Leviathan'],
    g_descs: [
      'Crawls, squelches, makes goo. Employee of the month.',
      'Grows mushrooms on its own head. Saves on garden beds.',
      'Bats lay eggs upside down.',
      'Croaks so loud the goo just leaks out.',
      'Knits goo sweaters. Stylish and sticky.',
      'Spectral cows give ectoplasmic milk.',
      'Eight arms, eight garden beds.',
      'Will work for brains. The union is concerned.',
      'Extinct? Only on weekends.',
      'Free egg heating. Fire insurance not included.',
      'They grind everything. Mostly goo.',
      'Feeding time requires a ship.',
      'They abduct cows and return them gooey.',
      'Golems forge goo at 3000°C.',
      'Eats stars, excretes goo. Circle of life.',
    ],
    tiers: ['Vitamins', 'Cozy Beds', 'Monster Yoga', 'Gene Magic', 'Moon Feed', 'Cosmic DNA'],
    gu_name: '{tier}: {g}', gu_desc: '{g} produce x{m}',
    glob_names: ['Monster Fertilizer', 'Swamp Diet', 'Monster Lullabies', 'Goo Magnet', 'Full Moon Shift', 'UFO Delivery', 'Gene Smoothie', 'Alchemy Cauldron', 'Crystal Ball', 'Swamp Portal', 'Meteor Shower', 'Interplanetary Ranch'],
    glob_desc: 'All income x{m}',
    click_names: ['Pointy Finger', 'Farmer Glove', 'Buff Tap', 'Zeal Zap', 'Goo Hammer', 'Robo Arm', 'Thunder Poke', 'High Five of Power', 'Combo Boom', 'Magic Wand'],
    click_mult: 'Tap power x{v}', click_pct: 'Tap: +{v}% of income/sec', click_combo: 'Max combo +x{v}',
    upg_empty: 'No upgrades yet — save up some goo!', upg_buy_all: 'Buy all affordable', upg_next: 'Soon: {name} — {v}',
    sec_click: 'Taps', sec_global: 'Global', sec_gen: 'Buildings',
    mgr_title: 'Manager: {g}', mgr_desc: 'Buys this building whenever you have enough goo',
    mgr_hire: 'Hire', mgr_on: 'ON', mgr_off: 'OFF', mgr_locked: 'Unlocks after buying the building',
    ac_title: 'Auto-tapper', ac_desc: '{r} taps/sec without lifting a finger', ac_max: 'Maxed', ac_lvl: 'Lv. {n}', ac_upgrade: 'Upgrade',
    mgr_intro: 'Hire helpers and the ranch will run itself.',
    rb_title: 'Rebirth', rb_desc: 'Reset the ranch to get Mutagen 🧪. Each point permanently gives +{p}% income.',
    rb_gain: 'You get: {v} 🧪', rb_btn: 'Rebirth', rb_need: 'Earn {v} goo this run',
    rb_next: 'Next point in: {v}', bonus: 'Bonus: x{v} income', have: 'Have: {v}', total_got: 'Total earned: {v}',
    rb_confirm: 'Your ranch, buildings and upgrades will be reset. You will get {v} 🧪 mutagen. Continue?',
    asc_title: 'Ascension', asc_desc: 'Resets rebirths and the Mutation Tree. Grants Moonstones 🌙: +{p}% income each.',
    asc_gain: 'You get: {v} 🌙', asc_btn: 'Ascend', asc_need: 'Rebirths needed: {n}/{m}', asc_need2: 'Need more mutagen: {v}',
    asc_confirm: 'Mutagen, the Mutation Tree and rebirths will be reset. You will get {v} 🌙. Continue?',
    aw_title: 'Awakening of the Ancients', aw_desc: 'Resets everything except runes and achievements. Runes 🔮: +{p}% income each.',
    aw_gain: 'You get: {v} 🔮', aw_btn: 'Awaken', aw_need: 'Ascensions needed: {n}/{m}', aw_need2: 'Need more moonstones: {v}',
    aw_confirm: 'Everything except runes and achievements will be reset. You will get {v} 🔮. Continue?',
    locked: 'Locked', tree_btn: 'Tree',
    tree1_title: 'Mutation Tree 🧪', tree2_title: 'Moon Tree 🌙', tree3_title: 'Ancient Runes 🔮',
    node_owned: 'Learned ✔', node_locked: 'Learn the connected nodes first', node_buy: 'Learn',
    node_tap: 'Tap a node to see details',
    n: {
      root: 'Mutant Heart', t1: 'Grippy Fingers', t2: 'Power Tap', t3: 'Nervous Twitch', t4: 'Robo-Tapper', t5: 'Giant Fist', t6: 'Bionic Arm',
      p1: 'Fertile Goo', p2: 'Monster Daycare', p3: 'Swamp Boom', p4: 'Ghost Factory', p5: 'Gigantomania', p6: 'Mutagen Concentrate', p7: 'Tree of Life', p8: 'Mutation Burst',
      u1: 'Sleepy Potion', u2: 'Golden Bait', u3: 'Inheritance', u4: 'Loyal Helpers', u5: 'Golden Frenzy', u6: 'Sleepwalking', u7: 'Bulk Prices', u8: 'Hall of Fame', cap: 'Monster King',
      m_root: 'Moonlight', m_mut: 'Lunar Mutation', m_off: 'Long Nap', m_click: 'Moon Tap', m_start: 'Mutagen Backpack', m_gold: 'Golden Moon', m_auto: 'Hiring Agency',
      m_upg: 'Scroll of Discounts', m_moonB: 'Moon Phases', m_cost: 'Lunar Market', m_prod: 'Starfall', m_moonG: 'Moon Mine', m_cap: 'Galactic Ranch',
      r_root: 'Rune of Power', r_mut: 'Rune of Mutation', r_moon: 'Rune of the Moon', r_off: 'Rune of Time', r_keep: 'Rune of Memory', r_click: 'Rune of Touch', r_prod: 'Rune of Plenty', r_rune: 'Rune of Runes',
    },
    e_prod: 'All income x{v}', e_click: 'Tap power x{v}', e_tapPct: 'Tap: +{v}% of income/sec', e_comboMax: 'Max combo +x{v}',
    e_autoClick: 'Auto-tapper: +{v} free levels', e_genRange: 'Buildings {a}–{b}: x{v}', e_mutBonus: 'Each mutagen: extra +{v}% income',
    e_mutGain: 'Mutagen gain x{v}', e_offlineCap: 'Offline limit +{v} h', e_goldenFreq: 'Golden slimes {v}% more often',
    e_startMoney: 'Start each run with {v} goo', e_keepManagers: 'Helpers stay after rebirth', e_goldenPow: 'Stronger frenzy: +x{v}',
    e_offlineEff: 'Offline income +{v}%', e_costMult: 'Buildings {v}% cheaper', e_achBonus: 'Achievement bonus x{v}',
    e_startMutagen: 'After ascension: +{v} mutagen', e_freeManagers: 'All managers hired from the start', e_upgCost: 'Upgrades {v}% cheaper',
    e_moonBonus: 'Each moonstone: extra +{v}% income', e_moonGain: 'Moonstone gain x{v}', e_keepTree1: 'Mutation Tree is kept on ascension',
    e_runeGain: 'Rune gain x{v}', e_goldenDur: 'Frenzy lasts x{v} longer',
    daily_title: 'Daily tasks', weekly_title: 'Weekly challenge', login_title: 'Daily bonus',
    claim: 'Claim', claimed: 'Claimed ✔', day_n: 'Day {n}', login_text: 'Come back every day — the reward grows!',
    login_come_back: 'Come back tomorrow for day {n}!', reward: 'Reward: {v}',
    task_tap: 'Tap {n} times', task_buy: 'Buy {n} buildings', task_golden: 'Catch {n} golden slimes',
    task_upgrade: 'Buy {n} upgrades', task_earn: 'Earn {v} goo', task_combo: 'Max out your combo {n} times',
    task_rebirth: 'Rebirth {n} times',
    extra_slot: 'One more task', extra_slot_desc: 'An extra daily task for watching an ad',
    time_left: 'Time left: {t}', weekly_reward: 'x2 income for {h} h + {v}', new_tasks_in: 'New tasks in {t}',
    ach_title: 'Achievements', stats_title: 'Statistics', settings_title: 'Settings',
    ach_progress: '{n} of {m} unlocked · +{p}% income', ach_unlocked: 'Achievement!',
    a_first: '{g} moves in', a_first_d: 'Buy your first {g}',
    a_own50: 'Herd: {g}', a_own50_d: 'Own 50 × {g}',
    a_earn: ['First Puddle', 'Gooey Million', 'Billion Drops', 'Trillion Swamp', 'Quadrillion Bloops', 'Ocean of Goo', 'Goo Galaxy', 'The Universe Squelches'],
    a_earn_d: 'Earn {v} goo in total',
    a_taps: ['Tap-tap', 'Lightning Finger', 'Tireless Tapper'], a_taps_d: 'Tap {v} times',
    a_gold: ['Gold Rush', 'Luck Catcher', 'Golden Tycoon'], a_gold_d: 'Catch {v} golden slimes',
    a_combo: 'Combo Maniac', a_combo_d: 'Max out your combo',
    a_rb: ['New Life', 'Seasoned Mutant', 'Immortal Goo'], a_rb_d: 'Rebirth {v} times',
    a_asc: ['To the Stars', 'Moon Farmer'], a_asc_d: 'Ascend {v} times',
    a_aw: 'The Ancient Awakens', a_aw_d: 'Awaken the Ancients',
    a_streak: 'Loyal Farmer', a_streak_d: 'Log in 7 days in a row',
    a_upg: ['Upgrade Enthusiast', 'Mad Scientist'], a_upg_d: 'Buy {v} upgrades',
    a_gens: ['Growing Ranch', 'Monstropolis', 'Mega Ranch'], a_gens_d: 'Own {v} buildings at once',
    st_play: 'Time played', st_run: 'Current run', st_total: 'Total earned', st_runEarned: 'Earned this run',
    st_pps: 'Income per second', st_mult: 'Prestige multiplier', st_taps: 'Taps', st_golden: 'Golden slimes',
    st_buys: 'Buildings bought', st_rebirths: 'Rebirths (total)', st_asc: 'Ascensions (total)', st_awak: 'Awakenings',
    st_mut: 'Mutagen this ascension', st_moon: 'Moonstones earned', st_runes: 'Runes earned', st_ach: 'Achievements',
    st_combo: 'Max combo', st_streak: 'Login streak',
    sound: 'Sounds', music: 'Music', language: 'Language', on: 'On', off: 'Off',
    reset: 'Reset progress', reset_q: 'Delete all progress? This cannot be undone!', reset_q2: 'Really, really sure? The monsters will be sad 😢',
    reset_done: 'Progress reset', yes: 'Yes', no: 'No', cancel: 'Cancel', ok: 'OK', close: 'Close', open_settings: 'Settings',
    ads_title: 'Bonuses', ads_intro: 'Watch an ad if you like — the monsters will thank you!',
    ad_boost: 'x2 income for {h} h', ad_boost_desc: 'Time stacks (up to {m} h)', ad_instant: 'Instant reward',
    ad_instant_desc: '{m} minutes of income: {v}', ad_summon: 'Summon a golden slime', ad_summon_desc: 'It appears right now',
    ad_watch: '▶ Watch', ad_cd: 'in {t}', ad_unavailable: 'Ads are unavailable right now. Please try again later 🙏',
    ad_no_reward: 'The reward is given only for a full view', ad_thanks: 'Thanks! Reward received 🎉',
    boost_left: 'x2 for {t}',
    off_title: 'While you were away', off_text: 'Your monsters worked for {t} and collected:', off_claim: 'Claim', off_claim2: '▶ Claim x2',
    off_cap: 'Offline limit: {h} h · efficiency {p}%',
    gold_frenzy: 'Frenzy! Income x{m} for {s} sec', gold_instant: 'Golden goo! +{v}', gold_missed: 'The golden slime ran away!',
    gold_restore: '▶ Bring back', frenzy: 'x{m} {t}',
    combo: 'Combo x{v}', combo_max: 'MAX!',
    tut_tap: '👆 Tap the monster to collect goo!',
    tut_buy: '🐛 Buy a Goo Worm — it makes goo on its own!',
    tut_more: '📈 Buy more buildings and upgrades!',
    tips: [
      'Tip: fast taps build a combo up to x2 and beyond.',
      'Tip: catch golden slimes for a frenzy of income!',
      'Tip: building upgrades unlock at 10, 25, 50, 100, 200 and 400.',
      'Tip: helpers buy buildings while you rest.',
      'Tip: rebirth grants mutagen — a permanent income bonus.',
      'Tip: check Tasks for daily rewards.',
      'Tip: monsters work while you are away — up to {h} h offline.',
      'Tip: Max mode buys as many buildings as you can afford.',
    ],
    saved: 'Saved',
    sdk_local: 'Local mode',
  },
};

const I18n = {
  lang: 'en',
  set(lang) { this.lang = I18N[lang] ? lang : 'en'; },
  // t('key', {param}) — подстановка параметров
  t(key, p) {
    const d = I18N[this.lang];
    let s = d[key];
    if (s === undefined) s = I18N.en[key];
    if (s === undefined) return key;
    if (typeof s !== 'string') return s;
    if (p) s = s.replace(/\{(\w+)\}/g, (m, k) => (p[k] !== undefined ? p[k] : m));
    return s;
  },
  arr(key, i) { const a = this.t(key); return Array.isArray(a) ? (a[i] !== undefined ? a[i] : '') : ''; },
  node(id) { const n = this.t('n'); return (n && n[id]) || id; },
};
const t = (k, p) => I18n.t(k, p);

// ===================== Форматирование =====================
const Fmt = {
  num(v, dec = 0) {
    const b = BN.from(v);
    if (b.m === 0) return '0';
    if (b.m < 0) return '-' + Fmt.num(b.neg(), dec);
    if (b.e < 3) {
      const n = b.toNumber();
      if (dec > 0 && n < 100) return (+n.toFixed(n < 10 ? dec : 1)).toString();
      return Math.floor(n + 1e-9).toString();
    }
    const suf = I18n.t('suffixes');
    const g = Math.floor(b.e / 3);
    if (g < suf.length) {
      const v2 = b.m * Math.pow(10, b.e - g * 3);
      const s = v2 < 10 ? v2.toFixed(2) : v2 < 100 ? v2.toFixed(1) : Math.floor(v2).toString();
      return s + ' ' + suf[g];
    }
    return b.m.toFixed(2) + 'e' + b.e; // научная запись
  },
  time(sec) {
    sec = Math.max(0, Math.floor(U.safeNum(sec)));
    const d = Math.floor(sec / 86400), h = Math.floor((sec % 86400) / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    if (d > 0) return `${d}${t('t_d')} ${h}${t('t_h')}`;
    if (h > 0) return `${h}${t('t_h')} ${m}${t('t_m')}`;
    if (m > 0) return `${m}${t('t_m')} ${s}${t('t_s')}`;
    return `${s}${t('t_s')}`;
  },
  pct(v) { return (+(v * 100).toFixed(1)).toString(); },
  mult(v) { const b = BN.from(v); return b.e < 3 ? (+b.toNumber().toFixed(2)).toString() : Fmt.num(b); },
};

// ===================== STATE: состояние игры =====================
const GEN_COUNT = CONFIG.generators.length;
function newState() {
  return {
    v: CONFIG.saveVersion,
    lastSave: Date.now(),
    money: BN.ZERO, runEarned: BN.ZERO, totalEarned: BN.ZERO,
    gens: new Array(GEN_COUNT).fill(0),
    genUpg: new Array(GEN_COUNT).fill(0),     // сколько уровней апгрейда куплено
    globalUpg: {}, clickUpg: {},
    managers: new Array(GEN_COUNT).fill(false),
    managerOn: new Array(GEN_COUNT).fill(true),
    autoClickLvl: 0,
    buyMode: 1,                                // 1 / 10 / 100 / 0 = Макс
    mutagen: BN.ZERO, mutagenTotal: BN.ZERO, rebirths: 0, tree1: {},
    moon: 0, moonTotal: 0, ascensions: 0, tree2: {},
    runes: 0, runesTotal: 0, awakenings: 0, tree3: {},
    ach: {},
    stats: { taps: 0, golden: 0, buys: 0, upgrades: 0, playTime: 0, runTime: 0, maxCombo: 1,
      rebirthsAll: 0, ascAll: 0, comboMaxed: 0, startedAt: Date.now() },
    boosts: { adUntil: 0, weeklyUntil: 0, frenzyLeft: 0, frenzyMult: 1 },
    adCd: { boost: 0, instant: 0, summon: 0, restore: 0 },
    daily: { day: -1, tasks: [], extra: false },
    weekly: { week: -1, type: '', target: 0, progress: 0, claimed: false },
    login: { last: -1, streak: 0 },
    settings: { sound: true, music: true, lang: '' },
    tutorial: { done: false, time: 0 },
    golden: { next: CONFIG.golden.firstSec },
  };
}
let S = newState();

// ===================== SAVE: сохранения, миграции, валидация =====================
const MIGRATIONS = {
  // v1 → v2: валюта хранилась числом; не было еженедельного испытания
  1: d => {
    ['money', 'runEarned', 'totalEarned'].forEach(k => { if (typeof d[k] === 'number') d[k] = String(d[k]); });
    if (!d.weekly) d.weekly = null;
    return d;
  },
};

// Слияние сохранения со структурой по умолчанию (защита от мусора)
function mergeDefaults(def, src) {
  if (def instanceof BN) {
    if (src === undefined || src === null) return def;
    const b = BN.from(src);
    return b.m >= 0 && Number.isFinite(b.e) ? b : def;
  }
  if (Array.isArray(def)) {
    if (!Array.isArray(src)) return def;
    if (def.length === 0) return src.filter(x => x && typeof x === 'object');
    return def.map((dv, i) => mergeDefaults(dv, src[i]));
  }
  if (typeof def === 'number') return typeof src === 'number' && Number.isFinite(src) ? src : def;
  if (typeof def === 'boolean') return typeof src === 'boolean' ? src : def;
  if (typeof def === 'string') return typeof src === 'string' ? src.slice(0, 64) : def;
  if (def && typeof def === 'object') {
    if (!src || typeof src !== 'object' || Array.isArray(src)) return def;
    const keys = Object.keys(def);
    if (keys.length === 0) { // словарь id → true
      const o = {};
      for (const k of Object.keys(src)) if (src[k] === true) o[k] = true;
      return o;
    }
    const o = {};
    for (const k of keys) o[k] = mergeDefaults(def[k], src[k]);
    return o;
  }
  return def;
}

function sanitizeTask(x) {
  if (!x || typeof x.type !== 'string') return null;
  const tpl = CONFIG.daily.templates.concat(CONFIG.weekly.templates).find(tp => tp.type === x.type);
  if (!tpl) return null;
  if (x.type === 'earn') {
    return { type: 'earn', target: BN.from(x.target).toString(), progress: BN.from(x.progress).toString(), claimed: !!x.claimed };
  }
  return { type: x.type, target: Math.max(1, Math.floor(U.safeNum(x.target, 1))),
    progress: Math.max(0, U.safeNum(x.progress, 0)), claimed: !!x.claimed };
}

function sanitizeState(s) {
  s.gens = s.gens.map(v => U.clamp(Math.floor(v), 0, 1e7));
  s.genUpg = s.genUpg.map(v => U.clamp(Math.floor(v), 0, CONFIG.genUpgrades.thresholds.length));
  s.autoClickLvl = U.clamp(Math.floor(s.autoClickLvl), 0, CONFIG.autoClick.rates.length - 1);
  if (![0, 1, 10, 100].includes(s.buyMode)) s.buyMode = 1;
  ['moon', 'moonTotal', 'runes', 'runesTotal', 'rebirths', 'ascensions', 'awakenings'].forEach(k => {
    s[k] = U.clamp(Math.floor(s[k]), 0, 1e300);
  });
  s.daily.tasks = s.daily.tasks.slice(0, CONFIG.daily.count + 1).map(sanitizeTask).filter(Boolean);
  if (s.weekly.type && !CONFIG.weekly.templates.some(tp => tp.type === s.weekly.type)) s.weekly.week = -1;
  if (s.settings.lang && !I18N[s.settings.lang]) s.settings.lang = '';
  // удаляем узлы, которых нет в конфиге
  [['tree1', CONFIG.tree1], ['tree2', CONFIG.tree2], ['tree3', CONFIG.tree3]].forEach(([k, tree]) => {
    for (const id of Object.keys(s[k])) if (!tree.some(n => n.id === id)) delete s[k][id];
  });
  s.golden.next = U.clamp(s.golden.next, 1, CONFIG.golden.maxSec * 2);
  s.boosts.frenzyLeft = U.clamp(s.boosts.frenzyLeft, 0, 600);
  s.v = CONFIG.saveVersion;
  return s;
}

const Save = {
  lastCloud: 0,
  serialize() {
    S.lastSave = Date.now();
    return JSON.stringify({ v: CONFIG.saveVersion, t: S.lastSave, d: S });
  },
  parse(str) {
    try {
      if (typeof str !== 'string' || str.length < 10) return null;
      const o = JSON.parse(str);
      if (!o || typeof o !== 'object' || !o.d || typeof o.d !== 'object') return null;
      let d = o.d, v = Math.floor(U.safeNum(o.v, 1));
      while (v < CONFIG.saveVersion) { const fn = MIGRATIONS[v]; if (fn) d = fn(d) || d; v++; }
      return { t: U.safeNum(o.t, 0), d: sanitizeState(mergeDefaults(newState(), d)) };
    } catch (e) { return null; }
  },
  async save(forceCloud = false) {
    const str = this.serialize();
    const now = Date.now();
    const cloud = forceCloud || now - this.lastCloud >= CONFIG.cloudMinSec * 1000;
    if (cloud) this.lastCloud = now;
    await Platform.save(str, cloud);
  },
  async load() {
    const list = await Platform.load();
    let best = null;
    for (const s of list) {
      const p = this.parse(s);
      if (p && (!best || p.t > best.t)) best = p; // берём самое свежее
    }
    return best ? best.d : null;
  },
};

// ===================== PLATFORM: Яндекс SDK + заглушка =====================
const RU_LANGS = ['ru', 'be', 'kk', 'uk', 'uz'];
function langFrom(code) {
  const l = String(code || 'en').slice(0, 2).toLowerCase();
  return RU_LANGS.includes(l) ? 'ru' : 'en';
}

// Заглушка для локальной отладки (без SDK)
const StubPlatform = {
  name: 'local',
  async init() {},
  getLang() { return langFrom(typeof navigator !== 'undefined' ? navigator.language : 'en'); },
  ready() {}, gameplayStart() {}, gameplayStop() {},
  showRewarded(cb) {
    cb.onOpen();
    UI.fakeAd(1200, () => { cb.onRewarded(); cb.onClose(); });
  },
  showInterstitial(cb) {
    cb.onOpen();
    UI.fakeAd(700, () => cb.onClose());
  },
  async save(str) { try { localStorage.setItem(CONFIG.saveKey, str); } catch (e) { /* приватный режим */ } },
  async load() {
    try { const s = localStorage.getItem(CONFIG.saveKey); return s ? [s] : []; } catch (e) { return []; }
  },
};

// Реализация для Яндекс Игр
const YandexPlatform = {
  name: 'yandex', ysdk: null, player: null,
  async init() {
    this.ysdk = await YaGames.init();
    try { this.player = await this.ysdk.getPlayer({ scopes: false }); } catch (e) { this.player = null; }
    try {
      this.ysdk.on('game_api_pause', () => Game.setPause('sdk', true));
      this.ysdk.on('game_api_resume', () => Game.setPause('sdk', false));
    } catch (e) { /* старые версии SDK */ }
  },
  getLang() {
    try { return langFrom(this.ysdk.environment.i18n.lang); } catch (e) { return StubPlatform.getLang(); }
  },
  ready() { this.ysdk.features.LoadingAPI.ready(); },
  gameplayStart() { this.ysdk.features.GameplayAPI.start(); },
  gameplayStop() { this.ysdk.features.GameplayAPI.stop(); },
  showRewarded(cb) {
    this.ysdk.adv.showRewardedVideo({ callbacks: {
      onOpen: () => cb.onOpen(),
      onRewarded: () => cb.onRewarded(),
      onClose: () => cb.onClose(),
      onError: e => cb.onError(e),
    } });
  },
  showInterstitial(cb) {
    this.ysdk.adv.showFullscreenAdv({ callbacks: {
      onOpen: () => cb.onOpen(),
      onClose: () => cb.onClose(),
      onError: e => cb.onError(e),
      onOffline: () => cb.onError('offline'),
    } });
  },
  async save(str, cloud) {
    await StubPlatform.save(str);
    if (cloud && this.player) await this.player.setData({ save: str }, false);
  },
  async load() {
    const list = await StubPlatform.load();
    if (this.player) {
      try {
        const d = await this.player.getData(['save']);
        if (d && typeof d.save === 'string') list.push(d.save);
      } catch (e) { /* облако недоступно — берём локальное */ }
    }
    return list;
  },
};

// Единый фасад: все вызовы защищены try/catch
const Platform = {
  impl: StubPlatform, readyCalled: false, playing: false,
  async init() {
    try {
      if (typeof YaGames !== 'undefined' && YaGames && typeof YaGames.init === 'function') {
        await Promise.race([
          YandexPlatform.init(),
          new Promise((_, rej) => setTimeout(() => rej(new Error('sdk timeout')), 8000)),
        ]);
        this.impl = YandexPlatform;
      }
    } catch (e) { this.impl = StubPlatform; }
  },
  get isYandex() { return this.impl === YandexPlatform; },
  getLang() { try { return this.impl.getLang(); } catch (e) { return 'en'; } },
  // LoadingAPI.ready — строго один раз
  ready() {
    if (this.readyCalled) return;
    this.readyCalled = true;
    try { this.impl.ready(); } catch (e) { /* нет LoadingAPI */ }
  },
  gameplayStart() {
    if (this.playing) return;
    this.playing = true;
    try { this.impl.gameplayStart(); } catch (e) { /* нет GameplayAPI */ }
  },
  gameplayStop() {
    if (!this.playing) return;
    this.playing = false;
    try { this.impl.gameplayStop(); } catch (e) { /* нет GameplayAPI */ }
  },
  // cb: {onOpen, onRewarded, onClose, onError} — каждый вызывается не более раза
  _wrap(cb) {
    const done = {};
    const once = (k, fn) => (...a) => { if (done[k]) return; done[k] = true; try { fn && fn(...a); } catch (e) { /* защищаем игру */ } };
    const w = { onOpen: once('open', cb.onOpen), onRewarded: once('rew', cb.onRewarded) };
    w.onClose = once('close', cb.onClose);
    w.onError = once('err', e => { if (!done.close) { done.close = true; cb.onError && cb.onError(e); } });
    return w;
  },
  showRewarded(cb) {
    const w = this._wrap(cb);
    try { this.impl.showRewarded(w); } catch (e) { w.onError(e); }
  },
  showInterstitial(cb) {
    const w = this._wrap(cb);
    try { this.impl.showInterstitial(w); } catch (e) { w.onError(e); }
  },
  async save(str, cloud) { try { await this.impl.save(str, cloud); } catch (e) { /* сохранение не критично */ } },
  async load() { try { return await this.impl.load(); } catch (e) { return []; } },
};

// ===================== PRESTIGE: три уровня престижа и деревья =====================
const TREES = { 1: CONFIG.tree1, 2: CONFIG.tree2, 3: CONFIG.tree3 };
const Prestige = {
  E: null, // агрегированные эффекты всех деревьев
  defaults() {
    return { prod: 1, click: 1, tapPct: 0, comboMax: 0, autoClick: 0, genMult: new Array(GEN_COUNT).fill(1),
      mutBonus: 0, mutGain: 1, offlineCap: 0, goldenFreq: 1, goldenDur: 1, goldenPow: 0, startMoney: 0,
      keepManagers: false, offlineEff: 0, costMult: 1, achBonus: 1, startMutagen: 0, freeManagers: false,
      upgCost: 1, moonBonus: 0, moonGain: 1, keepTree1: false, runeGain: 1 };
  },
  apply(E, f) {
    switch (f.t) {
      case 'prod': case 'click': case 'mutGain': case 'goldenFreq': case 'goldenDur': case 'costMult':
      case 'achBonus': case 'upgCost': case 'moonGain': case 'runeGain':
        E[f.t] *= f.v; break;
      case 'tapPct': case 'comboMax': case 'autoClick': case 'mutBonus': case 'offlineCap': case 'goldenPow':
      case 'offlineEff': case 'startMutagen': case 'moonBonus':
        E[f.t] += f.v; break;
      case 'startMoney': E.startMoney = Math.max(E.startMoney, f.v); break;
      case 'keepManagers': case 'freeManagers': case 'keepTree1': E[f.t] = true; break;
      case 'genRange': for (let i = f.a; i <= f.b && i < GEN_COUNT; i++) E.genMult[i] *= f.v; break;
      default: break;
    }
  },
  recalc() {
    const E = this.defaults();
    for (const k of [1, 2, 3]) {
      const owned = S['tree' + k];
      for (const node of TREES[k]) if (owned[node.id]) this.apply(E, node.eff);
    }
    this.E = E;
    if (typeof Economy !== 'undefined') Economy.invalidate();
  },
  balance(k) { return k === 1 ? S.mutagen : BN.from(k === 2 ? S.moon : S.runes); },
  nodeState(k, node) {
    const owned = S['tree' + k];
    if (owned[node.id]) return 'owned';
    if ((node.req || []).every(r => owned[r])) return 'available';
    return 'locked';
  },
  buyNode(k, id) {
    const node = TREES[k].find(n => n.id === id);
    if (!node || this.nodeState(k, node) !== 'available') return false;
    if (!this.balance(k).gte(node.cost)) return false;
    if (k === 1) S.mutagen = BN.max(BN.ZERO, S.mutagen.sub(node.cost));
    else if (k === 2) S.moon = Math.max(0, S.moon - node.cost);
    else S.runes = Math.max(0, S.runes - node.cost);
    S['tree' + k][id] = true;
    this.recalc();
    if (node.eff.t === 'freeManagers') S.managers = S.managers.map(() => true);
    return true;
  },
  // множители престижа
  mutMult() { return BN.ONE.add(S.mutagenTotal.mul(CONFIG.rebirth.bonusPerPoint + this.E.mutBonus)); },
  moonMult() { return 1 + S.moonTotal * (CONFIG.ascension.bonusPerPoint + this.E.moonBonus); },
  runeMult() { return 1 + S.runesTotal * CONFIG.awakening.bonusPerPoint; },
  // Перерождение: floor(sqrt(заработано / 1e12)) * множитель
  rebirthGain() { return S.runEarned.div(CONFIG.rebirth.divisor).sqrt().mul(this.E.mutGain).floor(); },
  rebirthNextAt() {
    const g = this.rebirthGain();
    return g.add(1).div(this.E.mutGain).pow(2).mul(CONFIG.rebirth.divisor);
  },
  // Вознесение/Пробуждение: логарифмическая формула, иначе рост уходит в бесконечность
  logGain(total, cfg, mult) {
    if (!(total >= cfg.need)) return 0;
    const base = Math.log10(total / cfg.need) + 1;
    return Math.floor(U.safeNum(Math.pow(base, cfg.power) * mult) + 1e-9);
  },
  logNeed(cur, cfg, mult) { // сколько нужно для следующей единицы
    const base = Math.pow((cur + 1) / mult, 1 / cfg.power);
    return cfg.need * Math.pow(10, Math.max(0, base - 1));
  },
  ascGain() {
    if (S.rebirths < CONFIG.ascension.minRebirths) return 0;
    return this.logGain(S.mutagenTotal.toNumber(), CONFIG.ascension, this.E.moonGain);
  },
  ascNeed() { return this.logNeed(this.logGain(S.mutagenTotal.toNumber(), CONFIG.ascension, this.E.moonGain), CONFIG.ascension, this.E.moonGain); },
  awGain() {
    if (S.ascensions < CONFIG.awakening.minAscensions) return 0;
    return this.logGain(S.moonTotal, CONFIG.awakening, this.E.runeGain);
  },
  awNeed() { return this.logNeed(this.logGain(S.moonTotal, CONFIG.awakening, this.E.runeGain), CONFIG.awakening, this.E.runeGain); },
  // сброс текущего забега
  resetRun() {
    const E = this.E;
    S.money = BN.from(E.startMoney);
    S.runEarned = BN.ZERO;
    S.gens = S.gens.map(() => 0);
    S.genUpg = S.genUpg.map(() => 0);
    S.globalUpg = {}; S.clickUpg = {};
    if (E.freeManagers) S.managers = S.managers.map(() => true);
    else if (!E.keepManagers) S.managers = S.managers.map(() => false);
    S.autoClickLvl = 0;
    S.boosts.frenzyLeft = 0;
    S.stats.runTime = 0;
    S.golden.next = CONFIG.golden.firstSec;
    Economy.combo = 0;
    Economy.invalidate();
  },
  doRebirth() {
    const gain = this.rebirthGain();
    if (gain.lt(1)) return null;
    S.mutagen = S.mutagen.add(gain);
    S.mutagenTotal = S.mutagenTotal.add(gain);
    S.rebirths++; S.stats.rebirthsAll++;
    Meta.track('rebirth', 1);
    this.resetRun();
    return gain;
  },
  doAscend() {
    const gain = this.ascGain();
    if (gain < 1) return 0;
    S.moon += gain; S.moonTotal += gain;
    S.ascensions++; S.stats.ascAll++;
    if (!this.E.keepTree1) S.tree1 = {};
    S.rebirths = 0;
    this.recalc();
    S.mutagen = BN.from(this.E.startMutagen);
    S.mutagenTotal = BN.from(this.E.startMutagen);
    this.resetRun();
    return gain;
  },
  doAwaken() {
    const gain = this.awGain();
    if (gain < 1) return 0;
    S.runes += gain; S.runesTotal += gain;
    S.awakenings++;
    S.moon = 0; S.moonTotal = 0; S.tree2 = {}; S.ascensions = 0;
    S.rebirths = 0;
    this.recalc();
    if (!this.E.keepTree1) S.tree1 = {};
    this.recalc();
    S.mutagen = BN.ZERO; S.mutagenTotal = BN.ZERO;
    this.resetRun();
    return gain;
  },
};

// ===================== ECONOMY: доход, цены, покупки =====================
const Economy = {
  dirty: true,
  combo: 0, lastTap: -10, atMax: false,
  c: { pm: BN.ONE, genProd: [], ppsBase: BN.ZERO, pps: BN.ZERO, tap: BN.ONE, temp: 1, comboMax: 1, sig: '' },
  invalidate() { this.dirty = true; },
  tierMult(i) {
    let m = 1;
    for (let k = 0; k < S.genUpg[i]; k++) m *= CONFIG.genUpgrades.mults[k];
    return m;
  },
  globalUpgMult() {
    let m = 1;
    for (const u of CONFIG.globalUpgrades) if (S.globalUpg[u.id]) m *= u.mult;
    return m;
  },
  clickStats() {
    const r = { mult: 1, pct: 0, combo: 0 };
    for (const u of CONFIG.clickUpgrades) {
      if (!S.clickUpg[u.id]) continue;
      if (u.type === 'mult') r.mult *= u.v; else if (u.type === 'pct') r.pct += u.v; else r.combo += u.v;
    }
    return r;
  },
  achCount() { return Object.keys(S.ach).length; },
  achMult() { return 1 + this.achCount() * CONFIG.achievementBonus * Prestige.E.achBonus; },
  prestigeMult() {
    return Prestige.mutMult().mul(Prestige.moonMult() * Prestige.runeMult() * this.achMult() * Prestige.E.prod);
  },
  tempSig(now) {
    const b = S.boosts;
    return (b.adUntil > now ? 'a' : '') + (b.weeklyUntil > now ? 'w' : '') + (b.frenzyLeft > 0 ? 'f' + b.frenzyMult : '');
  },
  tempMult(now) {
    const b = S.boosts;
    let m = 1;
    if (b.adUntil > now) m *= 2;
    if (b.weeklyUntil > now) m *= 2;
    if (b.frenzyLeft > 0) m *= b.frenzyMult;
    return m;
  },
  recalc() {
    const E = Prestige.E, now = Date.now(), c = this.c;
    c.pm = this.prestigeMult();
    const gm = c.pm.mul(this.globalUpgMult());
    let sum = BN.ZERO;
    CONFIG.generators.forEach((g, i) => {
      const p = BN.from(g.prod * S.gens[i] * this.tierMult(i) * E.genMult[i]).mul(gm);
      c.genProd[i] = p;
      sum = sum.add(p);
    });
    c.ppsBase = sum;
    c.temp = this.tempMult(now);
    c.pps = sum.mul(c.temp);
    const cs = this.clickStats();
    c.tapBase = BN.from(CONFIG.tap.base * cs.mult * E.click).mul(c.pm).add(sum.mul(cs.pct + E.tapPct));
    c.tap = c.tapBase.mul(c.temp);
    c.tapPct = cs.pct + E.tapPct;
    c.comboMax = CONFIG.tap.comboMax + cs.combo + E.comboMax;
    c.sig = this.tempSig(now);
    this.dirty = false;
  },
  get() {
    if (!this.dirty && this.c.sig !== this.tempSig(Date.now())) this.dirty = true;
    if (this.dirty) this.recalc();
    return this.c;
  },
  // --- цены зданий ---
  unitCost(i, owned) {
    const g = CONFIG.generators[i];
    return BN.fromLog10(owned * Math.log10(g.growth)).mul(g.base * Prestige.E.costMult);
  },
  costN(i, n) {
    const r = CONFIG.generators[i].growth;
    const geo = BN.fromLog10(n * Math.log10(r)).sub(1).div(r - 1); // (r^n - 1)/(r - 1)
    return this.unitCost(i, S.gens[i]).mul(geo);
  },
  maxAffordable(i) {
    const c1 = this.unitCost(i, S.gens[i]);
    if (S.money.lt(c1)) return 0;
    const r = CONFIG.generators[i].growth;
    const x = S.money.div(c1).mul(r - 1).add(1);
    let n = Math.max(1, Math.floor(x.log10() / Math.log10(r)));
    n = Math.min(n, 1e6);
    for (let k = 0; k < 5 && n > 1 && this.costN(i, n).gt(S.money); k++) n--;
    return n;
  },
  buyCount(i) { return S.buyMode === 0 ? Math.max(1, this.maxAffordable(i)) : S.buyMode; },
  spend(cost) {
    if (S.money.lt(cost)) return false;
    S.money = S.money.sub(cost);
    if (S.money.m < 0) S.money = BN.ZERO;
    return true;
  },
  buyGen(i, n) {
    if (!(n >= 1)) return false;
    if (!this.spend(this.costN(i, n))) return false;
    S.gens[i] += n;
    S.stats.buys += n;
    Meta.track('buy', n);
    this.invalidate();
    return true;
  },
  // --- улучшения ---
  genUpgCost(i, tier) {
    const th = CONFIG.genUpgrades.thresholds[tier];
    return this.unitCost(i, th).mul(CONFIG.genUpgrades.costFactor * Prestige.E.upgCost);
  },
  upgradeList() {
    const L = [], frac = CONFIG.upgradeRevealFrac, up = Prestige.E.upgCost;
    CONFIG.generators.forEach((g, i) => {
      const tier = S.genUpg[i];
      if (tier < CONFIG.genUpgrades.thresholds.length && S.gens[i] >= CONFIG.genUpgrades.thresholds[tier]) {
        L.push({ kind: 'gen', key: 'gen' + i + '_' + tier, i, tier, icon: g.icon, cost: this.genUpgCost(i, tier) });
      }
    });
    CONFIG.globalUpgrades.forEach((u, idx) => {
      if (S.globalUpg[u.id]) return;
      const cost = BN.from(u.cost * up);
      if (S.runEarned.gte(cost.mul(frac))) L.push({ kind: 'global', key: u.id, idx, u, icon: u.icon, cost });
    });
    CONFIG.clickUpgrades.forEach((u, idx) => {
      if (S.clickUpg[u.id]) return;
      const cost = BN.from(u.cost * up);
      if (S.runEarned.gte(cost.mul(frac))) L.push({ kind: 'click', key: u.id, idx, u, icon: u.icon, cost });
    });
    L.sort((a, b) => a.cost.cmp(b.cost));
    return L;
  },
  nextHiddenUpgrade() {
    const up = Prestige.E.upgCost, frac = CONFIG.upgradeRevealFrac;
    let best = null;
    const consider = (u, kind, idx) => {
      const cost = BN.from(u.cost * up);
      if (S.runEarned.gte(cost.mul(frac))) return;
      if (!best || cost.lt(best.cost)) best = { kind, idx, u, cost };
    };
    CONFIG.globalUpgrades.forEach((u, i) => { if (!S.globalUpg[u.id]) consider(u, 'global', i); });
    CONFIG.clickUpgrades.forEach((u, i) => { if (!S.clickUpg[u.id]) consider(u, 'click', i); });
    return best;
  },
  buyUpgrade(item) {
    if (!this.spend(item.cost)) return false;
    if (item.kind === 'gen') S.genUpg[item.i] = item.tier + 1;
    else if (item.kind === 'global') S.globalUpg[item.u.id] = true;
    else S.clickUpg[item.u.id] = true;
    S.stats.upgrades++;
    Meta.track('upgrade', 1);
    this.invalidate();
    return true;
  },
  // --- помощники ---
  autoClickLevel() { return Math.min(CONFIG.autoClick.rates.length - 1, S.autoClickLvl + Prestige.E.autoClick); },
  autoClickRate() { return CONFIG.autoClick.rates[this.autoClickLevel()]; },
  autoClickCost() { return BN.from(CONFIG.autoClick.costBase).mul(BN.from(CONFIG.autoClick.costGrowth).pow(S.autoClickLvl)); },
  buyAutoClick() {
    if (this.autoClickLevel() >= CONFIG.autoClick.rates.length - 1) return false;
    if (!this.spend(this.autoClickCost())) return false;
    S.autoClickLvl++;
    return true;
  },
  managerCost(i) { return BN.from(CONFIG.generators[i].base * CONFIG.managers.costMult * Prestige.E.costMult); },
  hireManager(i) {
    if (S.managers[i] || !this.spend(this.managerCost(i))) return false;
    S.managers[i] = true; S.managerOn[i] = true;
    return true;
  },
  runManagers() {
    let bought = 0;
    for (let i = GEN_COUNT - 1; i >= 0; i--) { // дорогие — в приоритете
      if (!S.managers[i] || !S.managerOn[i]) continue;
      let k = 0;
      while (k < CONFIG.managers.maxPerTick && this.buyGen(i, 1)) { k++; bought++; }
    }
    return bought;
  },
  // --- доход ---
  earn(v) {
    v = BN.from(v);
    if (!(v.m > 0)) return;
    S.money = S.money.add(v);
    S.runEarned = S.runEarned.add(v);
    S.totalEarned = S.totalEarned.add(v);
    Meta.trackEarn(v);
  },
  comboMult() { return 1 + Math.min(this.combo * CONFIG.tap.comboStep, this.get().comboMax); },
  tap(nowSec) {
    if (nowSec - this.lastTap <= CONFIG.tap.comboWindow) this.combo++;
    this.lastTap = nowSec;
    const c = this.get();
    const mult = this.comboMult();
    const val = c.tap.mul(mult);
    this.earn(val);
    S.stats.taps++;
    if (mult > S.stats.maxCombo) S.stats.maxCombo = mult;
    const isMax = mult >= 1 + c.comboMax - 1e-9;
    if (isMax && !this.atMax) { S.stats.comboMaxed++; Meta.track('combo', 1); }
    this.atMax = isMax;
    Meta.track('tap', 1);
    return { val, mult, isMax };
  },
  update(dt, nowSec) {
    if (nowSec - this.lastTap > CONFIG.tap.comboWindow && this.combo > 0) {
      this.combo = Math.max(0, this.combo - CONFIG.tap.comboDrain * dt);
      if (this.atMax && this.comboMult() < 1 + this.get().comboMax - 1e-9) this.atMax = false;
    }
    if (S.boosts.frenzyLeft > 0) S.boosts.frenzyLeft = Math.max(0, S.boosts.frenzyLeft - dt);
    const c = this.get();
    if (c.pps.m > 0) this.earn(c.pps.mul(dt));
  },
  // --- оффлайн ---
  offlineCapSec() { return (CONFIG.offline.capHours + Prestige.E.offlineCap) * 3600; },
  offlineEff() { return Math.min(CONFIG.offline.maxEff, CONFIG.offline.efficiency + Prestige.E.offlineEff); },
  offlineGain(sec) {
    const s = Math.min(Math.max(0, sec), this.offlineCapSec());
    return this.get().ppsBase.mul(s * this.offlineEff());
  },
  // награда «доход за N минут» без временных бустов
  incomeFor(minutes, minMoney) { return BN.max(minMoney, this.get().ppsBase.mul(minutes * 60)).floor(); },
};

// ===================== META: достижения, задания, вход =====================
const gname = i => I18n.arr('g_names', i);
const Meta = {
  list: [],
  build() {
    const A = [];
    const add = (id, icon, name, desc, check) => A.push({ id, icon, name, desc, check });
    CONFIG.generators.forEach((g, i) => add('first_' + i, g.icon, () => t('a_first', { g: gname(i) }), () => t('a_first_d', { g: gname(i) }), () => S.gens[i] >= 1));
    for (let i = 0; i < 10; i++) {
      const g = CONFIG.generators[i];
      add('own50_' + i, g.icon, () => t('a_own50', { g: gname(i) }), () => t('a_own50_d', { g: gname(i) }), () => S.gens[i] >= 50);
    }
    [1e3, 1e6, 1e9, 1e12, 1e15, 1e18, 1e24, 1e30].forEach((v, k) =>
      add('earn_' + k, '💧', () => I18n.arr('a_earn', k), () => t('a_earn_d', { v: Fmt.num(v) }), () => S.totalEarned.gte(v)));
    [100, 1000, 10000].forEach((v, k) => add('taps_' + k, '👆', () => I18n.arr('a_taps', k), () => t('a_taps_d', { v: Fmt.num(v) }), () => S.stats.taps >= v));
    [1, 10, 50].forEach((v, k) => add('gold_' + k, '🥇', () => I18n.arr('a_gold', k), () => t('a_gold_d', { v }), () => S.stats.golden >= v));
    add('combo', '⚡', () => t('a_combo'), () => t('a_combo_d'), () => S.stats.comboMaxed >= 1);
    [1, 5, 25].forEach((v, k) => add('rb_' + k, '🧪', () => I18n.arr('a_rb', k), () => t('a_rb_d', { v }), () => S.stats.rebirthsAll >= v));
    [1, 3].forEach((v, k) => add('asc_' + k, '🌙', () => I18n.arr('a_asc', k), () => t('a_asc_d', { v }), () => S.stats.ascAll >= v));
    add('aw', '🔮', () => t('a_aw'), () => t('a_aw_d'), () => S.awakenings >= 1);
    add('streak', '📅', () => t('a_streak'), () => t('a_streak_d'), () => S.login.streak >= 7);
    [10, 50].forEach((v, k) => add('upg_' + k, '📜', () => I18n.arr('a_upg', k), () => t('a_upg_d', { v }), () => S.stats.upgrades >= v));
    [100, 500, 1000].forEach((v, k) => add('gens_' + k, '🏘️', () => I18n.arr('a_gens', k), () => t('a_gens_d', { v }), () => S.gens.reduce((a, b) => a + b, 0) >= v));
    this.list = A;
  },
  // проверка достижений; возвращает новые
  checkAch() {
    const got = [];
    for (const a of this.list) {
      if (S.ach[a.id]) continue;
      let ok = false;
      try { ok = a.check(); } catch (e) { ok = false; }
      if (ok) { S.ach[a.id] = true; got.push(a); }
    }
    if (got.length) Economy.invalidate();
    return got;
  },
  // --- ежедневные задания ---
  makeTask(tp, rng) {
    if (tp.type === 'earn') {
      return { type: 'earn', target: Economy.incomeFor(tp.minutes, tp.minMoney).toString(), progress: '0', claimed: false };
    }
    return { type: tp.type, target: Math.round(tp.min + rng() * (tp.max - tp.min)), progress: 0, claimed: false };
  },
  dailyPool(day) {
    const rng = U.seeded(day * 7919 + 13);
    const pool = CONFIG.daily.templates.slice();
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    return { pool, rng };
  },
  checkDay() {
    const today = U.dayNumber();
    let changed = false;
    if (S.daily.day !== today) {
      const { pool, rng } = this.dailyPool(today);
      S.daily = { day: today, tasks: pool.slice(0, CONFIG.daily.count).map(tp => this.makeTask(tp, rng)), extra: false };
      changed = true;
    }
    const week = U.weekNumber(today);
    if (S.weekly.week !== week) {
      const tp = CONFIG.weekly.templates[week % CONFIG.weekly.templates.length];
      S.weekly = { week, type: tp.type, target: tp.v, progress: 0, claimed: false };
      changed = true;
    }
    return changed;
  },
  addExtraTask() {
    if (S.daily.extra) return false;
    const { pool, rng } = this.dailyPool(S.daily.day);
    pool.slice(0, CONFIG.daily.count).forEach(tp => this.makeTask(tp, rng)); // тот же ход ГСЧ
    S.daily.tasks.push(this.makeTask(pool[CONFIG.daily.count % pool.length], rng));
    S.daily.extra = true;
    return true;
  },
  track(type, n) {
    for (const tk of S.daily.tasks) {
      if (tk.type === type && !tk.claimed && tk.type !== 'earn') tk.progress = Math.min(tk.target, tk.progress + n);
    }
    const w = S.weekly;
    if (w.type === type && !w.claimed) w.progress = Math.min(w.target, w.progress + n);
  },
  trackEarn(v) {
    for (const tk of S.daily.tasks) {
      if (tk.type !== 'earn' || tk.claimed) continue;
      const tg = BN.from(tk.target);
      const p = BN.from(tk.progress);
      if (p.gte(tg)) continue;
      tk.progress = BN.min(tg, p.add(v)).toString();
    }
  },
  taskDone(tk) {
    if (tk.type === 'earn') return BN.from(tk.progress).gte(BN.from(tk.target));
    return tk.progress >= tk.target;
  },
  taskFrac(tk) {
    if (tk.type === 'earn') {
      const tg = BN.from(tk.target);
      return tg.m > 0 ? U.clamp(BN.from(tk.progress).div(tg).toNumber(), 0, 1) : 1;
    }
    return U.clamp(tk.progress / tk.target, 0, 1);
  },
  taskReward() { return Economy.incomeFor(CONFIG.daily.rewardMinutes, CONFIG.daily.rewardMinMoney); },
  claimTask(idx) {
    const tk = S.daily.tasks[idx];
    if (!tk || tk.claimed || !this.taskDone(tk)) return null;
    tk.claimed = true;
    const r = this.taskReward();
    Economy.earn(r);
    return r;
  },
  weeklyReward() { return Economy.incomeFor(CONFIG.weekly.rewardMinutes, CONFIG.weekly.rewardMinMoney); },
  claimWeekly() {
    const w = S.weekly;
    if (w.claimed || w.progress < w.target) return null;
    w.claimed = true;
    const now = Date.now();
    S.boosts.weeklyUntil = Math.max(now, S.boosts.weeklyUntil) + CONFIG.weekly.boostHours * 3600e3;
    const r = this.weeklyReward();
    Economy.earn(r);
    Economy.invalidate();
    return r;
  },
  // --- бонус за вход ---
  loginAvailable() { return S.login.last !== U.dayNumber(); },
  loginNextStreak() {
    const today = U.dayNumber();
    return S.login.last === today - 1 ? (S.login.streak % 7) + 1 : 1;
  },
  loginReward(day) {
    const i = U.clamp(day - 1, 0, 6);
    return Economy.incomeFor(CONFIG.login.minutes[i], CONFIG.login.minMoney[i]);
  },
  claimLogin() {
    if (!this.loginAvailable()) return null;
    const day = this.loginNextStreak();
    const r = this.loginReward(day);
    S.login.last = U.dayNumber();
    S.login.streak = day;
    Economy.earn(r);
    if (day === 7) {
      S.boosts.adUntil = Math.max(Date.now(), S.boosts.adUntil) + CONFIG.login.day7BoostHours * 3600e3;
      Economy.invalidate();
    }
    return { r, day };
  },
};

// ===================== SFX: звук и музыка через Web Audio =====================
const SFX = {
  ctx: null, master: null, sfx: null, mus: null, musTimer: null, nextNote: 0, step: 0, paused: false,
  // создаём контекст только после жеста пользователя
  init() {
    if (this.ctx) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain(); this.master.gain.value = 0.9; this.master.connect(this.ctx.destination);
      this.sfx = this.ctx.createGain(); this.sfx.gain.value = 0.5; this.sfx.connect(this.master);
      this.mus = this.ctx.createGain(); this.mus.gain.value = 0.12; this.mus.connect(this.master);
      this.applySettings();
    } catch (e) { this.ctx = null; }
  },
  applySettings() {
    if (!this.ctx) return;
    this.sfx.gain.value = S.settings.sound ? 0.5 : 0;
    if (S.settings.music && !this.paused) this.startMusic(); else this.stopMusic();
  },
  setPaused(p) {
    this.paused = p;
    if (!this.ctx) return;
    try {
      if (p) { this.stopMusic(); this.ctx.suspend(); }
      else { this.ctx.resume(); this.applySettings(); }
    } catch (e) { /* игнор */ }
  },
  tone(freq, dur, type = 'sine', vol = 0.3, slide = 0, delay = 0, dest = null) {
    if (!this.ctx || this.paused) return;
    if (!dest && !S.settings.sound) return;
    try {
      const t0 = this.ctx.currentTime + delay;
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, t0);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t0 + dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g); g.connect(dest || this.sfx);
      o.start(t0); o.stop(t0 + dur + 0.05);
    } catch (e) { /* игнор */ }
  },
  click(combo) { this.tone(320 + Math.min(combo, 60) * 9, 0.09, 'triangle', 0.25, 120); },
  buy() { this.tone(520, 0.08, 'square', 0.12); this.tone(780, 0.12, 'square', 0.12, 0, 0.07); },
  upgrade() { [523, 659, 784].forEach((f, i) => this.tone(f, 0.12, 'triangle', 0.2, 0, i * 0.06)); },
  ach() { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.18, 'triangle', 0.25, 0, i * 0.09)); },
  golden() { for (let i = 0; i < 6; i++) this.tone(1200 + Math.random() * 900, 0.12, 'sine', 0.15, 0, i * 0.05); },
  error() { this.tone(160, 0.15, 'sawtooth', 0.12, -40); },
  prestige() { this.tone(200, 1.2, 'sine', 0.3, 900); [392, 523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.3, 'triangle', 0.2, 0, 0.3 + i * 0.12)); },
  // фоновая музыка: мягкая пентатоника, планировщик с упреждением
  melody: [0, 2, 4, 7, 9, 7, 4, 2, 0, 4, 7, 12, 9, 7, 4, 2],
  bass: [0, 0, 5, 5, 7, 7, 3, 3],
  startMusic() {
    if (!this.ctx || this.musTimer) return;
    this.nextNote = this.ctx.currentTime + 0.1;
    this.musTimer = setInterval(() => this.schedule(), 100);
  },
  stopMusic() { if (this.musTimer) { clearInterval(this.musTimer); this.musTimer = null; } },
  schedule() {
    if (!this.ctx || this.paused) return;
    const beat = 0.32, base = 262;
    while (this.nextNote < this.ctx.currentTime + 0.3) {
      const d = this.nextNote - this.ctx.currentTime;
      const s = this.step % this.melody.length;
      if (s % 2 === 0 || Math.random() < 0.6) {
        this.tone(base * Math.pow(2, this.melody[s] / 12), beat * 1.6, 'sine', 0.35, 0, Math.max(0, d), this.mus);
      }
      if (s % 2 === 0) {
        const b = this.bass[(this.step / 2) % this.bass.length | 0];
        this.tone(base / 2 * Math.pow(2, b / 12), beat * 2.2, 'triangle', 0.3, 0, Math.max(0, d), this.mus);
      }
      this.nextNote += beat;
      this.step++;
    }
  },
};

// ===================== SCENE: монстр и ферма на canvas =====================
const Scene = {
  cv: null, ctx: null, w: 1, h: 1, dpr: 1, t: 0,
  sq: 0, sqv: 0, lookX: 0, lookY: 0, blinkT: 3, blink: 0, stars: [], minis: [],
  init() {
    this.cv = document.getElementById('scene-cv');
    this.ctx = this.cv.getContext('2d');
    for (let i = 0; i < 45; i++) this.stars.push({ x: Math.random(), y: Math.random() * 0.55, s: Math.random() * 1.6 + 0.4, p: Math.random() * 6 });
    this.resize();
  },
  resize() {
    const r = this.cv.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = Math.max(1, r.width); this.h = Math.max(1, r.height);
    this.cv.width = Math.round(this.w * this.dpr); this.cv.height = Math.round(this.h * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  },
  groundY() { return this.h * 0.86; },
  monster() {
    const r = Math.min(this.w * 0.22, this.h * 0.25);
    return { x: this.w / 2, y: this.groundY() - r * 0.95, r };
  },
  hue() { return (140 + S.rebirths * 37 + S.ascensions * 90 + S.awakenings * 45) % 360; },
  hit(x, y) {
    const m = this.monster();
    return Math.hypot(x - m.x, y - m.y) < m.r * 1.25;
  },
  poke(x, y) {
    this.sqv = -5;
    const m = this.monster();
    this.lookX = U.clamp((x - m.x) / m.r, -1, 1);
    this.lookY = U.clamp((y - m.y) / m.r, -1, 1);
  },
  syncMinis() {
    for (let i = 0; i < GEN_COUNT; i++) {
      const has = this.minis.some(m => m.i === i);
      if (S.gens[i] > 0 && !has) this.minis.push({ i, x: Math.random(), dir: Math.random() < 0.5 ? -1 : 1, sp: U.rand(0.02, 0.05), ph: Math.random() * 6 });
    }
    this.minis = this.minis.filter(m => S.gens[m.i] > 0);
  },
  update(dt) {
    this.t += dt;
    // пружина «сплющивания»
    const a = -170 * this.sq - 11 * this.sqv;
    this.sqv += a * dt; this.sq += this.sqv * dt;
    this.sq = U.clamp(this.sq, -1, 1);
    this.lookX *= Math.pow(0.4, dt); this.lookY *= Math.pow(0.4, dt);
    this.blinkT -= dt;
    if (this.blinkT <= 0) { this.blink = 0.18; this.blinkT = U.rand(2, 5); }
    if (this.blink > 0) this.blink -= dt;
    for (const m of this.minis) {
      m.x += m.dir * m.sp * dt;
      if (m.x < 0.04) { m.x = 0.04; m.dir = 1; }
      if (m.x > 0.96) { m.x = 0.96; m.dir = -1; }
    }
  },
  draw() {
    const c = this.ctx, w = this.w, h = this.h, t = this.t, gy = this.groundY();
    // небо
    const sky = c.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#1d1240'); sky.addColorStop(0.6, '#45286e'); sky.addColorStop(1, '#6a3d8f');
    c.fillStyle = sky; c.fillRect(0, 0, w, h);
    for (const s of this.stars) {
      c.globalAlpha = 0.35 + 0.65 * Math.abs(Math.sin(t * 0.8 + s.p));
      c.fillStyle = '#fff';
      c.fillRect(s.x * w, s.y * h, s.s, s.s);
    }
    c.globalAlpha = 1;
    // луна
    const mx = w * 0.84, my = h * 0.16, mr = Math.min(w, h) * 0.06;
    const glow = c.createRadialGradient(mx, my, mr * 0.5, mx, my, mr * 3);
    glow.addColorStop(0, S.ascensions > 0 ? 'rgba(180,220,255,.45)' : 'rgba(255,240,180,.35)'); glow.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = glow; c.beginPath(); c.arc(mx, my, mr * 3, 0, 7); c.fill();
    c.fillStyle = S.ascensions > 0 ? '#d8ecff' : '#fff3c4'; c.beginPath(); c.arc(mx, my, mr, 0, 7); c.fill();
    // холмы
    this.hill(gy - h * 0.12, '#2c5a5a', 0.7, 0.3);
    this.hill(gy - h * 0.05, '#2f7a5c', 1.3, 1.7);
    c.fillStyle = '#3f9b5f'; c.fillRect(0, gy, w, h - gy);
    c.fillStyle = '#4fb36d'; c.fillRect(0, gy, w, 5);
    // забор
    c.fillStyle = 'rgba(120,80,50,.55)';
    for (let x = 8; x < w; x += 34) c.fillRect(x, gy - 24, 6, 24);
    c.fillRect(0, gy - 18, w, 4);
    // мини-монстры
    c.textAlign = 'center'; c.textBaseline = 'bottom';
    const fs = Math.max(20, Math.min(30, h * 0.07));
    c.font = fs + 'px sans-serif';
    for (const m of this.minis) {
      const bob = Math.abs(Math.sin(t * 6 + m.ph)) * 5;
      c.save();
      c.translate(m.x * w, gy + 4 - bob);
      if (m.dir < 0) c.scale(-1, 1);
      c.fillText(CONFIG.generators[m.i].icon, 0, 0);
      c.restore();
    }
    this.drawMonster();
  },
  hill(y, color, f, ph) {
    const c = this.ctx, w = this.w;
    c.fillStyle = color; c.beginPath(); c.moveTo(0, this.h);
    for (let x = 0; x <= w; x += 10) c.lineTo(x, y + Math.sin(x / w * Math.PI * 2 * f + ph) * 18);
    c.lineTo(w, this.h); c.closePath(); c.fill();
  },
  drawMonster() {
    const c = this.ctx, m = this.monster(), t = this.t, hue = this.hue();
    const sx = 1 - this.sq * 0.18, sy = 1 + this.sq * 0.18;
    const breathe = 1 + Math.sin(t * 2) * 0.02;
    const r = m.r;
    // тень
    c.fillStyle = 'rgba(0,0,0,.25)';
    c.beginPath(); c.ellipse(m.x, this.groundY() + 2, r * 0.95 * sx, r * 0.18, 0, 0, 7); c.fill();
    c.save();
    c.translate(m.x, m.y + r * 0.95);
    c.scale(sx * breathe, sy / breathe);
    c.translate(0, -r * 0.95);
    // рожки
    c.fillStyle = `hsl(${(hue + 40) % 360},60%,80%)`;
    [-1, 1].forEach(s => {
      c.beginPath(); c.moveTo(s * r * 0.45, -r * 0.75); c.lineTo(s * r * 0.62, -r * 1.22); c.lineTo(s * r * 0.2, -r * 0.88); c.closePath(); c.fill();
    });
    // тело-капля с колыханием
    const g = c.createRadialGradient(-r * 0.35, -r * 0.45, r * 0.1, 0, 0, r * 1.2);
    g.addColorStop(0, `hsl(${hue},85%,72%)`); g.addColorStop(1, `hsl(${hue},70%,38%)`);
    c.fillStyle = g;
    c.beginPath();
    const N = 14, pts = [];
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      const wob = 1 + 0.035 * Math.sin(t * 3 + i * 1.7);
      const flat = Math.sin(a) > 0.5 ? 0.92 : 1; // приплюснутое дно
      pts.push([Math.cos(a) * r * wob, Math.sin(a) * r * wob * flat]);
    }
    for (let i = 0; i <= N; i++) {
      const p = pts[i % N], q = pts[(i + 1) % N];
      const mx2 = (p[0] + q[0]) / 2, my2 = (p[1] + q[1]) / 2;
      if (i === 0) c.moveTo(mx2, my2); else c.quadraticCurveTo(p[0], p[1], mx2, my2);
    }
    c.closePath(); c.fill();
    // блик и пятна
    c.fillStyle = 'rgba(255,255,255,.25)';
    c.beginPath(); c.ellipse(-r * 0.4, -r * 0.5, r * 0.22, r * 0.12, -0.6, 0, 7); c.fill();
    c.fillStyle = `hsla(${(hue + 30) % 360},70%,30%,.35)`;
    [[0.55, 0.2, 0.09], [0.4, 0.5, 0.06], [-0.6, 0.3, 0.07]].forEach(([x, y, s]) => { c.beginPath(); c.arc(x * r, y * r, s * r, 0, 7); c.fill(); });
    // глаза
    const blink = this.blink > 0 ? 0.12 : 1;
    [[-0.33, -0.15, 0.24], [0.33, -0.15, 0.2]].forEach(([ex, ey, es]) => {
      c.fillStyle = '#fff';
      c.beginPath(); c.ellipse(ex * r, ey * r, es * r, es * r * 1.1 * blink, 0, 0, 7); c.fill();
      if (blink > 0.5) {
        c.fillStyle = '#1b1030';
        c.beginPath(); c.arc(ex * r + this.lookX * es * r * 0.4, ey * r + this.lookY * es * r * 0.4, es * r * 0.5, 0, 7); c.fill();
        c.fillStyle = '#fff';
        c.beginPath(); c.arc(ex * r + this.lookX * es * r * 0.4 - es * r * 0.18, ey * r - es * r * 0.2, es * r * 0.16, 0, 7); c.fill();
      }
    });
    // щёчки
    c.fillStyle = 'rgba(255,120,160,.35)';
    c.beginPath(); c.ellipse(-r * 0.55, r * 0.12, r * 0.12, r * 0.07, 0, 0, 7); c.fill();
    c.beginPath(); c.ellipse(r * 0.55, r * 0.12, r * 0.12, r * 0.07, 0, 0, 7); c.fill();
    // рот: улыбка или «ам» при тапе
    if (this.sq < -0.15) {
      c.fillStyle = '#3a0f2e';
      c.beginPath(); c.ellipse(0, r * 0.25, r * 0.2, r * 0.16, 0, 0, 7); c.fill();
      c.fillStyle = '#ff7aa8';
      c.beginPath(); c.ellipse(0, r * 0.33, r * 0.11, r * 0.06, 0, 0, 7); c.fill();
    } else {
      c.strokeStyle = '#3a0f2e'; c.lineWidth = Math.max(2, r * 0.05); c.lineCap = 'round';
      c.beginPath(); c.arc(0, r * 0.12, r * 0.2, 0.2, Math.PI - 0.2); c.stroke();
      c.fillStyle = '#fff';
      c.fillRect(-r * 0.08, r * 0.28, r * 0.07, r * 0.07);
    }
    c.restore();
  },
};

// ===================== FX: частицы и всплывающие числа =====================
const FX = {
  cv: null, ctx: null, parts: [], texts: [], w: 1, h: 1,
  init() {
    this.cv = document.getElementById('fx-cv');
    this.ctx = this.cv.getContext('2d');
    this.resize();
  },
  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = window.innerWidth; this.h = window.innerHeight;
    this.cv.width = Math.round(this.w * dpr); this.cv.height = Math.round(this.h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  },
  burst(x, y, n, colors, speed = 240, size = 5, shape = 'c') {
    for (let i = 0; i < n && this.parts.length < 350; i++) {
      const a = Math.random() * Math.PI * 2, s = speed * (0.4 + Math.random() * 0.8);
      this.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - speed * 0.4, life: 0, max: 0.6 + Math.random() * 0.5,
        c: colors[(Math.random() * colors.length) | 0], s: size * (0.6 + Math.random() * 0.8), sh: shape, rot: Math.random() * 6 });
    }
  },
  text(x, y, str, color = '#fff', size = 26) {
    if (this.texts.length > 40) this.texts.shift();
    this.texts.push({ x: x + U.rand(-12, 12), y, str, color, size, life: 0, max: 1.0 });
  },
  update(dt) {
    for (const p of this.parts) { p.life += dt; p.vy += 600 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += dt * 6; }
    this.parts = this.parts.filter(p => p.life < p.max);
    for (const tx of this.texts) { tx.life += dt; tx.y -= 70 * dt; }
    this.texts = this.texts.filter(tx => tx.life < tx.max);
  },
  draw() {
    const c = this.ctx;
    c.clearRect(0, 0, this.w, this.h);
    for (const p of this.parts) {
      c.globalAlpha = 1 - p.life / p.max;
      c.fillStyle = p.c;
      if (p.sh === 's') {
        c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); c.restore();
      } else { c.beginPath(); c.arc(p.x, p.y, p.s, 0, 7); c.fill(); }
    }
    c.textAlign = 'center'; c.textBaseline = 'middle';
    for (const tx of this.texts) {
      const k = tx.life / tx.max;
      const sc = k < 0.15 ? 0.6 + k / 0.15 * 0.5 : 1.1 - (k - 0.15) * 0.15; // «выпрыгивание» числа
      c.globalAlpha = k > 0.6 ? 1 - (k - 0.6) / 0.4 : 1;
      c.font = `900 ${Math.round(tx.size * sc)}px system-ui, sans-serif`;
      c.lineWidth = 5; c.strokeStyle = 'rgba(30,10,50,.85)';
      c.strokeText(tx.str, tx.x, tx.y);
      c.fillStyle = tx.color; c.fillText(tx.str, tx.x, tx.y);
    }
    c.globalAlpha = 1;
  },
  active() { return this.parts.length > 0 || this.texts.length > 0; },
};

// ===================== UI: интерфейс на DOM =====================
const $ = id => document.getElementById(id);
const cur = v => '🟢 ' + Fmt.num(v);

// Описание эффекта узла дерева
function effText(f) {
  const p = {};
  switch (f.t) {
    case 'tapPct': case 'offlineEff': p.v = Fmt.pct(f.v); break;
    case 'goldenFreq': case 'costMult': case 'upgCost': p.v = Math.round((1 - f.v) * 100); break;
    case 'mutBonus': case 'moonBonus': p.v = Fmt.pct(f.v); break;
    case 'startMoney': case 'startMutagen': p.v = Fmt.num(f.v); break;
    case 'genRange': p.a = f.a + 1; p.b = f.b + 1; p.v = f.v; break;
    default: p.v = f.v;
  }
  return t('e_' + f.t, p);
}

function upgName(u) {
  if (u.kind === 'gen') return t('gu_name', { tier: I18n.arr('tiers', u.tier), g: gname(u.i) });
  if (u.kind === 'global') return I18n.arr('glob_names', u.idx);
  return I18n.arr('click_names', u.idx);
}
function upgDesc(u) {
  if (u.kind === 'gen') return t('gu_desc', { g: gname(u.i), m: CONFIG.genUpgrades.mults[u.tier] });
  if (u.kind === 'global') return t('glob_desc', { m: u.u.mult });
  const x = u.u;
  if (x.type === 'mult') return t('click_mult', { v: x.v });
  if (x.type === 'pct') return t('click_pct', { v: Fmt.pct(x.v) });
  return t('click_combo', { v: x.v });
}

const TABS = [
  { id: 'farm', icon: '🏡' }, { id: 'upg', icon: '⬆️' }, { id: 'mgr', icon: '🤖' },
  { id: 'prest', icon: '🧪' }, { id: 'tasks', icon: '📅' }, { id: 'more', icon: '🏆' },
];

const UI = {
  tab: 'farm', moreSub: 'ach', shownMoney: BN.ZERO, sig: '', dyn: [], modal: null, queue: [],
  hintMode: null, hintTimer: 0, treeSel: null,

  init() {
    this.applyStatic();
    $('tabs').addEventListener('click', e => {
      const b = e.target.closest('[data-tab]');
      if (b) this.setTab(b.dataset.tab);
    });
    const onAct = e => {
      const b = e.target.closest('[data-act]');
      if (!b || b.classList.contains('off')) {
        if (b && b.dataset.act === 'buy') { SFX.error(); this.shake(b); }
        return;
      }
      try { this.action(b.dataset.act, b.dataset, b); } catch (err) { /* защищаем UI */ }
    };
    $('content').addEventListener('click', onAct);
    $('modal-root').addEventListener('click', onAct);
    $('toasts').addEventListener('click', onAct);
    $('btn-ads').addEventListener('click', () => this.adsModal());
    $('btn-set').addEventListener('click', () => this.settingsModal());
    this.shownMoney = S.money;
    this.render();
  },
  applyStatic() {
    document.documentElement.lang = I18n.lang;
    document.title = t('title');
    $('tabs').innerHTML = TABS.map(tb =>
      `<button class="tab${tb.id === this.tab ? ' on' : ''}" data-tab="${tb.id}"><span class="ti">${tb.icon}</span><span class="tl">${t('tab_' + tb.id)}</span><i class="dot"></i></button>`).join('');
  },
  setTab(id) {
    this.tab = id;
    document.querySelectorAll('#tabs .tab').forEach(b => b.classList.toggle('on', b.dataset.tab === id));
    this.render();
    $('content').scrollTop = 0;
  },
  // полная перерисовка вкладки
  render() {
    const tab = this.tabs[this.tab];
    this.sig = tab.sig.call(this);
    $('content').innerHTML = `<div class="tab-body fade-in">${tab.html.call(this)}</div>`;
    this.dyn = Array.from($('content').querySelectorAll('[data-k]'));
    this.refresh();
  },
  // обновление только изменившихся значений
  applyVals(els, vals) {
    for (const el of els) {
      const v = vals[el.dataset.k];
      if (v === undefined) continue;
      if (typeof v === 'string' || typeof v === 'number') { if (el.textContent !== String(v)) el.textContent = v; continue; }
      if (v.t !== undefined && el.textContent !== String(v.t)) el.textContent = v.t;
      if (v.off !== undefined) el.classList.toggle('off', !!v.off);
      if (v.w !== undefined) el.style.width = (U.clamp(v.w, 0, 1) * 100).toFixed(1) + '%';
      if (v.hide !== undefined) el.classList.toggle('hidden', !!v.hide);
      if (v.cls) for (const k in v.cls) el.classList.toggle(k, !!v.cls[k]);
    }
  },
  refresh() {
    const tab = this.tabs[this.tab];
    if (tab.sig.call(this) !== this.sig) { this.render(); return; }
    this.applyVals(this.dyn, tab.vals.call(this));
  },
  tick() {
    this.refresh();
    const c = Economy.get();
    $('pps').textContent = t('per_sec', { v: Fmt.num(c.pps, 1) });
    this.boosts();
    this.badges();
    if (this.modal && this.modal.vals) {
      try { this.applyVals(this.modal.dyn, this.modal.vals()); } catch (e) { /* модалка закрыта */ }
    }
    if (this.hintMode === 'tip') { this.hintTimer -= CONFIG.uiTickSec; if (this.hintTimer <= 0) this.hint(null); }
  },
  // плавный счётчик денег + комбо (каждый кадр)
  frame(dt) {
    const target = S.money;
    if (target.lt(this.shownMoney) || target.sub(this.shownMoney).lt(target.mul(1e-4))) this.shownMoney = target;
    else this.shownMoney = this.shownMoney.add(target.sub(this.shownMoney).mul(Math.min(1, dt * 12)));
    const txt = Fmt.num(this.shownMoney);
    const el = $('money');
    if (el.textContent !== txt) el.textContent = txt;
    const cm = Economy.comboMult(), max = 1 + Economy.get().comboMax;
    const f = (cm - 1) / (max - 1);
    $('combo').classList.toggle('show', cm > 1.04);
    $('combo-fill').style.width = (U.clamp(f, 0, 1) * 100).toFixed(1) + '%';
    $('combo-txt').textContent = cm >= max - 1e-9 ? t('combo', { v: cm.toFixed(2) }) + ' ' + t('combo_max') : t('combo', { v: cm.toFixed(2) });
    $('combo').classList.toggle('max', cm >= max - 1e-9);
  },
  boosts() {
    const now = Date.now(), b = S.boosts, chips = [];
    if (b.frenzyLeft > 0) chips.push(`<span class="chip fr">🔥 x${b.frenzyMult} ${Math.ceil(b.frenzyLeft)}${t('t_s')}</span>`);
    if (b.adUntil > now) chips.push(`<span class="chip ad">⚡ ${t('boost_left', { t: Fmt.time((b.adUntil - now) / 1000) })}</span>`);
    if (b.weeklyUntil > now) chips.push(`<span class="chip wk">🏅 ${t('boost_left', { t: Fmt.time((b.weeklyUntil - now) / 1000) })}</span>`);
    const html = chips.join('');
    if ($('boosts').innerHTML !== html) $('boosts').innerHTML = html;
  },
  badges() {
    const money = S.money;
    const has = {
      upg: Economy.upgradeList().some(u => money.gte(u.cost)),
      mgr: (S.stats.taps > 20 && Economy.autoClickLevel() < CONFIG.autoClick.rates.length - 1 && money.gte(Economy.autoClickCost()))
        || S.gens.some((n, i) => n > 0 && !S.managers[i] && money.gte(Economy.managerCost(i))),
      prest: Prestige.rebirthGain().gte(1) || Prestige.ascGain() >= 1 || Prestige.awGain() >= 1
        || [1, 2, 3].some(k => TREES[k].some(n => Prestige.nodeState(k, n) === 'available' && Prestige.balance(k).gte(n.cost))),
      tasks: Meta.loginAvailable() || S.daily.tasks.some(tk => !tk.claimed && Meta.taskDone(tk)) || (!S.weekly.claimed && S.weekly.progress >= S.weekly.target),
    };
    document.querySelectorAll('#tabs .tab').forEach(b => b.classList.toggle('badge', !!has[b.dataset.tab]));
    const adReady = ['boost', 'instant', 'summon'].some(k => Ads.cdLeft(k) <= 0);
    $('btn-ads').classList.toggle('badge', adReady);
  },

  // ---------------- вкладки ----------------
  tabs: {
    farm: {
      sig() { return 'farm' + UI.visibleGens() + '|' + S.buyMode + I18n.lang; },
      html() {
        const modes = [[1, 'x1'], [10, 'x10'], [100, 'x100'], [0, t('max')]];
        let h = `<div class="seg">${modes.map(([m, l]) => `<button class="${S.buyMode === m ? 'on' : ''}" data-act="mode" data-m="${m}">${l}</button>`).join('')}</div>`;
        const vis = UI.visibleGens();
        for (let i = 0; i < vis; i++) {
          const g = CONFIG.generators[i];
          h += `<div class="card gen" id="gen-${i}">
            <div class="ico" style="--c:${g.color}">${g.icon}<b data-k="cnt${i}"></b></div>
            <div class="info"><div class="name">${gname(i)}</div><div class="desc">${I18n.arr('g_descs', i)}</div>
              <div class="sub"><span data-k="pps${i}"></span> · <span data-k="tier${i}"></span></div>
              <div class="bar"><i data-k="bar${i}"></i></div></div>
            <button class="buy" data-act="buy" data-i="${i}" data-k="btn${i}"><span class="n" data-k="n${i}"></span><span class="c" data-k="c${i}"></span></button>
          </div>`;
        }
        if (vis < GEN_COUNT) {
          const g = CONFIG.generators[vis];
          h += `<div class="card gen locked"><div class="ico" style="--c:#555">❔</div><div class="info"><div class="name">${t('locked_gen')}</div>
            <div class="desc">${t('locked_hint', { v: cur(Economy.unitCost(vis, 0)) })}</div></div><span class="lock-ico">${g.icon}</span></div>`;
        }
        return h;
      },
      vals() {
        const v = {}, c = Economy.get(), th = CONFIG.genUpgrades.thresholds;
        for (let i = 0; i < UI.visibleGens(); i++) {
          const n = Economy.buyCount(i), cost = Economy.costN(i, n), tier = S.genUpg[i];
          v['cnt' + i] = Fmt.num(S.gens[i]);
          v['pps' + i] = '+' + t('per_sec', { v: Fmt.num(c.genProd[i].mul(c.temp), 1) });
          if (tier < th.length) {
            v['tier' + i] = t('next_tier', { m: CONFIG.genUpgrades.mults[tier], n: th[tier] });
            const prev = tier > 0 ? th[tier - 1] : 0;
            v['bar' + i] = { w: (S.gens[i] - prev) / (th[tier] - prev) };
          } else { v['tier' + i] = t('all_tiers'); v['bar' + i] = { w: 1 }; }
          v['n' + i] = 'x' + n;
          v['c' + i] = cur(cost);
          v['btn' + i] = { off: S.money.lt(cost), cls: { pulse: !S.tutorial.done && i === 0 && S.gens[0] === 0 && S.stats.taps >= 5 } };
        }
        return v;
      },
    },
    upg: {
      sig() { return 'upg' + Economy.upgradeList().map(u => u.key).join(',') + I18n.lang; },
      html() {
        const L = Economy.upgradeList();
        let h = '';
        if (L.length) h += `<button class="wide-btn" data-act="upgall" data-k="upgall">${t('upg_buy_all')}</button>`;
        else h += `<div class="empty">${t('upg_empty')}</div>`;
        for (const u of L) {
          const color = u.kind === 'gen' ? CONFIG.generators[u.i].color : u.kind === 'global' ? '#ffd166' : '#7ad7ff';
          h += `<div class="card upg"><div class="ico sm" style="--c:${color}">${u.icon}</div>
            <div class="info"><div class="name">${upgName(u)}</div><div class="desc">${upgDesc(u)}</div></div>
            <button class="buy" data-act="upg" data-key="${u.key}" data-k="u_${u.key}"><span class="c">${cur(u.cost)}</span></button></div>`;
        }
        const nx = Economy.nextHiddenUpgrade();
        if (nx) h += `<div class="soon">🔒 ${t('upg_next', { name: nx.kind === 'global' ? I18n.arr('glob_names', nx.idx) : I18n.arr('click_names', nx.idx), v: cur(nx.cost) })}</div>`;
        return h;
      },
      vals() {
        const v = {};
        let any = false;
        for (const u of Economy.upgradeList()) { const ok = S.money.gte(u.cost); any = any || ok; v['u_' + u.key] = { off: !ok }; }
        v.upgall = { off: !any };
        return v;
      },
    },
    mgr: {
      sig() { return 'mgr' + UI.visibleGens() + S.managers.join('') + S.managerOn.join('') + I18n.lang; },
      html() {
        let h = `<div class="intro">${t('mgr_intro')}</div>`;
        h += `<div class="card"><div class="ico" style="--c:#7ad7ff">🤖</div><div class="info"><div class="name">${t('ac_title')} <span class="lvl" data-k="aclvl"></span></div>
          <div class="desc" data-k="acdesc"></div></div><button class="buy" data-act="ac" data-k="acbtn"><span class="n">${t('ac_upgrade')}</span><span class="c" data-k="accost"></span></button></div>`;
        for (let i = 0; i < GEN_COUNT; i++) {
          const g = CONFIG.generators[i];
          if (S.gens[i] <= 0 && !S.managers[i]) continue;
          h += `<div class="card"><div class="ico sm" style="--c:${g.color}">${g.icon}<span class="hat">🎩</span></div>
            <div class="info"><div class="name">${t('mgr_title', { g: gname(i) })}</div><div class="desc">${t('mgr_desc')}</div></div>`;
          if (S.managers[i]) h += `<button class="toggle ${S.managerOn[i] ? 'on' : ''}" data-act="mtog" data-i="${i}">${S.managerOn[i] ? t('mgr_on') : t('mgr_off')}</button></div>`;
          else h += `<button class="buy" data-act="hire" data-i="${i}" data-k="h${i}"><span class="n">${t('mgr_hire')}</span><span class="c">${cur(Economy.managerCost(i))}</span></button></div>`;
        }
        if (!S.gens.some(n => n > 0)) h += `<div class="empty">${t('mgr_locked')}</div>`;
        return h;
      },
      vals() {
        const v = {}, max = Economy.autoClickLevel() >= CONFIG.autoClick.rates.length - 1;
        v.aclvl = t('ac_lvl', { n: Economy.autoClickLevel() });
        v.acdesc = t('ac_desc', { r: Economy.autoClickRate() });
        v.accost = max ? t('ac_max') : cur(Economy.autoClickCost());
        v.acbtn = { off: max || S.money.lt(Economy.autoClickCost()) };
        for (let i = 0; i < GEN_COUNT; i++) if (!S.managers[i]) v['h' + i] = { off: S.money.lt(Economy.managerCost(i)) };
        return v;
      },
    },
    prest: {
      sig() { return 'prest' + (S.stats.rebirthsAll > 0 || S.ascensions > 0 || S.awakenings > 0) + (S.stats.ascAll > 0 || S.awakenings > 0) + I18n.lang; },
      html() {
        const sec = (k, icon, title, desc, cls) => `<div class="card pcard ${cls}"><div class="ptitle">${icon} ${title}</div><div class="desc">${desc}</div>
          <div class="pstats"><span data-k="${k}have"></span><span data-k="${k}bonus"></span></div>
          <div class="pgain" data-k="${k}gain"></div><div class="bar big"><i data-k="${k}bar"></i></div><div class="desc small" data-k="${k}need"></div>
          <div class="prow"><button class="pbtn" data-act="${k}" data-k="${k}btn">${t(k + '_btn')}</button>
          <button class="tbtn" data-act="tree" data-tree="${k === 'rb' ? 1 : k === 'asc' ? 2 : 3}">🌳 ${t('tree_btn')}</button></div></div>`;
        let h = sec('rb', '🧪', t('rb_title'), t('rb_desc', { p: Fmt.pct(CONFIG.rebirth.bonusPerPoint + Prestige.E.mutBonus) }), 'p1');
        h += sec('asc', '🌙', t('asc_title'), t('asc_desc', { p: Fmt.pct(CONFIG.ascension.bonusPerPoint + Prestige.E.moonBonus) }), 'p2');
        h += sec('aw', '🔮', t('aw_title'), t('aw_desc', { p: Fmt.pct(CONFIG.awakening.bonusPerPoint) }), 'p3');
        return h;
      },
      vals() {
        const v = {};
        // перерождение
        const g = Prestige.rebirthGain(), next = Prestige.rebirthNextAt();
        v.rbhave = t('have', { v: Fmt.num(S.mutagen) + ' 🧪' });
        v.rbbonus = t('bonus', { v: Fmt.mult(Prestige.mutMult()) });
        v.rbgain = t('rb_gain', { v: Fmt.num(g) });
        v.rbbar = { w: S.runEarned.div(next).toNumber() };
        v.rbneed = g.lt(1) ? t('rb_need', { v: Fmt.num(next) }) : t('rb_next', { v: Fmt.num(BN.max(0, next.sub(S.runEarned))) });
        v.rbbtn = { off: g.lt(1) };
        // вознесение
        const ag = Prestige.ascGain();
        v.aschave = t('have', { v: Fmt.num(S.moon) + ' 🌙' });
        v.ascbonus = t('bonus', { v: Fmt.mult(Prestige.moonMult()) });
        v.ascgain = t('asc_gain', { v: Fmt.num(ag) });
        const needM = Prestige.ascNeed();
        v.ascbar = { w: S.rebirths < CONFIG.ascension.minRebirths ? S.rebirths / CONFIG.ascension.minRebirths : S.mutagenTotal.toNumber() / needM };
        v.ascneed = S.rebirths < CONFIG.ascension.minRebirths ? t('asc_need', { n: S.rebirths, m: CONFIG.ascension.minRebirths })
          : t('asc_need2', { v: Fmt.num(needM) + ' 🧪' });
        v.ascbtn = { off: ag < 1 };
        // пробуждение
        const wg = Prestige.awGain();
        v.awhave = t('have', { v: Fmt.num(S.runes) + ' 🔮' });
        v.awbonus = t('bonus', { v: Fmt.mult(Prestige.runeMult()) });
        v.awgain = t('aw_gain', { v: Fmt.num(wg) });
        const needR = Prestige.awNeed();
        v.awbar = { w: S.ascensions < CONFIG.awakening.minAscensions ? S.ascensions / CONFIG.awakening.minAscensions : S.moonTotal / needR };
        v.awneed = S.ascensions < CONFIG.awakening.minAscensions ? t('aw_need', { n: S.ascensions, m: CONFIG.awakening.minAscensions })
          : t('aw_need2', { v: Fmt.num(needR) + ' 🌙' });
        v.awbtn = { off: wg < 1 };
        return v;
      },
    },
    tasks: {
      sig() { return 'tasks' + S.daily.day + S.daily.tasks.length + S.daily.tasks.map(x => x.claimed).join('') + S.weekly.week + S.weekly.claimed + S.login.last + I18n.lang; },
      html() {
        const avail = Meta.loginAvailable(), next = avail ? Meta.loginNextStreak() : (S.login.streak % 7) + 1;
        let h = `<div class="card col"><div class="ptitle">🎁 ${t('login_title')}</div><div class="desc">${t('login_text')}</div><div class="days">`;
        for (let d = 1; d <= 7; d++) {
          const done = avail ? d < next : d <= S.login.streak;
          const cls = done ? 'done' : (avail && d === next ? 'today' : '');
          h += `<div class="day ${cls}"><span>${d}</span><b>${d === 7 ? '💎' : '🟢'}</b></div>`;
        }
        h += `</div>`;
        h += avail ? `<button class="wide-btn hot" data-act="login">${t('claim')} · ${cur(Meta.loginReward(next))}</button>`
          : `<div class="desc center">${t('login_come_back', { n: next })}</div>`;
        h += `</div><div class="card col"><div class="ptitle">📋 ${t('daily_title')}</div><div class="desc small" data-k="dleft"></div>`;
        S.daily.tasks.forEach((tk, i) => {
          h += `<div class="task"><div class="tinfo"><div class="name">${UI.taskText(tk)}</div><div class="bar"><i data-k="tb${i}"></i></div>
            <div class="desc small" data-k="tp${i}"></div></div>`;
          h += tk.claimed ? `<span class="claimed">${t('claimed')}</span>` : `<button class="buy" data-act="task" data-i="${i}" data-k="tc${i}"><span class="n">${t('claim')}</span><span class="c" data-k="tr${i}"></span></button>`;
          h += `</div>`;
        });
        if (!S.daily.extra) h += `<button class="wide-btn ad" data-act="ad" data-kind="extra">▶ ${t('extra_slot')}<small>${t('extra_slot_desc')}</small></button>`;
        h += `</div><div class="card col"><div class="ptitle">🏅 ${t('weekly_title')}</div><div class="desc small" data-k="wleft"></div>
          <div class="task"><div class="tinfo"><div class="name">${UI.taskText(S.weekly)}</div><div class="bar"><i data-k="wb"></i></div>
          <div class="desc small" data-k="wp"></div><div class="desc small">${t('reward', { v: t('weekly_reward', { h: CONFIG.weekly.boostHours, v: '' }) })}<span data-k="wr"></span></div></div>`;
        h += S.weekly.claimed ? `<span class="claimed">${t('claimed')}</span>` : `<button class="buy" data-act="weekly" data-k="wc"><span class="n">${t('claim')}</span></button>`;
        h += `</div></div>`;
        return h;
      },
      vals() {
        const v = {}, now = Date.now();
        const dayEnd = (S.daily.day + 1) * 86400000 + new Date().getTimezoneOffset() * 60000;
        v.dleft = t('new_tasks_in', { t: Fmt.time((dayEnd - now) / 1000) });
        const wkEnd = ((S.weekly.week + 1) * 7 - 3) * 86400000 + new Date().getTimezoneOffset() * 60000;
        v.wleft = t('time_left', { t: Fmt.time((wkEnd - now) / 1000) });
        const rew = cur(Meta.taskReward());
        S.daily.tasks.forEach((tk, i) => {
          v['tb' + i] = { w: Meta.taskFrac(tk) };
          v['tp' + i] = UI.taskProg(tk);
          v['tc' + i] = { off: !Meta.taskDone(tk) };
          v['tr' + i] = rew;
        });
        v.wb = { w: S.weekly.progress / S.weekly.target };
        v.wp = UI.taskProg(S.weekly);
        v.wr = cur(Meta.weeklyReward());
        v.wc = { off: S.weekly.progress < S.weekly.target };
        return v;
      },
    },
    more: {
      sig() { return 'more' + UI.moreSub + (UI.moreSub === 'ach' ? Object.keys(S.ach).length : '') + I18n.lang; },
      html() {
        const subs = [['ach', '🏆 ' + t('ach_title')], ['stats', '📊 ' + t('stats_title')], ['set', '⚙️ ' + t('settings_title')]];
        let h = `<div class="seg">${subs.map(([k, l]) => `<button class="${UI.moreSub === k ? 'on' : ''}" data-act="sub" data-s="${k}">${l}</button>`).join('')}</div>`;
        if (UI.moreSub === 'ach') {
          const n = Object.keys(S.ach).length;
          h += `<div class="desc center">${t('ach_progress', { n, m: Meta.list.length, p: Fmt.pct(n * CONFIG.achievementBonus * Prestige.E.achBonus) })}</div><div class="achs">`;
          for (const a of Meta.list) h += `<button class="ach ${S.ach[a.id] ? 'got' : ''}" data-act="ach" data-id="${a.id}">${a.icon}</button>`;
          h += `</div>`;
        } else if (UI.moreSub === 'stats') {
          h += `<div class="card col stats">` + ['play', 'run', 'total', 'runEarned', 'pps', 'mult', 'taps', 'golden', 'buys', 'rebirths', 'asc', 'awak', 'mut', 'moon', 'runes', 'ach', 'combo', 'streak']
            .map(k => `<div class="srow"><span>${t('st_' + k)}</span><b data-k="st_${k}"></b></div>`).join('') + `</div>`;
        } else h += UI.settingsHtml();
        return h;
      },
      vals() {
        if (UI.moreSub !== 'stats') return {};
        const c = Economy.get();
        return {
          st_play: Fmt.time(S.stats.playTime), st_run: Fmt.time(S.stats.runTime), st_total: Fmt.num(S.totalEarned),
          st_runEarned: Fmt.num(S.runEarned), st_pps: Fmt.num(c.pps, 1), st_mult: 'x' + Fmt.mult(c.pm),
          st_taps: Fmt.num(S.stats.taps), st_golden: Fmt.num(S.stats.golden), st_buys: Fmt.num(S.stats.buys),
          st_rebirths: Fmt.num(S.stats.rebirthsAll), st_asc: Fmt.num(S.stats.ascAll), st_awak: Fmt.num(S.awakenings),
          st_mut: Fmt.num(S.mutagenTotal), st_moon: Fmt.num(S.moonTotal), st_runes: Fmt.num(S.runesTotal),
          st_ach: Object.keys(S.ach).length + ' / ' + Meta.list.length, st_combo: 'x' + S.stats.maxCombo.toFixed(2), st_streak: String(S.login.streak),
        };
      },
    },
  },
  visibleGens() {
    let n = 1;
    for (let i = 0; i < GEN_COUNT; i++) if (S.gens[i] > 0) n = Math.max(n, i + 2);
    return Math.min(GEN_COUNT, n);
  },
  taskText(tk) {
    if (tk.type === 'earn') return t('task_earn', { v: Fmt.num(BN.from(tk.target)) });
    return t('task_' + tk.type, { n: Fmt.num(tk.target) });
  },
  taskProg(tk) {
    if (tk.type === 'earn') return Fmt.num(BN.from(tk.progress)) + ' / ' + Fmt.num(BN.from(tk.target));
    return Fmt.num(Math.floor(tk.progress)) + ' / ' + Fmt.num(tk.target);
  },
  settingsHtml() {
    const tg = (act, on) => `<button class="toggle ${on ? 'on' : ''}" data-act="${act}">${on ? t('on') : t('off')}</button>`;
    return `<div class="card col settings">
      <div class="srow"><span>🔊 ${t('sound')}</span>${tg('snd', S.settings.sound)}</div>
      <div class="srow"><span>🎵 ${t('music')}</span>${tg('mus', S.settings.music)}</div>
      <div class="srow"><span>🌐 ${t('language')}</span><div class="seg mini">
        <button class="${I18n.lang === 'ru' ? 'on' : ''}" data-act="lang" data-l="ru">RU</button>
        <button class="${I18n.lang === 'en' ? 'on' : ''}" data-act="lang" data-l="en">EN</button></div></div>
      <button class="wide-btn danger" data-act="reset">🗑️ ${t('reset')}</button>
    </div>`;
  },

  // ---------------- действия ----------------
  action(act, d, el) {
    switch (act) {
      case 'buy': {
        const i = +d.i, n = Economy.buyCount(i);
        if (Economy.buyGen(i, n)) {
          SFX.buy(); this.fxAt(el, ['#8be37a', '#ffd166', '#fff', CONFIG.generators[i].color], 18);
          Scene.syncMinis();
        } else { SFX.error(); this.shake(el); }
        break;
      }
      case 'mode': S.buyMode = +d.m; this.render(); break;
      case 'upg': {
        const u = Economy.upgradeList().find(x => x.key === d.key);
        if (u && Economy.buyUpgrade(u)) { SFX.upgrade(); this.fxAt(el, ['#ffd166', '#7ad7ff', '#fff'], 26, 's'); this.render(); }
        else { SFX.error(); this.shake(el); }
        break;
      }
      case 'upgall': {
        let k = 0;
        for (const u of Economy.upgradeList()) if (Economy.buyUpgrade(u)) k++;
        if (k) { SFX.upgrade(); this.fxAt(el, ['#ffd166', '#7ad7ff', '#fff'], 40, 's'); this.render(); }
        break;
      }
      case 'ac': if (Economy.buyAutoClick()) { SFX.upgrade(); this.fxAt(el, ['#7ad7ff', '#fff'], 20); } else SFX.error(); break;
      case 'hire': if (Economy.hireManager(+d.i)) { SFX.upgrade(); this.fxAt(el, ['#ffd166', '#fff'], 24); this.render(); } else SFX.error(); break;
      case 'mtog': S.managerOn[+d.i] = !S.managerOn[+d.i]; this.render(); break;
      case 'rb': this.confirm(t('rb_confirm', { v: Fmt.num(Prestige.rebirthGain()) }), () => Game.prestige(1)); break;
      case 'asc': this.confirm(t('asc_confirm', { v: Fmt.num(Prestige.ascGain()) }), () => Game.prestige(2)); break;
      case 'aw': this.confirm(t('aw_confirm', { v: Fmt.num(Prestige.awGain()) }), () => Game.prestige(3)); break;
      case 'tree': this.treeModal(+d.tree); break;
      case 'node': this.treeSel = d.id; this.treeRender(); break;
      case 'nodebuy': {
        const k = this.modal && this.modal.tree;
        if (k && Prestige.buyNode(k, d.id)) { SFX.upgrade(); this.fxAt(el, ['#c08bff', '#7ad7ff', '#fff'], 30); this.treeRender(); this.render(); }
        else SFX.error();
        break;
      }
      case 'login': {
        const r = Meta.claimLogin();
        if (r) { SFX.ach(); this.fxAt(el, ['#ffd166', '#8be37a', '#fff'], 40, 's'); FX.text(this.cx(el), this.cy(el) - 20, '+' + Fmt.num(r.r), '#ffd166', 30); this.closeModalIf('login'); this.render(); }
        break;
      }
      case 'task': { const r = Meta.claimTask(+d.i); if (r) { SFX.ach(); this.fxAt(el, ['#ffd166', '#fff'], 30, 's'); FX.text(this.cx(el), this.cy(el) - 20, '+' + Fmt.num(r), '#ffd166', 28); this.render(); } break; }
      case 'weekly': { const r = Meta.claimWeekly(); if (r) { SFX.ach(); this.fxAt(el, ['#ffd166', '#c08bff', '#fff'], 50, 's'); this.render(); } break; }
      case 'ad': Ads.byKind(d.kind, el); break;
      case 'sub': this.moreSub = d.s; this.render(); break;
      case 'ach': {
        const a = Meta.list.find(x => x.id === d.id);
        if (a) this.toast(`<b>${a.icon} ${a.name()}</b><br>${a.desc()}${S.ach[a.id] ? ' ✔' : ''}`, { dur: 3 });
        break;
      }
      case 'snd': S.settings.sound = !S.settings.sound; SFX.applySettings(); this.rerenderSettings(); break;
      case 'mus': S.settings.music = !S.settings.music; SFX.init(); SFX.applySettings(); this.rerenderSettings(); break;
      case 'lang': {
        const inModal = this.modal && this.modal.kind === 'settings';
        S.settings.lang = d.l; I18n.set(d.l); this.applyStatic(); this.render();
        if (inModal) { this.closeModal(); this.settingsModal(); }
        Save.save();
        break;
      }
      case 'reset': this.confirm(t('reset_q'), () => setTimeout(() => this.confirm(t('reset_q2'), () => Game.resetAll()), 50)); break;
      case 'mbtn': { const b = this.modal && this.modal.buttons[+d.i]; if (b) { if (!b.keep) this.closeModal(true); if (b.fn) b.fn(); } break; }
      case 'mclose': this.closeModal(); break;
      case 'tbtn': { const fn = this.toastFns[d.id]; if (fn) { fn(); el.closest('.toast').remove(); } break; }
      default: break;
    }
    this.refresh();
  },
  rerenderSettings() {
    if (this.tab === 'more' && this.moreSub === 'set') this.render();
    if (this.modal && this.modal.kind === 'settings') { this.closeModal(); this.settingsModal(); }
    Save.save();
  },
  cx(el) { const r = el.getBoundingClientRect(); return r.left + r.width / 2; },
  cy(el) { const r = el.getBoundingClientRect(); return r.top + r.height / 2; },
  fxAt(el, colors, n, shape) { if (el) FX.burst(this.cx(el), this.cy(el), n, colors, 260, 5, shape || 'c'); },
  shake(el) { if (!el) return; el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); },

  // ---------------- модальные окна ----------------
  modalOpen() { return !!this.modal; },
  openModal(m) {
    if (this.modal) { this.queue.push(m); return; }
    this.modal = m;
    const btns = (m.buttons || []).map((b, i) => `<button class="mb ${b.cls || ''}" data-act="mbtn" data-i="${i}">${b.label}</button>`).join('');
    $('modal-root').innerHTML = `<div class="mwrap"><div class="modal ${m.cls || ''}">
      ${m.noClose ? '' : '<button class="mx" data-act="mclose" aria-label="close">✕</button>'}
      <h2>${m.title}</h2><div class="mbody">${m.html || ''}</div>${btns ? `<div class="mbtns">${btns}</div>` : ''}</div></div>`;
    m.dyn = Array.from($('modal-root').querySelectorAll('[data-k]'));
    requestAnimationFrame(() => { const w = $('modal-root').querySelector('.mwrap'); if (w) w.classList.add('show'); });
    if (m.vals) this.applyVals(m.dyn, m.vals());
    Game.updateGameplay();
  },
  closeModal(viaButton) {
    const m = this.modal;
    if (!m) return;
    this.modal = null;
    $('modal-root').innerHTML = '';
    if (!viaButton && m.onClose) { try { m.onClose(); } catch (e) { /* ничего */ } }
    if (m.after) { try { m.after(); } catch (e) { /* ничего */ } }
    if (this.queue.length) this.openModal(this.queue.shift());
    Game.updateGameplay();
  },
  closeModalIf(kind) { if (this.modal && this.modal.kind === kind) this.closeModal(true); },
  confirm(text, fn) {
    this.openModal({ kind: 'confirm', title: '❓', html: `<p class="mtext">${text}</p>`,
      buttons: [{ label: t('cancel'), cls: 'ghost' }, { label: t('yes'), cls: 'hot', fn }] });
  },
  settingsModal() { this.openModal({ kind: 'settings', title: '⚙️ ' + t('settings_title'), html: this.settingsHtml() }); },
  adsModal() {
    const row = (kind, icon, title, desc) => `<div class="card adrow"><div class="ico sm" style="--c:#ffd166">${icon}</div>
      <div class="info"><div class="name">${title}</div><div class="desc" data-k="${kind}d">${desc}</div><div class="bar cd"><i data-k="${kind}bar"></i></div></div>
      <button class="buy ad" data-act="ad" data-kind="${kind}" data-k="${kind}btn"><span class="n" data-k="${kind}lbl"></span></button></div>`;
    this.openModal({
      kind: 'ads', title: '🎁 ' + t('ads_title'),
      html: `<p class="mtext">${t('ads_intro')}</p>` +
        row('boost', '⚡', t('ad_boost', { h: CONFIG.ads.boost.hours }), t('ad_boost_desc', { m: CONFIG.ads.boost.maxHours })) +
        row('instant', '💰', t('ad_instant'), '') +
        row('summon', '🥚', t('ad_summon'), t('ad_summon_desc')),
      vals() {
        const v = {};
        ['boost', 'instant', 'summon'].forEach(k => {
          const left = Ads.cdLeft(k), cd = CONFIG.ads[k].cd;
          v[k + 'lbl'] = left > 0 ? t('ad_cd', { t: Fmt.time(left) }) : t('ad_watch');
          v[k + 'btn'] = { off: left > 0 || Ads.busy };
          v[k + 'bar'] = { w: 1 - left / cd };
        });
        v.instantd = t('ad_instant_desc', { m: CONFIG.ads.instant.minutes, v: cur(Economy.incomeFor(CONFIG.ads.instant.minutes, CONFIG.ads.instant.minMoney)) });
        const bl = (S.boosts.adUntil - Date.now()) / 1000;
        v.boostd = bl > 0 ? t('boost_left', { t: Fmt.time(bl) }) : t('ad_boost_desc', { m: CONFIG.ads.boost.maxHours });
        return v;
      },
    });
  },
  offlineModal(sec, gain) {
    let claimed = false;
    const claim = mult => {
      if (claimed) return;
      claimed = true;
      Economy.earn(gain.mul(mult));
      FX.burst(window.innerWidth / 2, window.innerHeight / 2, 60, ['#8be37a', '#ffd166', '#fff'], 320, 6, 's');
      FX.text(window.innerWidth / 2, window.innerHeight / 2 - 40, '+' + Fmt.num(gain.mul(mult)), '#8be37a', 36);
      SFX.ach();
    };
    this.openModal({
      kind: 'offline', title: '🌙 ' + t('off_title'),
      html: `<p class="mtext">${t('off_text', { t: Fmt.time(Math.min(sec, Economy.offlineCapSec())) })}</p>
        <div class="bigval">${cur(gain)}</div>
        <p class="desc center small">${t('off_cap', { h: Fmt.num(Economy.offlineCapSec() / 3600), p: Math.round(Economy.offlineEff() * 100) })}</p>`,
      buttons: [
        { label: t('off_claim'), cls: 'ghost', fn: () => claim(1) },
        { label: t('off_claim2'), cls: 'hot ad', keep: true, fn: () => Ads.rewarded('offline', () => { claim(2); UI.closeModalIf('offline'); }) },
      ],
      onClose: () => claim(1),
      after: () => { claim(1); Ads.interstitial(); },
    });
  },
  loginModal() {
    if (!Meta.loginAvailable()) return;
    const next = Meta.loginNextStreak();
    let days = '';
    for (let d = 1; d <= 7; d++) days += `<div class="day ${d < next ? 'done' : d === next ? 'today' : ''}"><span>${d}</span><b>${d === 7 ? '💎' : '🟢'}</b></div>`;
    this.openModal({
      kind: 'login', title: '🎁 ' + t('login_title'),
      html: `<p class="mtext">${t('login_text')}</p><div class="days">${days}</div><div class="bigval">${cur(Meta.loginReward(next))}</div>`,
      buttons: [{ label: t('claim'), cls: 'hot', keep: true, fn: () => this.action('login', {}, $('modal-root').querySelector('.mb.hot')) }],
    });
  },
  // ---------------- деревья престижа ----------------
  treeModal(k) {
    this.treeSel = null;
    const title = t('tree' + k + '_title');
    this.openModal({ kind: 'tree', tree: k, cls: 'wide', title, html: `<div class="tree-top" data-k="tbal"></div><div class="tree-scroll"><div class="tree" id="tree"></div></div><div class="tree-info" id="tree-info"></div>`,
      vals: () => ({ tbal: t('have', { v: Fmt.num(Prestige.balance(k)) + (k === 1 ? ' 🧪' : k === 2 ? ' 🌙' : ' 🔮') }) }) });
    this.treeRender();
  },
  treeRender() {
    const m = this.modal;
    if (!m || m.kind !== 'tree') return;
    const k = m.tree, nodes = TREES[k];
    const CW = 58, CH = 74, P = 34;
    const maxX = Math.max(...nodes.map(n => n.x)), maxY = Math.max(...nodes.map(n => n.y));
    const W = maxX * CW + P * 2 + 10, H = maxY * CH + P * 2;
    const pos = n => [P + 5 + n.x * CW, P + n.y * CH];
    let lines = '';
    for (const n of nodes) for (const r of n.req || []) {
      const p = nodes.find(x => x.id === r);
      if (!p) continue;
      const [x1, y1] = pos(p), [x2, y2] = pos(n);
      const on = S['tree' + k][r] && S['tree' + k][n.id];
      lines += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${on ? 'on' : ''}"/>`;
    }
    let html = `<svg width="${W}" height="${H}">${lines}</svg>`;
    for (const n of nodes) {
      const st = Prestige.nodeState(k, n), [x, y] = pos(n);
      const afford = st === 'available' && Prestige.balance(k).gte(n.cost);
      html += `<button class="node ${st} ${afford ? 'afford' : ''} ${this.treeSel === n.id ? 'sel' : ''}" style="left:${x}px;top:${y}px" data-act="node" data-id="${n.id}">
        <span>${n.icon}</span><small>${st === 'owned' ? '✔' : Fmt.num(n.cost)}</small></button>`;
    }
    const tree = $('tree');
    tree.style.width = W + 'px'; tree.style.height = H + 'px';
    tree.innerHTML = html;
    const sel = nodes.find(n => n.id === this.treeSel);
    let info = `<div class="desc center">${t('node_tap')}</div>`;
    if (sel) {
      const st = Prestige.nodeState(k, sel);
      info = `<div class="name">${sel.icon} ${I18n.node(sel.id)}</div><div class="desc">${effText(sel.eff)}</div>`;
      if (st === 'owned') info += `<div class="claimed">${t('node_owned')}</div>`;
      else if (st === 'locked') info += `<div class="desc small">🔒 ${t('node_locked')}</div>`;
      else info += `<button class="buy ${Prestige.balance(k).gte(sel.cost) ? '' : 'off'}" data-act="nodebuy" data-id="${sel.id}"><span class="n">${t('node_buy')}</span><span class="c">${Fmt.num(sel.cost)} ${k === 1 ? '🧪' : k === 2 ? '🌙' : '🔮'}</span></button>`;
    }
    $('tree-info').innerHTML = info;
    if (m.vals) this.applyVals(m.dyn, m.vals());
  },
  // ---------------- тосты и подсказки ----------------
  toastFns: {}, toastSeq: 0,
  toast(html, o = {}) {
    const box = $('toasts');
    while (box.children.length >= 4) box.firstChild.remove();
    const el = document.createElement('div');
    el.className = 'toast ' + (o.cls || '');
    let btn = '';
    if (o.btn) { const id = 't' + (++this.toastSeq); this.toastFns[id] = o.btn.fn; btn = `<button class="tb" data-act="tbtn" data-id="${id}">${o.btn.label}</button>`; }
    el.innerHTML = `<div class="tt">${html}</div>${btn}`;
    box.appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 400); }, (o.dur || 2.5) * 1000);
  },
  achToast(a) { this.toast(`<span class="ai">${a.icon}</span><div><small>${t('ach_unlocked')}</small><br><b>${a.name()}</b></div>`, { cls: 'achv', dur: 3.5 }); },
  hint(text, mode) {
    const el = $('hint');
    if (!text) { el.classList.add('hidden'); this.hintMode = null; return; }
    if (el.textContent !== text) el.textContent = text;
    el.classList.remove('hidden');
    el.classList.toggle('tip', mode === 'tip');
    this.hintMode = mode;
    if (mode === 'tip') this.hintTimer = 7;
  },
  // имитация рекламы для локального режима
  fakeAd(ms, done) {
    const el = $('adfake');
    el.innerHTML = `<div>📺</div><div>AD (local test)</div>`;
    el.classList.remove('hidden');
    setTimeout(() => { el.classList.add('hidden'); done(); }, ms);
  },
  hideLoading() { const l = $('loading'); if (l) { l.classList.add('done'); setTimeout(() => l.remove(), 600); } },
};

// ===================== ADS: реклама только по желанию =====================
const Ads = {
  busy: false, lastInter: Date.now(),
  cdLeft(kind) { return Math.max(0, ((S.adCd[kind] || 0) - Date.now()) / 1000); },
  // награда выдаётся строго в onRewarded
  rewarded(kind, onReward) {
    if (this.busy) return;
    if (kind in S.adCd && this.cdLeft(kind) > 0) { UI.toast(t('ad_cd', { t: Fmt.time(this.cdLeft(kind)) })); return; }
    this.busy = true;
    let got = false;
    Platform.showRewarded({
      onOpen: () => Game.setPause('ad', true),
      onRewarded: () => {
        got = true;
        if (CONFIG.ads[kind] && CONFIG.ads[kind].cd) S.adCd[kind] = Date.now() + CONFIG.ads[kind].cd * 1000;
        try { onReward(); } catch (e) { /* награда не должна ронять игру */ }
      },
      onClose: () => {
        this.busy = false; this.lastInter = Date.now();
        Game.setPause('ad', false);
        UI.toast(got ? t('ad_thanks') : t('ad_no_reward'));
        UI.refresh(); Save.save();
      },
      onError: () => {
        this.busy = false;
        Game.setPause('ad', false);
        UI.toast(t('ad_unavailable'));
      },
    });
  },
  byKind(kind, el) {
    if (kind === 'boost') {
      this.rewarded('boost', () => {
        const now = Date.now(), cfg = CONFIG.ads.boost;
        S.boosts.adUntil = Math.min(now + cfg.maxHours * 3600e3, Math.max(now, S.boosts.adUntil) + cfg.hours * 3600e3);
        Economy.invalidate();
      });
    } else if (kind === 'instant') {
      this.rewarded('instant', () => {
        const r = Economy.incomeFor(CONFIG.ads.instant.minutes, CONFIG.ads.instant.minMoney);
        Economy.earn(r);
        FX.text(window.innerWidth / 2, window.innerHeight * 0.4, '+' + Fmt.num(r), '#ffd166', 36);
      });
    } else if (kind === 'summon') {
      this.rewarded('summon', () => { UI.closeModalIf('ads'); Golden.spawn(); });
    } else if (kind === 'extra') {
      if (S.daily.extra) return;
      this.rewarded('extra', () => { Meta.addExtraTask(); UI.render(); });
    }
  },
  // полноэкранная — редко и только в естественных паузах
  interstitial() {
    const now = Date.now();
    if (this.busy || now - Game.startedAt < CONFIG.ads.interFirstSec * 1000 || now - this.lastInter < CONFIG.ads.interMinSec * 1000) return;
    this.busy = true; this.lastInter = now;
    const end = () => { this.busy = false; Game.setPause('ad', false); };
    Platform.showInterstitial({ onOpen: () => Game.setPause('ad', true), onClose: end, onError: end });
  },
};

// ===================== GOLDEN: случайное событие =====================
const Golden = {
  el: null, life: 0,
  update(dt) {
    if (this.el) {
      this.life -= dt;
      if (this.life <= 0) this.miss();
      return;
    }
    S.golden.next -= dt;
    if (S.golden.next <= 0) this.spawn();
  },
  spawn() {
    this.remove();
    const cfg = CONFIG.golden;
    S.golden.next = U.rand(cfg.minSec, cfg.maxSec) * Prestige.E.goldenFreq;
    const layer = $('golden-layer');
    const el = document.createElement('button');
    el.className = 'golden';
    el.setAttribute('aria-label', 'golden');
    el.innerHTML = '<i class="ge l"></i><i class="ge r"></i><i class="gm"></i>';
    el.style.left = U.rand(8, 78) + '%';
    el.style.top = U.rand(8, 55) + '%';
    el.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); this.catch(e.clientX, e.clientY); });
    layer.appendChild(el);
    this.el = el; this.life = cfg.lifeSec;
    SFX.golden();
  },
  remove() { if (this.el) { this.el.remove(); this.el = null; } },
  catch(x, y) {
    if (!this.el) return;
    this.remove();
    const cfg = CONFIG.golden, c = Economy.get();
    S.stats.golden++;
    Meta.track('golden', 1);
    SFX.golden();
    FX.burst(x, y, 50, ['#ffd166', '#fff3c4', '#ffb35c'], 340, 6, 's');
    if (Math.random() < cfg.frenzyChance) {
      S.boosts.frenzyMult = cfg.frenzyMult + Prestige.E.goldenPow;
      S.boosts.frenzyLeft = cfg.frenzySec * Prestige.E.goldenDur;
      Economy.invalidate();
      const msg = t('gold_frenzy', { m: S.boosts.frenzyMult, s: Math.round(S.boosts.frenzyLeft) });
      UI.toast('🔥 ' + msg, { cls: 'gold' });
      FX.text(x, y - 30, 'x' + S.boosts.frenzyMult + '!', '#ffd166', 40);
    } else {
      const r = BN.max(c.ppsBase.mul(cfg.instantSec), c.tapBase.mul(cfg.instantTapMin)).floor();
      Economy.earn(r);
      UI.toast('✨ ' + t('gold_instant', { v: Fmt.num(r) }), { cls: 'gold' });
      FX.text(x, y - 30, '+' + Fmt.num(r), '#ffd166', 36);
    }
  },
  miss() {
    this.remove();
    if (Ads.cdLeft('restore') > 0) return;
    UI.toast('🥚 ' + t('gold_missed'), { dur: CONFIG.golden.restoreWindowSec,
      btn: { label: t('gold_restore'), fn: () => Ads.rewarded('restore', () => Golden.spawn()) } });
  },
};

// ===================== TUTORIAL =====================
const Tutorial = {
  tipT: 25, tipIdx: 0,
  update(dt) {
    const tu = S.tutorial;
    if (!tu.done) {
      tu.time += dt;
      const key = S.stats.taps < 5 ? 'tut_tap' : S.gens[0] < 1 ? 'tut_buy' : 'tut_more';
      UI.hint(t(key), 'tut');
      if (key === 'tut_buy' && UI.tab !== 'farm') UI.setTab('farm');
      const basics = S.stats.taps >= 5 && S.gens[0] >= 1;
      if ((tu.time >= CONFIG.tutorialSec && basics) || tu.time >= CONFIG.tutorialSec * 2) { tu.done = true; UI.hint(null); }
      return;
    }
    // ненавязчивые советы
    this.tipT -= dt;
    if (this.tipT <= 0 && !UI.modalOpen()) {
      this.tipT = CONFIG.tipEverySec;
      const tips = t('tips');
      const tip = tips[this.tipIdx++ % tips.length].replace('{h}', Fmt.num(Economy.offlineCapSec() / 3600));
      UI.hint(tip, 'tip');
    }
  },
};

// ===================== GAME: цикл, паузы, престиж =====================
const Game = {
  pauses: new Set(), last: 0, pausedAt: 0, startedAt: Date.now(), ready: false,
  acc: { ui: 0, save: 0, mgr: 0, ach: 0, day: 0 }, autoAcc: 0, autoFx: 0, tapTimes: [], loginShown: false,
  start() {
    this.last = performance.now();
    requestAnimationFrame(ts => this.loop(ts));
  },
  loop(ts) {
    requestAnimationFrame(t2 => this.loop(t2));
    let dt = (ts - this.last) / 1000;
    this.last = ts;
    if (this.pauses.size > 0) return; // пауза: цикл не считает
    if (!(dt >= 0)) dt = 0;
    if (dt > CONFIG.maxActiveGapSec) { this.catchUp(dt); dt = 0; }
    try {
      this.update(dt, ts / 1000);
      Scene.draw(); FX.draw(); UI.frame(dt);
    } catch (e) { /* не даём циклу умереть */ }
  },
  update(dt, nowSec) {
    S.stats.playTime += dt; S.stats.runTime += dt;
    Economy.update(dt, nowSec);
    // автотапер
    const rate = Economy.autoClickRate();
    if (rate > 0) {
      this.autoAcc += rate * dt;
      if (this.autoAcc >= 1) {
        const n = Math.floor(this.autoAcc); this.autoAcc -= n;
        const v = Economy.get().tap.mul(n);
        Economy.earn(v);
        this.autoFx += n;
        if (this.autoFx >= Math.max(1, rate)) {
          this.autoFx = 0;
          const m = Scene.monster(), r = Scene.cv.getBoundingClientRect();
          FX.text(r.left + m.x + U.rand(-m.r, m.r), r.top + m.y - m.r, '+' + Fmt.num(v.mul(Math.max(1, rate) / n)), '#bfe9ff', 18);
          Scene.sqv -= 1.5;
        }
      }
    }
    Golden.update(dt);
    const a = this.acc;
    a.mgr += dt;
    if (a.mgr >= CONFIG.managers.tickSec) { a.mgr = 0; if (Economy.runManagers() > 0) Scene.syncMinis(); }
    a.ach += dt;
    if (a.ach >= 1) {
      a.ach = 0;
      for (const ach of Meta.checkAch()) { UI.achToast(ach); SFX.ach(); }
    }
    a.day += dt;
    if (a.day >= 5) {
      a.day = 0;
      if (Meta.checkDay()) UI.refresh();
      if (S.tutorial.done && !this.loginShown && !UI.modalOpen() && Meta.loginAvailable()) { this.loginShown = true; UI.loginModal(); }
    }
    a.save += dt;
    if (a.save >= CONFIG.autosaveSec) { a.save = 0; Save.save(); }
    a.ui += dt;
    if (a.ui >= CONFIG.uiTickSec) { a.ui = 0; UI.tick(); }
    Tutorial.update(dt);
    Scene.update(dt); FX.update(dt);
  },
  // время, которое игра «не видела» (фон, реклама)
  catchUp(sec) {
    if (!(sec > 0)) return;
    if (sec < CONFIG.offline.minSec) {
      Economy.earn(Economy.get().ppsBase.mul(sec));
      S.stats.playTime += sec;
    } else this.offline(sec);
  },
  offline(sec) {
    const gain = Economy.offlineGain(sec);
    if (gain.m > 0) UI.offlineModal(sec, gain);
  },
  setPause(reason, on) {
    const was = this.pauses.size > 0;
    if (on) this.pauses.add(reason); else this.pauses.delete(reason);
    const now = this.pauses.size > 0;
    if (was !== now) {
      if (now) { this.pausedAt = Date.now(); SFX.setPaused(true); Save.save(); }
      else {
        this.last = performance.now();
        SFX.setPaused(false);
        this.catchUp((Date.now() - this.pausedAt) / 1000);
      }
    }
    this.updateGameplay();
  },
  updateGameplay() {
    if (!this.ready) return;
    if (this.pauses.size === 0 && !UI.modalOpen()) Platform.gameplayStart(); else Platform.gameplayStop();
  },
  // тап по монстру
  tap(x, y, clientX, clientY) {
    const now = performance.now();
    this.tapTimes = this.tapTimes.filter(tt => now - tt < 1000);
    if (this.tapTimes.length >= CONFIG.maxTapsPerSec) return;
    this.tapTimes.push(now);
    const res = Economy.tap(now / 1000);
    Scene.poke(x, y);
    SFX.click(Economy.combo);
    const hue = Scene.hue();
    FX.text(clientX, clientY - 20, '+' + Fmt.num(res.val), res.isMax ? '#ffd166' : '#ffffff', res.isMax ? 30 : 26);
    FX.burst(clientX, clientY, 6, [`hsl(${hue},80%,65%)`, `hsl(${hue},80%,80%)`], 200, 4);
  },
  prestige(level) {
    let gain;
    if (level === 1) gain = Prestige.doRebirth();
    else if (level === 2) gain = Prestige.doAscend();
    else gain = Prestige.doAwaken();
    if (!gain || (gain instanceof BN ? gain.lt(1) : gain < 1)) return;
    Golden.remove();
    SFX.prestige();
    for (let i = 0; i < 4; i++) setTimeout(() => FX.burst(window.innerWidth * U.rand(0.2, 0.8), window.innerHeight * U.rand(0.2, 0.6), 50,
      level === 1 ? ['#8be37a', '#c0ffb0', '#fff'] : level === 2 ? ['#bfe9ff', '#7aa8ff', '#fff'] : ['#c08bff', '#ffd166', '#fff'], 360, 6, 's'), i * 180);
    UI.shownMoney = S.money;
    Scene.syncMinis();
    UI.render();
    Save.save(true);
    setTimeout(() => Ads.interstitial(), 1500); // естественная пауза
  },
  resetAll() {
    const lang = S.settings.lang;
    S = newState();
    S.settings.lang = lang;
    S.tutorial.done = true;
    Prestige.recalc(); Economy.invalidate();
    Meta.checkDay();
    Golden.remove();
    UI.shownMoney = BN.ZERO;
    Scene.syncMinis();
    UI.setTab('farm');
    Save.save(true);
    UI.toast(t('reset_done'));
  },
};

// ===================== Защита ввода и системные события =====================
function installGuards() {
  const prevent = e => e.preventDefault();
  document.addEventListener('contextmenu', prevent);
  document.addEventListener('selectstart', prevent);
  document.addEventListener('dragstart', prevent);
  document.addEventListener('dblclick', prevent, { passive: false });
  document.addEventListener('gesturestart', prevent, { passive: false });
  document.addEventListener('touchmove', e => { if (e.touches && e.touches.length > 1) e.preventDefault(); }, { passive: false });
  document.addEventListener('wheel', e => { if (e.ctrlKey) e.preventDefault(); }, { passive: false });
  document.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && ['+', '-', '=', '0'].includes(e.key)) e.preventDefault(); });
  // первый жест — запускаем звук; клик возвращает фокус
  document.addEventListener('pointerdown', () => { SFX.init(); if (Game.pauses.has('blur')) Game.setPause('blur', false); }, true);
  document.addEventListener('visibilitychange', () => Game.setPause('hidden', document.hidden));
  window.addEventListener('blur', () => Game.setPause('blur', true));
  window.addEventListener('focus', () => Game.setPause('blur', false));
  window.addEventListener('pagehide', () => Save.save(true));
  window.addEventListener('resize', () => { Scene.resize(); FX.resize(); });
  window.addEventListener('error', () => { /* глушим, чтобы игра не падала */ });
  window.addEventListener('unhandledrejection', e => e.preventDefault());
}

function bindScene() {
  const cv = $('scene-cv');
  cv.addEventListener('pointerdown', e => {
    e.preventDefault();
    const r = cv.getBoundingClientRect();
    Game.tap(e.clientX - r.left, e.clientY - r.top, e.clientX, e.clientY);
  });
}

// ===================== BOOT =====================
async function boot() {
  installGuards();
  await Platform.init();
  let loaded = null;
  try { loaded = await Save.load(); } catch (e) { loaded = null; }
  if (loaded) S = loaded;
  I18n.set(S.settings.lang || Platform.getLang());
  Meta.build();
  Prestige.recalc();
  Economy.invalidate();
  Meta.checkDay();
  Meta.checkAch();
  Scene.init(); FX.init();
  UI.init();
  bindScene();
  Scene.syncMinis();
  Game.startedAt = Date.now();
  Ads.lastInter = Date.now();
  Game.start();
  UI.hideLoading();
  Platform.ready();          // LoadingAPI.ready() — ровно один раз
  Game.ready = true;
  if (document.hidden) Game.setPause('hidden', true);
  const away = (Date.now() - S.lastSave) / 1000;
  if (loaded && away >= CONFIG.offline.minSec) Game.offline(away);
  Game.updateGameplay();
  Save.save();
}

if (typeof window === 'undefined') {
  // Node: экспорт логики для балансных тестов
  module.exports = { CONFIG, BN, Economy, Prestige, Meta, newState, getState: () => S, setState: s => { S = s; } };
} else {
  window.addEventListener('DOMContentLoaded', () => { boot().catch(() => { UI.hideLoading(); }); });
}
