// System cleanup utilities to prevent memory leaks and corruption

export const cleanupStorages = () => {
  try {
    // Clean corrupted localStorage entries
    Object.keys(localStorage).forEach((key) => {
      try {
        const value = localStorage.getItem(key);
        if (value && (value.includes('undefined') || value.includes('null'))) {
          localStorage.removeItem(key);
        }
      } catch (e) {
        localStorage.removeItem(key);
      }
    });

    // Clean corrupted sessionStorage entries  
    Object.keys(sessionStorage).forEach((key) => {
      try {
        const value = sessionStorage.getItem(key);
        if (value && (value.includes('undefined') || value.includes('null'))) {
          sessionStorage.removeItem(key);
        }
      } catch (e) {
        sessionStorage.removeItem(key);
      }
    });

    // Clear old trip intervals
    const intervalId = sessionStorage.getItem('tripInterval');
    if (intervalId && intervalId !== 'null' && intervalId !== 'undefined') {
      clearInterval(parseInt(intervalId));
      sessionStorage.removeItem('tripInterval');
    }
  } catch (error) {
    console.error('Storage cleanup error:', error);
  }
};

export const performSystemStartupCleanup = () => {
  cleanupStorages();
  
  // Clear only specific intervals, not all
  const intervalId = sessionStorage.getItem('tripInterval');
  if (intervalId && !isNaN(parseInt(intervalId))) {
    clearInterval(parseInt(intervalId));
    sessionStorage.removeItem('tripInterval');
  }
};