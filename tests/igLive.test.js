const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { PROBE_JS, HARVEST_JS } = require('../.testbuild/lib/igLive.js');

function response(status, body, extra = {}) {
  return { status, ok: status >= 200 && status < 300, json: async () => body, ...extra };
}

function browser(script, replies, pathname = '/') {
  const messages = [];
  const requests = [];
  const intervals = [];
  const document = { cookie: 'ds_user_id=42; csrftoken=token' };
  const window = { location: { pathname }, ReactNativeWebView: { postMessage: raw => messages.push(JSON.parse(raw)) } };
  const context = vm.createContext({
    window, document,
    setInterval: fn => intervals.push(fn),
    setTimeout: fn => { fn(); },
    fetch: async (url, options) => {
      requests.push({ url, options });
      if (!replies.length) throw new Error('Unexpected request');
      return replies.shift();
    },
  });
  vm.runInContext(script, context);
  return { messages, requests, intervals, document, window, context };
}

const settle = () => new Promise(resolve => setImmediate(resolve));

function connectScreen() {
  const fs = require('node:fs');
  const path = require('node:path');
  const ts = require('typescript');
  const slots = [];
  let cursor = 0;
  const React = {
    createElement: (type, props, ...children) => ({ type, props: props || {}, children }),
    useRef: value => { const i = cursor++; return slots[i] ||= { current: value }; },
    useState: initial => {
      const i = cursor++;
      if (!(i in slots)) slots[i] = initial;
      return [slots[i], next => { slots[i] = typeof next === 'function' ? next(slots[i]) : next; }];
    },
    useCallback: fn => fn,
    useEffect: () => {},
  };
  const native = { StyleSheet: { create: x => x }, View: 'View', Text: 'Text', ScrollView: 'ScrollView', ActivityIndicator: 'ActivityIndicator' };
  const module = { exports: {} };
  const source = fs.readFileSync(path.join(__dirname, '../src/screens/Connect.tsx'), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true } }).outputText;
  vm.runInNewContext(compiled, {
    module, exports: module.exports,
    require: name => {
      if (name === 'react') return React;
      if (name === 'react-i18next') return { useTranslation: () => ({ t: key => key }) };
      if (name === 'react-native') return native;
      if (name === 'react-native-webview') return { WebView: 'WebView' };
      if (name === '../lib/igLive') return require('../.testbuild/lib/igLive.js');
      if (name === '../lib/fmt') return { sayi: String };
      if (name === '../theme') return { C: {}, S: {} };
      if (name === '../ui/kit') return { Btn: 'Btn', Card: 'Card', Header: 'Header' };
      throw new Error('Unexpected module ' + name);
    },
  });
  let finished = 0;
  let tree;
  const find = (node, predicate) => {
    if (!node || typeof node !== 'object') return null;
    if (predicate(node)) return node;
    for (const child of node.children || []) { const hit = find(child, predicate); if (hit) return hit; }
    return null;
  };
  const render = () => {
    cursor = 0;
    tree = module.exports.Connect({ onBack: () => {}, onFinish: () => finished++ });
    find(tree, n => n.type === 'WebView').props.ref.current = { injectJavaScript: () => {} };
  };
  render();
  return {
    render,
    web: () => find(tree, n => n.type === 'WebView'),
    button: label => find(tree, n => n.type === 'Btn' && n.props.label === label),
    finished: () => finished,
    message: (web, data) => web.props.onMessage({ nativeEvent: { data: JSON.stringify(data) } }),
  };
}

test('session error cannot be revived by stale messages; retry creates a fresh login window', () => {
  const screen = connectScreen();
  const oldWeb = screen.web();
  screen.message(oldWeb, { t: 'state', logged: true, uid: '42' });
  screen.render();
  screen.button('connect.ready.fetchButton').props.onPress();
  screen.render();
  screen.message(screen.web(), { t: 'error', code: 'session' });
  screen.render();
  screen.message(screen.web(), { t: 'state', logged: true, uid: '42' });
  screen.message(screen.web(), { t: 'done' });
  screen.render();
  assert.ok(screen.button('connect.error.loginAgainButton'));
  assert.equal(screen.finished(), 0);
  screen.button('connect.error.loginAgainButton').props.onPress();
  screen.render();
  assert.equal(screen.web().props.key, 1);
  assert.equal(screen.web().props.incognito, true);
  screen.message(oldWeb, { t: 'state', logged: true, uid: '42' });
  screen.render();
  assert.equal(screen.button('connect.ready.fetchButton'), null);
  screen.message(screen.web(), { t: 'state', logged: true, uid: '99' });
  screen.render();
  assert.ok(screen.button('connect.ready.fetchButton'));
});

