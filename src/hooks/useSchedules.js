import { useState, useEffect } from 'react';
import { saveToIndexedDB, loadFromIndexedDB } from '../indexedDBStorage';
import {
    STORAGE_KEY,
    USER_DATA_KEY,
    BASE_SCHEDULES_KEY,
    BASE_SCHEDULES_VERSION_KEY,
    BASE_SCHEDULES_LAST_FETCH_KEY
} from '../constants';
import { getBaseSchedulesUrl, shouldFetchBaseSchedules } from '../utils';

/**
 * 合并基础日程和用户数据，返回完整日程列表
 */
export function mergeSchedules(baseSchedules, userData) {
    const merged = baseSchedules.map(baseItem => {
        const userItem = userData[baseItem.id];
        return {
            ...baseItem,
            completed: userItem?.completed || baseItem.completed || false,
            note: userItem?.note || baseItem.note || '',
            link: userItem?.link || baseItem.link || '',
            isFavorite: userItem?.isFavorite || false,
            isAnime: userItem?.isAnime || baseItem.isAnime || false,
            isBaseSchedule: true
        };
    });

    const userSchedules = Object.values(userData)
        .filter(item => item.isUserCreated)
        .map(item => ({
            ...item,
            isAnime: item.isAnime || false,
            isFavorite: item.isFavorite || false
        }));

    return [...merged, ...userSchedules];
}

/**
 * 将基础日程库的 completed/note 字段同步合并到 userData 中
 * （避免基础库更新覆盖用户数据）
 */
export function syncBaseFieldsToUserData(baseSchedules, userData) {
    const updated = { ...userData };
    baseSchedules.forEach(baseItem => {
        if (!updated[baseItem.id]) {
            updated[baseItem.id] = {};
        }
        if (baseItem.completed === true && !updated[baseItem.id].completed) {
            updated[baseItem.id].completed = true;
        }
        if (baseItem.note && baseItem.note.trim()) {
            if (updated[baseItem.id].note && updated[baseItem.id].note !== baseItem.note) {
                updated[baseItem.id].note = `${updated[baseItem.id].note}\n---\n${baseItem.note}`;
            } else if (!updated[baseItem.id].note) {
                updated[baseItem.id].note = baseItem.note;
            }
        }
    });
    return updated;
}

/**
 * 从 schedules 状态中提取用户数据（只保存用户修改部分）
 */
export function extractUserDataFromSchedules(schedules) {
    const userData = {};
    schedules.forEach(schedule => {
        if (schedule.isUserCreated) {
            userData[schedule.id] = { ...schedule, isUserCreated: true };
        } else if (schedule.isBaseSchedule) {
            const userModifications = {};
            if (schedule.completed) userModifications.completed = true;
            if (schedule.note) userModifications.note = schedule.note;
            if (schedule.link && schedule.link.trim()) {
                const isSystemLink =
                    schedule.link === schedule.liveRoomUrl ||
                    schedule.link === schedule.dynamicUrl ||
                    schedule.link === schedule.icsUrl;
                if (!isSystemLink) {
                    userModifications.link = schedule.link;
                }
            }
            if (schedule.isFavorite) userModifications.isFavorite = true;
            if (schedule.isAnime) userModifications.isAnime = true;

            if (Object.keys(userModifications).length > 0) {
                userData[schedule.id] = userModifications;
            }
        }
    });
    return userData;
}

/**
 * useSchedules Hook
 * 负责：
 *   1. 初始加载（缓存优先 → 后台更新基础库）
 *   2. schedules 变化时自动保存用户数据
 *   3. 暴露手动更新基础库方法
 */
