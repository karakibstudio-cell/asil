const fs = require('fs');
const text = fs.readFileSync('./src/data/mockHotels.ts', 'utf8');
const lines = text.split('\n').filter(l => l.includes('"mainImage":'));
console.log('Total hotels with mainImage:', lines.length);
lines.forEach((l, i) => console.log(`${i + 1}: ${l.trim()}`));
