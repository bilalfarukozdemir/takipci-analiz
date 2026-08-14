/**
 * Instagram veri arşivi çözümleyicisinin testleri.
 *
 *   npm test
 *
 * (önce src/lib/*.ts dosyaları .testbuild klasörüne derlenir)
 */
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BUILD = path.join(ROOT, '.testbuild');

const { zipSync, strToU8 } = require('fflate');
const { parseFiles, dedupe } = require(path.join(BUILD, 'lib', 'parse.js'));
const { analyze } = require(path.join(BUILD, 'lib', 'analyze.js'));

let fail = 0;
function check(name, cond, extra) {
  if (cond) console.log('  ✓', name);
  else {
    fail++;
    console.log('  ✗', name, extra !== undefined ? JSON.stringify(extra) : '');
  }
}
const section = (t) => console.log('\n' + t);

const entry = (u, ts) => ({
  title: '',
  media_list_data: [],
  string_list_data: [{ href: `https://www.instagram.com/${u}`, value: u, timestamp: ts }],
});

// ---------------------------------------------------------------- 1
section('1) Modern JSON arşivi (zip)');
{
  const zip = zipSync({
    'connections/followers_and_following/followers_1.json': strToU8(
      JSON.stringify([entry('ali', 1700000000), entry('veli', 1700000100), entry('ayse', 1700000200)])
    ),
    'connections/followers_and_following/following.json': strToU8(
      JSON.stringify({
        relationships_following: [entry('ali', 1690000000), entry('zeynep', 1690000100)],
      })
    ),
    'connections/followers_and_following/pending_follow_requests.json': strToU8(
      JSON.stringify({ relationships_follow_requests_sent: [entry('mehmet', 1695000000)] })
    ),
    'connections/followers_and_following/recently_unfollowed_profiles.json': strToU8(
      JSON.stringify({ relationships_unfollowed_users: [entry('eski_dost', 1699000000)] })
    ),
    'connections/followers_and_following/close_friends.json': strToU8(
      JSON.stringify({ relationships_close_friends: [entry('ali', 1690000000)] })
    ),
    'connections/followers_and_following/blocked_profiles.json': strToU8(
      JSON.stringify({
        relationships_blocked_users: [
          { title: 'kotu_hesap', string_list_data: [{ href: '', value: 'kotu_hesap', timestamp: 1 }] },
        ],
      })
    ),
    // arşivdeki ilgisiz dosyalar
    'ads_information/ads_and_topics/advertisers_using_your_activity.json': strToU8(
      JSON.stringify({ ig_custom_audiences_all_types: [{ advertiser_name: 'X' }] })
    ),
    'media/posts/1.jpg': new Uint8Array([1, 2, 3, 4, 5]),
    'personal_information/personal_information.json': strToU8(JSON.stringify({ profile_user: [] })),
  });
  const r = parseFiles([{ name: 'instagram-arsiv.zip', bytes: zip, size: zip.length }]);

  check('3 takipçi', r.data.followers.length === 3, r.data.followers);
  check('2 takip', r.data.following.length === 2, r.data.following);
  check('bekleyen istek', r.data.pendingSent.map((x) => x.u).join() === 'mehmet');
  check('yakında bırakılan', r.data.recentlyUnfollowed.map((x) => x.u).join() === 'eski_dost');
  check('yakın arkadaş', r.data.closeFriends.map((x) => x.u).join() === 'ali');
  check('engellenen', r.data.blocked.map((x) => x.u).join() === 'kotu_hesap');
  check('zaman damgası korundu', r.data.followers[0].t === 1700000000, r.data.followers[0]);
  check('bilinmeyen dosya yok', r.unknown.length === 0, r.unknown);

  const a = analyze(r.data, null);
  check('geri takip etmeyen = zeynep', a.notFollowingBack.map((x) => x.u).join() === 'zeynep');
  check('hayranlar = ayse,veli', a.fans.map((x) => x.u).sort().join() === 'ayse,veli');
  check('karşılıklı = ali', a.mutual.map((x) => x.u).join() === 'ali');
  check('ilk yüklemede takipten çıkan yok', a.lostFollowers.length === 0);
}

// ---------------------------------------------------------------- 2
section('2) Çok parçalı takipçi dosyaları + fark analizi');
{
  const eski = parseFiles([
    {
      name: 'eski.zip',
      bytes: zipSync({
        'followers_1.json': strToU8(JSON.stringify([entry('a', 1), entry('b', 2)])),
        'followers_2.json': strToU8(JSON.stringify([entry('c', 3), entry('d', 4)])),
        'following.json': strToU8(
          JSON.stringify({ relationships_following: [entry('a', 1), entry('x', 9)] })
        ),
      }),
      size: 1,
    },
  ]);
  check('4 takipçi (2 parça birleşti)', eski.data.followers.length === 4, eski.data.followers);

  const yeni = parseFiles([
    {
      name: 'yeni.zip',
      bytes: zipSync({
        'followers_1.json': strToU8(JSON.stringify([entry('a', 1), entry('c', 3), entry('e', 5)])),
        'following.json': strToU8(
          JSON.stringify({ relationships_following: [entry('a', 1), entry('y', 8)] })
        ),
      }),
      size: 1,
    },
  ]);

  const a = analyze(yeni.data, eski.data);
  check('takipten çıkanlar = b,d', a.lostFollowers.map((x) => x.u).sort().join() === 'b,d', a.lostFollowers);
  check('yeni takipçi = e', a.newFollowers.map((x) => x.u).join() === 'e');
  check('bıraktıkların = x', a.stoppedFollowing.map((x) => x.u).join() === 'x');
  check('yeni takip = y', a.startedFollowing.map((x) => x.u).join() === 'y');
  check('takipten çıkanın zaman damgası korundu', a.lostFollowers[0].t !== undefined);
}

