import { useState, useMemo, useEffect } from 'react';
import './App.css';
import { getSupabaseConfig, saveSupabaseConfig, isUsingDefaultConfig } from './supabaseClient';
import { getSyncId, saveSyncId, uploadToSupabase, downloadFromSupabase, getTimeUntilNextSync } from './supabaseSync';
import Icon from './components/Icon';
import FirstTimeNotice from './FirstTimeNotice';
import NetworkStatus from './components/NetworkStatus';
import LinksView from './components/LinksView';
import ChangelogNotification, { markChangelogAsRead } from './components/ChangelogNotification';
import { syncIcsCalendars, parseICS } from './services/icsParser';
import {
    uploadToGist,
    downloadFromGist,
    mergeUserData
} from './services/gistSync';

import {
    ICS_CONFIG_KEY,
    GIST_TOKEN_KEY,
    GIST_ID_KEY,
    CUSTOM_COLORS_KEY,
    LINKS_KEY,
    ANIME_VIEW_KEY,
    USER_DATA_KEY,
    BASE_SCHEDULES_KEY,
    SUPABASE_AUTO_SYNC_KEY,
    DISPLAY_MODE_KEY,
    SPECIAL_GROUP_COLOR_KEY,
    SHOW_SEARCH_BTN_KEY,
    SHOW_DYNAMIC_BTN_KEY,
    MOBILE_OPTIMIZE_KEY
} from './constants';
import { formatDateString, toZeroDate, extractUrlFromText, isTouchDevice, toBilibiliScheme } from './utils';
import { getInitialLinks } from './data/defaultLinks';

// Hooks
import { useSchedules, mergeSchedules, extractUserDataFromSchedules } from './hooks/useSchedules';
import { useAutoSync } from './hooks/useAutoSync';
import { useUrlParamLink } from './hooks/useUrlParamLink';
import { useTheme } from './hooks/useTheme';

// Views
import CalendarView from './views/CalendarView';
import AnimeView from './views/AnimeView';
import SearchView from './views/SearchView';
import SettingsView from './views/SettingsView';

// Components
import AppHeader from './AppHeader';
import NoteModal from './components/modals/NoteModal';
import AddScheduleModal from './components/modals/AddScheduleModal';
import ExternalLinkModal from './components/modals/ExternalLinkModal';
import SetLinkCandidateModal from './components/modals/SetLinkCandidateModal';

// ── 计算当前周的七天 ─────────────────────────────────────────────────────────
function getWeekDays(currentDate) {
    const ref = toZeroDate(currentDate);
    const day = ref.getDay();
    const diffToMonday = day === 0 ? 6 : day - 1;
    const monday = new Date(ref);
    monday.setDate(ref.getDate() - diffToMonday);
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return formatDateString(d);
    });
}

