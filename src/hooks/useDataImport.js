import { BASE_SCHEDULES_KEY, USER_DATA_KEY } from '../constants';
import { mergeSchedules } from './useSchedules';
import { parseICS, syncIcsCalendars } from '../services/icsParser';

export function useDataImport({ schedules, setSchedules, icsUrls, setIsSyncing, setView }) {
    const handleSyncIcs = async () => {
        if (!icsUrls || !icsUrls.trim()) {
            alert('请先在设置中配置 ICS 订阅链接');
            setView('settings');
            return;
        }

        setIsSyncing(true);
        try {
            const { newItems, totalAdded } = await syncIcsCalendars(icsUrls, schedules);
            if (newItems.length > 0) {
                setSchedules(prev => [...prev, ...newItems]);
                alert(`同步成功！新增了 ${totalAdded} 项日程。`);
            } else {
                alert('同步完成，暂无新日程。');
            }
        } catch (err) {
            alert('同步失败：' + err.message);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleImportJSON = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target.result);
                let userData = {};

                if (Array.isArray(imported)) {
                    alert('检测到旧格式或特殊属性数据，正在转换...');
                    imported.forEach(schedule => {
                        if (schedule.isUserCreated) {
                            userData[schedule.id] = { ...schedule, isUserCreated: true };
                        } else {
                            const modifications = {};
                            if (schedule.completed) modifications.completed = true;
                            if (schedule.note) modifications.note = schedule.note;
                            if (schedule.link && !schedule.liveRoomUrl) modifications.link = schedule.link;
                            if (schedule.isFavorite) modifications.isFavorite = true;
                            if (schedule.isAnime) modifications.isAnime = true;
                            if (Object.keys(modifications).length > 0) userData[schedule.id] = modifications;
                        }
                    });
                } else if (imported && typeof imported === 'object') {
                    userData = imported;
                } else {
                    throw new Error('文件格式不正确');
                }

                const current = JSON.parse(localStorage.getItem(USER_DATA_KEY) || '{}');
                let added = 0;
                let updated = 0;
                let merged = 0;

                Object.keys(userData).forEach(id => {
                    if (current[id]) {
                        if (userData[id].isUserCreated) {
                            current[id] = userData[id];
                            updated++;
                        } else {
                            const existing = current[id];
                            const importedItem = userData[id];
                            if (importedItem.note) {
                                if (existing.note && existing.note !== importedItem.note) {
                                    current[id].note = `${existing.note}\n---\n${importedItem.note}`;
                                    merged++;
                                } else {
                                    current[id].note = importedItem.note;
                                }
                            }
                            if (importedItem.completed) current[id].completed = true;
                            if (importedItem.link) current[id].link = importedItem.link;
                            if (importedItem.isFavorite) current[id].isFavorite = true;
                            if (importedItem.isAnime) current[id].isAnime = true;
                            updated++;
                        }
                    } else {
                        current[id] = userData[id];
                        added++;
                    }
                });

                localStorage.setItem(USER_DATA_KEY, JSON.stringify(current));
                const base = JSON.parse(localStorage.getItem(BASE_SCHEDULES_KEY) || '[]');
                setSchedules(mergeSchedules(base, current));

                let message = '导入完成！\n\n';
                if (added) message += `新增 ${added} 条数据\n`;
                if (updated) message += `更新 ${updated} 条数据\n`;
                if (merged) message += `合并 ${merged} 条备注\n`;
                alert(message);
            } catch (err) {
                alert('导入失败：' + err.message);
            }
            event.target.value = '';
        };
        reader.readAsText(file);
    };

    const handleImportICSFile = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const parsed = parseICS(e.target.result);
                if (parsed.length === 0) {
                    alert('未找到有效的日程数据');
                    return;
                }

                const existingIds = new Set(schedules.map(s => s.id));
                const newEvents = parsed.filter(ev => !existingIds.has(ev.id));
                if (newEvents.length === 0) {
                    alert('所有日程都已存在，没有新数据导入');
                    return;
                }

                if (confirm(`找到 ${parsed.length} 个日程，其中 ${newEvents.length} 个是新日程。是否确认导入？`)) {
                    setSchedules(prev => [...prev, ...newEvents]);
                    alert(`成功导入 ${newEvents.length} 个新日程！`);
                }
            } catch (err) {
                alert('ICS文件解析失败：' + err.message);
            }
            event.target.value = '';
        };
        reader.onerror = () => {
            alert('文件读取失败');
            event.target.value = '';
        };
        reader.readAsText(file);
    };

    return {
        handleSyncIcs,
        handleImportJSON,
        handleImportICSFile
    };
}
