/**
 * Utility functions for debugging and verifying Asgardeo session clearing
 */

export interface SessionDebugInfo {
  cookies: string[];
  localStorage: string[];
  sessionStorage: string[];
  authRelatedData: {
    foundCookies: string[];
    foundLocalStorage: string[];
    foundSessionStorage: string[];
  };
}

/**
 * Debug function to check what authentication-related data still exists
 */
export function debugAuthenticationData(): SessionDebugInfo {
  const result: SessionDebugInfo = {
    cookies: [],
    localStorage: [],
    sessionStorage: [],
    authRelatedData: {
      foundCookies: [],
      foundLocalStorage: [],
      foundSessionStorage: []
    }
  };

  if (typeof window === 'undefined') {
    return result;
  }

  // Check cookies
  const cookies = document.cookie.split(';');
  cookies.forEach(cookie => {
    const name = cookie.split('=')[0].trim();
    result.cookies.push(name);
    
    const lowerName = name.toLowerCase();
    if (lowerName.includes('asgardeo') || 
        lowerName.includes('oauth') || 
        lowerName.includes('auth') ||
        lowerName.includes('token') ||
        lowerName.includes('session')) {
      result.authRelatedData.foundCookies.push(name);
    }
  });

  // Check localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      result.localStorage.push(key);
      
      const lowerKey = key.toLowerCase();
      if (lowerKey.includes('asgardeo') || 
          lowerKey.includes('oauth') || 
          lowerKey.includes('auth') ||
          lowerKey.includes('token') ||
          lowerKey.includes('session')) {
        result.authRelatedData.foundLocalStorage.push(key);
      }
    }
  }

  // Check sessionStorage
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key) {
      result.sessionStorage.push(key);
      
      const lowerKey = key.toLowerCase();
      if (lowerKey.includes('asgardeo') || 
          lowerKey.includes('oauth') || 
          lowerKey.includes('auth') ||
          lowerKey.includes('token') ||
          lowerKey.includes('session')) {
        result.authRelatedData.foundSessionStorage.push(key);
      }
    }
  }

  return result;
}

/**
 * Force clear all authentication data (for emergency cleanup)
 */
export function forceCleanupAuthData(): void {
  if (typeof window === 'undefined') {
    return;
  }

  console.debug('🧹 Starting force cleanup of authentication data...');

  // Get debug info before cleanup
  const beforeCleanup = debugAuthenticationData();
  console.debug('Before cleanup:', beforeCleanup);

  // Clear localStorage
  const localStorageKeys = Object.keys(localStorage);
  localStorageKeys.forEach(key => {
    const lowerKey = key.toLowerCase();
    if (lowerKey.includes('asgardeo') || 
        lowerKey.includes('oauth') || 
        lowerKey.includes('auth') ||
        lowerKey.includes('token') ||
        lowerKey.includes('session')) {
  localStorage.removeItem(key);
  console.debug(`Removed localStorage: ${key}`);
    }
  });

  // Clear sessionStorage
  const sessionStorageKeys = Object.keys(sessionStorage);
  sessionStorageKeys.forEach(key => {
    const lowerKey = key.toLowerCase();
    if (lowerKey.includes('asgardeo') || 
        lowerKey.includes('oauth') || 
        lowerKey.includes('auth') ||
        lowerKey.includes('token') ||
        lowerKey.includes('session')) {
  sessionStorage.removeItem(key);
  console.debug(`Removed sessionStorage: ${key}`);
    }
  });

  // Clear cookies
  const authCookieNames = [
    'asgardeo_session',
    'oauth_state', 
    'oauth_callback',
    'id_token',
    'access_token',
    'refresh_token',
    'auth_session',
    'session_state'
  ];

  authCookieNames.forEach(cookieName => {
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${window.location.hostname}`;
  console.debug(`Cleared cookie: ${cookieName}`);
  });

  // Clear any remaining auth-related cookies
  document.cookie.split(";").forEach(cookie => {
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
    const lowerName = name.toLowerCase();
    
    if (lowerName.includes('asgardeo') || 
        lowerName.includes('oauth') || 
        lowerName.includes('auth') ||
        lowerName.includes('token') ||
        lowerName.includes('session')) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${window.location.hostname}`;
  console.debug(`Cleared found cookie: ${name}`);
    }
  });

  // Get debug info after cleanup
  const afterCleanup = debugAuthenticationData();
  console.debug('After cleanup:', afterCleanup);
  
  console.debug('✅ Force cleanup completed');
}

/**
 * Check if user session is properly cleared
 */
export function isSessionCleared(): boolean {
  const debugInfo = debugAuthenticationData();
  const hasAuthData = debugInfo.authRelatedData.foundCookies.length > 0 ||
                     debugInfo.authRelatedData.foundLocalStorage.length > 0 ||
                     debugInfo.authRelatedData.foundSessionStorage.length > 0;
  
  return !hasAuthData;
}

/**
 * Get session clearing status for UI display
 */
export function getSessionStatus(): {
  isCleared: boolean;
  remainingAuthItems: number;
  details: SessionDebugInfo;
} {
  const details = debugAuthenticationData();
  const remainingAuthItems = details.authRelatedData.foundCookies.length +
                            details.authRelatedData.foundLocalStorage.length +
                            details.authRelatedData.foundSessionStorage.length;
  
  return {
    isCleared: remainingAuthItems === 0,
    remainingAuthItems,
    details
  };
}

// Export for global debugging (can be called from browser console)
if (typeof window !== 'undefined') {
  (window as any).debugAuthData = debugAuthenticationData;
  (window as any).forceCleanupAuth = forceCleanupAuthData;
  (window as any).getSessionStatus = getSessionStatus;
}
