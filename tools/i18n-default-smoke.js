#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'i18n.js'), 'utf8');

function boot(language, savedLocale) {
  const values = new Map();
  if (savedLocale) values.set('tiny-cosmos-locale-v1', savedLocale);
  const windowObject = {};
  const context = vm.createContext({
    window: windowObject,
    navigator: { language, languages: [language] },
    localStorage: {
      getItem: (key) => values.has(key) ? values.get(key) : null,
      setItem: (key, value) => values.set(key, value),
    },
    document: {
      body: null,
      dispatchEvent: () => {},
    },
    CustomEvent: function CustomEvent() {},
  });
  vm.runInContext(source, context, { filename: 'js/i18n.js' });
  return { i18n: windowObject.GameI18n, values };
}

const english = boot('en-US');
assert.strictEqual(english.i18n.getLocale(), 'en');

const chinese = boot('zh-TW');
assert.strictEqual(chinese.i18n.getLocale(), 'zh-CN');

const savedChinese = boot('fr-FR', 'zh-CN');
assert.strictEqual(savedChinese.i18n.getLocale(), 'zh-CN');
assert.strictEqual(savedChinese.i18n.hasSavedPreference(), true);
assert.strictEqual(savedChinese.i18n.setAutomaticLocale('en-US'), false);

const platformChinese = boot('en-US');
assert.strictEqual(platformChinese.i18n.setAutomaticLocale('zh-CN'), true);
assert.strictEqual(platformChinese.i18n.getLocale(), 'zh-CN');
assert.strictEqual(platformChinese.values.has('tiny-cosmos-locale-v1'), false);

platformChinese.i18n.setLocale('en');
assert.strictEqual(platformChinese.values.get('tiny-cosmos-locale-v1'), 'en');
assert.strictEqual(platformChinese.i18n.setAutomaticLocale('zh-CN'), false);
assert.strictEqual(platformChinese.i18n.getLocale(), 'en');

console.log('System-language default and explicit locale preference smoke passed.');
