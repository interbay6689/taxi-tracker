import React from 'react';
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { performSystemStartupCleanup } from './utils/systemCleanup'
import { performHealthCheck, fixCommonIssues } from './utils/healthCheck'

// Comprehensive system startup
console.log('🔧 Starting system diagnostics...');
const healthReport = performHealthCheck();
console.log('📊 Health Report:', healthReport);

const fixes = fixCommonIssues();
if (fixes.length > 0) {
  console.log('🛠️ Applied fixes:', fixes);
}

performSystemStartupCleanup();
console.log('✅ System ready');

createRoot(document.getElementById("root")!).render(<App />);
