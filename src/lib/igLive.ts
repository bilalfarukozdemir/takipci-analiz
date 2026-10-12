/**
 * Instagram oturumuyla canlı liste çekme.
 *
 * Kod Instagram sayfasının *içinde* çalışır: WebView'e enjekte edilen script,
 * kullanıcının kendi oturum çerezleriyle Instagram'ın web arayüzünün kullandığı
 * uçlara istek atar ve sonucu React tarafına yollar. Şifre hiçbir zaman
 * uygulamaya girilmez; giriş Instagram'ın kendi sayfasında yapılır ve çerezler
 * WebView'in dışına çıkarılmaz.
 *
 * Not: Bu yöntem Instagram'ın kullanım şartlarına aykırıdır ve çok hızlı
 * istek atılırsa hesaba geçici işlem engeli gelebilir. Bu yüzden istekler
 * aralıklı ve rastgele gecikmelerle atılır.
 */

/** Instagram web arayüzünün kendi uygulama kimliği. */
const APP_ID = '936619743392459';

/** Sayfa başına çekilen hesap sayısı. */
const PAGE = 50;

export type LiveKind = 'followers' | 'following';

export type LiveMessage =
  | { t: 'state'; logged: boolean; uid: string }
  | { t: 'totals'; followers: number | null; following: number | null }
  | { t: 'chunk'; kind: LiveKind; users: { u: string; n?: string; p?: string }[] }
  | { t: 'progress'; kind: LiveKind; count: number; total: number | null }
  | { t: 'done' }
  | { t: 'error'; code: 'session' | 'challenge' | 'limit' | 'http' | 'cancel' | 'unknown'; detail?: string };

// Both scripts must interpret Instagram's authentication responses identically.
const REQUEST_JS = `
  var authPath = function(url){
    var path = String(url || '').split('?')[0];
    if (/\\/(challenge|checkpoint)(\\/|$)/i.test(path)) return 'challenge';
    if (/\\/accounts\\/login(\\/|$)/i.test(path)) return 'session';
    return '';
  };
  var jget = function(url){
    return fetch(url, { headers: headers, credentials: 'include' }).then(function(res){
      var redirectedAuth = res.redirected && authPath(res.url);
      if (redirectedAuth) throw new Error(redirectedAuth);
      if (res.status === 429) throw new Error('limit');
      return res.json().catch(function(){
        if (res.status === 401) throw new Error('session');
        if (res.status === 403) throw new Error('challenge');
        throw new Error('http-' + res.status);
      }).then(function(j){
        var message = String((j && j.message) || '');
        if (j && (j.challenge || j.checkpoint_url) || /challenge_required|checkpoint_required|consent_required/i.test(message)) {
          throw new Error('challenge');
        }
        if (res.status === 401 || /login_required|not logged in/i.test(message)) throw new Error('session');
        if (res.status === 403) throw new Error('challenge');
        if (!res.ok || j && j.status === 'fail') throw new Error('http-' + res.status + (message ? ' ' + message.slice(0, 80) : ''));
        return j;
      });
    });
  };
`;

/**
 * Her sayfa yüklendiğinde çalışır: oturum durumunu bildirir.
 * Instagram tek sayfa uygulaması olduğu için çerezi periyodik de yoklar.
 */
export const PROBE_JS = `
(function(){
  if (window.__igProbe) { return; }
  window.__igProbe = true;
  var ck = function(k){
    var m = document.cookie.match(new RegExp('(^|; )' + k + '=([^;]*)'));
    return m ? decodeURIComponent(m[2]) : '';
  };
  var post = function(m){
    try { window.ReactNativeWebView.postMessage(JSON.stringify(m)); } catch (e) {}
  };
  var last = null;
  var checked = null;
  var pending = false;
  var headers = { 'x-ig-app-id': '${APP_ID}', 'x-requested-with': 'XMLHttpRequest' };
  ${REQUEST_JS}
  var tick = function(){
    var uid = ck('ds_user_id');
    var pathError = authPath(window.location.pathname);
    if (pathError === 'challenge') {
      if (last !== 'challenge') { last = 'challenge'; post({ t: 'error', code: 'challenge' }); }
      return;
    }
    if (!uid || pathError === 'session') {
      checked = null;
      if (last !== '0') { last = '0'; post({ t: 'state', logged: false, uid: '' }); }
      return;
    }
    // A stale ds_user_id is not proof of authentication. Check once per account/page,
    // never repeatedly poll the API while a security check or login is required.
    if (pending || checked === uid) return;
    checked = uid;
    pending = true;
    headers['x-csrftoken'] = ck('csrftoken');
    var accept = function(){
      last = '1:' + uid;
      post({ t: 'state', logged: true, uid: uid });
    };
    jget('/api/v1/accounts/current_user/?edit=true').then(function(j){
      if (uid !== ck('ds_user_id') || authPath(window.location.pathname)) return;
      if (j && j.user && String(j.user.pk) !== uid) throw new Error('session');
      accept();
    }).catch(function(e){
      if (uid !== ck('ds_user_id') || authPath(window.location.pathname)) return;
      var code = String((e && e.message) || e);
      if (code === 'session' || code === 'challenge' || code === 'limit') {
        post({ t: 'error', code: code });
        return;
      }
      // This check is only a guard against stale cookies. If Instagram answers it in an
      // unexpected way, do not block login; the list fetch reports its own real error.
      accept();
    }).then(function(){ pending = false; });
  };
  tick();
  setInterval(tick, 1000);
})();
true;
`;

