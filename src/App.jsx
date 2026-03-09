import { useState, useMemo, useEffect, useRef } from 'react';
import './App.css';
import { getSupabaseConfig, saveSupabaseConfig, isUsingDefaultConfig } from './supabaseClient';
import { getSyncId, saveSyncId, uploadToSupabase, downloadFromSupabase, canSync, getTimeUntilNextSync } from './supabaseSync';
import { saveToIndexedDB, loadFromIndexedDB, deleteDatabase } from './indexedDBStorage';
import FirstTimeNotice from './FirstTimeNotice';
import Icon from './components/Icon';
import SettingsSection from './components/SettingsSection';
import ScheduleCard from './components/ScheduleCard';
import ChangelogView from './components/ChangelogView';
import LinksView from './components/LinksView';
import { parseICS, syncIcsCalendars } from './services/icsParser';
import {
    extractUserData,
    uploadToGist,
    downloadFromGist,
    mergeUserData,
    reloadSchedules
} from './services/gistSync';
import {
    extractUserDataForExport,
    importUserData,
    mergeImportedUserData,
    reloadSchedulesFromUserData,
    exportUserCreatedSchedules,
    exportCleanedSchedules,
    clearUserData
} from './services/dataManager';
import {
    STORAGE_KEY,
    USER_DATA_KEY,
    BASE_SCHEDULES_KEY,
    BASE_SCHEDULES_VERSION_KEY,
    BASE_SCHEDULES_LAST_FETCH_KEY,
    THEME_KEY,
    ICS_CONFIG_KEY,
    DISPLAY_MODE_KEY,
    SPECIAL_GROUP_COLOR_KEY,
    ANIME_VIEW_KEY,
    GIST_TOKEN_KEY,
    GIST_ID_KEY,
    CUSTOM_COLORS_KEY,
    LINKS_KEY,
    BASE_SCHEDULES_URL,
    DEFAULT_MEMBER_CONFIG,
    LIVE_ROOM_URLS
} from './constants';
import {
    getBaseSchedulesUrl,
    shouldFetchBaseSchedules,
    getMemberConfigColors,
    getMemberByLiveRoomUrl,
    getMemberConfig,
    formatDateString,
    toZeroDate,
    extractUrlFromText
} from './utils';

const MEMBER_CONFIG = getMemberConfigColors();

