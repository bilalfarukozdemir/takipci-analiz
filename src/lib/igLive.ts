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
  | { t: 'error'; code: 'session' | 'limit' | 'http' | 'cancel' | 'unknown'; detail?: string };

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
  var tick = function(){
    var uid = ck('ds_user_id');
    var key = uid ? '1:' + uid : '0';
    if (key !== last) { last = key; post({ t: 'state', logged: !!uid, uid: uid }); }
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

  var jget = function(url){
    return fetch(url, { headers: headers, credentials: 'include' }).then(function(res){
      if (res.status === 401 || res.status === 403) { throw new Error('session'); }
      if (res.status === 429) { throw new Error('limit'); }
      if (!res.ok) { throw new Error('http-' + res.status); }
      return res.json();
    });
  };

  var totals = function(){
    return jget('/api/v1/users/' + uid + '/info/').then(function(j){
      var u = (j && j.user) || {};
      return {
        followers: typeof u.follower_count === 'number' ? u.follower_count : null,
        following: typeof u.following_count === 'number' ? u.following_count : null
      };
    }).catch(function(){ return { followers: null, following: null }; });
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