test('security errors stop completion and require fresh login instead of automatic fetch', () => {
  const screen = connectScreen();
  screen.message(screen.web(), { t: 'state', logged: true, uid: '42' });
  screen.render();
  screen.button('connect.ready.fetchButton').props.onPress();
  screen.render();
  screen.message(screen.web(), { t: 'error', code: 'challenge' });
  screen.message(screen.web(), { t: 'done' });
  screen.render();
  assert.equal(screen.finished(), 0);
  screen.button('connect.error.loginAgainButton').props.onPress();
  screen.render();
  assert.equal(screen.web().props.key, 1);
  assert.equal(screen.button('connect.ready.fetchButton'), null);
});

test('stale account cookie with 401 never reports logged in and is not polled repeatedly', async () => {
  const b = browser(PROBE_JS, [response(401, { message: 'login_required' })]);
  await settle();
  for (let i = 0; i < 10; i++) b.intervals[0]();
  await settle();
  assert.equal(b.requests.length, 1);
  assert.deepEqual(b.messages, [{ t: 'error', code: 'session' }]);
});

test('valid current account is confirmed by server and revoked cookie reports logout', async () => {
  const b = browser(PROBE_JS, [response(200, { status: 'ok', user: { pk: 42 } })]);
  await settle();
  assert.deepEqual(b.messages, [{ t: 'state', logged: true, uid: '42' }]);
  assert.equal(b.requests[0].options.credentials, 'include');
  b.document.cookie = '';
  b.intervals[0]();
  assert.deepEqual(b.messages[1], { t: 'state', logged: false, uid: '' });
});

test('login page with old cookie does not claim authentication or request lists', async () => {
  const b = browser(PROBE_JS, [], '/accounts/login/');
  await settle();
  assert.equal(b.requests.length, 0);
  assert.deepEqual(b.messages, [{ t: 'state', logged: false, uid: '' }]);
});

test('checkpoint page reports security check once without requests', async () => {
  const b = browser(PROBE_JS, [], '/challenge/123/');
  for (let i = 0; i < 10; i++) b.intervals[0]();
  assert.equal(b.requests.length, 0);
  assert.deepEqual(b.messages, [{ t: 'error', code: 'challenge' }]);
});

test('200 login_required and mismatched account are not accepted as valid sessions', async () => {
  for (const body of [{ status: 'fail', message: 'login_required' }, { user: { pk: 99 } }]) {
    const b = browser(PROBE_JS, [response(200, body)]);
    await settle();
    assert.deepEqual(b.messages, [{ t: 'error', code: 'session' }]);
  }
});

test('late validation response for a previous account is ignored', async () => {
  const b = browser(PROBE_JS, [response(200, { user: { pk: 42 } })]);
  b.document.cookie = 'ds_user_id=99';
  await settle();
  assert.deepEqual(b.messages, []);
});

test('authentication failure in totals stops before requesting follower lists', async () => {
  const b = browser(HARVEST_JS, [response(401, { message: 'login_required' })]);
  await settle();
  assert.equal(b.requests.length, 1);
  assert.equal(b.messages.at(-1).code, 'session');
  assert.equal(b.window.__igRunning, false);
});

test('security checks and limits in totals stop the fetch instead of being swallowed', async () => {
  for (const [res, code] of [
    [response(403, { message: 'challenge_required', challenge: {} }), 'challenge'],
    [response(200, { status: 'fail', message: 'checkpoint_required' }), 'challenge'],
    [response(429, {}), 'limit'],
  ]) {
    const b = browser(HARVEST_JS, [res]);
    await settle();
    assert.equal(b.requests.length, 1);
    assert.equal(b.messages.at(-1).code, code);
  }
});

test('redirect to login does not parse HTML as follower data', async () => {
  const b = browser(HARVEST_JS, [response(200, {}, { redirected: true, url: 'https://www.instagram.com/accounts/login/?next=%2F' })]);
  await settle();
  assert.equal(b.messages.at(-1).code, 'session');
  assert.equal(b.requests.length, 1);
});

test('revocation after a partial page does not emit successful completion', async () => {
  const b = browser(HARVEST_JS, [
    response(200, { user: { follower_count: 2, following_count: 0 } }),
    response(200, { users: [{ username: 'example' }], next_max_id: 'next' }),
    response(401, { message: 'login_required' }),
  ]);
  await settle();
  assert.ok(b.messages.some(m => m.t === 'chunk'));
  assert.ok(!b.messages.some(m => m.t === 'done'));
  assert.equal(b.messages.at(-1).code, 'session');
});

test('normal complete fetch still emits both lists and done', async () => {
  const b = browser(HARVEST_JS, [
    response(200, { user: { follower_count: 1, following_count: 1 } }),
    response(200, { users: [{ username: 'follower' }] }),
    response(200, { users: [{ username: 'following' }] }),
  ]);
  await settle();
  assert.equal(b.requests.length, 3);
  assert.deepEqual(b.messages.filter(m => m.t === 'chunk').map(m => m.kind), ['followers', 'following']);
  assert.equal(b.messages.at(-1).t, 'done');
});
