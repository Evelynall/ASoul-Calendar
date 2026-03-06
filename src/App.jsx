import { useState, useMemo, useEffect, Fragment, useRef } from 'react';
import './App.css';
const STORAGE_KEY = 'asoul_calendar_data';
const THEME_KEY = 'asoul_calendar_theme';
const ICS_CONFIG_KEY = 'asoul_ics_urls';
const DISPLAY_MODE_KEY = 'asoul_display_mode';
const SPECIAL_GROUP_COLOR_KEY = 'asoul_special_group_color';
const ANIME_VIEW_KEY = 'asoul_anime_view';
const GIST_TOKEN_KEY = 'asoul_gist_token';
const GIST_ID_KEY = 'asoul_gist_id';
const CUSTOM_COLORS_KEY = 'asoul_custom_colors';

const DEFAULT_MEMBER_CONFIG = {
    '贝拉': { color: '#DB7D74', textColor: '#FFFFFF' },
    '嘉然': { color: '#E799B0', textColor: '#FFFFFF' },
    '乃琳': { color: '#576690', textColor: '#FFFFFF' },
    '思诺': { color: '#7252C0', textColor: '#FFFFFF' },
    '心宜': { color: '#C93773', textColor: '#FFFFFF' },
    'A-SOUL': { color: '#55ACEE', textColor: '#FFFFFF' },
    '小心思': { color: '#4CADAF', textColor: '#FFFFFF' },
    '其他': { color: '#94a3b8', textColor: '#FFFFFF' }
};

// 获取成员配置（支持自定义颜色）
const getMemberConfigColors = () => {
    const saved = localStorage.getItem(CUSTOM_COLORS_KEY);
    if (saved) {
        try {
            const customColors = JSON.parse(saved);
            return { ...DEFAULT_MEMBER_CONFIG, ...customColors };
        } catch (e) {
            return DEFAULT_MEMBER_CONFIG;
        }
    }
    return DEFAULT_MEMBER_CONFIG;
};

const MEMBER_CONFIG = getMemberConfigColors();

// 获取成员配置（支持多成员组合、直播间地址反向匹配和特殊组合颜色开关）
const getMemberConfig = (category, displayMode = 'single', liveRoomUrl = null) => {
    const useSpecialGroupColor = localStorage.getItem(SPECIAL_GROUP_COLOR_KEY) !== 'false';
    const memberConfig = getMemberConfigColors(); // 获取最新的配置（包括自定义颜色）

    // 优先根据直播间URL确定主要成员
    let primaryMember = null;
    if (liveRoomUrl) {
        primaryMember = getMemberByLiveRoomUrl(liveRoomUrl);
    }

    // 如果是已知的组合，根据特殊组合颜色开关决定处理方式
    if (memberConfig[category]) {
        // 如果开启特殊组合颜色，直接返回配置
        if (useSpecialGroupColor) {
            const config = { ...memberConfig[category] };
            // 如果存在直播间URL对应的成员，且是多成员组合，优先使用直播间成员的颜色
            if (primaryMember && category.includes('+') && displayMode === 'multi-color') {
                config.color = memberConfig[primaryMember]?.color || config.color;
                if (config.multiColors && config.multiColors.length > 1) {
                    // 确保直播间成员的颜色在渐变色中排在第一位
                    const primaryColor = memberConfig[primaryMember]?.color;
                    if (primaryColor && config.multiColors.includes(primaryColor)) {
                        const filteredColors = config.multiColors.filter(c => c !== primaryColor);
                        config.multiColors = [primaryColor, ...filteredColors];
                    }
                }
            }
            return config;
        } else {
            // 如果关闭特殊组合颜色，将特殊组合转换为多成员组合处理
            if (category === 'A-SOUL') {
                category = '贝拉+嘉然+乃琳';
            } else if (category === '小心思') {
                category = '心宜+思诺';
            }
            // 其他组合保持不变
        }
    }

    // 处理多成员组合（如"贝拉等"）
    if (category.endsWith('等')) {
        const mainMember = category.replace('等', '');
        if (memberConfig[mainMember]) {
            // 使用主要成员的颜色，但文本表示为组合
            return {
                ...memberConfig[mainMember],
                isMultiMember: true
            };
        }
    }

    // 处理多成员组合（如"贝拉+嘉然"）
    if (category.includes('+')) {
        const members = category.split('+').map(m => m.trim()).filter(m => m);

        // 如果有直播间URL对应的成员，确保该成员排在前面
        if (primaryMember && members.includes(primaryMember)) {
            const sortedMembers = [primaryMember, ...members.filter(m => m !== primaryMember)];
            members.splice(0, members.length, ...sortedMembers);
        }

        const memberColors = members.map(member => {
            if (memberConfig[member]) {
                return memberConfig[member].color;
            }
            return memberConfig['其他'].color;
        }).filter(color => color !== memberConfig['其他'].color);

        if (memberColors.length > 0) {
            if (displayMode === 'multi-color') {
                // 多色模式：返回渐变色配置
                return {
                    color: memberColors[0], // 主颜色（直播间成员优先）
                    textColor: '#FFFFFF',
                    isMultiMember: true,
                    multiColors: memberColors.slice(0, 5) // 最多5个成员颜色
                };
            } else {
                // 单一颜色模式：优先使用直播间成员的颜色，否则使用第一个成员的颜色
                const targetMember = primaryMember || members.find(member => memberConfig[member]);
                if (targetMember) {
                    return {
                        ...memberConfig[targetMember],
                        isMultiMember: true
                    };
                }
            }
        }
    }

    // 如果有直播间URL对应的成员，使用该成员的颜色
    if (primaryMember && memberConfig[primaryMember]) {
        return memberConfig[primaryMember];
    }

    // 默认返回其他配置
    return memberConfig['其他'];
};

