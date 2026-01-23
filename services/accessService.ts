import { supabase } from './supabaseClient';

// 驗證一次性密碼是否有效
export async function verifyAccessCode(code: string): Promise<{
  valid: boolean;
  productId?: string;
  productName?: string;
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('access_code', code)
      .eq('status', 'completed')
      .single();
    
    if (error || !data) {
      return { valid: false, error: '無效的存取碼' };
    }
    
    // 檢查是否已使用（可選：限制使用次數）
    // 這裡暫時允許重複使用
    
    return {
      valid: true,
      productId: data.product_id,
      productName: data.product_name
    };
  } catch (e) {
    return { valid: false, error: '驗證失敗' };
  }
}

// 本地存儲已驗證的存取碼（session 級別）
const ACCESS_KEY = 'willwi_access_verified';

export function setAccessVerified(code: string, productId: string) {
  sessionStorage.setItem(ACCESS_KEY, JSON.stringify({
    code,
    productId,
    timestamp: Date.now()
  }));
}

export function getAccessStatus(): { verified: boolean; productId?: string } {
  try {
    const stored = sessionStorage.getItem(ACCESS_KEY);
    if (!stored) return { verified: false };
    
    const data = JSON.parse(stored);
    // 驗證有效期：24小時
    if (Date.now() - data.timestamp > 24 * 60 * 60 * 1000) {
      sessionStorage.removeItem(ACCESS_KEY);
      return { verified: false };
    }
    
    return { verified: true, productId: data.productId };
  } catch {
    return { verified: false };
  }
}

export function clearAccess() {
  sessionStorage.removeItem(ACCESS_KEY);
}