export function useSchedules() {
    const [schedules, setSchedules] = useState([]);
    const [isLoadingBase, setIsLoadingBase] = useState(true);
    const [fetchError, setFetchError] = useState(false);

    // ── 初始加载 ────────────────────────────────────────────────────────────
    useEffect(() => {
        const loadSchedules = async () => {
            setIsLoadingBase(true);
            try {
                // 1. 读取缓存
                let baseSchedules = [];
                const cached = localStorage.getItem(BASE_SCHEDULES_KEY);
                if (cached) {
                    try {
                        baseSchedules = JSON.parse(cached);
                        console.log('使用缓存的基础日程');
                    } catch (e) {
                        console.warn('缓存数据解析失败:', e);
                    }
                }

                // 2. 读取用户数据（localStorage → IndexedDB 兜底）
                let userData = {};
                try {
                    const localData = localStorage.getItem(USER_DATA_KEY);
                    if (localData) {
                        userData = JSON.parse(localData);
                        console.log('[数据加载] 从 localStorage 加载用户数据成功');
                    }
                } catch (error) {
                    console.warn('[数据加载] localStorage 读取失败，尝试从 IndexedDB 恢复:', error);
                }

                if (!userData || Object.keys(userData).length === 0) {
                    try {
                        const indexedData = await loadFromIndexedDB(USER_DATA_KEY);
                        if (indexedData) {
                            userData = indexedData;
                            console.log('[数据恢复] 从 IndexedDB 恢复用户数据成功');
                            localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
                        }
                    } catch (error) {
                        console.error('[数据恢复] IndexedDB 读取失败:', error);
                    }
                }

                // 3. 合并并立即显示
                setSchedules(mergeSchedules(baseSchedules, userData));
                setIsLoadingBase(false);

                // 4. 后台检查更新
                if (shouldFetchBaseSchedules() && navigator.onLine) {
                    console.log('后台更新基础日程库...');
                    try {
                        const response = await fetch(getBaseSchedulesUrl());
                        if (!response.ok) throw new Error(`HTTP ${response.status}`);

                        const data = await response.json();
                        const newBaseSchedules = data.schedules || [];
                        const baseVersion = data.version || Date.now();

                        localStorage.setItem(BASE_SCHEDULES_LAST_FETCH_KEY, Date.now().toString());

                        if (JSON.stringify(newBaseSchedules) !== JSON.stringify(baseSchedules)) {
                            console.log('发现基础日程库更新，重新合并数据');
                            localStorage.setItem(BASE_SCHEDULES_KEY, JSON.stringify(newBaseSchedules));
                            localStorage.setItem(BASE_SCHEDULES_VERSION_KEY, baseVersion.toString());

                            const updatedUserData = syncBaseFieldsToUserData(newBaseSchedules, userData);
                            localStorage.setItem(USER_DATA_KEY, JSON.stringify(updatedUserData));
                            setSchedules(mergeSchedules(newBaseSchedules, updatedUserData));
                        } else {
                            console.log('基础日程库无更新');
                        }
                    } catch (error) {
                        console.warn('后台更新基础日程库失败:', error);
                        if (!cached) setFetchError(true);
                    }
                } else if (!navigator.onLine) {
                    console.log('离线模式，跳过基础日程库更新');
                }
            } catch (error) {
                console.error('加载日程数据失败:', error);
                setIsLoadingBase(false);
                // 兜底：读取旧版本完整数据
                const oldData = localStorage.getItem(STORAGE_KEY);
                if (oldData) {
                    try {
                        const data = JSON.parse(oldData);
                        setSchedules(
                            Array.isArray(data)
                                ? data.map(item => ({
                                    ...item,
                                    isAnime: item.isAnime || false,
                                    isFavorite: item.isFavorite || false
                                }))
                                : []
                        );
                    } catch (e) {
                        console.error('旧数据解析失败:', e);
                        setSchedules([]);
                    }
                } else {
                    setSchedules([]);
                }
            }
        };

        loadSchedules();
    }, []);

    // ── 自动保存用户数据 ─────────────────────────────────────────────────────
    useEffect(() => {
        if (schedules.length === 0) return;

        const userData = extractUserDataFromSchedules(schedules);
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules));

        saveToIndexedDB(USER_DATA_KEY, userData).catch(err => {
            console.error('[备份] IndexedDB 备份失败:', err);
        });
    }, [schedules]);

    // ── 手动更新基础日程库 ────────────────────────────────────────────────────
    const handleUpdateBaseSchedules = async () => {
        setIsLoadingBase(true);
        try {
            const response = await fetch(getBaseSchedulesUrl());
            if (!response.ok) throw new Error('无法加载基础日程库');

            const data = await response.json();
            const baseSchedules = data.schedules || [];
            const baseVersion = data.version || Date.now();

            localStorage.setItem(BASE_SCHEDULES_KEY, JSON.stringify(baseSchedules));
            localStorage.setItem(BASE_SCHEDULES_VERSION_KEY, baseVersion.toString());
            localStorage.setItem(BASE_SCHEDULES_LAST_FETCH_KEY, Date.now().toString());

            const currentUserData = JSON.parse(localStorage.getItem(USER_DATA_KEY) || '{}');
            const updatedUserData = syncBaseFieldsToUserData(baseSchedules, currentUserData);
            localStorage.setItem(USER_DATA_KEY, JSON.stringify(updatedUserData));

            setSchedules(mergeSchedules(baseSchedules, updatedUserData));
            alert(`成功更新基础日程库！共 ${baseSchedules.length} 条日程`);
        } catch (error) {
            console.error('更新失败:', error);
            alert('更新基础日程库失败：' + error.message);
        } finally {
            setIsLoadingBase(false);
        }
    };

    return {
        schedules,
        setSchedules,
        isLoadingBase,
        fetchError,
        setFetchError,
        handleUpdateBaseSchedules
    };
}