const LIVE_ROOM_URLS = {
    '贝拉': 'https://live.bilibili.com/22632424',
    '乃琳': 'https://live.bilibili.com/22625027',
    '嘉然': 'https://live.bilibili.com/22637261',
    '心宜': 'https://live.bilibili.com/30849777',
    '思诺': 'https://live.bilibili.com/30858592',
    'A-SOUL': 'https://live.bilibili.com/22632424', // A-SOUL官方直播间
    '小心思': 'https://live.bilibili.com/30849777' // 小心思官方直播间
};

// 根据直播间URL反向查找成员
const getMemberByLiveRoomUrl = (liveRoomUrl) => {
    if (!liveRoomUrl) return null;
    for (const [member, url] of Object.entries(LIVE_ROOM_URLS)) {
        if (liveRoomUrl.includes(url.replace('https://live.bilibili.com/', ''))) {
            return member;
        }
    }
    return null;
};

const formatDateString = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}/${m}/${d}`;
};

const toZeroDate = (val) => {
    const d = val ? new Date(typeof val === 'string' ? val.replace(/-/g, '/') : val) : new Date();
    d.setHours(0, 0, 0, 0);
    return d;
};

const Icon = ({ name, className = "w-4 h-4" }) => {
    const icons = {
        calendar:
            <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />,
        settings: (
            <Fragment>
                <path
                    d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z" />
                <circle cx="12" cy="12" r="3" />
            </Fragment>
        ),
        palette: (
            <Fragment>
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74" />
                <path d="M12 22a7 7 0 0 0 7-7c0-2.38-1.19-4.47-3-5.74" />
            </Fragment>
        ),
        x:
            <path d="M18 6 6 18M6 6l12 12" />,
        moon:
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />,
        sun: (
            <Fragment>
                <circle cx="12" cy="12" r="4" />
                <path
                    d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
            </Fragment>
        ),
        "chevron-left":
            <path d="m15 18-6-6 6-6" />,
        "chevron-right":
            <path d="m9 18 6-6-6-6" />,
        "check-circle-2": (
            <Fragment>
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                <path d="m9 12 2 2 4-4" />
            </Fragment>
        ),
        "message-square":
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
        plus:
            <path d="M5 12h14M12 5v14" />,
        refresh:
            <path
                d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8m0 0V3m0 5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16m0 0v5m0-5h5" />
        ,
        download:
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />,
        upload:
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />,
        "trash-2": (
            <Fragment>
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
            </Fragment>
        ),
        search: (
            <Fragment>
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
            </Fragment>
        ),
        "calendar-days": (
            <Fragment>
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                <line x1="16" x2="16" y1="2" y2="6" />
                <line x1="8" x2="8" y1="2" y2="6" />
                <line x1="3" x2="21" y1="10" y2="10" />
                <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" />
            </Fragment>
        ),
        bilibili: (
            <Fragment>
                <path d="M12 3L9 1M12 3l3-2" />
                <rect x="3" y="6" width="18" height="14" rx="3" />
                <path d="M8 12c.5 0 1 .5 1 1s-.5 1-1 1-1-.5-1-1 .5-1 1-1zm8 0c.5 0 1 .5 1 1s-.5 1-1 1-1-.5-1-1 .5-1 1-1z" />
                <path d="M9 17h6" />
            </Fragment>
        ),
        link:
            <path
                d="M 13 12 L 13 3 C 20 3 20 12 13 12 L 22 12 C 22 19 13 19 13 12 L 13 21 C 6 21 6 12 13 12 L 4 12 C 4 5 13 5 13 12" />
        ,
        "external-link":
            <path
                d="m 4 18 C 4 14 5 9 11 9 L 11 6 C 11 4 12 4 19 10 C 20 11 20 11 19 12 C 12 19 11 19 11 17 L 11 14 C 9 14 6 14 4 18" />
        ,
        star:
            <path d="m 5 21 C 13 17 9 17 17 21 C 16 12 15 15 20 10 C 12 9 15 11 11 3 C 7 11 10 9 2 10 C 7 15 6 12 5 21" />
    };
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" className={className}>
            {icons[name] || null}
        </svg>
    );
};

const SettingsSection = ({ title, icon, iconColor, description, children }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <section className="rounded-2xl bg-white dark:bg-slate-900 border dark:border-slate-800 shadow-sm overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <Icon name={icon} className={`w-5 h-5 ${iconColor}`} />
                    <div className="text-left">
                        <h3 className="font-bold text-lg">{title}</h3>
                        {description && (
                            <p className="text-xs text-slate-500 mt-0.5">{description}</p>
                        )}
                    </div>
                </div>
                <Icon
                    name="chevron-right"
                    className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                />
            </button>
            {isOpen && (
                <div className="px-6 pb-6">
                    {children}
                </div>
            )}
        </section>
    );
};

function App() {
    const [schedules, setSchedules] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const data = JSON.parse(saved);
            // 兼容旧数据：如果没有isAnime字段，默认为false（日历日程）
            // 兼容旧数据：如果没有isFavorite字段，默认为false
            return Array.isArray(data) ? data.map(item => ({
                ...item,
                isAnime: item.isAnime || false,
                isFavorite: item.isFavorite || false
            })) : [];
        }
        return [];
    });

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
    const [showThankYouModal, setShowThankYouModal] = useState(false);

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

    const fileInputRef = useRef(null);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules));
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

    const ScheduleCard = ({ item, showDate = false, showMoveButton = false }) => {
        const displayMode = localStorage.getItem(DISPLAY_MODE_KEY) || 'multi-color';
        // 获取直播间URL（优先级：ICS直播间URL > 预定义直播间URL）
        const liveRoomUrl = item.liveRoomUrl || LIVE_ROOM_URLS[item.category];
        const config = getMemberConfig(item.category, displayMode, liveRoomUrl);

        // 生成渐变背景样式
        const getBackgroundStyle = () => {
            if (displayMode === 'multi-color' && config.multiColors && config.multiColors.length > 1) {
                const colors = config.multiColors;
                const gradientStops = colors.map((color, index) => `${color} ${(index / (colors.length - 1)) * 100}%`).join(', ');
                return {
                    background: `linear-gradient(135deg, ${gradientStops})`,
                    color: config.textColor
                };
            }
            return {
                backgroundColor: config.color,
                color: config.textColor
            };
        };

        return (
            <div className="flex flex-col gap-1 px-1 mb-4">
                <div className="flex justify-between items-baseline px-0.5">
                    <div className="text-[10px] font-black italic tracking-tighter opacity-60 text-slate-500 dark:text-slate-400">
                        {item.isAnime ? (
                            item.isFavorite ? (
                                <span className="text-yellow-500">收藏日程</span>
                            ) : (
                                <span className="text-orange-500">追番日程</span>
                            )
                        ) : (
                            showDate ? `${item.date.split('/').slice(1).join('/')} ${item.time}` : item.time
                        )}
                    </div>
                </div>
                <div className={`group relative p-3 rounded-xl transition-all shadow-sm ${item.completed ? 'opacity-30 grayscale'
                    : 'hover:shadow-md hover:scale-[1.01]'} cursor-pointer`} style={getBackgroundStyle()} onClick={() =>
                        toggleComplete(item.id)}>
                    <div className="flex items-center gap-1.5 mb-1">
                        <span
                            className="px-1.5 py-0.5 rounded text-[9px] font-black bg-black/10 uppercase tracking-tighter">{item.type}</span>
                        <div className="text-[11px] font-bold opacity-80 truncate pr-4">{item.subTitle}</div>
                    </div>
                    <div className="text-xs md:text-sm font-black leading-tight line-clamp-2">{item.title}</div>

                    {item.note && <div className="mt-2 p-1.5 rounded text-[10px] bg-black/5 flex items-start gap-1">
                        <Icon name="message-square" className="w-2.5 h-2.5 mt-0.5" /><span
                            className="italic opacity-90">{item.note}</span>
                    </div>}



                    <div className="absolute top-1 right-1 flex items-center gap-0.5">
                        {item.completed &&
                            <Icon name="check-circle-2" className="w-3.5 h-3.5 text-green-400" />}
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!item.isAnime && (() => {
                                // 优先级：ICS直播间URL > 预定义直播间URL
                                const liveRoomUrl = item.liveRoomUrl || LIVE_ROOM_URLS[item.category];

                                // 判断日程日期是否为今天或未来
                                const scheduleDate = toZeroDate(item.date);
                                const today = toZeroDate();
                                const isFutureOrToday = scheduleDate >= today;

                                return liveRoomUrl && isFutureOrToday && (
                                    <button title="进入直播间" className="p-1 bg-black/5 hover:bg-black/10 rounded-full" onClick={(e) => {
                                        e.stopPropagation(); window.open(liveRoomUrl, '_blank');
                                    }}>
                                        <Icon name="bilibili" className="w-3 h-3" />
                                    </button>
                                );
                            })()}
                            {item.link && <button title="跳转链接" className="p-1 bg-black/5 hover:bg-black/10 rounded-full"
                                onClick={(e) => { e.stopPropagation(); window.open(item.link, '_blank'); }}>
                                <Icon name="external-link" className="w-3 h-3" />
                            </button>}
                            {!item.isAnime && item.dynamicUrl && <button title="查看动态"
                                className="p-1 bg-black/5 hover:bg-black/10 rounded-full" onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(item.dynamicUrl, '_blank');
                                }}>
                                <Icon name="link" className="w-3 h-3" />
                            </button>}
                            {!item.isAnime && (() => {
                                // 判断日程日期是否为今天或过去
                                const scheduleDate = toZeroDate(item.date);
                                const today = toZeroDate();
                                const isPastOrToday = scheduleDate <= today; return isPastOrToday && (<button title="在B站搜索"
                                    className="p-1 bg-black/5 hover:bg-black/10 rounded-full" onClick={(e) => {
                                        e.stopPropagation();
                                        handleBilibiliSearch(item);
                                    }}>
                                    <Icon name="search" className="w-3 h-3" />
                                </button>
                                );
                            })()}
                            {(!item.isAnime || item.isFavorite) && (
                                <button title={item.isFavorite ? "取消收藏" : "收藏到追番表"} className={`p-1 rounded-full ${item.isFavorite
                                    ? 'bg-yellow-500 text-white' : 'bg-black/5 hover:bg-black/10'}`} onClick={(e) => {
                                        e.stopPropagation(); toggleFavorite(item.id);
                                    }}
                                >
                                    <Icon name="star" className="w-3 h-3" />
                                </button>
                            )}
                            <button title="编辑备注" className="p-1 bg-black/5 hover:bg-black/10 rounded-full" onClick={(e) => {
                                e.stopPropagation(); setEditingNoteId(item.id); setTempNote(item.note || '');
                                setTempLink(item.link || '');
                            }}>
                                <Icon name="message-square" className="w-3 h-3" />
                            </button>
                            <button title="删除日程" className="p-1 bg-black/5 hover:bg-black/10 rounded-full" onClick={(e) => {
                                e.stopPropagation(); if (confirm('确定删除吗？')) setSchedules(prev => prev.filter(s => s.id !==
                                    item.id));
                            }}>
                                <Icon name="trash-2" className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
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

    // 从文本中提取URL链接
    const extractUrlFromText = (text) => {
        if (!text) return '';

        // 匹配常见的URL模式
        const urlRegex = /(https?:\/\/[^\s]+)/gi;
        const matches = text.match(urlRegex);

        if (matches && matches.length > 0) {
            // 返回第一个找到的URL
            return matches[0];
        }

        // 如果没有找到标准URL，尝试匹配简化的链接格式
        const simplifiedRegex = /(www\.[^\s]+\.[a-z]{2,})|([a-z]+\.[a-z]{2,}(\/[^\s]*)?)/gi;
        const simplifiedMatches = text.match(simplifiedRegex);

        if (simplifiedMatches && simplifiedMatches.length > 0) {
            const url = simplifiedMatches[0];
            // 如果没有协议头，添加https://
            if (!url.startsWith('http')) {
                return 'https://' + url;
            }
            return url;
        }

        return '';
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
            note: ''
        };
        setSchedules(prev => [...prev, entry]);
        setIsAddModalOpen(false);

        // 只有日历日程才需要跳转到日期位置
        if (!newSchedule.isAnime) {
            setCurrentDate(toZeroDate(formattedDate));
        }

        setView(newSchedule.isAnime ? 'anime' : 'calendar');
    };

    // ICS 解析核心逻辑
    const parseICS = (icsText) => {
        // 1. Unfold: 处理折行 (根据 RFC 5545, 换行+空格/制表符表示续行)
        const unfoldedText = icsText.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '');
        const lines = unfoldedText.split(/\r?\n/);
        const events = [];
        let currentEvent = null;

        const getVal = (line) => {
            const parts = line.split(':');
            return parts.slice(1).join(':').trim();
        };

        lines.forEach(line => {
            if (line.startsWith('BEGIN:VEVENT')) {
                currentEvent = {};
            } else if (line.startsWith('END:VEVENT')) {
                if (currentEvent) events.push(currentEvent);
                currentEvent = null;
            } else if (currentEvent) {
                if (line.startsWith('SUMMARY')) currentEvent.summary = getVal(line);
                else if (line.startsWith('DTSTART')) currentEvent.dtstart = getVal(line);
                else if (line.startsWith('DTEND')) currentEvent.dtend = getVal(line);
                else if (line.startsWith('DESCRIPTION')) currentEvent.description = getVal(line).replace(/\\n/g, '\n');
                else if (line.startsWith('UID')) currentEvent.uid = getVal(line);
                else if (line.startsWith('URL')) currentEvent.url = getVal(line);
            }
        });

        return events.map(ev => {
            // 解析日期时间（带时区处理）
            let date = '', time = '';
            if (ev.dtstart) {
                // 处理带时区的DTSTART（格式：20231225T103000Z 或 20231225T103000+0800）
                const tzMatch = ev.dtstart.match(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z|[+-]\d{4})?/);
                if (tzMatch) {
                    const [, year, month, day, hour, minute, second, timezone] = tzMatch;

                    // 创建日期对象
                    let eventDate = new Date(year, month - 1, day, hour, minute, second || 0);

                    // 处理UTC时间（Z结尾）
                    if (timezone === 'Z') {
                        // UTC时间需要转换为本地时间
                        const utcTime = Date.UTC(year, month - 1, day, hour, minute, second || 0);
                        eventDate = new Date(utcTime);
                    }
                    // 处理带时区偏移的时间（+0800, -0500等）
                    else if (timezone && timezone.match(/[+-]\d{4}/)) {
                        const offsetHours = parseInt(timezone.substring(1, 3));
                        const offsetMinutes = parseInt(timezone.substring(3, 5));
                        const totalOffsetMinutes = (timezone[0] === '+' ? 1 : -1) * (offsetHours * 60 + offsetMinutes);
                        eventDate = new Date(eventDate.getTime() - totalOffsetMinutes * 60000);
                    }

                    date = `${eventDate.getFullYear()}/${String(eventDate.getMonth() + 1).padStart(2,
                        '0')}/${String(eventDate.getDate()).padStart(2, '0')}`;
                    time = `${String(eventDate.getHours()).padStart(2, '0')}:${String(eventDate.getMinutes()).padStart(2, '0')}`;
                } else {
                    // 处理只有日期的情况（全天事件）
                    const dm = ev.dtstart.match(/(\d{4})(\d{2})(\d{2})/);
                    if (dm) {
                        date = `${dm[1]}/${dm[2]}/${dm[3]}`;
                        time = '00:00';
                    }
                }
            }

            // 从 DESCRIPTION 提取信息
            // 格式要求: "tag | 成员动态：链接"
            let type = '订阅';
            let dynamicUrl = '';
            let liveRoomUrl = ''; // 专门用于直播间跳转的URL

            if (ev.description) {
                const desc = ev.description;
                // 提取 Tag
                const tagMatch = desc.match(/^([^|]+)\|/);
                if (tagMatch) type = tagMatch[1].trim();

                // 提取链接 (寻找 bilibili.com 相关的链接)
                const urlMatch = desc.match(/https?:\/\/www\.bilibili\.com\/[^\s\n]+/);
                if (urlMatch) dynamicUrl = urlMatch[0];
            }

            // 从 URL 标签提取直播间链接（如果存在）
            let icsUrl = null;
            if (ev.url) {
                // 如果URL是直播间链接，用于直播间跳转
                liveRoomUrl = ev.url;
                icsUrl = ev.url; // 保存原始ICS URL
            }

            // 解析 SUMMARY 字段
            let summary = ev.summary || '无标题';
            // 移除【节目】等tag部分
            summary = summary.replace(/^【[^】]+】/, '').trim();
            // 分割副标题和主标题（同时支持全角和半角冒号）
            let subTitle = '';
            let title = summary;
            // 查找冒号位置（支持全角：和半角:）
            const colonIndex = summary.indexOf('：') !== -1 ? summary.indexOf('：') : summary.indexOf(':');
            if (colonIndex !== -1) {
                subTitle = summary.substring(0, colonIndex).trim();
                title = summary.substring(colonIndex + 1).trim();
            } else {
                // 如果没有冒号，副标题和主标题一致
                subTitle = title;
            }

            // 识别成员 - 支持多成员组合判断
            let category = '其他';
            const fullText = (ev.summary + (ev.description || '')).toLowerCase();

            // 检查特殊组合
            const has贝拉 = fullText.includes('贝拉');
            const has嘉然 = fullText.includes('嘉然');
            const has乃琳 = fullText.includes('乃琳');
            const has心宜 = fullText.includes('心宜');
            const has思诺 = fullText.includes('思诺');

            // 贝拉+嘉然+乃琳组合 -> A-SOUL
            if (has贝拉 && has嘉然 && has乃琳) {
                category = 'A-SOUL';
            }
            // 心宜+思诺组合 -> 小心思
            else if (has心宜 && has思诺) {
                category = '小心思';
            }
            // 多成员组合识别（2-5个成员）
            else {
                const foundMembers = [];
                const memberNames = Object.keys(MEMBER_CONFIG).filter(name => name !== 'A-SOUL' && name !== '小心思' && name !== '其他');

                for (const name of memberNames) {
                    if (fullText.includes(name.toLowerCase())) {
                        foundMembers.push(name);
                    }
                }

                if (foundMembers.length >= 2 && foundMembers.length <= 5) {
                    // 按优先级排序：直播间成员排在前面
                    const liveRoomPriority = ['贝拉', '嘉然', '乃琳', '心宜', '思诺'];
                    foundMembers.sort((a, b) => {
                        const aIndex = liveRoomPriority.indexOf(a);
                        const bIndex = liveRoomPriority.indexOf(b);
                        if (aIndex === -1 && bIndex === -1) return 0;
                        if (aIndex === -1) return 1;
                        if (bIndex === -1) return -1;
                        return aIndex - bIndex;
                    });
                    category = foundMembers.join('+');
                }
                // 单个成员识别
                else if (foundMembers.length === 1) {
                    category = foundMembers[0];
                }
            }

            // 备用检查
            if (category === '其他' && fullText.includes('有点宜思')) category = '小心思';

            return {
                id: ev.uid || `ics-${date}-${time}-${ev.summary}`,
                date,
                time,
                title,
                type,
                subTitle,
                category,
                dynamicUrl,
                liveRoomUrl: liveRoomUrl || '', // 直播间专用URL
                icsUrl: icsUrl || ev.url, // 保存原始ICS URL
                completed: false,
                note: '',
                isIcs: true
            };
        }).filter(ev => ev.date); // 过滤无效项
    };

    const handleSyncIcs = async () => {
        if (!icsUrls || !icsUrls.trim()) {
            alert('请先在设置中配置 ICS 订阅链接');
            setView('settings');
            return;
        }

        // 显示感谢弹窗
        setShowThankYouModal(true);
    };

    const proceedWithSync = async () => {
        setShowThankYouModal(false);
        setIsSyncing(true);
        const urls = icsUrls.split('\n').filter(u => u.trim().startsWith('http'));
        let totalAdded = 0;

        try {
            const existingIds = new Set(schedules.map(s => s.id));
            const newItems = [];

            for (const url of urls) {
                // 使用 corsproxy.io 代理解决跨域
                const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url.trim())}`;
                const response = await fetch(proxyUrl);
                if (!response.ok) throw new Error(`无法获取日历: ${url}`);
                const text = await response.text();
                const parsed = parseICS(text);

                parsed.forEach(item => {
                    if (!existingIds.has(item.id)) {
                        newItems.push(item);
                        existingIds.add(item.id);
                        totalAdded++;
                    }
                });
            }

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
                if (!Array.isArray(importedData)) throw new Error('格式不正确');

                // 检查重复项并合并备注
                const existingSchedules = schedules;
                const newSchedules = [];
                const updatedSchedules = [...existingSchedules];
                let mergedCount = 0;
                let addedCount = 0;

                importedData.forEach(importedItem => {
                    // 查找重复项：相同的日期、时间、标题、副标题和类型
                    const duplicateIndex = existingSchedules.findIndex(existingItem =>
                        existingItem.date === importedItem.date &&
                        existingItem.time === importedItem.time &&
                        existingItem.title === importedItem.title &&
                        existingItem.subTitle === importedItem.subTitle &&
                        existingItem.type === importedItem.type
                    );

                    if (duplicateIndex !== -1) {
                        // 找到重复项，检查备注是否不同
                        const existingItem = existingSchedules[duplicateIndex];
                        if (importedItem.note && importedItem.note !== existingItem.note) {
                            // 合并备注
                            const mergedNote = existingItem.note
                                ? `${existingItem.note}\n${importedItem.note}`
                                : importedItem.note;

                            updatedSchedules[duplicateIndex] = {
                                ...existingItem,
                                note: mergedNote
                            };
                            mergedCount++;
                        }
                        // 如果备注相同或导入项没有备注，则不处理
                    } else {
                        // 新项，添加到新日程列表
                        newSchedules.push(importedItem);
                        addedCount++;
                    }
                });

                // 更新日程列表
                if (newSchedules.length > 0 || mergedCount > 0) {
                    setSchedules([...updatedSchedules, ...newSchedules]);

                    let message = '';
                    if (addedCount > 0 && mergedCount > 0) {
                        message = `成功导入 ${addedCount} 项新日程，合并了 ${mergedCount} 项重复日程的备注。`;
                    } else if (addedCount > 0) {
                        message = `成功导入 ${addedCount} 项新日程。`;
                    } else if (mergedCount > 0) {
                        message = `合并了 ${mergedCount} 项重复日程的备注，没有新日程导入。`;
                    } else {
                        message = '所有日程都已存在且备注相同，没有新数据导入。';
                    }
                    alert(message);
                } else {
                    alert('所有日程都已存在且备注相同，没有新数据导入。');
                }
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
            const data = {
                description: 'A-SOUL 追番表数据备份',
                public: false,
                files: {
                    'asoul-calendar-data.json': {
                        content: JSON.stringify(schedules, null, 2)
                    }
                }
            };

            let response;
            if (gistId) {
                // 更新现有 Gist
                response = await fetch(`https://api.github.com/gists/${gistId}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `token ${gistToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });
            } else {
                // 创建新 Gist
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
            if (!gistId) {
                setGistId(result.id);
            }

            alert('数据已成功同步到 GitHub Gist！');
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
            const file = gist.files['asoul-calendar-data.json'];

            if (!file) {
                throw new Error('Gist 中未找到数据文件');
            }

            const gistData = JSON.parse(file.content);

            if (!Array.isArray(gistData)) {
                throw new Error('数据格式不正确');
            }

            // 合并数据
            const existingIds = new Set(schedules.map(s => s.id));
            const newSchedules = gistData.filter(item => !existingIds.has(item.id));

            if (newSchedules.length > 0) {
                setSchedules(prev => [...prev, ...newSchedules]);
                alert(`成功从 Gist 加载 ${newSchedules.length} 项新日程！`);
            } else {
                alert('所有日程都已存在，没有新数据');
            }
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

        if (!confirm('此操作将用 Gist 中的数据完全替换本地数据，确定继续吗？')) {
            return;
        }

        setIsGistSyncing(true);
        try {
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
            const file = gist.files['asoul-calendar-data.json'];

            if (!file) {
                throw new Error('Gist 中未找到数据文件');
            }

            const gistData = JSON.parse(file.content);

            if (!Array.isArray(gistData)) {
                throw new Error('数据格式不正确');
            }

            setSchedules(gistData);
            alert(`成功从 Gist 恢复 ${gistData.length} 项日程！`);
        } catch (err) {
            console.error('Gist 读取错误:', err);
            alert('读取失败：' + err.message);
        } finally {
            setIsGistSyncing(false);
        }
    };

    return (
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
                                <button onClick={handleSyncIcs} disabled={isSyncing} className={`flex items-center gap-1.5
                                px-3 py-1.5 ${isSyncing ? 'bg-slate-400' : 'bg-emerald-600 hover:bg-emerald-700'}
                                text-white rounded-lg text-xs md:text-sm font-bold shadow-md transition-all shrink-0`}>
                                    <Icon name="refresh" className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                                    <span className="hidden sm:inline">{isSyncing ? '同步中...' : '同步订阅'}</span>
                                </button>
                                {view === 'calendar' && (
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
                                                    <ScheduleCard key={item.id} item={item} />
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
                                        <ScheduleCard key={item.id} item={item} showDate={false} showMoveButton={false} />
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

                {view === 'search' && (
                    <div
                        className="h-full max-w-3xl mx-auto p-4 md:p-8 flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Icon name="search" className="w-5 h-5" /> 搜索结果 ({filteredSchedules.length})
                        </h3>
                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                                {filteredSchedules.map(item => (
                                    <ScheduleCard key={item.id} item={item} showDate={true} />
                                ))}
                            </div>
                        </div>
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

                                <div className="flex items-center justify-between p-4 rounded-lg border dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
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
                                    <div className="text-xs text-slate-500 mb-3">点击颜色块可以自定义每个成员的背景色</div>
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
                            title="数据管理"
                            icon="download"
                            iconColor="text-blue-500"
                            description="导入导出数据，管理本地存储"
                        >
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <button onClick={() => {
                                        const blob = new Blob([JSON.stringify(schedules, null, 2)], { type: 'application/json' });
                                        const a = document.createElement('a');
                                        a.href = URL.createObjectURL(blob);
                                        a.download = `asoul_backup_all.json`;
                                        a.click();
                                    }} className="flex items-center justify-center gap-2 p-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold italic"><Icon name="download" /> 导出全部</button>
                                    <button onClick={() => {
                                        const calendarSchedules = schedules.filter(s => !s.isAnime);
                                        const blob = new Blob([JSON.stringify(calendarSchedules, null, 2)], { type: 'application/json' });
                                        const a = document.createElement('a');
                                        a.href = URL.createObjectURL(blob);
                                        a.download = `asoul_backup_calendar.json`;
                                        a.click();
                                    }} className="flex items-center justify-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 rounded-xl font-bold italic"><Icon name="calendar" /> 只导出日历</button>
                                    <button onClick={() => {
                                        const animeSchedules = schedules.filter(s => s.isAnime);
                                        const blob = new Blob([JSON.stringify(animeSchedules, null, 2)], { type: 'application/json' });
                                        const a = document.createElement('a');
                                        a.href = URL.createObjectURL(blob);
                                        a.download = `asoul_backup_anime.json`;
                                        a.click();
                                    }} className="flex items-center justify-center gap-2 p-3 bg-orange-50 dark:bg-orange-900/10 text-orange-600 dark:text-orange-400 rounded-xl font-bold italic"><Icon name="calendar-days" /> 只导出追番表</button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <button onClick={() => fileInputRef.current.click()} className="flex items-center justify-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 rounded-xl font-bold italic">
                                        <Icon name="upload" /> 导入 JSON
                                        <input type="file" ref={fileInputRef} onChange={handleImportJSON} accept=".json" className="hidden" />
                                    </button>
                                    <button onClick={() => { if (confirm('确定清空所有数据？这将同时删除已导入的订阅日程。')) { setSchedules([]); localStorage.removeItem(STORAGE_KEY); } }} className="flex items-center justify-center gap-2 p-3 text-red-500 bg-red-50 dark:bg-red-900/10 rounded-xl font-bold italic"><Icon name="trash-2" /> 清空所有数据</button>
                                </div>
                            </div>
                        </SettingsSection>

                        <SettingsSection
                            title="GitHub Gist 云同步"
                            icon="refresh"
                            iconColor="text-purple-500"
                            description="使用 GitHub Gist 在多设备间同步数据"
                        >
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
                                        {isGistSyncing ? '同步中...' : '上传到 Gist'}
                                    </button>

                                    <button
                                        onClick={handleLoadFromGist}
                                        disabled={isGistSyncing || !gistToken || !gistId}
                                        className="py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                                    >
                                        {isGistSyncing ? <Icon name="refresh" className="w-4 h-4 animate-spin" /> : <Icon name="download" className="w-4 h-4" />}
                                        合并 Gist 数据
                                    </button>

                                    <button
                                        onClick={handleReplaceFromGist}
                                        disabled={isGistSyncing || !gistToken || !gistId}
                                        className="py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-400 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                                    >
                                        {isGistSyncing ? <Icon name="refresh" className="w-4 h-4 animate-spin" /> : <Icon name="refresh" className="w-4 h-4" />}
                                        替换为 Gist
                                    </button>
                                </div>

                                <div className="text-xs text-slate-500 space-y-1 pt-2">
                                    <p>• 上传到 Gist：将当前数据上传到 GitHub Gist（首次会创建新 Gist）</p>
                                    <p>• 合并 Gist 数据：从 Gist 下载数据并与本地数据合并（不会删除本地数据）</p>
                                    <p>• 替换为 Gist：用 Gist 中的数据完全替换本地数据</p>
                                </div>
                            </div>
                        </SettingsSection>

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

                        <SettingsSection
                            title="解析文本日程"
                            icon="plus"
                            iconColor="text-blue-500"
                            description="粘贴文本格式的日程数据进行批量导入"
                        >
                            <textarea className="w-full h-48 p-3 border dark:border-slate-700 rounded-xl text-sm outline-none bg-slate-50 dark:bg-slate-800 font-mono" placeholder="在此粘贴日程文本..." value={inputText} onChange={e => setInputText(e.target.value)} />
                            <button onClick={() => parseText(inputText)} disabled={!inputText.trim()} className="mt-4 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold disabled:opacity-50 transition-all">导入并保存</button>
                        </SettingsSection>

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
                                    <div className="font-medium text-slate-900 dark:text-slate-100">版本信息</div>
                                    <div className="text-slate-500 dark:text-slate-400">v2.0.8</div>
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

            {/* 感谢弹窗 */}
            {showThankYouModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border dark:border-slate-800 p-8 space-y-6">
                        <div className="text-center space-y-4">
                            <div className="flex justify-center">
                                <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                                    <Icon name="star" className="w-8 h-8 text-white" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                                    订阅信息来源
                                </h3>
                                <p className="text-slate-600 dark:text-slate-400 text-sm">
                                    订阅信息来自 <span className="font-bold text-pink-600 dark:text-pink-400">枝江站(asoul.love)</span>
                                </p>
                            </div>
                            <div className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/30 dark:to-purple-950/30 rounded-xl p-4 border border-pink-200 dark:border-pink-800">
                                <p className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600">
                                    感谢枝江站的分享与支持！
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setShowThankYouModal(false)}
                                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                                取消
                            </button>
                            <button
                                onClick={proceedWithSync}
                                className="flex-1 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-xl transition-all"
                            >
                                继续同步
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
                            Github
                        </a>
                    </span>
                </div>
            </footer>
        </div>
    );
};

export default App;
