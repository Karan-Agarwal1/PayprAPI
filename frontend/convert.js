const fs = require('fs'); 
const html = fs.readFileSync('scratch_stitch/landing.html', 'utf8'); 
const match = html.match(/tailwind\.config\s*=\s*(\{[\s\S]*?\})\s*<\/script>/); 
if (match) { 
  const configStr = match[1].replace(/(['"])?([a-zA-Z0-9_-]+)(['"])?:/g, '"$2":').replace(/'/g, '"').replace(/,(?=\s*\})/g, '').replace(/"darkMode":\s*"class",/,''); 
  try { 
    const config = JSON.parse(configStr); 
    let theme = '@theme {\n'; 
    for (const [k, v] of Object.entries(config.theme.extend.colors)) { 
      theme += '  --color-' + k + ': ' + v + ';\n'; 
    } 
    theme += '  --font-headline: "Space Grotesk", sans-serif;\n  --font-body: "Inter", sans-serif;\n  --font-label: "Inter", sans-serif;\n}\n'; 
    console.log(theme); 
  } catch(e) { 
    console.log('JSON Parse error', e); 
    console.log(configStr); 
  } 
} else { 
  console.log('No tailwind config found'); 
}
