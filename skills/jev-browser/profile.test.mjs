import assert from 'node:assert/strict';
import test from 'node:test';
import { profileDirectory as resolveProfileDirectory } from './tab.mjs';

const profileDirectory = (profile, cache, host = 'other-host') => resolveProfileDirectory(profile, cache, host);

test('Pro Work uses the existing DEX work session despite blank Google metadata', () => {
  assert.equal(profileDirectory('work', {
    Default: { name: 'DEX - work', user_name: '' },
    'Profile 4': { name: 'Tyler', user_name: 'tnewman@quantafinance.com' },
  }, 'Tylers-MacBook-Pro.local'), 'Default');
});

test('Pro Work refuses a missing, relabeled or personal session binding', () => {
  for (const bound of [undefined, { name: 'Personal', user_name: '' }, { name: 'DEX - work', user_name: 'tylerjnewman18@gmail.com' }]) {
    assert.throws(() => profileDirectory('work', {
      ...(bound ? { Default: bound } : {}),
      'Profile 4': { user_name: 'tnewman@quantafinance.com' },
    }, 'Tylers-MacBook-Pro.local'), /bound DEX Work profile/);
  }
});

test('Work selects Quanta when Default belongs to the personal account', () => {
  assert.equal(profileDirectory('work', {
    Default: { user_name: 'tylerjnewman18@gmail.com' },
    'Profile 1': { user_name: 'tnewman@quantafinance.com' },
    'Profile 2': { user_name: '' },
  }), 'Profile 1');
});

test('Work still selects Default when it belongs to Quanta', () => {
  assert.equal(profileDirectory('work', {
    Default: { user_name: 'tnewman@quantafinance.com' },
    'Profile 2': { user_name: 'tylerjnewman18@gmail.com' },
  }), 'Default');
});

test('Work refuses missing, ambiguous and unsupported Quanta profiles', () => {
  for (const cache of [undefined, {}, { Default: { user_name: 'tylerjnewman18@gmail.com' } }]) {
    assert.throws(() => profileDirectory('work', cache), /found 0/);
  }
  assert.throws(() => profileDirectory('work', {
    Default: { user_name: 'tnewman@quantafinance.com' },
    'Profile 1': { user_name: 'tnewman@quantafinance.com' },
  }), /found 2/);
  assert.throws(() => profileDirectory('work', {
    '../outside': { user_name: 'tnewman@quantafinance.com' },
  }), /unsupported directory/);
});

test('Personal and dev retain their existing explicit directories', () => {
  assert.equal(profileDirectory('personal'), 'Profile 2');
  assert.equal(profileDirectory('dev'), 'Profile 3');
  assert.throws(() => profileDirectory('other'), /unknown profile/);
});
