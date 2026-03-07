import { createClient } from '@supabase/supabase-js';

// 默认 Supabase 配置（公共服务）
const DEFAULT_SUPABASE_URL = 'https://aeyssvgeughzikmigrxw.supabase.co';
const DEFAULT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFleXNzdmdldWdoemlrbWlncnh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5NzI5NzcsImV4cCI6MjA1NjU0ODk3N30.sb_publishable__0It3s_EGA0JLjYDicxGjw_k94IhQVe';

// Supabase 配置
const SUPABASE_URL_KEY = 'asoul_supabase_url';
const SUPABASE_ANON_KEY = 'asoul_supabase_anon_key';

// 获取配置（优先使用用户自定义配置，否则使用默认配置）
export const getSupabaseConfig = () => {
    const customUrl = localStorage.getItem(SUPABASE_URL_KEY);
    const customKey = localStorage.getItem(SUPABASE_ANON_KEY);

    // 如果用户设置了自定义配置，使用自定义配置
    if (customUrl && customKey && customUrl.trim() && customKey.trim()) {
        return {
            url: customUrl,
            key: customKey,
            isCustom: true
        };
    }

    // 否则使用默认配置
    return {
        url: DEFAULT_SUPABASE_URL,
        key: DEFAULT_SUPABASE_KEY,
        isCustom: false
    };
};

// 保存配置
export const saveSupabaseConfig = (url, key) => {
    if (url && url.trim()) {
        localStorage.setItem(SUPABASE_URL_KEY, url);
    } else {
        localStorage.removeItem(SUPABASE_URL_KEY);
    }

    if (key && key.trim()) {
        localStorage.setItem(SUPABASE_ANON_KEY, key);
    } else {
        localStorage.removeItem(SUPABASE_ANON_KEY);
    }
};

// 检查是否使用默认配置
export const isUsingDefaultConfig = () => {
    const { isCustom } = getSupabaseConfig();
    return !isCustom;
};

// 创建 Supabase 客户端
export const createSupabaseClient = () => {
    const { url, key } = getSupabaseConfig();

    if (!url || !key) {
        return null;
    }

    return createClient(url, key);
};
