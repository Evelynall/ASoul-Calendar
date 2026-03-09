import { USER_DATA_KEY, BASE_SCHEDULES_KEY } from '../constants';

// 提取用户数据
export const extractUserData = (schedules) => {
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

// 上传到 Gist
export const uploadToGist = async (gistToken, gistId, userData) => {
    const userDataJson = JSON.stringify(userData, null, 2);
    const fileSizeKB = (new Blob([userDataJson]).size / 1024).toFixed(2);

    const data = {
        description: 'A-SOUL 追番表用户数据备份',
        public: false,
        files: {
            'asoul-user-data.json': {
                content: userDataJson
            }
        }
    };

    let response;
    if (gistId) {
        response = await fetch(`https://api.github.com/gists/${gistId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `token ${gistToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
    } else {
        response = await fetch('https://api.github.com/gists', {
            method: 'POST',
            headers: {
                'Authorization': `token ${gistToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
    }

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '同步失败');
    }

    const result = await response.json();
    return { gistId: result.id, fileSizeKB, dataCount: Object.keys(userData).length };
};

// 从 Gist 下载数据
export const downloadFromGist = async (gistToken, gistId) => {
    const response = await fetch(`https://api.github.com/gists/${gistId}`, {
        headers: {
            'Authorization': `token ${gistToken}`,
        }
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '读取失败');
    }

    const gist = await response.json();
    const file = gist.files['asoul-user-data.json'] || gist.files['asoul-calendar-data.json'];

    if (!file) {
        throw new Error('Gist 中未找到数据文件');
    }

    const fileSizeKB = (file.size / 1024).toFixed(2);
    const gistData = JSON.parse(file.content);

    // 转换数据格式
    let userData = {};

    if (Array.isArray(gistData)) {
        // 旧格式转换
        gistData.forEach(schedule => {
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
    } else if (typeof gistData === 'object') {
        userData = gistData;
    } else {
        throw new Error('数据格式不正确');
    }

    return { userData, fileSizeKB };
};

// 合并用户数据
export const mergeUserData = (currentUserData, importedUserData) => {
    let addedCount = 0;
    let updatedCount = 0;

    Object.keys(importedUserData).forEach(id => {
        if (currentUserData[id]) {
            if (importedUserData[id].isUserCreated) {
                currentUserData[id] = importedUserData[id];
            } else {
                const existing = currentUserData[id];
                const imported = importedUserData[id];

                if (imported.note) {
                    if (existing.note && existing.note !== imported.note) {
                        currentUserData[id].note = `${existing.note}\n---\n${imported.note}`;
                    } else {
                        currentUserData[id].note = imported.note;
                    }
                }

                if (imported.completed) currentUserData[id].completed = true;
                if (imported.link) currentUserData[id].link = imported.link;
                if (imported.isFavorite) currentUserData[id].isFavorite = true;
                if (imported.isAnime) currentUserData[id].isAnime = true;
            }
            updatedCount++;
        } else {
            currentUserData[id] = importedUserData[id];
            addedCount++;
        }
    });

    return { mergedData: currentUserData, addedCount, updatedCount };
};

// 重新加载日程
export const reloadSchedules = (userData) => {
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
