const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const cron = require('node-cron');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Initialize cron job for bill generation
  cron.schedule('0 * * * *', async () => {
    console.log('Running scheduled bill generation cron job...');
    try {
      // Dynamic import for CommonJS
      const generateBillsModule = require('./pages/api/cron/generate-monthly-bills.js');
      const handler = generateBillsModule.default || generateBillsModule;
      
      // Create mock request and response
      const req = {
        method: 'POST',
        headers: {}
      };
      
      const res = {
        status: (code) => ({
          json: (data) => {
            if (code >= 200 && code < 300) {
              console.log('✅ Cron job completed successfully:', data);
            } else {
              console.error('❌ Cron job failed:', data);
            }
          }
        })
      };

      await handler(req, res);
    } catch (error) {
      console.error('❌ Error in scheduled bills generation:', error);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata" // Indian timezone
  });

  console.log('✅ Cron job initialized - will run every hour');

  const port = process.env.PORT || 3000;

  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(port, () => {
    console.log(`> Ready on port ${port}`);
  });
  
});