// ---------------------------------------------------------------- 3
section('3) HTML arşivi');
{
  const html = (users) =>
    `<!DOCTYPE html><html><body><div class="pam">${users
      .map(
        (u) =>
          `<div><a href="https://www.instagram.com/${u}" target="_blank">${u}</a><div>Jan 5, 2024 8:12 am</div></div>`
      )
      .join('')}</div><a href="https://www.instagram.com/accounts/login">Giriş</a></body></html>`;

  const r = parseFiles([
    {
      name: 'arsiv.zip',
      bytes: zipSync({
        'connections/followers_and_following/followers_1.html': strToU8(html(['ali', 'veli'])),
        'connections/followers_and_following/following.html': strToU8(html(['ali', 'zeynep'])),
      }),
      size: 1,
    },
  ]);
  check('html takipçi', r.data.followers.map((x) => x.u).join() === 'ali,veli', r.data.followers);
  check('html takip', r.data.following.map((x) => x.u).join() === 'ali,zeynep');
  check('login bağlantısı ayıklandı', !r.data.followers.some((x) => x.u === 'accounts'));
}

// ---------------------------------------------------------------- 4
section('4) Doğrudan JSON dosyaları (zip açılmış)');
{
  const r = parseFiles([
    { name: 'followers_1.json', bytes: strToU8(JSON.stringify([entry('ali', 1), entry('veli', 2)])), size: 1 },
    {
      name: 'following.json',
      bytes: strToU8(JSON.stringify({ relationships_following: [entry('ali', 1)] })),
      size: 1,
    },
  ]);
  check('takipçi 2', r.data.followers.length === 2);
  check('takip 1', r.data.following.length === 1);
}

// ---------------------------------------------------------------- 5
section('5) Eski connections.json');
{
  const r = parseFiles([
    {
      name: 'connections.json',
      bytes: strToU8(
        JSON.stringify({
          followers: { ali: '2019-04-01T10:00:00', veli: '2019-05-02T10:00:00' },
          following: { ali: '2019-01-01T10:00:00' },
          blocked_users: { kotu: '2018-01-01T00:00:00' },
        })
      ),
      size: 1,
    },
  ]);
  check('eski format takipçi', r.data.followers.length === 2, r.data.followers);
  check('eski format takip', r.data.following.map((x) => x.u).join() === 'ali');
  check('eski format engellenen', r.data.blocked.map((x) => x.u).join() === 'kotu');
  check('tarih saniyeye çevrildi', typeof r.data.followers[0].t === 'number');
}

// ---------------------------------------------------------------- 6
section('6) Adı tanınmayan dosya');
{
  const r = parseFiles([
    { name: 'liste.json', bytes: strToU8(JSON.stringify([entry('ali', 1), entry('veli', 2)])), size: 1 },
  ]);
  check('bilinmeyen olarak işaretlendi', r.unknown.length === 1 && r.unknown[0].users.length === 2, r.unknown);
  check('kovalara yazılmadı', r.data.followers.length === 0 && r.data.following.length === 0);
}

// ---------------------------------------------------------------- 7
section('7) Sağlamlık');
{
  let atti = false;
  try {
    parseFiles([{ name: 'bos.zip', bytes: zipSync({ 'media/1.jpg': new Uint8Array([1, 2, 3]) }), size: 1 }]);
  } catch (e) {
    atti = e && e.message === 'zip-content';
  }
  check('ilgisiz zip hata veriyor', atti);

  const r = parseFiles([
    { name: 'followers_1.json', bytes: strToU8('{bozuk'), size: 1 },
    {
      name: 'following.json',
      bytes: strToU8(JSON.stringify({ relationships_following: [entry('a', 1)] })),
      size: 1,
    },
  ]);
  check('bozuk dosya çökertmiyor', r.data.following.length === 1 && r.data.followers.length === 0);

  const a = analyze({ ...r.data, followers: [{ u: 'Ali' }], following: [{ u: 'ali' }] }, null);
  check('büyük/küçük harf duyarsız eşleşme', a.mutual.length === 1 && a.notFollowingBack.length === 0);

  const d = dedupe([{ u: 'x', t: 500 }, { u: 'X', t: 100 }]);
  check('dedupe tek kayıt + en eski tarih', d.length === 1 && d[0].t === 100, d);

  const r2 = parseFiles([
    {
      name: 'followers_1.json',
      bytes: strToU8(
        JSON.stringify([
          { string_list_data: [{ href: '', value: 'gecerli_ad', timestamp: 1 }] },
          { string_list_data: [{ href: '', value: 'boşluk var', timestamp: 1 }] },
          { string_list_data: [] },
          {},
        ])
      ),
      size: 1,
    },
  ]);
  check('sadece geçerli kullanıcı adları', r2.data.followers.map((x) => x.u).join() === 'gecerli_ad', r2.data.followers);
}

console.log(fail === 0 ? '\nTÜM TESTLER GEÇTİ' : `\n${fail} TEST BAŞARISIZ`);
process.exit(fail === 0 ? 0 : 1);