/** Listeleri çeken asıl script. */
export const HARVEST_JS = `
(function(){
  if (window.__igRunning) { return; }
  window.__igRunning = true;
  window.__igStop = false;

  var post = function(m){
    try { window.ReactNativeWebView.postMessage(JSON.stringify(m)); } catch (e) {}
  };
  var ck = function(k){
    var m = document.cookie.match(new RegExp('(^|; )' + k + '=([^;]*)'));
    return m ? decodeURIComponent(m[2]) : '';
  };
  var sleep = function(ms){ return new Promise(function(r){ setTimeout(r, ms); }); };
  var rnd = function(a, b){ return a + Math.floor(Math.random() * (b - a)); };

  var uid = ck('ds_user_id');
  if (!uid) {
    post({ t: 'error', code: 'session' });
    window.__igRunning = false;
    return;
  }

  var headers = {
    'x-ig-app-id': '${APP_ID}',
    'x-csrftoken': ck('csrftoken'),
    'x-requested-with': 'XMLHttpRequest'
  };

  ${REQUEST_JS}

  var totals = function(){
    return jget('/api/v1/users/' + uid + '/info/').then(function(j){
      var u = (j && j.user) || {};
      return {
        followers: typeof u.follower_count === 'number' ? u.follower_count : null,
        following: typeof u.following_count === 'number' ? u.following_count : null
      };
    }).catch(function(e){
      if (e.message === 'session' || e.message === 'challenge' || e.message === 'limit') throw e;
      return { followers: null, following: null };
    });
  };

  var harvest = function(kind, total){
    var seen = 0;
    var maxId = '';
    var pages = 0;
    var step = function(){
      if (window.__igStop) { throw new Error('cancel'); }
      var url = '/api/v1/friendships/' + uid + '/' + kind + '/?count=${PAGE}'
        + (maxId ? '&max_id=' + encodeURIComponent(maxId) : '');
      return jget(url).then(function(j){
        var list = j && j.users ? j.users : [];
        var users = [];
        for (var i = 0; i < list.length; i++) {
          var x = list[i];
          if (!x || !x.username) { continue; }
          var o = { u: String(x.username) };
          if (x.full_name && x.full_name !== x.username) { o.n = String(x.full_name); }
          var pic = x.profile_pic_url || x.profile_pic_url_hd;
          if (pic) { o.p = String(pic); }
          users.push(o);
        }
        seen += users.length;
        pages += 1;
        post({ t: 'chunk', kind: kind, users: users });
        post({ t: 'progress', kind: kind, count: seen, total: total });
        maxId = j && j.next_max_id ? String(j.next_max_id) : '';
        if (!maxId || users.length === 0) { return; }
        var wait = rnd(1200, 2300);
        if (pages % 8 === 0) { wait += rnd(3000, 5500); }
        return sleep(wait).then(step);
      });
    };
    return Promise.resolve().then(step);
  };

  totals().then(function(t){
    post({ t: 'totals', followers: t.followers, following: t.following });
    return harvest('followers', t.followers).then(function(){
      return sleep(rnd(2000, 3500));
    }).then(function(){
      return harvest('following', t.following);
    });
  }).then(function(){
    post({ t: 'done' });
  }).catch(function(e){
    var m = String((e && e.message) || e);
    var code = 'unknown';
    if (m === 'session') { code = 'session'; }
    else if (m === 'challenge') { code = 'challenge'; }
    else if (m === 'limit') { code = 'limit'; }
    else if (m === 'cancel') { code = 'cancel'; }
    else if (m.indexOf('http-') === 0) { code = 'http'; }
    post({ t: 'error', code: code, detail: m });
  }).then(function(){
    window.__igRunning = false;
  });
})();
true;
`;

export const STOP_JS = 'window.__igStop = true; true;';

export const LOGIN_URL = 'https://www.instagram.com/accounts/login/';

export function parseMessage(raw: string): LiveMessage | null {
  try {
    const m = JSON.parse(raw);
    return m && typeof m.t === 'string' ? (m as LiveMessage) : null;
  } catch {
    return null;
  }
}
