import { test } from 'node:test'
import assert from 'node:assert/strict'
import { notificationText } from '../notification-text.js'

test('Persian reminders keep user-created routine names and localize surrounding text', () => {
  const text = notificationText('fa', 'day', { name: 'تمرین من', emoji: '🏋️' })
  assert.equal(text.title, '🏋️ تمرین من امروز')
  assert.match(text.body, /شروع/)
  assert.equal(notificationText('fa', 'coach', 2).body, '۲ پیشنهاد پس از این هفته')
  assert.equal(notificationText('fa', 'rest').title, 'استراحت تمام شد 💪')
})

test('Existing languages preserve notification text and English singular/plural', () => {
  assert.equal(notificationText('en', 'coach', 1).body, '1 suggestion after this week')
  assert.equal(notificationText('de', 'coach', 2).body, '2 suggestions after this week')
  assert.equal(notificationText(undefined, 'day').title, 'Workout planned today')
  assert.equal(notificationText('en', 'rest').body, 'Time for your next set.')
})
