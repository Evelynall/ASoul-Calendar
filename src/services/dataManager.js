import { USER_DATA_KEY, BASE_SCHEDULES_KEY } from '../constants';

// 提取用户数据（用于导出）
export const extractUserDataForExport = (schedules) => {
    const userData = {};

    schedules.forEach(schedule => {
        if (schedule.isUserCreated) {
            userData[schedule.id] = { ...schedule, isUserCreated: true };
        } else if (schedule.isBaseSchedule) {
            const userModifications = {};
            if (schedule.completed) userModifications.completed = true;
            if (schedule.note) userModifications.note = schedule.note;

            if (schedule.link && schedule.link.trim()) {
                const isSystemLink = schedule.link === schedule.liveRoomUrl ||
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
};

// 导入用户数据
export const importUserData = (importedData) => {
    let userData = {};

    if (Array.isArray(importedData)) {
        // 旧格式：完整日程数组，需要转换
        importedData.forEach(schedule => {
            if (schedule.isUserCreated) {
                userData[schedule.id] = { ...schedule, isUserCreated: true };
            } else {
                const userModifications = {};
                if (schedule.completed) userModifications.completed = true;
                if (schedule.note) userModifications.note = schedule.note;
                if (schedule.link && !schedule.liveRoomUrl) userModifications.link = schedule.link;
                if (schedule.isFavorite) userModifications.isFavorite = true;
                if (schedule.isAnime) userModifications.isAnime = true;

                if (Object.keys(userModifications).length > 0) {
                    userData[schedule.id] = userModifications;
                }
            }
        });
    } else if (typeof importedData === 'object') {
        // 新格式：用户数据对象
        userData = importedData;
    } else {
        throw new Error('文件格式不正确');
    }

    return userData;
};

// 合并导入的用户数据
export const mergeImportedUserData = (currentUserData, importedUserData) => {
    let mergedCount = 0;
    let addedCount = 0;
    let updatedCount = 0;

    Object.keys(importedUserData).forEach(id => {
        if (currentUserData[id]) {
            if (importedUserData[id].isUserCreated) {
                currentUserData[id] = importedUserData[id];
                updatedCount++;
            } else {
                const existing = currentUserData[id];
                const imported = importedUserData[id];

                if (imported.note) {
                    if (existing.note && existing.note !== imported.note) {
                        currentUserData[id].note = `${existing.note}\n---\n${imported.note}`;
                        mergedCount++;
                    } else {
                        currentUserData[id].note = imported.note;
                    }
                }

                if (imported.completed) currentUserData[id].completed = true;
                if (imported.link) currentUserData[id].link = imported.link;
                if (imported.isFavorite) currentUserData[id].isFavorite = true;
                if (imported.isAnime) currentUserData[id].isAnime = true;

                updatedCount++;
            }
        } else {
            currentUserData[id] = importedUserData[id];
            addedCount++;
        }
    });

    return { mergedData: currentUserData, mergedCount, addedCount, updatedCount };
};

// 重新加载日程（合并基础日程和用户数据）
export const reloadSchedulesFromUserData = (userData) => {
    const baseSchedules = JSON.parse(localStorage.getItem(BASE_SCHEDULES_KEY) || '[]');

    const mergedSchedules = baseSchedules.map(baseItem => {
        const userItem = userData[baseItem.id];
        return {
            ...baseItem,
            completed: userItem?.completed || false,
            note: userItem?.note || '',
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

    return [...mergedSchedules, ...userSchedules];
};

// 导出用户创建的日程
export const exportUserCreatedSchedules = (schedules) => {
    return schedules
        .filter(schedule => schedule.isUserCreated)
        .map(schedule => ({ ...schedule }));
};

// 导出清理后的日程（移除完成状态）
export const exportCleanedSchedules = (schedules) => {
    return schedules.map(schedule => {
        const cleaned = { ...schedule };
        delete cleaned.completed;
        return cleaned;
    });
};

// 清空用户数据
export const clearUserData = () => {
    localStorage.removeItem(USER_DATA_KEY);

    const baseSchedules = JSON.parse(localStorage.getItem(BASE_SCHEDULES_KEY) || '[]');
    return baseSchedules.map(item => ({
        ...item,
        completed: false,
        note: '',
        link: item.link || '',
        isFavorite: false,
        isAnime: item.isAnime || false,
        isBaseSchedule: true
    }));
};
