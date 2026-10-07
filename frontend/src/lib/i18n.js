// Tiny dependency-free i18n. English source strings are the keys; locale files in
// src/locales/ map them to translations and are lazy-loaded (Vite code-splits each
// import.meta.glob entry), so the initial bundle stays English-only.
// Exercise instructions come from separately generated packs in src/instr/ (one per
// language, from the upstream dataset) — also lazy-loaded on language switch.
import { useSyncExternalStore } from 'react'

// UI languages. de/pt have no instruction pack upstream — instructions fall back to English.
export const LANGS = {
  en: 'English', de: 'Deutsch', es: 'Español', fr: 'Français', it: 'Italiano',
  pt: 'Português', pl: 'Polski', tr: 'Türkçe', ru: 'Русский', zh: '中文',
  ko: '한국어', hi: 'हिन्दी', fa: 'فارسی'
}
export const INSTR_LANGS = ['en', 'es', 'fr', 'it', 'tr', 'ru', 'zh', 'hi', 'pl', 'ko', 'fa']
const DATE_LOCALES = {
  en: 'en-GB', de: 'de-DE', es: 'es-ES', fr: 'fr-FR', it: 'it-IT', pt: 'pt-PT',
  pl: 'pl-PL', tr: 'tr-TR', ru: 'ru-RU', zh: 'zh-CN', ko: 'ko-KR', hi: 'hi-IN',
  // The calendar grids use Gregorian month boundaries. Keep labels consistent with them.
  fa: 'fa-IR-u-ca-gregory'
}

const localePacks = import.meta.glob('../locales/*.js')
const instrPacks = import.meta.glob('../instr/*.js')

let lang = 'en'
let dict = {}
let instr = null            // { exId: [steps] } for the current language, null = English
let exerciseNames = {}
let version = 0
let languageRequest = 0
const subs = new Set()
const notify = () => { version++; subs.forEach(f => f()) }

export const getLang = () => lang
export const dateLocale = () => DATE_LOCALES[lang] || 'en-GB'
export const direction = () => lang === 'fa' ? 'rtl' : 'ltr'

// Translate a source string; {0},{1}… are replaced with args (also on the English fallback).
export function t(s, ...args) {
  let v = dict[s] || s
  for (let i = 0; i < args.length; i++) {
    let arg = args[i]
    if (lang === 'fa') {
      if (typeof arg === 'number') arg = arg.toLocaleString('fa-IR')
      else if (['kg', 'lbs', 'lb', 'km/h'].includes(arg)) arg = dict[arg] || arg
    }
    v = v.replaceAll('{' + i + '}', arg)
  }
  return v
}
// Backend/provider diagnostics are not all fixed locale keys. Present a localized
// message to the user; API callers retain the original diagnostic on the Error.
export function errorText(message) {
  const source = String(message || 'Request failed')
  const translated = t(source)
  if (lang !== 'fa' || translated !== source || !/[a-z]/i.test(source)) return translated
  if (source.startsWith('verification failed:')) return t('Passkey verification failed')
  if (/^HTTP \d+$/.test(source)) return t('Server request failed ({0})', Number(source.slice(5)))
  return t('The request failed. Please try again.')
}
// Instructions for an exercise in the current language (English steps as fallback).
export const instrFor = ex => (instr && instr[ex.id]) || ex.st || []
export const instructionsLanguage = ex => instr?.[ex.id] ? lang : 'en'
export const exerciseName = ex => exerciseNames[ex.id] || ex.n

export async function setLang(l) {
  if (!LANGS[l]) l = 'en'
  const request = ++languageRequest
  if (l === lang && version > 0) return
  let nextDict = l === 'en' ? {} : (await localePacks['../locales/' + l + '.js']()).default
  if (l === 'fa') nextDict = { ...nextDict, ...(await import('../extra-locales/fa.js')).default }
  const nextInstr = l === 'en' || !INSTR_LANGS.includes(l) ? null : (await instrPacks['../instr/' + l + '.js']()).default
  const nextNames = l === 'fa' ? (await import('../exercise-names/fa.js')).default : {}
  if (request !== languageRequest) return
  lang = l
  dict = nextDict
  instr = nextInstr
  exerciseNames = nextNames
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lang
    document.documentElement.dir = direction()
  }
  notify()
}

// Re-renders the subscribing component (and its children) whenever the language changes.
export function useLang() {
  return useSyncExternalStore(fn => { subs.add(fn); return () => subs.delete(fn) }, () => version)
}
