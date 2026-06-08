import { BASE_SCHEDULES_KEY, USER_DATA_KEY } from '../constants';
import { downloadFromSupabase, uploadToSupabase } from '../supabaseSync';
import { isUsingDefaultConfig } from '../supabaseClient';
import { downloadFromGist, mergeUserData, uploadToGist } from '../services/gistSync';
import { extractUserDataFromSchedules, mergeSchedules } from './useSchedules';

export function useCloudSyncActions({
    schedules,
    setSchedules,
    gistToken,
    gistId,
    setGistId,
    setIsGistSyncing,
    syncId,
    setIsSupabaseSyncing,
    setSyncCooldown
}) {
    const handleSyncToGist = async () => {
        if (!gistToken) {
            alert('请先配置 GitHub Personal Access Token');
            return;
        }

        setIsGistSyncing(true);
        try {
            const userData = extractUserDataFromSchedules(schedules);
            const result = await uploadToGist(gistToken, gistId, userData);
            if (!gistId) setGistId(result.gistId);
            alert(`数据已成功同步到 GitHub Gist！\n\n同步的数据：\n- 用户数据记录：${result.dataCount} 条\n- 文件大小：${result.fileSizeKB} KB`);
        } catch (err) {
            alert('同步失败：' + err.message);
        } finally {
            setIsGistSyncing(false);
        }
    };

    const handleLoadFromGist = async () => {
        if (!gistToken || !gistId) {
            alert('请先配置 GitHub Personal Access Token 和 Gist ID');
            return;
        }

        setIsGistSyncing(true);
        try {
            const { userData, fileSizeKB } = await downloadFromGist(gistToken, gistId);
            const current = JSON.parse(localStorage.getItem(USER_DATA_KEY) || '{}');
            const { mergedData, addedCount, updatedCount } = mergeUserData(current, userData);
            localStorage.setItem(USER_DATA_KEY, JSON.stringify(mergedData));
            setSchedules(mergeSchedules(JSON.parse(localStorage.getItem(BASE_SCHEDULES_KEY) || '[]'), mergedData));
            alert(`成功从 Gist 加载数据！\n\n- 新增：${addedCount} 条\n- 更新：${updatedCount} 条\n- 文件大小：${fileSizeKB} KB`);
        } catch (err) {
            alert('读取失败：' + err.message);
        } finally {
            setIsGistSyncing(false);
        }
    };

    const handleReplaceFromGist = async () => {
        if (!gistToken || !gistId) {
            alert('请先配置 GitHub Personal Access Token 和 Gist ID');
            return;
        }
        if (!confirm('此操作将用 Gist 中的用户数据完全替换本地用户数据，确定继续吗？\n\n注意：基础日程库不会被影响。')) return;

        setIsGistSyncing(true);
        try {
            const { userData, fileSizeKB } = await downloadFromGist(gistToken, gistId);
            localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
            setSchedules(mergeSchedules(JSON.parse(localStorage.getItem(BASE_SCHEDULES_KEY) || '[]'), userData));
            alert(`成功从 Gist 恢复用户数据！\n\n- 用户数据记录：${Object.keys(userData).length} 条\n- 文件大小：${fileSizeKB} KB`);
        } catch (err) {
            alert('读取失败：' + err.message);
        } finally {
            setIsGistSyncing(false);
        }
    };

    const handleUploadToSupabase = async () => {
        if (!syncId || !syncId.trim()) {
            alert('请先设置同步 ID');
            return;
        }

        setIsSupabaseSyncing(true);
        try {
            const userData = extractUserDataFromSchedules(schedules);
            const dataCount = Object.keys(userData).length;
            const dataSizeKB = (new Blob([JSON.stringify(userData)]).size / 1024).toFixed(2);

            if (isUsingDefaultConfig()) {
                const warn = dataSizeKB > 80 ? '\n\n⚠️ 数据接近 100 KB 限制，建议使用自定义 Supabase 服务器' : '';
                if (!confirm(`准备上传数据到默认云同步服务\n\n用户数据记录：${dataCount} 条\n文件大小：${dataSizeKB} KB / 100 KB${warn}\n\n是否继续？`)) {
                    setIsSupabaseSyncing(false);
                    return;
                }
            }

            await uploadToSupabase(userData, syncId);
            alert(`数据已成功上传到 Supabase！\n\n同步 ID: ${syncId}\n用户数据记录：${dataCount} 条\n文件大小：${dataSizeKB} KB${isUsingDefaultConfig() ? ' / 100 KB' : ''}`);
            setSyncCooldown(300);
        } catch (err) {
            alert('上传失败：' + err.message);
        } finally {
            setIsSupabaseSyncing(false);
        }
    };

    const handleDownloadFromSupabase = async () => {
        if (!syncId || !syncId.trim()) {
            alert('请先设置同步 ID');
            return;
        }

        setIsSupabaseSyncing(true);
        try {
            const result = await downloadFromSupabase(syncId);
            const userData = result.user_data;
            if (!userData || typeof userData !== 'object') throw new Error('数据格式不正确');

            const current = JSON.parse(localStorage.getItem(USER_DATA_KEY) || '{}');
            let added = 0;
            let updated = 0;
            Object.keys(userData).forEach(id => {
                if (current[id]) {
                    if (userData[id].isUserCreated) {
                        current[id] = userData[id];
                    } else {
                        const existing = current[id];
                        const imported = userData[id];
                        if (imported.note) {
                            if (existing.note && existing.note !== imported.note) current[id].note = `${existing.note}\n---\n${imported.note}`;
                            else current[id].note = imported.note;
                        }
                        if (imported.completed) current[id].completed = true;
                        if (imported.link) current[id].link = imported.link;
                        if (imported.isFavorite) current[id].isFavorite = true;
                        if (imported.isAnime) current[id].isAnime = true;
                    }
                    updated++;
                } else {
                    current[id] = userData[id];
                    added++;
                }
            });

            localStorage.setItem(USER_DATA_KEY, JSON.stringify(current));
            const base = JSON.parse(localStorage.getItem(BASE_SCHEDULES_KEY) || '[]');
            setSchedules(mergeSchedules(base, current));
            alert(`成功从 Supabase 下载数据！\n\n同步 ID: ${syncId}\n新增：${added} 条\n更新：${updated} 条\n更新时间：${new Date(result.updated_at).toLocaleString('zh-CN')}`);
            setSyncCooldown(300);
        } catch (err) {
            alert('下载失败：' + err.message);
        } finally {
            setIsSupabaseSyncing(false);
        }
    };

    return {
        handleSyncToGist,
        handleLoadFromGist,
        handleReplaceFromGist,
        handleUploadToSupabase,
        handleDownloadFromSupabase
    };
}
