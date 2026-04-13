const fs = require('fs');

function convertStr(filePath, outPath, componentName, depth = 0) {
  let html = fs.readFileSync(filePath, 'utf8');
  let bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/);
  if(bodyMatch){
    let jsx = bodyMatch[1];
    
    // 1. Escape ALL curly braces globally first
    jsx = jsx.replace(/\{/g, '{"{"}').replace(/\}/g, '{"}"}');

    // 2. Standard HTML to JSX conversions
    jsx = jsx.replace(/className=/g, 'className='); // wait, className wasn't in source
    jsx = jsx.replace(/class=/g, 'className=');
    jsx = jsx.replace(/for=/g, 'htmlFor=');
    jsx = jsx.replace(/<!--([\s\S]*?)-->/g, '{/*$1*/}');
    
    // 3. Handle specific void elements
    jsx = jsx.replace(/<img([^>]+[^\/])>/gi, '<img$1 />');
    jsx = jsx.replace(/<hr([^>]*[^\/])>/gi, '<hr$1 />');
    jsx = jsx.replace(/<input([^>]*[^\/])>/gi, '<input$1 />');
    jsx = jsx.replace(/<br([^>]*[^\/])>/gi, '<br$1 />');
    
    // 4. Fix numeric attributes like rows="4" to rows={4}
    // Note: We search for the original attribute pattern in the source
    jsx = jsx.replace(/(\s)(rows|cols|tabIndex|maxLength|minLength|size|step|max|min)="(\d+)"/gi, '$1$2={$3}');

    // 5. replace styles
    jsx = jsx.replace(/style="([^"]*)"/g, (match, p1) => {
        const styleParts = p1.split(';').filter(s => s.trim());
        const styleObj = {};
        for(const part of styleParts) {
            let [k, v] = part.split(':');
            if(k && v) {
                k = k.trim().replace(/-([a-z])/g, g => g[1].toUpperCase());
                styleObj[k] = v.trim();
            }
        }
        return `style={${JSON.stringify(styleObj)}}`;
    });

    const walletImportPath = depth === 0 ? './components/WalletProvider' : '../components/WalletProvider';

    let fileContent = `'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWallet } from '${walletImportPath}';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function ${componentName}() {
  const { disconnectWallet } = useWallet();
  const [stats, setStats] = useState({ total_apis: 4, total_providers: 3, total_requests: 0, total_earnings: 0 });

  useEffect(() => {
    fetch('http://localhost:8000/registry/stats/overview')
      .then(r => r.json())
      .then(d => setStats(d))
      .catch(() => {});
  }, []);

  return (
    <div className="bg-surface font-body text-on-surface selection:bg-secondary-container selection:text-on-secondary-container">
      ${jsx}
    </div>
  );
}`;
    fs.writeFileSync(outPath, fileContent);
    console.log(`Converted ${filePath} to ${outPath}`);
  }
}

convertStr('scratch_stitch/landing.html', 'app/page.tsx', 'HomePage', 0);
convertStr('scratch_stitch/explore.html', 'app/explore/page.tsx', 'ExplorePage', 1);
convertStr('scratch_stitch/agent.html', 'app/agent-console/page.tsx', 'AgentConsolePage', 1);
convertStr('scratch_stitch/provider.html', 'app/dashboard/page.tsx', 'ProviderDashboardPage', 1);
convertStr('scratch_stitch/analytics.html', 'app/analytics/page.tsx', 'AnalyticsDashboardPage', 1);
