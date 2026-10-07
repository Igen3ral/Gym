// HTML numeric fields do not understand Persian/Arabic digits. Normalize only
// at the input boundary; persisted weights, reps and exercise IDs stay unchanged.
export function numberDraft(raw, decimal = true) {
  let s = String(raw)
    .replace(/[۰-۹]/g, c => String(c.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, c => String(c.charCodeAt(0) - 0x0660))
    .replace(/٬/g, '')
    .replace(/[٫,]/g, '.')
    .replace(/[^0-9.]/g, '')
  const i = s.indexOf('.')
  if (i !== -1) s = decimal ? s.slice(0, i + 1) + s.slice(i + 1).replace(/\./g, '') : s.slice(0, i)
  return s
}

export const persianDigits = value => String(value).replace(/[0-9]/g, c => '۰۱۲۳۴۵۶۷۸۹'[+c]).replace(/\./g, '٫')
