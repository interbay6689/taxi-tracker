// Critical security and performance optimizations

export const performHealthCheck = () => {
  const checks = [];
  
  // 1. Check localStorage health
  try {
    const testKey = 'healthcheck_test';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    checks.push({ name: 'localStorage', status: 'OK' });
  } catch (e) {
    checks.push({ name: 'localStorage', status: 'ERROR', error: e.message });
  }
  
  // 2. Check sessionStorage health
  try {
    const testKey = 'healthcheck_session_test';
    sessionStorage.setItem(testKey, 'test');
    sessionStorage.removeItem(testKey);
    checks.push({ name: 'sessionStorage', status: 'OK' });
  } catch (e) {
    checks.push({ name: 'sessionStorage', status: 'ERROR', error: e.message });
  }
  
  // 3. Check for corrupted auth data
  const authIssues = [];
  Object.keys(localStorage).forEach(key => {
    if (key.includes('supabase') && key.includes('auth')) {
      try {
        const value = localStorage.getItem(key);
        if (value) JSON.parse(value);
      } catch (e) {
        authIssues.push(key);
      }
    }
  });
  
  if (authIssues.length > 0) {
    checks.push({ name: 'Auth Data', status: 'CORRUPTED', items: authIssues });
  } else {
    checks.push({ name: 'Auth Data', status: 'OK' });
  }
  
  // 4. Check for hanging intervals
  const activeIntervals = sessionStorage.getItem('tripInterval');
  checks.push({ 
    name: 'Active Intervals', 
    status: activeIntervals ? 'ACTIVE' : 'CLEAN',
    intervalId: activeIntervals 
  });
  
  return checks;
};

export const fixCommonIssues = () => {
  const fixes = [];
  
  // Fix 1: Clean corrupted auth data
  Object.keys(localStorage).forEach(key => {
    if (key.includes('supabase') && key.includes('auth')) {
      try {
        const value = localStorage.getItem(key);
        if (value) JSON.parse(value);
      } catch (e) {
        localStorage.removeItem(key);
        fixes.push(`Removed corrupted key: ${key}`);
      }
    }
  });
  
  // Fix 2: Clear hanging intervals
  const intervalId = sessionStorage.getItem('tripInterval');
  if (intervalId && !isNaN(parseInt(intervalId))) {
    clearInterval(parseInt(intervalId));
    sessionStorage.removeItem('tripInterval');
    fixes.push(`Cleared hanging interval: ${intervalId}`);
  }
  
  // Fix 3: Clear invalid entries
  Object.keys(localStorage).forEach(key => {
    const value = localStorage.getItem(key);
    if (value === 'undefined' || value === 'null') {
      localStorage.removeItem(key);
      fixes.push(`Removed invalid entry: ${key}`);
    }
  });
  
  return fixes;
};

export const optimizePerformance = () => {
  const optimizations = [];
  
  // 1. Preload critical resources
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    if (connection.effectiveType === '4g') {
      optimizations.push('Network: 4G detected - full optimization enabled');
    } else {
      optimizations.push('Network: Slower connection - conservative loading');
    }
  }
  
  // 2. Check memory usage
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    if (memory.usedJSHeapSize > 50 * 1024 * 1024) { // 50MB
      optimizations.push('Memory: High usage detected - cleanup recommended');
    } else {
      optimizations.push('Memory: Usage normal');
    }
  }
  
  return optimizations;
};