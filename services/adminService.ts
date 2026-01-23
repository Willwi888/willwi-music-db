// Admin Authentication Service
// 管理員密碼: 0709

const ADMIN_PASSWORD = '0709';
const ADMIN_KEY = 'willwi_admin_auth';

export interface AdminStatus {
  isAdmin: boolean;
  loginTime?: number;
}

// Check if user is logged in as admin
export function isAdminLoggedIn(): boolean {
  try {
    const stored = localStorage.getItem(ADMIN_KEY);
    if (!stored) return false;
    
    const status: AdminStatus = JSON.parse(stored);
    // Admin session lasts 24 hours
    if (status.isAdmin && status.loginTime) {
      const elapsed = Date.now() - status.loginTime;
      const twentyFourHours = 24 * 60 * 60 * 1000;
      return elapsed < twentyFourHours;
    }
    return false;
  } catch {
    return false;
  }
}

// Login as admin
export function adminLogin(password: string): boolean {
  if (password === ADMIN_PASSWORD) {
    const status: AdminStatus = {
      isAdmin: true,
      loginTime: Date.now()
    };
    localStorage.setItem(ADMIN_KEY, JSON.stringify(status));
    return true;
  }
  return false;
}

// Logout admin
export function adminLogout(): void {
  localStorage.removeItem(ADMIN_KEY);
}

// Get admin status
export function getAdminStatus(): AdminStatus {
  if (isAdminLoggedIn()) {
    return { isAdmin: true, loginTime: Date.now() };
  }
  return { isAdmin: false };
}

// Check if user has full access (admin OR paid user)
export function hasFullAccess(): boolean {
  // Admin always has full access
  if (isAdminLoggedIn()) return true;
  
  // Check for paid access code
  try {
    const accessData = localStorage.getItem('willwi_access');
    if (accessData) {
      const { verified, expiry } = JSON.parse(accessData);
      if (verified && expiry && Date.now() < expiry) {
        return true;
      }
    }
  } catch {
    // Ignore errors
  }
  
  return false;
}
