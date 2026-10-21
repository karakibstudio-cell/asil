const fs = require('fs');
const content = fs.readFileSync('./src/data/mockHotels.ts', 'utf8');
const lines = content.split('\n');
let currentHotel = '';
for (let line of lines) {
  if (line.includes('"name":')) {
    currentHotel = line.trim();
  }
  if (line.includes('"galleryImages":')) {
    console.log(currentHotel, line.trim());
  }
}
