async function test() {
  const url = 'https://prestige-ksa.web.app/ar/hotels/prestige-ajyad';
  console.log('Fetching:', url);
  const res = await fetch(url);
  const text = await res.text();
  console.log('Status:', res.status);
  console.log('Title Match:', text.match(/<title>(.*?)<\/title>/)?.[1]);
  console.log('H1 Match:', text.match(/<h1>(.*?)<\/h1>/)?.[1]);
  console.log('Canonical Match:', text.match(/<link rel="canonical" href="(.*?)"/)?.[1]);
  console.log('Has JSON-LD:', text.includes('application/ld+json'));
  const enUrl = 'https://prestige-ksa.web.app/en/hotels/prestige-ajyad';
  console.log('Fetching EN:', enUrl);
  const enRes = await fetch(enUrl);
  const enText = await enRes.text();
  console.log('EN Status:', enRes.status);
  console.log('EN Title Match:', enText.match(/<title>(.*?)<\/title>/)?.[1]);
  console.log('EN Canonical Match:', enText.match(/<link rel="canonical" href="(.*?)"/)?.[1]);
  console.log('EN Lang:', enText.match(/<html lang="(.*?)"/)?.[1]);
}
test();