function App() {
    const [schedules, setSchedules] = useState([]);
    const [isLoadingBase, setIsLoadingBase] = useState(true);

    const [currentDate, setCurrentDate] = useState(() => toZeroDate());
    const [view, setView] = useState(() => localStorage.getItem(ANIME_VIEW_KEY) || 'calendar');
    const [searchQuery, setSearchQuery] = useState('');
    const [inputText, setInputText] = useState('');
    const [editingNoteId, setEditingNoteId] = useState(null);
    const [tempNote, setTempNote] = useState('');
    const [tempLink, setTempLink] = useState('');
    const [themeMode, setThemeMode] = useState(() => localStorage.getItem(THEME_KEY) || 'auto');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [icsUrls, setIcsUrls] = useState(() => {
        const saved = localStorage.getItem(ICS_CONFIG_KEY);
        return saved ? JSON.parse(saved) : '';
    });
    const [displayMode, setDisplayMode] = useState(() => localStorage.getItem(DISPLAY_MODE_KEY) || 'multi-color');
    const [useSpecialGroupColor, setUseSpecialGroupColor] = useState(() => localStorage.getItem(SPECIAL_GROUP_COLOR_KEY) !==
        'false');
    const [gistToken, setGistToken] = useState(() => localStorage.getItem(GIST_TOKEN_KEY) || '');
    const [gistId, setGistId] = useState(() => localStorage.getItem(GIST_ID_KEY) || '');
    const [isGistSyncing, setIsGistSyncing] = useState(false);
    const [customColors, setCustomColors] = useState(() => {
        const saved = localStorage.getItem(CUSTOM_COLORS_KEY);
        return saved ? JSON.parse(saved) : {};
    });
    const [links, setLinks] = useState(() => {
        const saved = localStorage.getItem(LINKS_KEY);
        if (saved) {
            return JSON.parse(saved);
        }
        // 默认链接
        return [
            {
                id: 'default-1',
                title: 'A-SOUL官方账号',
                description: 'A-SOUL官方B站账号',
                url: 'https://space.bilibili.com/703007996',
                icon: 'bilibili'
            },
            {
                id: 'default-2',
                title: '枝江日程表',
                description: '粉丝搭建的第三方日程表',
                url: 'https://asoul.love/',
                icon: 'calendar'
            },
            {
                id: 'default-3',
                title: '贝极星空间站的日常',
                description: '贝拉的tag动态',
                url: 'https://www.bilibili.com/v/topic/detail?topic_id=32780&topic_name=%E8%B4%9D%E6%9E%81%E6%98%9F%E7%A9%BA%E9%97%B4%E7%AB%99%E7%9A%84%E6%97%A5%E5%B8%B8',
                icon: 'calendar'
            },
            {
                id: 'default-4',
                title: '嘉心糖的手帐本',
                description: '嘉然的tag动态',
                url: 'https://www.bilibili.com/v/topic/detail?topic_id=36443&topic_name=%E5%98%89%E5%BF%83%E7%B3%96%E7%9A%84%E6%89%8B%E5%B8%90%E6%9C%AC',
                icon: 'calendar'
            },
            {
                id: 'default-5',
                title: '乃琳夸夸群',
                description: '乃琳的tag动态',
                url: 'https://www.bilibili.com/v/topic/detail?topic_id=9825&topic_name=%E4%B9%83%E7%90%B3%E5%A4%B8%E5%A4%B8%E7%BE%A4',
                icon: 'calendar'
            },
            {
                id: 'default-6',
                title: '今日宜心动',
                description: '心宜的tag动态',
                url: 'https://www.bilibili.com/v/topic/detail?topic_id=1120163&topic_name=%E4%BB%8A%E6%97%A5%E5%AE%9C%E5%BF%83%E5%8A%A8',
                icon: 'calendar'
            },
            {
                id: 'default-7',
                title: '小海诺嘀嘀嘀吹',
                description: '思诺的tag动态',
                url: 'https://www.bilibili.com/v/topic/detail?topic_id=1123339&topic_name=%E5%B0%8F%E6%B5%B7%E8%AF%BA%E5%98%80%E5%98%80%E5%98%80%E5%90%B9',
                icon: 'calendar'
            },
            {
                id: 'default-8',
                title: 'GitHub仓库',
                description: '本项目开源地址',
                url: 'https://github.com/Evelynall/ASoul-Data',
                icon: 'github'
            }
        ];
    });

    // Supabase 同步相关状态
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

    // 外部链接确认弹窗状态
    const [externalLinkModal, setExternalLinkModal] = useState({
        isOpen: false,
        url: ''
    });

    const fileInputRef = useRef(null);

    // 加载并合并基础日程库和用户数据
    useEffect(() => {
        const loadSchedules = async () => {
            setIsLoadingBase(true);
            try {
                // 1. 尝试从网络加载基础日程库
                let baseSchedules = [];
                let baseVersion = null;

                // 检查是否需要重新获取（2小时限制）
                if (shouldFetchBaseSchedules()) {
                    try {
                        const response = await fetch(getBaseSchedulesUrl());
                        if (response.ok) {
                            const data = await response.json();
                            baseSchedules = data.schedules || [];
                            baseVersion = data.version || Date.now();

                            // 缓存基础日程库和获取时间
                            localStorage.setItem(BASE_SCHEDULES_KEY, JSON.stringify(baseSchedules));
                            localStorage.setItem(BASE_SCHEDULES_VERSION_KEY, baseVersion.toString());
                            localStorage.setItem(BASE_SCHEDULES_LAST_FETCH_KEY, Date.now().toString());
                        }
                    } catch (error) {
                        console.warn('无法加载基础日程库，使用缓存数据:', error);
                        // 如果网络加载失败，使用缓存
                        const cached = localStorage.getItem(BASE_SCHEDULES_KEY);
                        if (cached) {
                            baseSchedules = JSON.parse(cached);
                        }
                    }
                } else {
                    // 未超过2小时，直接使用缓存
                    console.log('使用缓存的基础日程（未超过2小时）');
                    const cached = localStorage.getItem(BASE_SCHEDULES_KEY);
                    if (cached) {
                        baseSchedules = JSON.parse(cached);
                    }
                }

                // 2. 加载用户数据（完成状态、备注、用户添加的日程）
                let userData = null;

                // 尝试从 localStorage 读取
                try {
                    const localData = localStorage.getItem(USER_DATA_KEY);
                    if (localData) {
                        userData = JSON.parse(localData);
                        console.log('[数据加载] 从 localStorage 加载用户数据成功');
                    }
                } catch (error) {
                    console.warn('[数据加载] localStorage 读取失败，尝试从 IndexedDB 恢复:', error);
                }

                // 如果 localStorage 失败，尝试从 IndexedDB 恢复
                if (!userData) {
                    try {
                        const indexedData = await loadFromIndexedDB(USER_DATA_KEY);
                        if (indexedData) {
                            userData = indexedData;
                            console.log('[数据恢复] 从 IndexedDB 恢复用户数据成功');
                            // 恢复到 localStorage
                            localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
                            console.log('[数据恢复] 已将数据恢复到 localStorage');
                        }
                    } catch (error) {
                        console.error('[数据恢复] IndexedDB 读取失败:', error);
                    }
                }

                // 如果两者都失败，使用空对象
                if (!userData) {
                    userData = {};
                    console.log('[数据加载] 使用空用户数据');
                }

                // 3. 合并数据
                const mergedSchedules = baseSchedules.map(baseItem => {
                    const userItem = userData[baseItem.id];
                    return {
                        ...baseItem,
                        completed: userItem?.completed || false,
                        note: userItem?.note || '',
                        link: userItem?.link || baseItem.link || '',
                        isFavorite: userItem?.isFavorite || false,
                        isAnime: userItem?.isAnime || baseItem.isAnime || false,
                        isBaseSchedule: true // 标记为基础日程
                    };
                });

                // 4. 添加用户自己创建的日程
                const userSchedules = Object.values(userData)
                    .filter(item => item.isUserCreated)
                    .map(item => ({
                        ...item,
                        isAnime: item.isAnime || false,
                        isFavorite: item.isFavorite || false
                    }));

                setSchedules([...mergedSchedules, ...userSchedules]);
            } catch (error) {
                console.error('加载日程数据失败:', error);
                // 如果完全失败，尝试加载旧的完整数据（兼容旧版本）
                const oldData = localStorage.getItem(STORAGE_KEY);
                if (oldData) {
                    const data = JSON.parse(oldData);
                    setSchedules(Array.isArray(data) ? data.map(item => ({
                        ...item,
                        isAnime: item.isAnime || false,
                        isFavorite: item.isFavorite || false
                    })) : []);
                }
            } finally {
                setIsLoadingBase(false);
            }
        };

        loadSchedules();
    }, []);

    useEffect(() => {
        if (schedules.length === 0) return;

        // 分离用户数据和基础数据
        const userData = {};

        schedules.forEach(schedule => {
            if (schedule.isUserCreated) {
                // 用户创建的日程，保存完整数据
                userData[schedule.id] = { ...schedule, isUserCreated: true };
            } else if (schedule.isBaseSchedule) {
                // 基础日程，只保存用户修改的部分
                const userModifications = {};
                if (schedule.completed) userModifications.completed = true;
                if (schedule.note) userModifications.note = schedule.note;
                // 保存用户自定义的链接（排除系统自带的链接）
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

        // 保存到 localStorage
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
        // 保留旧的存储方式作为备份（可选）
        localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules));

        // 同时备份到 IndexedDB
        saveToIndexedDB(USER_DATA_KEY, userData).catch(err => {
            console.error('[备份] IndexedDB 备份失败:', err);
        });
    }, [schedules]);

    useEffect(() => {
        localStorage.setItem(ICS_CONFIG_KEY, JSON.stringify(icsUrls));
    }, [icsUrls]);

    useEffect(() => {
        if (gistToken) localStorage.setItem(GIST_TOKEN_KEY, gistToken);
        else localStorage.removeItem(GIST_TOKEN_KEY);
    }, [gistToken]);

    useEffect(() => {
        if (gistId) localStorage.setItem(GIST_ID_KEY, gistId);
        else localStorage.removeItem(GIST_ID_KEY);
    }, [gistId]);

    useEffect(() => {
        localStorage.setItem(CUSTOM_COLORS_KEY, JSON.stringify(customColors));
        // 强制重新渲染以应用新颜色
        setSchedules(prev => [...prev]);
    }, [customColors]);

    useEffect(() => {
        localStorage.setItem(LINKS_KEY, JSON.stringify(links));
    }, [links]);

    // 保存 Supabase 配置
    useEffect(() => {
        if (showCustomConfig && supabaseUrl && supabaseKey) {
            saveSupabaseConfig(supabaseUrl, supabaseKey);
        } else if (!showCustomConfig) {
            // 清除自定义配置，使用默认配置
            saveSupabaseConfig('', '');
        }
    }, [supabaseUrl, supabaseKey, showCustomConfig]);

    // 保存同步 ID
    useEffect(() => {
        if (syncId) {
            saveSyncId(syncId);
        }
    }, [syncId]);

    // 更新同步冷却时间
    useEffect(() => {
        const updateCooldown = () => {
            const remaining = getTimeUntilNextSync();
            setSyncCooldown(remaining);
        };

        updateCooldown();
        const interval = setInterval(updateCooldown, 1000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const root = document.documentElement;
        localStorage.setItem(THEME_KEY, themeMode);
        const handleTheme = () => {
            if (themeMode === 'auto') {
                const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (isDark) {
                    root.classList.add('dark');
                } else {
                    root.classList.remove('dark');
                }
            } else {
                if (themeMode === 'dark') {
                    root.classList.add('dark');
                } else {
                    root.classList.remove('dark');
                }
            }
        };
        handleTheme();

        // 监听系统主题变化
        if (themeMode === 'auto') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const listener = (e) => {
                if (e.matches) {
                    root.classList.add('dark');
                } else {
                    root.classList.remove('dark');
                }
            };
            mediaQuery.addEventListener('change', listener);
            return () => mediaQuery.removeEventListener('change', listener);
        }
    }, [themeMode]);

    const weekDays = useMemo(() => {
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
    }, [currentDate]);

    const jumpToDate = (dateStr) => {
        setCurrentDate(toZeroDate(dateStr));
        setView('calendar');
        setSearchQuery('');
    };

    // 切换视图时保存到本地存储
    useEffect(() => {
        localStorage.setItem(ANIME_VIEW_KEY, view);
    }, [view]);

    const handleBilibiliSearch = (item) => {
        const parts = item.date.split('/');
        const year = parts[0];
        const month = parseInt(parts[1], 10);
        const day = parseInt(parts[2], 10);
        const formattedDate = `${year}.${month}.${day}`;
        const keyword = encodeURIComponent(`${item.category} ${formattedDate}`);
        const url = `https://search.bilibili.com/all?keyword=${keyword}`;
        window.open(url, '_blank');
    };

    const handleLiveRoom = (member) => {
        const liveUrl = LIVE_ROOM_URLS[member];
        if (liveUrl) {
            window.open(liveUrl, '_blank');
        }
    };

    const toggleComplete = (id) => {
        setSchedules(prev => prev.map(s => s.id === id ? { ...s, completed: !s.completed } : s));
    };

    const toggleAnimeStatus = (id) => {
        setSchedules(prev => prev.map(s => s.id === id ? { ...s, isAnime: !s.isAnime } : s));
    };

    // 切换收藏状态
    const toggleFavorite = (id) => {
        setSchedules(prev => prev.map(s => {
            if (s.id === id) {
                const newFavoriteStatus = !s.isFavorite;
                // 如果收藏，同时标记为追番；如果取消收藏，恢复为普通日历日程
                return {
                    ...s,
                    isFavorite: newFavoriteStatus,
                    isAnime: newFavoriteStatus ? true : false
                };
            }
            return s;
        }));
    };

    const saveNote = (id) => {
        // 在保存时自动从链接输入框文本中提取纯链接
        let finalLink = tempLink;
        if (tempLink.trim()) {
            const extractedUrl = extractUrlFromText(tempLink);
            if (extractedUrl) {
                finalLink = extractedUrl;
            }
        }

        setSchedules(prev => prev.map(s => s.id === id ? { ...s, note: tempNote, link: finalLink } : s));
        setEditingNoteId(null);
    };

    const filteredSchedules = useMemo(() => {
        if (!searchQuery.trim()) return [];
        const keywords = searchQuery.toLowerCase().split(/\s+/).filter(k => k.length > 0);
        return schedules.filter(s => {
            const searchableText = [s.title, s.subTitle, s.category, s.type, s.note || '', s.date].join(' ').toLowerCase();
            return keywords.every(kw => searchableText.includes(kw));
        }).sort((a, b) => new Date(b.date.replace(/\//g, '-')) - new Date(a.date.replace(/\//g, '-')));
    }, [schedules, searchQuery]);

    const handleManualAdd = () => {
        if (!newSchedule.title) { alert('标题为必填项'); return; }

        let formattedDate = newSchedule.date.replace(/-/g, '/');
        let time = newSchedule.time;

        // 如果是追番日程，使用固定日期和时间
        if (newSchedule.isAnime) {
            formattedDate = '追番/追番';
            time = '追番';
        }

        const id = `manual-${formattedDate}-${time}-${Math.random().toString(36).substr(2, 4)}`;
        const entry = {
            ...newSchedule,
            id,
            date: formattedDate,
            time: time,
            completed: false,
            note: '',
            isUserCreated: true // 标记为用户创建
        };
        setSchedules(prev => [...prev, entry]);
        setIsAddModalOpen(false);

        // 只有日历日程才需要跳转到日期位置
        if (!newSchedule.isAnime) {
            setCurrentDate(toZeroDate(formattedDate));
        }

        setView(newSchedule.isAnime ? 'anime' : 'calendar');
    };

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
            console.error(err);
            alert('同步失败：' + err.message);
        } finally {
            setIsSyncing(false);
        }
    };

    const parseText = (text) => {
        if (!text.trim()) return;
        const lines = text.split('\n').map(l => l.trim()).filter(l => l !== '');
        const newSchedules = [];
        let activeDate = '';
        const dateRegex = /(\d{4}[\/\-]\d{2}[\/\-]\d{2})/;
        const timeRegex = /^(\d{2}:\d{2})$/;
        const generateFingerprint = (item) => `${item.date}|${item.time}|${item.subTitle}|${item.title}`.replace(/\s+/g,
            '');
        const existingFingerprints = new Set(schedules.map(generateFingerprint));

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i]; const dateMatch = line.match(dateRegex); if (dateMatch) { activeDate = dateMatch[1].replace(/-/g, '/'); continue; } const timeMatch = line.match(timeRegex); if (timeMatch
                && activeDate) {
                const time = timeMatch[1]; const type = lines[i + 1] || '未知'; const subTitle = lines[i + 2] || '';
                const rawTitle = lines[i + 3] || ''; let finalTitle = (rawTitle === '动态' || !rawTitle) ? subTitle : rawTitle; const
                    currentFingerprint = `${activeDate}|${time}|${subTitle}|${finalTitle}`.replace(/\s+/g, ''); if
                    (existingFingerprints.has(currentFingerprint)) { i += 3; continue; } let category = '其他'; const
                        checkString = (subTitle + finalTitle); if (checkString.includes('贝拉')) category = '贝拉'; else if
                            (checkString.includes('嘉然')) category = '嘉然'; else if (checkString.includes('乃琳')) category = '乃琳'; else if
                                (checkString.includes('思诺')) category = '思诺'; else if (checkString.includes('心宜')) category = '心宜'; else if
                                    (checkString.includes('A-SOUL')) category = 'A-SOUL'; else if (checkString.includes('有点宜思') ||
                                        checkString.includes('心宜思诺') || checkString.includes('小心思')) category = '小心思'; const
                                            id = `parse-${activeDate}-${time}-${Math.random().toString(36).substr(2, 4)}`.replace(/\s+/g, '');
                newSchedules.push({
                    id, date: activeDate, time, type, subTitle, title: finalTitle, category, completed: false,
                    note: ''
                }); existingFingerprints.add(currentFingerprint); i += 3;
            }
        } if (newSchedules.length > 0) {
            setSchedules(prev => [...prev, ...newSchedules]);
            alert(`成功导入 ${newSchedules.length} 项新日程。`);
            setInputText('');
            setView('calendar');
        } else if (text.trim() !== "") { alert('未发现新日程。'); }
    };

    const handleImportJSON = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);

                // 检查是否是用户数据格式（对象）还是旧的完整数据格式（数组）
                let userData = {};

                if (Array.isArray(importedData)) {
                    // 旧格式：完整日程数组，需要转换为用户数据格式
                    alert('检测到旧格式或特殊属性数据，正在转换...');
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

                // 获取当前用户数据
                const currentUserData = JSON.parse(localStorage.getItem(USER_DATA_KEY) || '{}');

                // 合并用户数据
                let mergedCount = 0;
                let addedCount = 0;
                let updatedCount = 0;

                Object.keys(userData).forEach(id => {
                    if (currentUserData[id]) {
                        // 已存在，合并数据
                        if (userData[id].isUserCreated) {
                            // 用户创建的日程，完全替换
                            currentUserData[id] = userData[id];
                            updatedCount++;
                        } else {
                            // 基础日程的修改，合并字段
                            const existing = currentUserData[id];
                            const imported = userData[id];

                            // 合并备注
                            if (imported.note) {
                                if (existing.note && existing.note !== imported.note) {
                                    currentUserData[id].note = `${existing.note}\n---\n${imported.note}`;
                                    mergedCount++;
                                } else {
                                    currentUserData[id].note = imported.note;
                                }
                            }

                            // 合并其他字段
                            if (imported.completed) currentUserData[id].completed = true;
                            if (imported.link) currentUserData[id].link = imported.link;
                            if (imported.isFavorite) currentUserData[id].isFavorite = true;
                            if (imported.isAnime) currentUserData[id].isAnime = true;

                            updatedCount++;
                        }
                    } else {
                        // 新数据
                        currentUserData[id] = userData[id];
                        addedCount++;
                    }
                });

                // 保存合并后的用户数据
                localStorage.setItem(USER_DATA_KEY, JSON.stringify(currentUserData));

                // 重新加载日程
                const baseSchedules = JSON.parse(localStorage.getItem(BASE_SCHEDULES_KEY) || '[]');

                // 合并基础日程和用户数据
                const mergedSchedules = baseSchedules.map(baseItem => {
                    const userItem = currentUserData[baseItem.id];
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

                // 添加用户创建的日程
                const userSchedules = Object.values(currentUserData)
                    .filter(item => item.isUserCreated)
                    .map(item => ({
                        ...item,
                        isAnime: item.isAnime || false,
                        isFavorite: item.isFavorite || false
                    }));

                setSchedules([...mergedSchedules, ...userSchedules]);

                // 显示导入结果
                let message = '导入完成！\n\n';
                if (addedCount > 0) message += `新增 ${addedCount} 条数据\n`;
                if (updatedCount > 0) message += `更新 ${updatedCount} 条数据\n`;
                if (mergedCount > 0) message += `合并 ${mergedCount} 条备注\n`;

                alert(message);

            } catch (err) {
                console.error('导入错误:', err);
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
                const icsText = e.target.result;
                const parsedEvents = parseICS(icsText);

                if (parsedEvents.length === 0) {
                    alert('未找到有效的日程数据');
                    return;
                }

                // 检查重复项
                const existingIds = new Set(schedules.map(s => s.id));
                const newEvents = parsedEvents.filter(event => !existingIds.has(event.id));

                if (newEvents.length === 0) {
                    alert('所有日程都已存在，没有新数据导入');
                    return;
                }

                // 确认导入
                const confirmMessage = `找到 ${parsedEvents.length} 个日程，其中 ${newEvents.length} 个是新日程。是否确认导入？`;
                if (confirm(confirmMessage)) {
                    setSchedules(prev => [...prev, ...newEvents]);
                    alert(`成功导入 ${newEvents.length} 个新日程！`);
                }

            } catch (err) {
                console.error('ICS文件解析错误:', err);
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

    // GitHub Gist 同步功能
    const handleSyncToGist = async () => {
        if (!gistToken) {
            alert('请先配置 GitHub Personal Access Token');
            return;
        }

        setIsGistSyncing(true);
        try {
            const userData = extractUserData(schedules);
            const result = await uploadToGist(gistToken, gistId, userData);

            if (!gistId) {
                setGistId(result.gistId);
            }

            alert(`数据已成功同步到 GitHub Gist！\n\n同步的数据：\n- 用户数据记录：${result.dataCount} 条\n- 文件大小：${result.fileSizeKB} KB`);
        } catch (err) {
            console.error('Gist 同步错误:', err);
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
            const currentUserData = JSON.parse(localStorage.getItem(USER_DATA_KEY) || '{}');
            const { mergedData, addedCount, updatedCount } = mergeUserData(currentUserData, userData);

            localStorage.setItem(USER_DATA_KEY, JSON.stringify(mergedData));
            const newSchedules = reloadSchedules(mergedData);
            setSchedules(newSchedules);

            alert(`成功从 Gist 加载数据！\n\n- 新增：${addedCount} 条\n- 更新：${updatedCount} 条\n- 文件大小：${fileSizeKB} KB`);
        } catch (err) {
            console.error('Gist 读取错误:', err);
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

        if (!confirm('此操作将用 Gist 中的用户数据完全替换本地用户数据，确定继续吗？\n\n注意：基础日程库不会被影响。')) {
            return;
        }

        setIsGistSyncing(true);
        try {
            const { userData, fileSizeKB } = await downloadFromGist(gistToken, gistId);

            localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
            const newSchedules = reloadSchedules(userData);
            setSchedules(newSchedules);

            alert(`成功从 Gist 恢复用户数据！\n\n- 用户数据记录：${Object.keys(userData).length} 条\n- 文件大小：${fileSizeKB} KB`);
        } catch (err) {
            console.error('Gist 读取错误:', err);
            alert('读取失败：' + err.message);
        } finally {
            setIsGistSyncing(false);
        }
    };

    // Supabase 上传数据
    const handleUploadToSupabase = async () => {
        if (!syncId || !syncId.trim()) {
            alert('请先设置同步 ID');
            return;
        }

        setIsSupabaseSyncing(true);
        try {
            // 提取用户数据
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

            const dataCount = Object.keys(userData).length;
            const dataSizeKB = (new Blob([JSON.stringify(userData)]).size / 1024).toFixed(2);

            // 如果使用默认配置，显示大小提示
            if (isUsingDefaultConfig()) {
                const sizeWarning = dataSizeKB > 80 ? '\n\n⚠️ 数据接近 100 KB 限制，建议使用自定义 Supabase 服务器' : '';
                if (!confirm(`准备上传数据到默认云同步服务\n\n用户数据记录：${dataCount} 条\n文件大小：${dataSizeKB} KB / 100 KB${sizeWarning}\n\n是否继续？`)) {
                    setIsSupabaseSyncing(false);
                    return;
                }
            }

            await uploadToSupabase(userData, syncId);

            alert(`数据已成功上传到 Supabase！\n\n同步 ID: ${syncId}\n用户数据记录：${dataCount} 条\n文件大小：${dataSizeKB} KB${isUsingDefaultConfig() ? ' / 100 KB' : ''}`);

            // 更新冷却时间
            setSyncCooldown(300);
        } catch (err) {
            console.error('Supabase 上传错误:', err);
            alert('上传失败：' + err.message);
        } finally {
            setIsSupabaseSyncing(false);
        }
    };

    // Supabase 下载数据
    const handleDownloadFromSupabase = async () => {
        if (!syncId || !syncId.trim()) {
            alert('请先设置同步 ID');
            return;
        }

        setIsSupabaseSyncing(true);
        try {
            const result = await downloadFromSupabase(syncId);
            const userData = result.user_data;

            if (!userData || typeof userData !== 'object') {
                throw new Error('数据格式不正确');
            }

            // 获取当前用户数据
            const currentUserData = JSON.parse(localStorage.getItem(USER_DATA_KEY) || '{}');

            // 合并用户数据
            let addedCount = 0;
            let updatedCount = 0;

            Object.keys(userData).forEach(id => {
                if (currentUserData[id]) {
                    if (userData[id].isUserCreated) {
                        currentUserData[id] = userData[id];
                    } else {
                        const existing = currentUserData[id];
                        const imported = userData[id];

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
                    currentUserData[id] = userData[id];
                    addedCount++;
                }
            });

            // 保存合并后的用户数据
            localStorage.setItem(USER_DATA_KEY, JSON.stringify(currentUserData));

            // 重新加载日程
            const baseSchedules = JSON.parse(localStorage.getItem(BASE_SCHEDULES_KEY) || '[]');

            const mergedSchedules = baseSchedules.map(baseItem => {
                const userItem = currentUserData[baseItem.id];
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

            const userSchedules = Object.values(currentUserData)
                .filter(item => item.isUserCreated)
                .map(item => ({
                    ...item,
                    isAnime: item.isAnime || false,
                    isFavorite: item.isFavorite || false
                }));

            setSchedules([...mergedSchedules, ...userSchedules]);

            const updateTime = new Date(result.updated_at).toLocaleString('zh-CN');
            alert(`成功从 Supabase 下载数据！\n\n同步 ID: ${syncId}\n新增：${addedCount} 条\n更新：${updatedCount} 条\n更新时间：${updateTime}`);

            // 更新冷却时间
            setSyncCooldown(300);
        } catch (err) {
            console.error('Supabase 下载错误:', err);
            alert('下载失败：' + err.message);
        } finally {
            setIsSupabaseSyncing(false);
        }
    };

    return (
        <>
            <FirstTimeNotice />
            <div className="flex flex-col h-screen transition-colors duration-300 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
                <header
                    className="border-b px-4 md:px-6 py-3 flex items-center justify-between shadow-sm shrink-0 bg-white dark:bg-slate-900 dark:border-slate-800 gap-4 text-slate-900 dark:text-slate-100">
                    <div className="flex items-center gap-3 shrink-0">
                        <Icon name="calendar" className="text-blue-500 w-5 h-5 md:w-6 md:h-6" />
                        <h1 className="hidden md:block text-lg md:text-xl font-bold tracking-tight">枝江追番表</h1>
                    </div>
                    <div className="flex gap-1">
                        <button
                            onClick={() => setView('calendar')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${view === 'calendar' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        >
                            日历视图
                        </button>
                        <button
                            onClick={() => setView('anime')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${view === 'anime' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        >
                            追番表
                        </button>
                        <button
                            onClick={() => setView('links')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${view === 'links' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        >
                            快捷链接
                        </button>
                    </div>
                    <div className="relative flex-1 max-w-md">
                        <div
                            className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <Icon name="search" className="w-4 h-4" />
                        </div>
                        <input type="text" placeholder="搜索日程、成员、备注..."
                            className="w-full pl-10 pr-4 py-1.5 md:py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-full text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                            value={searchQuery} onChange={(e) => {
                                setSearchQuery(e.target.value); if (e.target.value.trim())
                                    setView('search'); else if (view === 'search') setView('calendar');
                            }}
                        />
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')}
                            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400"
                        >
                            {themeMode === 'dark' ? <Icon name="sun" /> : <Icon name="moon" />}
                        </button>
                        <button
                            onClick={() => setView(view === 'settings' ? 'calendar' : 'settings')}
                            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400"
                        >
                            {view === 'settings' ? <Icon name="x" /> : <Icon name="settings" />}
                        </button>
                    </div>
                </header>

                <main className="flex-1 overflow-hidden relative">
                    {view === 'calendar' && (
                        <div className="h-full flex flex-col p-3 md:p-6 space-y-4">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex flex-wrap items-center gap-2 md:gap-4">
                                    <h2 className="text-sm md:text-lg font-bold min-w-[140px]">{weekDays[0]} - {weekDays[6]}
                                    </h2>
                                    <div
                                        className="flex border rounded-lg shadow-sm overflow-hidden dark:border-slate-700 bg-white dark:bg-slate-800">
                                        <button onClick={() => setCurrentDate(prev => {
                                            const d = new Date(prev);
                                            d.setDate(d.getDate() - 7); return d;
                                        })} className="p-1.5 md:p-2 border-r
                                    dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600
                                    dark:text-slate-400">
                                            <Icon name="chevron-left" />
                                        </button>
                                        <button onClick={() => setCurrentDate(toZeroDate())} className="px-3 py-1 text-xs
                                    md:text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600
                                    dark:text-slate-400">本周</button>
                                        <div
                                            className="date-input-wrapper border-l dark:border-slate-700 px-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400">
                                            <Icon name="calendar-days" className="w-4 h-4" />
                                            <input type="date" className="invisible-date-input" onChange={e => {
                                                if
                                                    (e.target.value) jumpToDate(e.target.value);
                                            }} />
                                        </div>
                                        <button onClick={() => setCurrentDate(prev => {
                                            const d = new Date(prev);
                                            d.setDate(d.getDate() + 7); return d;
                                        })} className="p-1.5 md:p-2 border-l
                                    dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600
                                    dark:text-slate-400">
                                            <Icon name="chevron-right" />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={handleSyncIcs} disabled={isSyncing} className={`hidden flex items-center gap-1.5
                                px-3 py-1.5 ${isSyncing ? 'bg-slate-400' : 'bg-emerald-600 hover:bg-emerald-700'}
                                text-white rounded-lg text-xs md:text-sm font-bold shadow-md transition-all shrink-0`}>
                                        <Icon name="refresh" className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                                        <span className="hidden sm:inline">{isSyncing ? '同步中...' : '同步日历订阅'}</span>
                                    </button>
                                    {view === 'calendar' && (
                                        <>
                                            <button onClick={() => {
                                                setNewSchedule({
                                                    date: formatDateString(new Date()),
                                                    time: '20:00',
                                                    type: '直播',
                                                    subTitle: '',
                                                    title: '',
                                                    category: '嘉然',
                                                    isAnime: false,
                                                    link: ''
                                                });
                                                setIsAddModalOpen(true);
                                            }} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg
                                text-xs md:text-sm font-bold shadow-md hover:bg-blue-700 transition-all shrink-0">
                                                <Icon name="plus" className="w-3.5 h-3.5" /> <span
                                                    className="hidden sm:inline">添加日历日程</span>
                                            </button>
                                            <button onClick={() => {
                                                // 导出用户数据（与设置中的导出功能相同）
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

                                                const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
                                                const a = document.createElement('a');
                                                a.href = URL.createObjectURL(blob);
                                                const timestamp = new Date().toISOString().replace(/[\-:T.]/g, '').slice(0, 14);
                                                a.download = `user-data-${timestamp}.json`;
                                                a.click();
                                            }} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg
                                text-xs md:text-sm font-bold shadow-md hover:bg-emerald-700 transition-all shrink-0">
                                                <Icon name="download" className="w-3.5 h-3.5" /> <span
                                                    className="hidden sm:inline">导出本地备份</span>
                                            </button>
                                        </>
                                    )}
                                    {view === 'anime' && (
                                        <button onClick={() => {
                                            setNewSchedule({
                                                date: '追番/追番',
                                                time: '追番',
                                                type: '追番',
                                                subTitle: '',
                                                title: '',
                                                category: '其他',
                                                isAnime: true,
                                                link: ''
                                            });
                                            setIsAddModalOpen(true);
                                        }}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 text-white rounded-lg
                                text-xs md:text-sm font-bold shadow-md hover:bg-orange-700 transition-all shrink-0"
                                        >
                                            <Icon name="plus" className="w-3.5 h-3.5" /> <span
                                                className="hidden sm:inline">添加追番日程</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-7 gap-4 min-w-max md:min-w-0">
                                    {weekDays.map((dayStr, idx) => {
                                        const daySchedules = schedules.filter(s => s.date === dayStr).sort((a, b) =>
                                            a.time.localeCompare(b.time));
                                        const isToday = formatDateString(new Date()) === dayStr;
                                        const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
                                        return (
                                            <div key={dayStr} className="flex flex-col min-w-[280px] md:min-w-0 h-full overflow-hidden">
                                                <div className={`flex items-baseline gap-2 pb-2 px-1 shrink-0 ${isToday
                                                    ? 'text-blue-500' : 'text-slate-500 dark:text-slate-400'}`}>
                                                    <span className="text-sm md:text-base font-bold">{dayNames[idx]}</span>
                                                    <span
                                                        className="text-[10px] md:text-xs opacity-70">{dayStr.split('/').slice(1).join('/')}</span>
                                                    {isToday &&
                                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />}
                                                </div>
                                                <div className="flex-1 space-y-1 overflow-y-auto custom-scrollbar pr-1">
                                                    {daySchedules.length > 0 ? daySchedules.map(item => (
                                                        <ScheduleCard
                                                            key={item.id}
                                                            item={item}
                                                            toggleComplete={toggleComplete}
                                                            toggleFavorite={toggleFavorite}
                                                            handleBilibiliSearch={handleBilibiliSearch}
                                                            setEditingNoteId={setEditingNoteId}
                                                            setTempNote={setTempNote}
                                                            setTempLink={setTempLink}
                                                            setSchedules={setSchedules}
                                                            setExternalLinkModal={setExternalLinkModal}
                                                        />
                                                    )) : <div
                                                        className="h-24 flex items-center justify-center italic text-[10px] text-slate-300 dark:text-slate-800 border-2 border-dashed border-slate-50 dark:border-slate-900 rounded-xl">
                                                        暂无</div>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {view === 'anime' && (
                        <div
                            className="h-full max-w-3xl mx-auto p-4 md:p-8 flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Icon name="calendar-days" className="w-5 h-5 text-orange-500" /> 追番表 ({schedules.filter(s =>
                                    s.isAnime || s.isFavorite).length})
                            </h3>
                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                                    {schedules
                                        .filter(item => item.isAnime || item.isFavorite)
                                        .sort((a, b) => new Date(b.date.replace(/\//g, '-')) - new Date(a.date.replace(/\//g, '-')))
                                        .map(item => (
                                            <ScheduleCard
                                                key={item.id}
                                                item={item}
                                                showDate={false}
                                                showMoveButton={false}
                                                toggleComplete={toggleComplete}
                                                toggleFavorite={toggleFavorite}
                                                handleBilibiliSearch={handleBilibiliSearch}
                                                setEditingNoteId={setEditingNoteId}
                                                setTempNote={setTempNote}
                                                setTempLink={setTempLink}
                                                setSchedules={setSchedules}
                                                setExternalLinkModal={setExternalLinkModal}
                                            />
                                        ))
                                    }
                                    {schedules.filter(item => item.isAnime || item.isFavorite).length === 0 && (
                                        <div
                                            className="col-span-2 flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-600">
                                            <Icon name="calendar-days" className="w-16 h-16 mb-4" />
                                            <p className="text-lg font-bold mb-2">追番表为空</p>
                                            <p className="text-sm text-center max-w-md">点击下方按钮添加追番日程</p>
                                            <button onClick={() => {
                                                setNewSchedule({
                                                    date: '追番/追番',
                                                    time: '追番',
                                                    type: '追番',
                                                    subTitle: '',
                                                    title: '',
                                                    category: '其他',
                                                    isAnime: true,
                                                    link: ''
                                                });
                                                setIsAddModalOpen(true);
                                            }}
                                                className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg font-bold
                                    hover:bg-orange-600 transition-all"
                                            >
                                                添加追番日程
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {view === 'links' && (
                        <LinksView links={links} setLinks={setLinks} />
                    )}

                    {view === 'search' && (
                        <div
                            className="h-full max-w-3xl mx-auto p-4 md:p-8 flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Icon name="search" className="w-5 h-5" /> 搜索结果 ({filteredSchedules.length})
                            </h3>
                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                                    {filteredSchedules.map(item => (
                                        <ScheduleCard
                                            key={item.id}
                                            item={item}
                                            showDate={true}
                                            toggleComplete={toggleComplete}
                                            toggleFavorite={toggleFavorite}
                                            handleBilibiliSearch={handleBilibiliSearch}
                                            setEditingNoteId={setEditingNoteId}
                                            setTempNote={setTempNote}
                                            setTempLink={setTempLink}
                                            setSchedules={setSchedules}
                                            setExternalLinkModal={setExternalLinkModal}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {view === 'changelog' && (
                        <div className="h-full overflow-y-auto custom-scrollbar p-4 md:p-8">
                            <ChangelogView onBack={() => setView('settings')} />
                        </div>
                    )}

                    {view === 'settings' && (
                        <div
                            className="h-full max-w-2xl mx-auto p-4 md:p-8 overflow-y-auto custom-scrollbar space-y-6 text-slate-900 dark:text-slate-100">

                            <SettingsSection
                                title="外观选项"
                                icon="palette"
                                iconColor="text-purple-500"
                                description="自定义日程的显示样式和配色方案"
                            >
                                <div className="space-y-4">
                                    <div className="p-4 rounded-lg border dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="font-medium">显示模式</div>
                                                <div className="text-xs text-slate-500">
                                                    {displayMode === 'single' ? '多成员日程使用主要成员颜色' : '多成员日程用渐变色显示所有成员颜色'}
                                                </div>
                                            </div>
                                            <select
                                                className="px-3 py-2 border dark:border-slate-700 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 outline-none text-slate-900 dark:text-slate-100"
                                                value={displayMode}
                                                onChange={(e) => {
                                                    setDisplayMode(e.target.value);
                                                    localStorage.setItem(DISPLAY_MODE_KEY, e.target.value);
                                                }}
                                            >
                                                <option value="single">单一颜色模式</option>
                                                <option value="multi-color">多色分割模式</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="hidden flex items-center justify-between p-4 rounded-lg border dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                        <div>
                                            <div className="font-medium">{useSpecialGroupColor ? '开启组合配色' : '关闭组合配色'}</div>
                                            <div className="text-xs text-slate-500">
                                                {useSpecialGroupColor ? 'A-SOUL和小心思组合使用单独的配色' : 'A-SOUL和小心思组合和其他日程一样显示'}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                const newValue = !useSpecialGroupColor;
                                                setUseSpecialGroupColor(newValue);
                                                localStorage.setItem(SPECIAL_GROUP_COLOR_KEY, newValue.toString());
                                            }}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${useSpecialGroupColor ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                                        >
                                            <span
                                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${useSpecialGroupColor ? 'translate-x-6' : 'translate-x-1'}`}
                                            />
                                        </button>
                                    </div>

                                    <div className="p-4 rounded-lg border dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="font-medium">自定义成员颜色</div>
                                            <button
                                                onClick={() => {
                                                    if (confirm('确定要恢复所有成员的默认颜色吗？')) {
                                                        setCustomColors({});
                                                    }
                                                }}
                                                className="text-xs px-2 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded text-slate-700 dark:text-slate-300 transition-colors"
                                            >
                                                恢复默认
                                            </button>
                                        </div>
                                        <div className="text-xs text-slate-500 mb-3">点击颜色块可以自定义每个成员的背景色(组合颜色暂未完工)</div>
                                        <div className="grid grid-cols-2 gap-3">
                                            {Object.keys(DEFAULT_MEMBER_CONFIG).map(member => {
                                                const currentColor = customColors[member]?.color || DEFAULT_MEMBER_CONFIG[member].color;
                                                return (
                                                    <div key={member} className="flex items-center gap-2">
                                                        <input
                                                            type="color"
                                                            value={currentColor}
                                                            onChange={(e) => {
                                                                setCustomColors(prev => ({
                                                                    ...prev,
                                                                    [member]: {
                                                                        color: e.target.value,
                                                                        textColor: '#FFFFFF'
                                                                    }
                                                                }));
                                                            }}
                                                            className="w-10 h-10 rounded cursor-pointer border-2 border-slate-300 dark:border-slate-600"
                                                            title={`选择${member}的颜色`}
                                                        />
                                                        <div className="flex-1">
                                                            <div className="text-sm font-medium">{member}</div>
                                                            <div className="text-xs text-slate-500 font-mono">{currentColor}</div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </SettingsSection>

                            <SettingsSection
                                title="基础日程库"
                                icon="refresh"
                                iconColor="text-blue-500"
                                description="从 GitHub 同步基础日程库（约2k条日程）"
                            >
                                <div className="space-y-4">
                                    <div className="p-4 rounded-lg border dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                                        <div className="text-sm space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-slate-600 dark:text-slate-400">基础日程数量：</span>
                                                <span className="font-bold">{schedules.filter(s => s.isBaseSchedule).length} 条</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-600 dark:text-slate-400">用户日程数量：</span>
                                                <span className="font-bold">{schedules.filter(s => s.isUserCreated).length} 条</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-600 dark:text-slate-400">缓存版本：</span>
                                                <span className="font-mono text-xs">{localStorage.getItem(BASE_SCHEDULES_VERSION_KEY) || '未缓存'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-600 dark:text-slate-400">最后获取：</span>
                                                <span className="font-mono text-xs">
                                                    {(() => {
                                                        const lastFetch = localStorage.getItem(BASE_SCHEDULES_LAST_FETCH_KEY);
                                                        if (!lastFetch) return '未记录';
                                                        const date = new Date(parseInt(lastFetch, 10));
                                                        return date.toLocaleString('zh-CN', {
                                                            month: '2-digit',
                                                            day: '2-digit',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        });
                                                    })()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={async () => {
                                            setIsLoadingBase(true);
                                            try {
                                                const response = await fetch(getBaseSchedulesUrl());
                                                if (!response.ok) throw new Error('无法加载基础日程库');

                                                const data = await response.json();
                                                const baseSchedules = data.schedules || [];
                                                const baseVersion = data.version || Date.now();

                                                localStorage.setItem(BASE_SCHEDULES_KEY, JSON.stringify(baseSchedules));
                                                localStorage.setItem(BASE_SCHEDULES_VERSION_KEY, baseVersion.toString());
                                                // 手动获取时更新最后获取时间
                                                localStorage.setItem(BASE_SCHEDULES_LAST_FETCH_KEY, Date.now().toString());

                                                const userData = JSON.parse(localStorage.getItem(USER_DATA_KEY) || '{}');

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

                                                setSchedules([...mergedSchedules, ...userSchedules]);
                                                alert(`成功更新基础日程库！共 ${baseSchedules.length} 条日程`);
                                            } catch (error) {
                                                console.error('更新失败:', error);
                                                alert('更新基础日程库失败：' + error.message);
                                            } finally {
                                                setIsLoadingBase(false);
                                            }
                                        }}
                                        disabled={isLoadingBase}
                                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                                    >
                                        {isLoadingBase ? <Icon name="refresh" className="w-4 h-4 animate-spin" /> : <Icon name="refresh" className="w-4 h-4" />}
                                        {isLoadingBase ? '更新中...' : '手动更新基础日程库'}
                                    </button>

                                    <div className="text-xs text-slate-500 space-y-1">
                                        <p>• 基础日程库会在每次打开页面时自动更新</p>
                                        <p>• 你的备注、完成状态和自己添加的日程不会丢失</p>
                                        <p>• 如果网络失败，会使用缓存的日程数据</p>
                                    </div>
                                </div>
                            </SettingsSection>

                            <SettingsSection
                                title="数据管理"
                                icon="download"
                                iconColor="text-blue-500"
                                description="导入导出数据，管理本地存储"
                            >
                                <div className="space-y-4">

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <button onClick={() => {
                                            // 提取用户数据
                                            const userData = {};

                                            schedules.forEach(schedule => {
                                                if (schedule.isUserCreated) {
                                                    // 用户创建的日程，保存完整数据
                                                    userData[schedule.id] = { ...schedule, isUserCreated: true };
                                                } else if (schedule.isBaseSchedule) {
                                                    // 基础日程，只保存用户修改的部分
                                                    const userModifications = {};
                                                    if (schedule.completed) userModifications.completed = true;
                                                    if (schedule.note) userModifications.note = schedule.note;
                                                    // 保存用户自定义的链接（排除系统自带的链接）
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

                                            const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
                                            const a = document.createElement('a');
                                            a.href = URL.createObjectURL(blob);
                                            const timestamp = new Date().toISOString().replace(/[\-:T.]/g, '').slice(0, 14);
                                            a.download = `user-data-${timestamp}.json`;
                                            a.click();
                                        }} className="flex items-center justify-center gap-2 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md transition-all">
                                            <Icon name="download" /> 导出用户数据
                                        </button>
                                        <button onClick={() => fileInputRef.current.click()} className="flex items-center justify-center gap-2 p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md transition-all">
                                            <Icon name="upload" /> 导入用户数据
                                            <input type="file" ref={fileInputRef} onChange={handleImportJSON} accept=".json" className="hidden" />
                                        </button>
                                    </div>
                                    <div className="text-xs text-slate-500 mb-3 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                                        <strong>说明：</strong>导出的是用户个性化数据（完成状态、备注、用户创建的日程等），不包含基础日程库。
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <button onClick={() => {
                                            // 仅导出用户额外添加的日程
                                            const userCreatedSchedules = schedules
                                                .filter(schedule => schedule.isUserCreated)
                                                .map(schedule => ({ ...schedule }));

                                            if (userCreatedSchedules.length === 0) {
                                                alert('没有用户创建的日程可以导出');
                                                return;
                                            }

                                            const blob = new Blob([JSON.stringify(userCreatedSchedules, null, 2)], { type: 'application/json' });
                                            const a = document.createElement('a');
                                            a.href = URL.createObjectURL(blob);
                                            const timestamp = new Date().toISOString().replace(/[\-:T.]/g, '').slice(0, 14);
                                            a.download = `user-created-schedules-${timestamp}.json`;
                                            a.click();
                                        }} className="flex items-center justify-center gap-2 p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-md transition-all">
                                            <Icon name="download" /> 仅导出添加的日程
                                        </button>
                                        <button onClick={() => {
                                            // 导出除完成状态、跳转链接以外的日程
                                            const cleanedSchedules = schedules.map(schedule => {
                                                const cleaned = { ...schedule };
                                                // 移除完成状态
                                                delete cleaned.completed;
                                                // 移除所有链接相关字段
                                                // delete cleaned.link;
                                                // delete cleaned.liveRoomUrl;
                                                // delete cleaned.dynamicUrl;
                                                // delete cleaned.icsUrl;
                                                return cleaned;
                                            });

                                            const blob = new Blob([JSON.stringify(cleanedSchedules, null, 2)], { type: 'application/json' });
                                            const a = document.createElement('a');
                                            a.href = URL.createObjectURL(blob);
                                            const timestamp = new Date().toISOString().replace(/[\-:T.]/g, '').slice(0, 14);
                                            a.download = `schedules-clean-${timestamp}.json`;
                                            a.click();
                                        }} className="flex items-center justify-center gap-2 p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md transition-all">
                                            <Icon name="download" /> 导出除完成状态以外的日程
                                        </button>
                                    </div>
                                    <div className="text-xs text-slate-500 mb-3 p-3 bg-purple-50 dark:bg-purple-900/10 rounded-lg">
                                        <strong>说明：</strong>仅添加的日程可用于分享日程表外的视频，除完成状态以外的日程则可以连同日程表中的备注一同分享
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                        <button onClick={() => {
                                            if (confirm('确定清空所有用户数据？\n\n这将清除：\n- 所有完成状态\n- 所有备注\n- 所有用户创建的日程\n- 所有收藏\n\n基础日程库不会被删除。')) {
                                                // 只清空用户数据
                                                localStorage.removeItem(USER_DATA_KEY);
                                                // 重新加载基础日程库
                                                const baseSchedules = JSON.parse(localStorage.getItem(BASE_SCHEDULES_KEY) || '[]');
                                                setSchedules(baseSchedules.map(item => ({
                                                    ...item,
                                                    completed: false,
                                                    note: '',
                                                    link: item.link || '',
                                                    isFavorite: false,
                                                    isAnime: item.isAnime || false,
                                                    isBaseSchedule: true
                                                })));
                                                alert('用户数据已清空');
                                            }
                                        }} className="flex items-center justify-center gap-2 p-3 text-red-600 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-xl font-bold transition-all">
                                            <Icon name="trash-2" /> 清空用户数据
                                        </button>
                                    </div>

                                    <div className="hidden p-4 rounded-lg border border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/10">
                                        <div className="font-medium text-orange-800 dark:text-orange-300 mb-2">测试功能：删除 localStorage</div>
                                        <div className="text-xs text-orange-600 dark:text-orange-400 mb-3">
                                            此按钮用于测试 IndexedDB 备份恢复功能。删除后刷新页面，系统将自动从 IndexedDB 恢复数据。
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <button onClick={() => {
                                                if (confirm('⚠️ 测试功能\n\n这将删除 localStorage 中的用户数据，但 IndexedDB 备份会保留。\n\n刷新页面后，系统将自动从 IndexedDB 恢复数据。\n\n确定要继续吗？')) {
                                                    localStorage.removeItem(USER_DATA_KEY);
                                                    console.log('[测试] localStorage 用户数据已删除');
                                                    alert('localStorage 已删除！\n\n请刷新页面测试 IndexedDB 恢复功能。\n\n打开控制台可以看到恢复日志。');
                                                }
                                            }} className="flex items-center justify-center gap-2 p-3 text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-900/20 hover:bg-orange-200 dark:hover:bg-orange-900/30 rounded-xl font-bold transition-all">
                                                <Icon name="trash-2" /> 删除 localStorage
                                            </button>
                                            <button onClick={async () => {
                                                if (confirm('⚠️ 重置 IndexedDB\n\n这将删除并重建 IndexedDB 数据库。\n\n如果遇到 IndexedDB 错误，可以使用此功能修复。\n\n确定要继续吗？')) {
                                                    try {
                                                        await deleteDatabase();
                                                        console.log('[测试] IndexedDB 数据库已删除');
                                                        alert('IndexedDB 已重置！\n\n刷新页面后将重新创建数据库。');
                                                    } catch (error) {
                                                        console.error('[测试] 删除 IndexedDB 失败:', error);
                                                        alert('删除失败：' + error.message);
                                                    }
                                                }
                                            }} className="flex items-center justify-center gap-2 p-3 text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-900/20 hover:bg-orange-200 dark:hover:bg-orange-900/30 rounded-xl font-bold transition-all">
                                                <Icon name="refresh" /> 重置 IndexedDB
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 hidden">
                                        <button onClick={() => {
                                            if (confirm('⚠️ 危险操作：清除所有数据\n\n这将清除：\n- 所有用户数据（完成状态、备注、用户日程等）\n- 基础日程库缓存\n- 所有本地存储数据\n\n确定要继续吗？')) {
                                                // 清空所有数据，默认隐藏，需要显示请删除div className中的hidden
                                                // 清除所有相关的 localStorage 数据
                                                localStorage.removeItem(USER_DATA_KEY);
                                                localStorage.removeItem(BASE_SCHEDULES_KEY);
                                                localStorage.removeItem(BASE_SCHEDULES_VERSION_KEY);
                                                localStorage.removeItem(BASE_SCHEDULES_LAST_FETCH_KEY);
                                                localStorage.removeItem(STORAGE_KEY);
                                                localStorage.removeItem(ICS_CONFIG_KEY);

                                                // 清空日程列表
                                                setSchedules([]);

                                                alert('所有数据已清除！');
                                            }
                                        }} className="flex items-center justify-center gap-2 p-3 text-white bg-red-600 hover:bg-red-700 rounded-xl font-bold shadow-md transition-all">
                                            <Icon name="trash-2" /> 🔥 清除所有数据（测试用）
                                        </button>
                                    </div>
                                </div>
                            </SettingsSection>

                            <SettingsSection
                                title="GitHub Gist 云同步"
                                icon="refresh"
                                iconColor="text-purple-500"
                                description="使用 GitHub Gist 在多设备间同步用户数据"
                            >
                                <div className="text-xs text-slate-500 mb-3 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                                    <strong>说明：</strong>只同步用户个性化数据（完成状态、备注、用户创建的日程等），不包含基础日程库。
                                </div>
                                <p className="text-xs text-slate-500 mb-4 italic">
                                    需要 GitHub Personal Access Token（需要 gist 权限）。
                                    <a
                                        href="https://github.com/settings/tokens/new?description=ASoul%20Calendar&scopes=gist"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 dark:text-blue-400 hover:underline ml-1"
                                    >
                                        点击创建 Token
                                    </a>
                                </p>

                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 mb-1.5 block">GitHub Token</label>
                                        <input
                                            type="password"
                                            className="w-full p-3 border dark:border-slate-700 rounded-xl text-sm outline-none bg-slate-50 dark:bg-slate-800 font-mono"
                                            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                                            value={gistToken}
                                            onChange={e => setGistToken(e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-slate-500 mb-1.5 block">
                                            Gist ID（首次同步后自动生成，也可手动填入已有的 Gist ID）
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full p-3 border dark:border-slate-700 rounded-xl text-sm outline-none bg-slate-50 dark:bg-slate-800 font-mono"
                                            placeholder="自动生成或手动输入"
                                            value={gistId}
                                            onChange={e => setGistId(e.target.value)}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                                        <button
                                            onClick={handleSyncToGist}
                                            disabled={isGistSyncing || !gistToken}
                                            className="py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                                        >
                                            {isGistSyncing ? <Icon name="refresh" className="w-4 h-4 animate-spin" /> : <Icon name="upload" className="w-4 h-4" />}
                                            {isGistSyncing ? '同步中...' : '上传用户数据'}
                                        </button>

                                        <button
                                            onClick={handleLoadFromGist}
                                            disabled={isGistSyncing || !gistToken || !gistId}
                                            className="py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                                        >
                                            {isGistSyncing ? <Icon name="refresh" className="w-4 h-4 animate-spin" /> : <Icon name="download" className="w-4 h-4" />}
                                            合并用户数据
                                        </button>

                                        <button
                                            onClick={handleReplaceFromGist}
                                            disabled={isGistSyncing || !gistToken || !gistId}
                                            className="py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-400 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                                        >
                                            {isGistSyncing ? <Icon name="refresh" className="w-4 h-4 animate-spin" /> : <Icon name="refresh" className="w-4 h-4" />}
                                            替换用户数据
                                        </button>
                                    </div>

                                    <div className="text-xs text-slate-500 space-y-1 pt-2">
                                        <p>• 上传用户数据：将用户数据上传到 GitHub Gist（首次会创建新 Gist）</p>
                                        <p>• 合并用户数据：从 Gist 下载数据并与本地数据智能合并</p>
                                        <p>• 替换用户数据：用 Gist 中的数据完全替换本地用户数据</p>
                                        <p>• 兼容旧格式：自动识别并转换旧版本的完整数据格式</p>
                                    </div>
                                </div>
                            </SettingsSection>

                            <SettingsSection
                                title="Supabase 云同步"
                                icon="refresh"
                                iconColor="text-green-500"
                                description="使用 Supabase 数据库在多设备间同步用户数据"
                            >
                                <div className="text-xs text-slate-500 mb-3 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                                    <strong>说明：</strong>只同步用户个性化数据（完成状态、备注、用户创建的日程等），不包含基础日程库。
                                </div>
                                <div className="text-xs text-slate-500 mb-3 p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg">
                                    <strong>⚠️ 默认云同步限制：</strong>
                                    <ul className="mt-1 space-y-0.5 list-disc list-inside">
                                        <li>数据大小限制：100 KB（仅支持轻量体验）</li>
                                        <li>同步频率限制：每 5 分钟可执行一次同步</li>
                                        <li>数据安全性：公开数据库，无法保证数据安全</li>
                                    </ul>
                                    <div className="mt-2 font-semibold">💡 如需同步更多数据或稳定使用，请使用自定义 Supabase 服务器（个人使用免费，无限制）</div>
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 mb-1.5 block">
                                            同步 ID（用于区分不同用户的数据，请设置一个唯一的标识符）
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full p-3 border dark:border-slate-700 rounded-xl text-sm outline-none bg-slate-50 dark:bg-slate-800 font-mono"
                                            placeholder="例如：user_12345 或任意唯一标识"
                                            value={syncId}
                                            onChange={e => setSyncId(e.target.value)}
                                        />
                                        <div className="text-xs text-slate-500 mt-1">
                                            ⚠️ 同步 ID 相同的设备会共享数据，请妥善保管
                                        </div>
                                    </div>

                                    {syncCooldown > 0 && (
                                        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg text-xs text-yellow-700 dark:text-yellow-400">
                                            ⏱️ 同步冷却中，还需等待 {Math.floor(syncCooldown / 60)}分{syncCooldown % 60}秒
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                                        <button
                                            onClick={handleUploadToSupabase}
                                            disabled={isSupabaseSyncing || !syncId || syncCooldown > 0}
                                            className="py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                                        >
                                            {isSupabaseSyncing ? <Icon name="refresh" className="w-4 h-4 animate-spin" /> : <Icon name="upload" className="w-4 h-4" />}
                                            {isSupabaseSyncing ? '上传中...' : '上传到云端'}
                                        </button>

                                        <button
                                            onClick={handleDownloadFromSupabase}
                                            disabled={isSupabaseSyncing || !syncId || syncCooldown > 0}
                                            className="py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                                        >
                                            {isSupabaseSyncing ? <Icon name="refresh" className="w-4 h-4 animate-spin" /> : <Icon name="download" className="w-4 h-4" />}
                                            {isSupabaseSyncing ? '下载中...' : '从云端下载'}
                                        </button>
                                    </div>

                                    <div className="text-xs text-slate-500 space-y-1 pt-2">
                                        <p>• 上传到云端：将用户数据上传到 Supabase 数据库</p>
                                        <p>• 从云端下载：从 Supabase 下载数据并与本地数据智能合并</p>
                                        <p>• {isUsingDefaultConfig() ? '默认云同步：100 KB 大小限制，每 5 分钟可同步一次' : '自定义服务器：无大小和频率限制'}</p>
                                        <p>• 数据隔离：不同的同步 ID 之间数据完全隔离</p>
                                    </div>

                                    <div className="border-t dark:border-slate-700 pt-4 mt-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <div>
                                                <div className="font-medium text-sm">使用自定义 Supabase 服务器</div>
                                                <div className="text-xs text-slate-500">配置自己的 Supabase 项目，无大小和频率限制</div>
                                            </div>
                                            <button
                                                onClick={() => setShowCustomConfig(!showCustomConfig)}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${showCustomConfig ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                                            >
                                                <span
                                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showCustomConfig ? 'translate-x-6' : 'translate-x-1'}`}
                                                />
                                            </button>
                                        </div>

                                        {showCustomConfig && (
                                            <div className="space-y-3 mt-3">
                                                <div>
                                                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">Supabase URL</label>
                                                    <input
                                                        type="text"
                                                        className="w-full p-3 border dark:border-slate-700 rounded-xl text-sm outline-none bg-slate-50 dark:bg-slate-800 font-mono"
                                                        placeholder="https://xxxxx.supabase.co"
                                                        value={supabaseUrl}
                                                        onChange={e => setSupabaseUrl(e.target.value)}
                                                    />
                                                </div>

                                                <div>
                                                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">Supabase Anon Key</label>
                                                    <input
                                                        type="password"
                                                        className="w-full p-3 border dark:border-slate-700 rounded-xl text-sm outline-none bg-slate-50 dark:bg-slate-800 font-mono"
                                                        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                                                        value={supabaseKey}
                                                        onChange={e => setSupabaseKey(e.target.value)}
                                                    />
                                                </div>

                                                <div className="text-xs text-slate-500 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                                                    <strong>提示：</strong>需要自己创建 Supabase 项目并执行数据库初始化脚本。
                                                    <a
                                                        href="https://supabase.com/dashboard"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 dark:text-blue-400 hover:underline ml-1"
                                                    >
                                                        前往 Supabase 控制台
                                                    </a>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </SettingsSection>

                            <div className="hidden">
                                <SettingsSection
                                    title="ICS 日历订阅"
                                    icon="refresh"
                                    iconColor="text-emerald-500"
                                    description="输入 ICS 订阅链接，同步日历数据"
                                >

                                    <p className="text-xs text-slate-500 mb-4 italic">同步时将自动提取 Tag 和 B 站链接。首次使用，请前往枝江站(asoul.love)获取订阅链接，<a
                                        href="https://asoul.love/calendar/latest"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 dark:text-blue-400 hover:underline ml-1"
                                    >
                                        点此前往</a></p>
                                    <textarea
                                        className="w-full h-24 p-3 border dark:border-slate-700 rounded-xl text-sm outline-none bg-slate-50 dark:bg-slate-800 font-mono mb-2"
                                        placeholder="https://example.com/calendar.ics" value={icsUrls} onChange={e => setIcsUrls(e.target.value)} />
                                    <button onClick={handleSyncIcs} disabled={isSyncing} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2">
                                        {isSyncing ? <Icon name="refresh" className="w-4 h-4 animate-spin" /> : null}
                                        {isSyncing ? '同步中...' : '保存并立即同步'}
                                    </button>
                                    <div className="mt-3">
                                        <input
                                            type="file"
                                            accept=".ics"
                                            onChange={handleImportICSFile}
                                            className="hidden"
                                            id="ics-file-input"
                                        />
                                        <label
                                            htmlFor="ics-file-input"
                                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                                        >
                                            <Icon name="upload" className="w-4 h-4" />
                                            导入本地ICS文件
                                        </label>
                                    </div>
                                </SettingsSection>
                            </div>

                            <div className="hidden">
                                <SettingsSection
                                    title="解析文本日程"
                                    icon="plus"
                                    iconColor="text-blue-500"
                                    description="粘贴文本格式的日程数据进行批量导入"
                                >
                                    <textarea className="w-full h-48 p-3 border dark:border-slate-700 rounded-xl text-sm outline-none bg-slate-50 dark:bg-slate-800 font-mono" placeholder="在此粘贴日程文本..." value={inputText} onChange={e => setInputText(e.target.value)} />
                                    <button onClick={() => parseText(inputText)} disabled={!inputText.trim()} className="mt-4 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold disabled:opacity-50 transition-all">导入并保存</button>
                                </SettingsSection>
                            </div>

                            <SettingsSection
                                title="关于"
                                icon="calendar"
                                iconColor="text-blue-500"
                                description="应用信息和免责声明"
                            >
                                <div className="space-y-4">
                                    <div className="text-sm">
                                        <div className="font-medium text-slate-900 dark:text-slate-100">枝江追番表</div>
                                        <div className="text-slate-500 dark:text-slate-400">一个受<a href="https://asoul.love/" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">枝江日程表</a>启发制作的一个方便补录播的工具。</div>
                                        <div className="text-slate-500 dark:text-slate-400">整体画面风格均仿照枝江日程表设计。感谢未署名的枝江日程表开发者。</div>
                                    </div>
                                    <div className="text-sm">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="font-medium text-slate-900 dark:text-slate-100">版本信息</div>
                                                <div className="text-slate-500 dark:text-slate-400">v1.1.0</div>
                                            </div>
                                            <button
                                                onClick={() => setView('changelog')}
                                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                                            >
                                                <Icon name="file-text" className="w-4 h-4" />
                                                查看更新日志
                                            </button>
                                        </div>
                                    </div>
                                    <div className="text-sm">
                                        <div className="font-medium text-slate-900 dark:text-slate-100">主要功能</div>
                                        <ul className="text-slate-500 dark:text-slate-400 list-disc list-inside space-y-1">
                                            <li>日历视图显示直播日程</li>
                                            <li>追番表管理进度</li>
                                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<font size="1">支持设置任意跳转链接，使用B站网页端自带的精准空降链接即可实现跳转到上次观看位置</font>
                                            <li>ICS 日历订阅同步（订阅自<a href="https://asoul.love/" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">枝江日程表</a>）</li>
                                            <li>多成员颜色配置</li>
                                            <li>数据导入导出</li>
                                        </ul>
                                    </div>
                                    <div className="text-sm">
                                        <div className="font-medium text-slate-900 dark:text-slate-100">免责声明</div>
                                        <div className="text-slate-500 dark:text-slate-400">本站为粉丝自发搭建的非营利性第三方工具，<br />
                                            与A-SOUL、枝江娱乐、乐华娱乐等官方无任何关联。<br /><br />
                                            所有数据来源于 Bilibili 公开动态或用户自行填充，<br />
                                            版权归原作者所有。如有侵权，请联系我们删除。<br /><br />
                                            信息可能存在误差，请以官方发布为准。 本站不对因信息错误导致的任何损失承担责任。</div>
                                    </div>
                                    <div className="text-sm">
                                        <div className="font-medium text-slate-900 dark:text-slate-100">技术支持</div>
                                        <div className="text-slate-500 dark:text-slate-400">如有问题或建议，请联系开发者</div>
                                    </div>
                                </div>
                            </SettingsSection>
                        </div>
                    )}
                </main>

                {editingNoteId && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm border dark:border-slate-800 p-5">
                            <div className="font-bold mb-4 flex justify-between items-center text-slate-900 dark:text-slate-100">
                                <span className="flex items-center gap-2"><Icon name="message-square" className="w-4 h-4" /> 备注和链接</span>
                                <button onClick={() => setEditingNoteId(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400"><Icon name="x" /></button>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">备注内容</label>
                                    <textarea autoFocus className="w-full h-24 p-3 border dark:border-slate-700 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 outline-none text-slate-900 dark:text-slate-100" value={tempNote} onChange={e => setTempNote(e.target.value)} placeholder="输入观看进度或其他备注..." />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">跳转链接</label>
                                    <input type="url" className="w-full p-3 border dark:border-slate-700 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 outline-none text-slate-900 dark:text-slate-100" value={tempLink} onChange={e => setTempLink(e.target.value)} placeholder="输入链接或包含链接的文本，保存时自动提取纯链接..." />
                                </div>
                            </div>
                            <div className="flex gap-2 mt-4">
                                <button onClick={() => setEditingNoteId(null)} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm font-bold">取消</button>
                                <button onClick={() => saveNote(editingNoteId)} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold">保存</button>
                            </div>
                        </div>
                    </div>
                )}

                {isAddModalOpen && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border dark:border-slate-800 p-6 space-y-4">
                            <div className="font-bold flex justify-between items-center text-slate-900 dark:text-slate-100">
                                <span className="flex items-center gap-2"><Icon name="plus" className="w-4 h-4 text-blue-500" /> 手动新增</span>
                                <button onClick={() => setIsAddModalOpen(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><Icon name="x" /></button>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-xs font-bold text-slate-500 mb-1.5 block">成员</label>
                                    <select className="w-full p-2.5 border dark:border-slate-700 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 outline-none text-slate-900 dark:text-slate-100" value={newSchedule.category} onChange={e => setNewSchedule({ ...newSchedule, category: e.target.value })}>
                                        {Object.keys(DEFAULT_MEMBER_CONFIG).map(name => <option key={name} value={name}>{name}</option>)}
                                    </select>
                                </div>
                                <div><label className="text-xs font-bold text-slate-500 mb-1.5 block">类型</label>
                                    <input type="text" className="w-full p-2.5 border dark:border-slate-700 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 outline-none text-slate-900 dark:text-slate-100" value={newSchedule.type} onChange={e => setNewSchedule({ ...newSchedule, type: e.target.value })} placeholder="直播" />
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg border dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                                <div>
                                    <div className="font-medium text-sm">标记为追番</div>
                                    <div className="text-xs text-slate-500">此日程将显示在追番表中，不在日历中显示</div>
                                </div>
                                <button
                                    onClick={() => setNewSchedule({ ...newSchedule, isAnime: !newSchedule.isAnime })}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${newSchedule.isAnime ? 'bg-orange-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${newSchedule.isAnime ? 'translate-x-6' : 'translate-x-1'}`}
                                    />
                                </button>
                            </div>
                            {newSchedule.isAnime && (
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">跳转链接</label>
                                    <input type="text" className="w-full p-2.5 border dark:border-slate-700 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 outline-none text-slate-900 dark:text-slate-100" value={newSchedule.link} onChange={e => setNewSchedule({ ...newSchedule, link: e.target.value })} placeholder="https://example.com" />
                                </div>
                            )}
                            {!newSchedule.isAnime && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="text-xs font-bold text-slate-500 mb-1.5 block">日期</label>
                                        <input type="date" className="w-full p-2.5 border dark:border-slate-700 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 outline-none text-slate-900 dark:text-slate-100" value={newSchedule.date.replace(/\//g, '-')} onChange={e => setNewSchedule({ ...newSchedule, date: e.target.value.replace(/-/g, '/') })} />
                                    </div>
                                    <div><label className="text-xs font-bold text-slate-500 mb-1.5 block">时间</label>
                                        <input type="time" className="w-full p-2.5 border dark:border-slate-700 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 outline-none text-slate-900 dark:text-slate-100" value={newSchedule.time} onChange={e => setNewSchedule({ ...newSchedule, time: e.target.value })} />
                                    </div>
                                </div>
                            )}
                            <div><label className="text-xs font-bold text-slate-500 mb-1.5 block">副标题</label>
                                <input type="text" className="w-full p-2.5 border dark:border-slate-700 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 outline-none text-slate-900 dark:text-slate-100" value={newSchedule.subTitle} onChange={e => setNewSchedule({ ...newSchedule, subTitle: e.target.value })} placeholder="直播" />
                            </div>
                            <div><label className="text-xs font-bold text-slate-500 mb-1.5 block">主标题</label>
                                <input type="text" className="w-full p-2.5 border dark:border-slate-700 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 outline-none text-slate-900 dark:text-slate-100" value={newSchedule.title} onChange={e => setNewSchedule({ ...newSchedule, title: e.target.value })} placeholder="《嘉然的奇妙冒险》" />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button onClick={() => setIsAddModalOpen(false)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm font-bold">取消</button>
                                <button onClick={handleManualAdd} className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg">确认添加</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 外部链接确认弹窗 */}
                {externalLinkModal.isOpen && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setExternalLinkModal({ isOpen: false, url: '' })}>
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border dark:border-slate-800" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                                    <Icon name="external-link" className="w-5 h-5 text-yellow-600 dark:text-yellow-500" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">外部链接提醒</h3>
                            </div>

                            <div className="mb-4 space-y-3">
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    您即将跳转到外部网站：
                                </p>
                                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg break-all text-xs font-mono text-slate-700 dark:text-slate-300">
                                    {externalLinkModal.url}
                                </div>
                                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                    <p className="text-xs text-yellow-800 dark:text-yellow-200 leading-relaxed">
                                        <span className="font-bold">⚠️ 免责声明：</span>
                                        该链接指向外部网站，不属于 bilibili.com 域名。请注意网络安全，谨慎访问未知网站。本应用不对外部链接的内容和安全性负责。
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setExternalLinkModal({ isOpen: false, url: '' })}
                                    className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 transition-colors"
                                >
                                    取消
                                </button>
                                <button
                                    onClick={() => {
                                        window.open(externalLinkModal.url, '_blank');
                                        setExternalLinkModal({ isOpen: false, url: '' });
                                    }}
                                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg transition-colors"
                                >
                                    继续访问
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 页脚 */}
                <footer className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-t dark:border-slate-800 py-2 px-4 z-10">
                    <div className="max-w-6xl mx-auto flex justify-center items-center">
                        <span className="text-xs text-slate-600 dark:text-slate-400">
                            <a href="https://github.com/Evelynall/ASoul-Calendar"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 dark:text-blue-400 hover:underline ml-1">
                                项目Github
                            </a>
                            &nbsp;&nbsp;&nbsp;&nbsp; 所有日程数据均来自枝江站(asoul.love)，感谢
                            <a href="https://asoul.love/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 dark:text-blue-400 hover:underline ml-1">
                                枝江站
                            </a>
                            &nbsp;的分享与许可！&nbsp;
                            <a
                                onClick={(e) => {
                                    e.preventDefault(); // 阻止<a>标签的默认跳转行为
                                    setView('changelog'); // 执行你的逻辑
                                }}
                                className="text-blue-600 dark:text-blue-400 hover:underline ml-1"
                                href="#" // 加空href保证浏览器识别为可点击元素（可选，但推荐）
                            >
                                查看更新日志
                            </a>
                        </span>
                    </div>
                </footer>
            </div>
        </>
    );
};

export default App;
