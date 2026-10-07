import { afterEach, describe, expect, it, vi } from 'vitest'
import fa from '../locales/fa.js'
import tr from '../locales/tr.js'
import extra from '../extra-locales/fa.js'
import { dateLocale, direction, getLang, setLang, t } from './i18n.js'
import { fmtDate, fmtDur, fmtNum, todayISO } from './format.js'
import { numberDraft, persianDigits } from './numeric-input.js'
import { planPrintHTML } from './plan-share.js'
import { matchesExercise } from './exercises.js'

afterEach(async () => { await setLang('en'); vi.unstubAllGlobals() })

describe('Persian localization', () => {
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
