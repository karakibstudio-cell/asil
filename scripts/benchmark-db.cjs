const https = require('https');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://nejmudhoamtugdaqfbdd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lam11ZGhvYW10dWdkYXFmYmRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2ODM3NDgsImV4cCI6MjEwNjI1OTc0OH0.E_VF3-JH9wyWxgSJyHBk8SS8BQM1nrDLYZN9I9YU6P8';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function runBenchmark() {
  console.log('⚡ Starting Database Connection & Latency Benchmark...');
  
  // 1. Raw HTTPS Ping
  const pingStart = Date.now();
  await new Promise((resolve) => {
    https.get(`${SUPABASE_URL}/rest/v1/`, { headers: { apikey: SUPABASE_KEY } }, (res) => {
      res.on('data', () => {});
      res.on('end', () => {
        const pingTime = Date.now() - pingStart;
        console.log(`📡 Network Roundtrip Ping: ${pingTime}ms (HTTP ${res.statusCode})`);
        resolve();
      });
    }).on('error', (err) => {
      console.error('Ping error:', err.message);
      resolve();
    });
  });

  // 2. Hotels Table Query Speed
  const hotelsStart = Date.now();
  const { data: hotels, error: hotelsErr } = await supabase.from('hotels').select('id, name, city, is_active').limit(25);
  const hotelsTime = Date.now() - hotelsStart;
  if (hotelsErr) {
    console.error('❌ Hotels Query Error:', hotelsErr.message);
  } else {
    console.log(`🏨 Hotels Query Speed: ${hotelsTime}ms | Retrieved: ${hotels?.length || 0} hotels`);
  }

  // 3. Site Settings / Content Query Speed
  const contentStart = Date.now();
  const { data: content, error: contentErr } = await supabase.from('content').select('key, updated_at').limit(10);
  const contentTime = Date.now() - contentStart;
  if (contentErr) {
    console.error('❌ Content Query Error:', contentErr.message);
  } else {
    console.log(`⚙️ Content/Settings Query Speed: ${contentTime}ms | Retrieved: ${content?.length || 0} items`);
  }

  // 4. Bookings Table Query Speed
  const bookingsStart = Date.now();
  const { data: bookings, error: bookingsErr } = await supabase.from('room_bookings').select('id, status, created_at').limit(10);
  const bookingsTime = Date.now() - bookingsStart;
  if (bookingsErr) {
    console.log('ℹ️ room_bookings table status:', bookingsErr.message);
  } else {
    console.log(`📋 Bookings Query Speed: ${bookingsTime}ms | Retrieved: ${bookings?.length || 0} bookings`);
  }

  console.log('✅ Database Benchmark Completed!');
}

runBenchmark().catch(console.error);
