const https = require('https');

const url = 'https://sjcgomwwcmvnkprecfcb.supabase.co/rest/v1/authors?select=*';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqY2dvbXd3Y212bmtwcmVjZmNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzODk3ODYsImV4cCI6MjA4Mzk2NTc4Nn0.pkDnbi6tQpNC57YQ1XdQo3qepQnYznTjl8xfg2E_l2Q';

const options = {
    headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
    }
};

https.get(url, options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log(data);
    });
}).on('error', (err) => {
    console.error(err);
});
