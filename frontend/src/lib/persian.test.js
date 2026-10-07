import { afterEach, describe, expect, it, vi } from 'vitest'
import fa from '../locales/fa.js'
import tr from '../locales/tr.js'
import extra from '../extra-locales/fa.js'
import { dateLocale, direction, getLang, setLang, t, instrFor, instructionsLanguage, errorText } from './i18n.js'
import { fmtDate, fmtDur, fmtNum, todayISO } from './format.js'
import { numberDraft, persianDigits } from './numeric-input.js'
import { planPrintHTML } from './plan-share.js'
import { EXDB, EXIDX, matchesExercise } from './exercises.js'
import sourceNames from '../exercise-names/fa.js'
import reviewedInstructions from '../instr/fa.js'
import { parseWorkoutCSV } from './import-csv.js'

afterEach(async () => { await setLang('en'); vi.unstubAllGlobals() })

describe('Persian localization', () => {
  it('covers every built-in exercise name without changing IDs or custom names', async () => {
    expect(Object.keys(sourceNames).sort()).toEqual(EXDB.map(ex => ex.id).sort())
    await setLang('fa')
    for (const ex of EXDB) {
      expect(ex.n, ex.id).toMatch(/[\u0600-\u06ff]/)
      expect(ex.n, ex.id).not.toMatch(/[a-z]/i)
      expect(matchesExercise(ex, ex.sourceName), ex.id).toBe(true)
    }
    const custom = { id: 'custom_test', n: 'My exercise' }
    expect(custom.n).toBe('My exercise')
    expect(EXIDX['0001'].n).toBe('درازونشست سه‌چهارم')
    await setLang('en')
    expect(EXIDX['0001'].n).toBe('3/4 sit-up')
  })

  it('continues matching original CSV exercise names while Persian is active', async () => {
    await setLang('fa')
    const ex = EXDB.find(e => e.sourceName === 'band concentration curl')
    const result = parseWorkoutCSV('Date,Exercise,Weight,Reps\n2026-10-07,band concentration curl,20,10', { unit: 'kg' })
    expect(result.error).toBeUndefined()
    expect(result.workouts[0].entries[0].id).toBe(ex.id)
  })

  it('keeps reviewed instructions aligned with source steps and labels English fallback', async () => {
    await setLang('fa')
    for (const [id, steps] of Object.entries(reviewedInstructions)) {
      expect(steps.length, id).toBe(EXIDX[id].st.length)
      expect(instrFor(EXIDX[id]), id).toEqual(steps)
      expect(instructionsLanguage(EXIDX[id]), id).toBe('fa')
      for (const step of steps) {
        expect(step).toMatch(/[\u0600-\u06ff]/)
        expect(step).not.toMatch(/[a-z]/i)
      }
    }
    const untranslated = { id: 'untranslated_example', st: ['Source instructions'] }
    expect(instructionsLanguage(untranslated)).toBe('en')
    expect(instrFor(untranslated)).toEqual(untranslated.st)
    await setLang('en')
    expect(instrFor(EXIDX['0001'])).toEqual(EXIDX['0001'].st)
  })

  it('localizes units and unknown API diagnostics without exposing raw English', async () => {
    await setLang('fa')
    expect(t('Weight ({0})', 'kg')).toBe('وزنه (کیلوگرم)')
    expect(errorText('verification failed: invalid challenge')).toMatch(/تأیید کلید ورود/)
    expect(errorText('HTTP 503')).toContain('۵۰۳')
    expect(errorText('Provider runtime error')).toBe('انجام درخواست ناموفق بود؛ دوباره تلاش کنید.')
    await setLang('en')
    expect(errorText('Provider runtime error')).toBe('Provider runtime error')
  })

  it('covers every existing UI key and preserves every interpolation placeholder', () => {
    expect(Object.keys(fa).sort()).toEqual(Object.keys(tr).sort())
    for (const [source, translated] of Object.entries({ ...fa, ...extra })) {
      expect(translated.trim(), source).not.toBe('')
      const placeholders = s => [...new Set(s.match(/\{\d+\}/g) || [])].sort()
      expect(placeholders(translated), source).toEqual(placeholders(source))
    }
  })

  it('loads Persian text and RTL document attributes, then restores English', async () => {
    const root = {}
    vi.stubGlobal('document', { documentElement: root })
    await setLang('fa')
    expect(root).toEqual({ lang: 'fa', dir: 'rtl' })
    expect(direction()).toBe('rtl')
    expect(t('Settings')).toBe('تنظیمات')
    expect(t('Admin dashboard')).toBe('پنل مدیریت')
    expect(t('Clear')).toBe('پاک کردن')
    expect(t('{0} exercises', 12)).toBe('۱۲ حرکت')
    expect(t('Welcome, {0}', 'Alex')).toBe('خوش آمدید، Alex')
    await setLang('en')
    expect(root).toEqual({ lang: 'en', dir: 'ltr' })
    expect(t('Settings')).toBe('Settings')
  })

  it('keeps the most recently selected language during overlapping lazy loads', async () => {
    await setLang('en')
    await Promise.all([setLang('fa'), setLang('en')])
    expect(getLang()).toBe('en')
    await Promise.all([setLang('en'), setLang('fa')])
    expect(getLang()).toBe('fa')
  })

  it('uses Persian numbers and Gregorian labels matching the existing calendar grids', async () => {
    await setLang('fa')
    expect(dateLocale()).toBe('fa-IR-u-ca-gregory')
    expect(fmtNum(72.5)).toBe('۷۲٫۵')
    expect(fmtDate('2026-10-07')).toMatch(/اکتبر/)
    expect(fmtDur(95 * 60000)).toBe('۱ ساعت و ۳۵ دقیقه')
    // Storage and exports retain machine-readable dates.
    expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('prints Persian headings and RTL without modifying exercise IDs or user names', async () => {
    await setLang('fa')
    const state = { routines: [{ id: 'r1', name: '<برنامهٔ من>', ex: [{ id: '0001', sets: 3, reps: 10 }] }], week: { 1: 'r1' } }
    const html = planPrintHTML(state, '<Alex>')
    expect(html).toContain('lang="fa" dir="rtl"')
    expect(html).toContain('برنامهٔ تمرین هفتگی')
    expect(html).toContain('&lt;Alex&gt;')
    expect(html).toContain('&lt;برنامهٔ من&gt;')
    expect(state.routines[0].ex[0].id).toBe('0001')
  })

  it('searches Persian muscle and equipment labels as well as original English names', async () => {
    await setLang('fa')
    const ex = { n: 'dumbbell bench press', bp: 'chest', tg: 'pectorals', eq: 'dumbbell' }
    expect(matchesExercise(ex, 'سينه')).toBe(true)
    expect(matchesExercise(ex, 'دمبل')).toBe(true)
    expect(matchesExercise(ex, 'bench')).toBe(true)
    expect(matchesExercise(ex, 'ساق')).toBe(false)
    expect(ex.n).toBe('dumbbell bench press')
  })
})

describe('Localized numeric input', () => {
  it.each([
    ['۷۲٫۵', true, '72.5'], ['٧٢٫٥', true, '72.5'], ['۱٬۲۳۴٫۵', true, '1234.5'],
    ['72,5', true, '72.5'], ['۱۲٫', true, '12.'], ['۱۲٫۵', false, '12'],
    ['', true, ''], ['٫', true, '.'], ['۱۲٫۳٫۴', true, '12.34']
  ])('normalizes %s without losing draft semantics', (raw, decimal, expected) => {
    expect(numberDraft(raw, decimal)).toBe(expected)
  })
  it('round trips fractional weights without changing the stored numeric value', () => {
    expect(Number(numberDraft(persianDigits(72.5)))).toBe(72.5)
    expect(persianDigits('12.')).toBe('۱۲٫')
  })
})
