import fetch from 'node-fetch';
import fs from 'fs';

(async () => {
  const res = await fetch('http://localhost:8000/api/translate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Payment': 'txid:WK5OYKQ55GOPSIX2MUL3AQE7ADVKCT5Y2AJBS7YMQ'
    },
    body: JSON.stringify({text: 'hello', target_lang: 'es', source_lang: 'auto'})
  });
  const data = await res.json();
  fs.writeFileSync('err.json', JSON.stringify(data, null, 2));
})();
