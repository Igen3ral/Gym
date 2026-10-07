// Notification strings follow the recipient's saved language, not the server locale.
export function notificationText(lang, kind, value) {
  const fa = lang === 'fa'
  switch (kind) {
    case 'rest': return {
      title: fa ? 'استراحت تمام شد 💪' : 'Rest over 💪',
      body: fa ? 'وقت ست بعدی است.' : 'Time for your next set.'
    }
    case 'test': return {
      title: 'openGym',
      body: fa ? 'اعلان آزمایشی ✅ — اعلان‌ها به این شکل نمایش داده می‌شوند.' : 'Test notification ✅ — this is what alerts look like.'
    }
    case 'day': return {
      title: value ? (fa ? `${value.emoji || '🏋️'} ${value.name} امروز` : `${value.emoji || '🏋️'} ${value.name} today`) : fa ? 'امروز تمرین دارید' : 'Workout planned today',
      body: fa ? 'در برنامهٔ شماست؛ شروع کنیم 💪' : "It's on your plan — let's go 💪"
    }
    case 'coach': return {
      title: fa ? 'مربی تمرین‌های شما را بررسی کرده است' : 'Your Coach has been reading',
      body: fa ? `${Number(value).toLocaleString('fa-IR')} پیشنهاد پس از این هفته` : value === 1 ? '1 suggestion after this week' : `${value} suggestions after this week`
    }
    default: throw new Error('Unknown notification kind')
  }
}