function App() {
    // ── 基础状态 ────────────────────────────────────────────────────────────
    const [currentDate, setCurrentDate] = useState(() => toZeroDate());
    const [view, setView] = useState(() => localStorage.getItem(ANIME_VIEW_KEY) || 'calendar');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSyncing, setIsSyncing] = useState(false);
    const [showSyncMenu, setShowSyncMenu] = useState(false);

    // ── 主题 ────────────────────────────────────────────────────────────────
    const { themeMode, toggleTheme } = useTheme();

    // ── 日程数据 ────────────────────────────────────────────────────────────
    const {
        schedules,
        setSchedules,
        isLoadingBase,
        fetchError,
        setFetchError,
        handleUpdateBaseSchedules
    } = useSchedules();

    // ── 外观设置 ────────────────────────────────────────────────────────────
    const [displayMode, setDisplayMode] = useState(() => localStorage.getItem(DISPLAY_MODE_KEY) || 'multi-color');
    const [useSpecialGroupColor, setUseSpecialGroupColor] = useState(
        () => localStorage.getItem(SPECIAL_GROUP_COLOR_KEY) !== 'false'
    );
    const [customColors, setCustomColors] = useState(() => {
        const saved = localStorage.getItem(CUSTOM_COLORS_KEY);
        return saved ? JSON.parse(saved) : {};
    });
    const [showSearchBtn, setShowSearchBtn] = useState(() => localStorage.getItem(SHOW_SEARCH_BTN_KEY) !== 'false');
    const [showDynamicBtn, setShowDynamicBtn] = useState(() => localStorage.getItem(SHOW_DYNAMIC_BTN_KEY) !== 'false');
    const [mobileOptimize, setMobileOptimize] = useState(() => localStorage.getItem(MOBILE_OPTIMIZE_KEY) !== 'false');

    // ── 链接 ────────────────────────────────────────────────────────────────
    const [links, setLinks] = useState(() => getInitialLinks());

    // ── ICS ─────────────────────────────────────────────────────────────────
    const [icsUrls, setIcsUrls] = useState(() => {
        const saved = localStorage.getItem(ICS_CONFIG_KEY);
        return saved ? JSON.parse(saved) : '';
    });

    // ── Gist 同步 ────────────────────────────────────────────────────────────
    const [gistToken, setGistToken] = useState(() => localStorage.getItem(GIST_TOKEN_KEY) || '');
    const [gistId, setGistId] = useState(() => localStorage.getItem(GIST_ID_KEY) || '');
    const [isGistSyncing, setIsGistSyncing] = useState(false);

    // ── Supabase 同步 ────────────────────────────────────────────────────────
    const [supabaseUrl, setSupabaseUrl] = useState(() => {
        const config = getSupabaseConfig();
        return config.isCustom ? config.url : '';
    });
    const [supabaseKey, setSupabaseKey] = useState(() => {
        const config = getSupabaseConfig();
        return config.isCustom ? config.key : '';
    });
    const [syncId, setSyncId] = useState(() => getSyncId() || '');
    const [isSupabaseSyncing, setIsSupabaseSyncing] = useState(false);
    const [syncCooldown, setSyncCooldown] = useState(0);
    const [showCustomConfig, setShowCustomConfig] = useState(() => {
        const config = getSupabaseConfig();
        return config.isCustom;
    });

    // ── 自动同步 ─────────────────────────────────────────────────────────────
    const { gistAutoSync, setGistAutoSync, supabaseAutoSync, setSupabaseAutoSync, showAutoSyncToast, autoSyncToastMessage } =
        useAutoSync({ schedules, isLoadingBase, gistToken, gistId, setGistId, supabaseUrl, supabaseKey, syncId });

    // ── URL 参数设置链接 ─────────────────────────────────────────────────────
    const { setLinkCandidateModal, setSetLinkCandidateModal, applyScheduleLink } =
        useUrlParamLink({ schedules, isLoadingBase, setSchedules, setCurrentDate, setView });

    // ── 备注弹窗 ─────────────────────────────────────────────────────────────
    const [editingNoteId, setEditingNoteId] = useState(null);
    const [tempNote, setTempNote] = useState('');
    const [tempLink, setTempLink] = useState('');

    // ── 新增日程弹窗 ─────────────────────────────────────────────────────────
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newSchedule, setNewSchedule] = useState({
        date: formatDateString(new Date()),
        time: '20:00',
        type: '直播',
        subTitle: '',
        title: '',
        category: '嘉然',
        isAnime: false,
        link: '',
        isFavorite: false
    });

    // ── 外部链接确认弹窗 ─────────────────────────────────────────────────────
    const [externalLinkModal, setExternalLinkModal] = useState({ isOpen: false, url: '' });

    // ── 文本解析（隐藏功能） ─────────────────────────────────────────────────
    const [inputText, setInputText] = useState('');

    // ── 副作用：持久化 ────────────────────────────────────────────────────────
    useEffect(() => { localStorage.setItem(ICS_CONFIG_KEY, JSON.stringify(icsUrls)); }, [icsUrls]);
    useEffect(() => { if (gistToken) localStorage.setItem(GIST_TOKEN_KEY, gistToken); else localStorage.removeItem(GIST_TOKEN_KEY); }, [gistToken]);
    useEffect(() => { if (gistId) localStorage.setItem(GIST_ID_KEY, gistId); else localStorage.removeItem(GIST_ID_KEY); }, [gistId]);
    useEffect(() => { localStorage.setItem(CUSTOM_COLORS_KEY, JSON.stringify(customColors)); setSchedules(prev => [...prev]); }, [customColors]);
    useEffect(() => { setSchedules(prev => [...prev]); }, [useSpecialGroupColor]);
    useEffect(() => { localStorage.setItem(LINKS_KEY, JSON.stringify(links)); }, [links]);
    useEffect(() => { if (showCustomConfig && supabaseUrl && supabaseKey) { saveSupabaseConfig(supabaseUrl, supabaseKey); } else if (!showCustomConfig) { saveSupabaseConfig('', ''); } }, [supabaseUrl, supabaseKey, showCustomConfig]);
    useEffect(() => { if (syncId) saveSyncId(syncId); }, [syncId]);
    useEffect(() => { localStorage.setItem(ANIME_VIEW_KEY, view); }, [view]);

    // 同步冷却倒计时
    useEffect(() => {
        const updateCooldown = () => setSyncCooldown(getTimeUntilNextSync());
        updateCooldown();
        const interval = setInterval(updateCooldown, 1000);
        return () => clearInterval(interval);
    }, []);

    // 点击外部关闭同步菜单
    useEffect(() => {
        const handler = () => { if (showSyncMenu) setShowSyncMenu(false); };
        document.addEventListener('click', handler);
        return () => document.removeEventListener('click', handler);
    }, [showSyncMenu]);

    // ── Memos ────────────────────────────────────────────────────────────────
    const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);

    const filteredSchedules = useMemo(() => {
        if (!searchQuery.trim()) return [];
        const keywords = searchQuery.toLowerCase().split(/\s+/).filter(k => k.length > 0);
        return schedules.filter(s => {
            const text = [s.title, s.subTitle, s.category, s.type, s.note || '', s.date].join(' ').toLowerCase();
            return keywords.every(kw => text.includes(kw));
        }).sort((a, b) => new Date(b.date.replace(/\//g, '-')) - new Date(a.date.replace(/\//g, '-')));
    }, [schedules, searchQuery]);

    // ── 操作函数 ─────────────────────────────────────────────────────────────
    const toggleComplete = (id) => setSchedules(prev => prev.map(s => s.id === id ? { ...s, completed: !s.completed } : s));
    const toggleFavorite = (id) => setSchedules(prev => prev.map(s => {
        if (s.id !== id) return s;
        const newFav = !s.isFavorite;
        return { ...s, isFavorite: newFav, isAnime: newFav ? true : false };
    }));

    const saveNote = (id) => {
        let finalLink = tempLink;
        if (tempLink.trim()) {
            const extracted = extractUrlFromText(tempLink);
            if (extracted) finalLink = extracted;
        }
        setSchedules(prev => prev.map(s => s.id === id ? { ...s, note: tempNote, link: finalLink } : s));
        setEditingNoteId(null);
    };

    const handleBilibiliSearch = (item) => {
        const parts = item.date.split('/');
        const keyword = encodeURIComponent(`${item.category} ${parts[0]}.${parseInt(parts[1], 10)}.${parseInt(parts[2], 10)}`);
        const url = `https://search.bilibili.com/all?keyword=${keyword}`;
        if (mobileOptimize && isTouchDevice()) {
            window.location.href = toBilibiliScheme(url);
        } else {
            window.open(url, '_blank');
        }
    };

    const handleManualAdd = () => {
        if (!newSchedule.title) { alert('标题为必填项'); return; }
        let formattedDate = newSchedule.date.replace(/-/g, '/');
        let time = newSchedule.time;
        if (newSchedule.isAnime) { formattedDate = '追番/追番'; time = '追番'; }
        const id = `manual-${formattedDate}-${time}-${Math.random().toString(36).substr(2, 4)}`;
        setSchedules(prev => [...prev, { ...newSchedule, id, date: formattedDate, time, completed: false, note: '', isUserCreated: true }]);
        setIsAddModalOpen(false);
        if (!newSchedule.isAnime) setCurrentDate(toZeroDate(formattedDate));
        setView(newSchedule.isAnime ? 'anime' : 'calendar');
    };

    const handleSyncIcs = async () => {
        if (!icsUrls || !icsUrls.trim()) { alert('请先在设置中配置 ICS 订阅链接'); setView('settings'); return; }
        setIsSyncing(true);
        try {
            const { newItems, totalAdded } = await syncIcsCalendars(icsUrls, schedules);
            if (newItems.length > 0) { setSchedules(prev => [...prev, ...newItems]); alert(`同步成功！新增了 ${totalAdded} 项日程。`); }
            else alert('同步完成，暂无新日程。');
        } catch (err) { alert('同步失败：' + err.message); }
        finally { setIsSyncing(false); }
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
                    imported.forEach(s => {
                        if (s.isUserCreated) { userData[s.id] = { ...s, isUserCreated: true }; }
                        else {
                            const m = {};
                            if (s.completed) m.completed = true;
                            if (s.note) m.note = s.note;
                            if (s.link && !s.liveRoomUrl) m.link = s.link;
                            if (s.isFavorite) m.isFavorite = true;
                            if (s.isAnime) m.isAnime = true;
                            if (Object.keys(m).length > 0) userData[s.id] = m;
                        }
                    });
                } else if (typeof imported === 'object') {
                    userData = imported;
                } else { throw new Error('文件格式不正确'); }

                const current = JSON.parse(localStorage.getItem(USER_DATA_KEY) || '{}');
                let added = 0, updated = 0, merged = 0;
                Object.keys(userData).forEach(id => {
                    if (current[id]) {
                        if (userData[id].isUserCreated) { current[id] = userData[id]; updated++; }
                        else {
                            const ex = current[id]; const im = userData[id];
                            if (im.note) { if (ex.note && ex.note !== im.note) { current[id].note = `${ex.note}\n---\n${im.note}`; merged++; } else { current[id].note = im.note; } }
                            if (im.completed) current[id].completed = true;
                            if (im.link) current[id].link = im.link;
                            if (im.isFavorite) current[id].isFavorite = true;
                            if (im.isAnime) current[id].isAnime = true;
                            updated++;
                        }
                    } else { current[id] = userData[id]; added++; }
                });

                localStorage.setItem(USER_DATA_KEY, JSON.stringify(current));
                const base = JSON.parse(localStorage.getItem(BASE_SCHEDULES_KEY) || '[]');
                setSchedules(mergeSchedules(base, current));

                let msg = '导入完成！\n\n';
                if (added) msg += `新增 ${added} 条数据\n`;
                if (updated) msg += `更新 ${updated} 条数据\n`;
                if (merged) msg += `合并 ${merged} 条备注\n`;
                alert(msg);
            } catch (err) { alert('导入失败：' + err.message); }
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
                if (parsed.length === 0) { alert('未找到有效的日程数据'); return; }
                const existingIds = new Set(schedules.map(s => s.id));
                const newEvents = parsed.filter(ev => !existingIds.has(ev.id));
                if (newEvents.length === 0) { alert('所有日程都已存在，没有新数据导入'); return; }
                if (confirm(`找到 ${parsed.length} 个日程，其中 ${newEvents.length} 个是新日程。是否确认导入？`)) {
                    setSchedules(prev => [...prev, ...newEvents]);
                    alert(`成功导入 ${newEvents.length} 个新日程！`);
                }
            } catch (err) { alert('ICS文件解析失败：' + err.message); }
            event.target.value = '';
        };
        reader.onerror = () => { alert('文件读取失败'); event.target.value = ''; };
        reader.readAsText(file);
    };

    // ── Gist 同步操作 ────────────────────────────────────────────────────────
    const handleSyncToGist = async () => {
        if (!gistToken) { alert('请先配置 GitHub Personal Access Token'); return; }
        setIsGistSyncing(true);
        try {
            const userData = extractUserDataFromSchedules(schedules);
            const result = await uploadToGist(gistToken, gistId, userData);
            if (!gistId) setGistId(result.gistId);
            alert(`数据已成功同步到 GitHub Gist！\n\n同步的数据：\n- 用户数据记录：${result.dataCount} 条\n- 文件大小：${result.fileSizeKB} KB`);
        } catch (err) { alert('同步失败：' + err.message); }
        finally { setIsGistSyncing(false); }
    };

    const handleLoadFromGist = async () => {
        if (!gistToken || !gistId) { alert('请先配置 GitHub Personal Access Token 和 Gist ID'); return; }
        setIsGistSyncing(true);
        try {
            const { userData, fileSizeKB } = await downloadFromGist(gistToken, gistId);
            const current = JSON.parse(localStorage.getItem(USER_DATA_KEY) || '{}');
            const { mergedData, addedCount, updatedCount } = mergeUserData(current, userData);
            localStorage.setItem(USER_DATA_KEY, JSON.stringify(mergedData));
            setSchedules(mergeSchedules(JSON.parse(localStorage.getItem(BASE_SCHEDULES_KEY) || '[]'), mergedData));
            alert(`成功从 Gist 加载数据！\n\n- 新增：${addedCount} 条\n- 更新：${updatedCount} 条\n- 文件大小：${fileSizeKB} KB`);
        } catch (err) { alert('读取失败：' + err.message); }
        finally { setIsGistSyncing(false); }
    };

    const handleReplaceFromGist = async () => {
        if (!gistToken || !gistId) { alert('请先配置 GitHub Personal Access Token 和 Gist ID'); return; }
        if (!confirm('此操作将用 Gist 中的用户数据完全替换本地用户数据，确定继续吗？\n\n注意：基础日程库不会被影响。')) return;
        setIsGistSyncing(true);
        try {
            const { userData, fileSizeKB } = await downloadFromGist(gistToken, gistId);
            localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
            setSchedules(mergeSchedules(JSON.parse(localStorage.getItem(BASE_SCHEDULES_KEY) || '[]'), userData));
            alert(`成功从 Gist 恢复用户数据！\n\n- 用户数据记录：${Object.keys(userData).length} 条\n- 文件大小：${fileSizeKB} KB`);
        } catch (err) { alert('读取失败：' + err.message); }
        finally { setIsGistSyncing(false); }
    };

    // ── Supabase 同步操作 ────────────────────────────────────────────────────
    const handleUploadToSupabase = async () => {
        if (!syncId || !syncId.trim()) { alert('请先设置同步 ID'); return; }
        setIsSupabaseSyncing(true);
        try {
            const userData = extractUserDataFromSchedules(schedules);

            const dataCount = Object.keys(userData).length;
            const dataSizeKB = (new Blob([JSON.stringify(userData)]).size / 1024).toFixed(2);

            if (isUsingDefaultConfig()) {
                const warn = dataSizeKB > 80 ? '\n\n⚠️ 数据接近 100 KB 限制，建议使用自定义 Supabase 服务器' : '';
                if (!confirm(`准备上传数据到默认云同步服务\n\n用户数据记录：${dataCount} 条\n文件大小：${dataSizeKB} KB / 100 KB${warn}\n\n是否继续？`)) {
                    setIsSupabaseSyncing(false); return;
                }
            }

            await uploadToSupabase(userData, syncId);
            alert(`数据已成功上传到 Supabase！\n\n同步 ID: ${syncId}\n用户数据记录：${dataCount} 条\n文件大小：${dataSizeKB} KB${isUsingDefaultConfig() ? ' / 100 KB' : ''}`);
            setSyncCooldown(300);
        } catch (err) { alert('上传失败：' + err.message); }
        finally { setIsSupabaseSyncing(false); }
    };

    const handleDownloadFromSupabase = async () => {
        if (!syncId || !syncId.trim()) { alert('请先设置同步 ID'); return; }
        setIsSupabaseSyncing(true);
        try {
            const result = await downloadFromSupabase(syncId);
            const userData = result.user_data;
            if (!userData || typeof userData !== 'object') throw new Error('数据格式不正确');

            const current = JSON.parse(localStorage.getItem(USER_DATA_KEY) || '{}');
            let added = 0, updated = 0;
            Object.keys(userData).forEach(id => {
                if (current[id]) {
                    if (userData[id].isUserCreated) { current[id] = userData[id]; }
                    else {
                        const ex = current[id]; const im = userData[id];
                        if (im.note) { if (ex.note && ex.note !== im.note) current[id].note = `${ex.note}\n---\n${im.note}`; else current[id].note = im.note; }
                        if (im.completed) current[id].completed = true;
                        if (im.link) current[id].link = im.link;
                        if (im.isFavorite) current[id].isFavorite = true;
                        if (im.isAnime) current[id].isAnime = true;
                    }
                    updated++;
                } else { current[id] = userData[id]; added++; }
            });

            localStorage.setItem(USER_DATA_KEY, JSON.stringify(current));
            const base = JSON.parse(localStorage.getItem(BASE_SCHEDULES_KEY) || '[]');
            setSchedules(mergeSchedules(base, current));

            alert(`成功从 Supabase 下载数据！\n\n同步 ID: ${syncId}\n新增：${added} 条\n更新：${updated} 条\n更新时间：${new Date(result.updated_at).toLocaleString('zh-CN')}`);
            setSyncCooldown(300);
        } catch (err) { alert('下载失败：' + err.message); }
        finally { setIsSupabaseSyncing(false); }
    };

    // 文本解析
    const parseText = (text) => {
        if (!text.trim()) return;
        const lines = text.split('\n').map(l => l.trim()).filter(l => l !== '');
        const newSchedules = [];
        let activeDate = '';
        const dateRegex = /(\d{4}[\/\-]\d{2}[\/\-]\d{2})/;
        const timeRegex = /^(\d{2}:\d{2})$/;
        const fingerprint = (item) => `${item.date}|${item.time}|${item.subTitle}|${item.title}`.replace(/\s+/g, '');
        const existing = new Set(schedules.map(fingerprint));

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const dM = line.match(dateRegex); if (dM) { activeDate = dM[1].replace(/-/g, '/'); continue; }
            const tM = line.match(timeRegex);
            if (tM && activeDate) {
                const time = tM[1], type = lines[i + 1] || '未知', subTitle = lines[i + 2] || '';
                const raw = lines[i + 3] || ''; const finalTitle = (raw === '动态' || !raw) ? subTitle : raw;
                const fp = `${activeDate}|${time}|${subTitle}|${finalTitle}`.replace(/\s+/g, '');
                if (existing.has(fp)) { i += 3; continue; }
                let category = '其他'; const cs = subTitle + finalTitle;
                if (cs.includes('贝拉')) category = '贝拉'; else if (cs.includes('嘉然')) category = '嘉然';
                else if (cs.includes('乃琳')) category = '乃琳'; else if (cs.includes('思诺')) category = '思诺';
                else if (cs.includes('心宜')) category = '心宜'; else if (cs.includes('A-SOUL')) category = 'A-SOUL';
                else if (cs.includes('有点宜思') || cs.includes('心宜思诺') || cs.includes('小心思')) category = '小心思';
                const id = `parse-${activeDate}-${time}-${Math.random().toString(36).substr(2, 4)}`.replace(/\s+/g, '');
                newSchedules.push({ id, date: activeDate, time, type, subTitle, title: finalTitle, category, completed: false, note: '' });
                existing.add(fp); i += 3;
            }
        }
        if (newSchedules.length > 0) { setSchedules(prev => [...prev, ...newSchedules]); alert(`成功导入 ${newSchedules.length} 项新日程。`); setInputText(''); setView('calendar'); }
        else if (text.trim()) alert('未发现新日程。');
    };

    // ── 公共 ScheduleCard props ───────────────────────────────────────────────
    const scheduleCardProps = {
        toggleComplete, toggleFavorite, handleBilibiliSearch,
        setEditingNoteId, setTempNote, setTempLink,
        setSchedules, setExternalLinkModal,
        showSearchBtn, showDynamicBtn, mobileOptimize
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <>
            <FirstTimeNotice />
            <NetworkStatus />

            {/* 基础日程库拉取失败提示 */}
            {fetchError && (
                <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg bg-red-500 text-white flex items-center gap-3">
                    <span>日程库拉取失败，请检查网络连接</span>
                    <button onClick={() => setFetchError(false)} className="text-white/80 hover:text-white text-lg leading-none">×</button>
                </div>
            )}

            {/* 自动同步 Toast */}
            {showAutoSyncToast && (
                <div className="fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg bg-green-500 text-white flex items-center gap-3 animate-pulse">
                    <Icon name="check-circle-2" className="w-5 h-5" />
                    <span>{autoSyncToastMessage}</span>
                </div>
            )}

            <div className="flex flex-col h-screen transition-colors duration-300 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
                {/* 顶部导航 */}
                <AppHeader
                    view={view}
                    setView={setView}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    themeMode={themeMode}
                    toggleTheme={toggleTheme}
                />

                {/* 主内容区 */}
                <main className="flex-1 overflow-hidden relative pb-10">
                    {view === 'calendar' && (
                        <CalendarView
                            weekDays={weekDays}
                            schedules={schedules}
                            isLoadingBase={isLoadingBase}
                            isSyncing={isSyncing}
                            currentDate={currentDate}
                            setCurrentDate={setCurrentDate}
                            setView={setView}
                            setIsAddModalOpen={setIsAddModalOpen}
                            setNewSchedule={setNewSchedule}
                            handleUpdateBaseSchedules={handleUpdateBaseSchedules}
                            handleSyncIcs={handleSyncIcs}
                            showSyncMenu={showSyncMenu}
                            setShowSyncMenu={setShowSyncMenu}
                            gistToken={gistToken}
                            syncId={syncId}
                            handleSyncToGist={handleSyncToGist}
                            handleUploadToSupabase={handleUploadToSupabase}
                            isGistSyncing={isGistSyncing}
                            {...scheduleCardProps}
                        />
                    )}

                    {view === 'anime' && (
                        <AnimeView
                            schedules={schedules}
                            setIsAddModalOpen={setIsAddModalOpen}
                            setNewSchedule={setNewSchedule}
                            {...scheduleCardProps}
                        />
                    )}

                    {view === 'links' && (
                        <LinksView links={links} setLinks={setLinks} mobileOptimize={mobileOptimize} />
                    )}

                    {view === 'search' && (
                        <SearchView filteredSchedules={filteredSchedules} {...scheduleCardProps} />
                    )}

                    {view === 'changelog' && (
                        <SettingsView view="changelog" setView={setView} schedules={schedules} setSchedules={setSchedules} />
                    )}

                    {view === 'settings' && (
                        <SettingsView
                            view={view}
                            setView={setView}
                            schedules={schedules}
                            setSchedules={setSchedules}
                            displayMode={displayMode} setDisplayMode={setDisplayMode}
                            useSpecialGroupColor={useSpecialGroupColor} setUseSpecialGroupColor={setUseSpecialGroupColor}
                            showSearchBtn={showSearchBtn} setShowSearchBtn={setShowSearchBtn}
                            showDynamicBtn={showDynamicBtn} setShowDynamicBtn={setShowDynamicBtn}
                            mobileOptimize={mobileOptimize} setMobileOptimize={setMobileOptimize}
                            customColors={customColors} setCustomColors={setCustomColors}
                            isLoadingBase={isLoadingBase} handleUpdateBaseSchedules={handleUpdateBaseSchedules}
                            gistToken={gistToken} setGistToken={setGistToken}
                            gistId={gistId} setGistId={setGistId}
                            gistAutoSync={gistAutoSync} setGistAutoSync={setGistAutoSync}
                            isGistSyncing={isGistSyncing}
                            handleSyncToGist={handleSyncToGist}
                            handleLoadFromGist={handleLoadFromGist}
                            handleReplaceFromGist={handleReplaceFromGist}
                            syncId={syncId} setSyncId={setSyncId}
                            syncCooldown={syncCooldown}
                            isSupabaseSyncing={isSupabaseSyncing}
                            supabaseAutoSync={supabaseAutoSync} setSupabaseAutoSync={setSupabaseAutoSync}
                            showCustomConfig={showCustomConfig} setShowCustomConfig={setShowCustomConfig}
                            supabaseUrl={supabaseUrl} setSupabaseUrl={setSupabaseUrl}
                            supabaseKey={supabaseKey} setSupabaseKey={setSupabaseKey}
                            handleUploadToSupabase={handleUploadToSupabase}
                            handleDownloadFromSupabase={handleDownloadFromSupabase}
                            handleImportJSON={handleImportJSON}
                            handleImportICSFile={handleImportICSFile}
                            handleSyncIcs={handleSyncIcs}
                            isSyncing={isSyncing}
                            icsUrls={icsUrls} setIcsUrls={setIcsUrls}
                            inputText={inputText} setInputText={setInputText}
                            parseText={parseText}
                        />
                    )}
                </main>

                {/* 弹窗层 */}
                <NoteModal
                    editingNoteId={editingNoteId}
                    tempNote={tempNote} setTempNote={setTempNote}
                    tempLink={tempLink} setTempLink={setTempLink}
                    onSave={saveNote}
                    onClose={() => setEditingNoteId(null)}
                />

                <AddScheduleModal
                    isOpen={isAddModalOpen}
                    newSchedule={newSchedule}
                    setNewSchedule={setNewSchedule}
                    onAdd={handleManualAdd}
                    onClose={() => setIsAddModalOpen(false)}
                />

                <ExternalLinkModal
                    modal={externalLinkModal}
                    onClose={() => setExternalLinkModal({ isOpen: false, url: '' })}
                />

                <SetLinkCandidateModal
                    modal={setLinkCandidateModal}
                    onSelect={(s, link) => { applyScheduleLink(s, link); setSetLinkCandidateModal({ isOpen: false, candidates: [], pendingLink: '' }); }}
                    onClose={() => setSetLinkCandidateModal({ isOpen: false, candidates: [], pendingLink: '' })}
                />

                {/* 页脚 */}
                <footer className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-t dark:border-slate-800 py-2 px-4 z-10">
                    <div className="max-w-6xl mx-auto flex justify-center items-center">
                        <span className="text-xs text-slate-600 dark:text-slate-400">
                            <a href="https://github.com/Evelynall/ASoul-Calendar" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline ml-1">项目Github</a>
                            &nbsp;&nbsp;
                            <a href="https://greasyfork.org/zh-CN/scripts/577237-%E6%9E%9D%E6%B1%9F%E8%BF%BD%E7%95%AA%E8%A1%A8%E8%BF%9B%E5%BA%A6%E4%BF%9D%E5%AD%98%E8%84%9A%E6%9C%AC" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline ml-1">进度保存脚本</a>
                            &nbsp;&nbsp; 所有日程数据均来自枝江站(asoul.love)，感谢
                            <a href="https://asoul.love/" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline ml-1">枝江站</a>
                            &nbsp;的分享与许可！&nbsp;
                            <a onClick={(e) => { e.preventDefault(); markChangelogAsRead(); setView('changelog'); }} className="text-blue-600 dark:text-blue-400 hover:underline ml-1" href="#">查看更新日志</a>
                        </span>
                    </div>
                </footer>

                {/* 重大更新通知 */}
                <ChangelogNotification onOpenChangelog={() => { markChangelogAsRead(); setView('changelog'); }} />
            </div>
        </>
    );
}

export default App;
