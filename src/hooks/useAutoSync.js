import { useState, useEffect, useRef, useCallback } from 'react';
import { uploadToSupabase } from '../supabaseSync';
import { uploadToGist } from '../services/gistSync';
import { USER_DATA_KEY, GIST_AUTO_SYNC_KEY, SUPABASE_AUTO_SYNC_KEY } from '../constants';

/**
 * useAutoSync Hook
 * 负责：
 *   1. 监听 schedules 变化，在用户操作后延迟触发云同步
 *   2. 管理自动同步开关状态（Gist / Supabase）
 *   3. Toast 提示
 *
 * @param {object} params
 * @param {Array}  params.schedules        - 当前日程列表（用于监听变化）
 * @param {boolean} params.isLoadingBase   - 初始数据是否加载完成
 * @param {string}  params.gistToken
 * @param {string}  params.gistId
 * @param {Function} params.setGistId
 * @param {string}  params.supabaseUrl
 * @param {string}  params.supabaseKey
 * @param {string}  params.syncId
 */
export function useAutoSync({
    schedules,
    isLoadingBase,
    gistToken,
    gistId,
    setGistId,
    supabaseUrl,
    supabaseKey,
    syncId
}) {
    const [gistAutoSync, setGistAutoSync] = useState(
        () => localStorage.getItem(GIST_AUTO_SYNC_KEY) === 'true'
    );
    const [supabaseAutoSync, setSupabaseAutoSync] = useState(
        () => localStorage.getItem(SUPABASE_AUTO_SYNC_KEY) === 'true'
    );
    const [showAutoSyncToast, setShowAutoSyncToast] = useState(false);
    const [autoSyncToastMessage, setAutoSyncToastMessage] = useState('');

    const isInitializedRef = useRef(false);
    const autoSyncTimerRef = useRef(null);
    const pendingAutoSyncRef = useRef(null);
    const skipNextSyncRef = useRef(false);

    // 持久化自动同步开关
    useEffect(() => {
        localStorage.setItem(GIST_AUTO_SYNC_KEY, gistAutoSync.toString());
    }, [gistAutoSync]);

    useEffect(() => {
        localStorage.setItem(SUPABASE_AUTO_SYNC_KEY, supabaseAutoSync.toString());
    }, [supabaseAutoSync]);

    // 标记初始化完成
    useEffect(() => {
        if (!isLoadingBase && schedules.length > 0 && !isInitializedRef.current) {
            isInitializedRef.current = true;
            skipNextSyncRef.current = true;
            console.log('[初始化] 页面数据加载完成，已标记为初始化状态');
        }
    }, [isLoadingBase, schedules]);

    // 触发一次实际同步
    const triggerAutoSync = useCallback(async () => {
        const userData = JSON.parse(localStorage.getItem(USER_DATA_KEY) || '{}');
        let anySyncSuccess = false;

        if (supabaseAutoSync && supabaseUrl && supabaseKey && syncId) {
            try {
                console.log('[自动同步] 正在上传到 Supabase...');
                await uploadToSupabase(userData, syncId);
                setAutoSyncToastMessage('Supabase 自动同步成功');
                setShowAutoSyncToast(true);
                anySyncSuccess = true;
            } catch (err) {
                console.error('[自动同步] Supabase 同步失败:', err);
            }
        }

        if (gistAutoSync && gistToken) {
            try {
                console.log('[自动同步] 正在上传到 GitHub Gist...');
                const result = await uploadToGist(gistToken, gistId, userData);
                if (result.gistId && !gistId) {
                    setGistId(result.gistId);
                }
                setAutoSyncToastMessage('Gist 自动同步成功');
                setShowAutoSyncToast(true);
                anySyncSuccess = true;
            } catch (err) {
                console.error('[自动同步] Gist 同步失败:', err);
            }
        }

        if (anySyncSuccess) {
            setTimeout(() => setShowAutoSyncToast(false), 3000);
        }

        return anySyncSuccess;
    }, [supabaseAutoSync, supabaseUrl, supabaseKey, syncId, gistAutoSync, gistToken, gistId, setGistId]);

    // 安排延迟同步（首次1分钟，后续3分钟）
    const scheduleAutoSync = useCallback(() => {
        if (!isInitializedRef.current) return;
        if (skipNextSyncRef.current) {
            skipNextSyncRef.current = false;
            console.log('[自动同步] 跳过首次操作同步');
            return;
        }

        if (autoSyncTimerRef.current) {
            clearTimeout(autoSyncTimerRef.current);
        }

        const isFirstAction = pendingAutoSyncRef.current === null;
        const waitTime = isFirstAction ? 60000 : 180000;
        pendingAutoSyncRef.current = true;

        console.log(`[自动同步] 已安排${waitTime / 1000}秒后触发同步`);
        autoSyncTimerRef.current = setTimeout(async () => {
            await triggerAutoSync();
            pendingAutoSyncRef.current = null;
        }, waitTime);
    }, [triggerAutoSync]);

    // 监听 schedules 变化触发自动同步
    useEffect(() => {
        if (!isInitializedRef.current || schedules.length === 0) return;
        scheduleAutoSync();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [schedules]);

    return {
        gistAutoSync,
        setGistAutoSync,
        supabaseAutoSync,
        setSupabaseAutoSync,
        showAutoSyncToast,
        autoSyncToastMessage
    };
}
