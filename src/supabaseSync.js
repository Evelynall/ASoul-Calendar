import { createSupabaseClient, isUsingDefaultConfig } from './supabaseClient';

const SYNC_ID_KEY = 'asoul_sync_id';
const LAST_SYNC_TIME_KEY = 'asoul_last_sync_time';
const SYNC_COOLDOWN = 5 * 60 * 1000; // 5分钟
const DEFAULT_SYNC_SIZE_LIMIT = 100 * 1024; // 默认云同步100KB限制

// 获取同步 ID
export const getSyncId = () => {
    return localStorage.getItem(SYNC_ID_KEY) || '';
};

// 保存同步 ID
export const saveSyncId = (syncId) => {
    localStorage.setItem(SYNC_ID_KEY, syncId);
};

// 检查是否可以同步（仅默认配置有5分钟限制，自定义配置无限制）
export const canSync = () => {
    // 如果使用自定义配置，没有冷却限制
    if (!isUsingDefaultConfig()) {
        return true;
    }

    // 使用默认配置，检查冷却时间
    const lastSyncTime = localStorage.getItem(LAST_SYNC_TIME_KEY);
    if (!lastSyncTime) return true;

    const now = Date.now();
    const timeSinceLastSync = now - parseInt(lastSyncTime, 10);

    return timeSinceLastSync >= SYNC_COOLDOWN;
};

// 获取距离下次可同步的剩余时间（秒）
export const getTimeUntilNextSync = () => {
    // 如果使用自定义配置，没有冷却限制
    if (!isUsingDefaultConfig()) {
        return 0;
    }

    const lastSyncTime = localStorage.getItem(LAST_SYNC_TIME_KEY);
    if (!lastSyncTime) return 0;

    const now = Date.now();
    const timeSinceLastSync = now - parseInt(lastSyncTime, 10);
    const remainingTime = SYNC_COOLDOWN - timeSinceLastSync;

    return remainingTime > 0 ? Math.ceil(remainingTime / 1000) : 0;
};

// 更新最后同步时间（仅默认配置需要记录）
const updateLastSyncTime = () => {
    if (isUsingDefaultConfig()) {
        localStorage.setItem(LAST_SYNC_TIME_KEY, Date.now().toString());
    }
};

// 上传数据到 Supabase
export const uploadToSupabase = async (userData, syncId) => {
    const supabase = createSupabaseClient();

    if (!supabase) {
        throw new Error('Supabase 未配置');
    }

    if (!syncId || !syncId.trim()) {
        throw new Error('同步 ID 不能为空');
    }

    if (!canSync()) {
        const remainingSeconds = getTimeUntilNextSync();
        const minutes = Math.floor(remainingSeconds / 60);
        const seconds = remainingSeconds % 60;
        throw new Error(`请等待 ${minutes}分${seconds}秒 后再同步`);
    }

    // 检查数据大小（仅默认配置有限制）
    if (isUsingDefaultConfig()) {
        const dataSize = new Blob([JSON.stringify(userData)]).size;
        if (dataSize > DEFAULT_SYNC_SIZE_LIMIT) {
            const dataSizeKB = (dataSize / 1024).toFixed(2);
            throw new Error(`数据大小 ${dataSizeKB} KB 超过默认云同步限制（100 KB）。\n\n默认云同步仅支持轻量体验，如需同步更多数据请使用自定义 Supabase 服务器。`);
        }
    }

    const dataToUpload = {
        sync_id: syncId.trim(),
        user_data: userData,
        updated_at: new Date().toISOString()
    };

    // 先查询是否存在该 sync_id 的记录
    const { data: existingData, error: queryError } = await supabase
        .from('asoul_sync_data')
        .select('id')
        .eq('sync_id', syncId.trim())
        .single();

    if (queryError && queryError.code !== 'PGRST116') {
        // PGRST116 表示没有找到记录，这是正常的
        throw new Error('查询数据失败: ' + queryError.message);
    }

    let result;
    if (existingData) {
        // 更新现有记录
        result = await supabase
            .from('asoul_sync_data')
            .update(dataToUpload)
            .eq('sync_id', syncId.trim());
    } else {
        // 插入新记录
        result = await supabase
            .from('asoul_sync_data')
            .insert([dataToUpload]);
    }

    if (result.error) {
        throw new Error('上传失败: ' + result.error.message);
    }

    updateLastSyncTime();
    return result.data;
};

// 从 Supabase 下载数据
export const downloadFromSupabase = async (syncId) => {
    const supabase = createSupabaseClient();

    if (!supabase) {
        throw new Error('Supabase 未配置');
    }

    if (!syncId || !syncId.trim()) {
        throw new Error('同步 ID 不能为空');
    }

    if (!canSync()) {
        const remainingSeconds = getTimeUntilNextSync();
        const minutes = Math.floor(remainingSeconds / 60);
        const seconds = remainingSeconds % 60;
        throw new Error(`请等待 ${minutes}分${seconds}秒 后再同步`);
    }

    const { data, error } = await supabase
        .from('asoul_sync_data')
        .select('user_data, updated_at')
        .eq('sync_id', syncId.trim())
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            throw new Error('未找到该同步 ID 的数据');
        }
        throw new Error('下载失败: ' + error.message);
    }

    updateLastSyncTime();
    return data;
};
