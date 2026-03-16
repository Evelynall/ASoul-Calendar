import { BASE_SCHEDULES_URL, BASE_SCHEDULES_LAST_FETCH_KEY, BASE_SCHEDULES_KEY, LIVE_ROOM_URLS, DEFAULT_MEMBER_CONFIG, CUSTOM_COLORS_KEY, SPECIAL_GROUP_COLOR_KEY } from './constants';

// 添加时间戳参数以绕过CDN缓存
export const getBaseSchedulesUrl = () => {
    return `${BASE_SCHEDULES_URL}?t=${Date.now()}`;
};

// 检查是否需要重新获取基础日程（2小时限制）
export const shouldFetchBaseSchedules = () => {
    const lastFetch = localStorage.getItem(BASE_SCHEDULES_LAST_FETCH_KEY);
    const cachedSchedules = localStorage.getItem(BASE_SCHEDULES_KEY);

    if (!cachedSchedules) {
        return true;
    }

    if (!lastFetch) {
        return true;
    }

    const now = Date.now();
    const lastFetchTime = parseInt(lastFetch, 10);
    const twoHours = 2 * 60 * 60 * 1000;

    return (now - lastFetchTime) >= twoHours;
};

// 获取成员配置（支持自定义颜色）
export const getMemberConfigColors = () => {
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

// 根据直播间URL反向查找成员
export const getMemberByLiveRoomUrl = (liveRoomUrl) => {
    if (!liveRoomUrl) return null;
    for (const [member, url] of Object.entries(LIVE_ROOM_URLS)) {
        if (liveRoomUrl.includes(url.replace('https://live.bilibili.com/', ''))) {
            return member;
        }
    }
    return null;
};

// 获取成员配置（支持多成员组合、直播间地址反向匹配和特殊组合颜色开关）
export const getMemberConfig = (category, displayMode = 'single', liveRoomUrl = null) => {
    const useSpecialGroupColor = localStorage.getItem(SPECIAL_GROUP_COLOR_KEY) !== 'false';
    const memberConfig = getMemberConfigColors();

    // 优先根据直播间URL确定主要成员
    let primaryMember = null;
    if (liveRoomUrl) {
        primaryMember = getMemberByLiveRoomUrl(liveRoomUrl);
    }

    // 如果是已知的组合，根据特殊组合颜色开关决定处理方式
    if (memberConfig[category]) {
        if (useSpecialGroupColor) {
            const config = { ...memberConfig[category] };
            if (primaryMember && category.includes('+') && displayMode === 'multi-color') {
                config.color = memberConfig[primaryMember]?.color || config.color;
                if (config.multiColors && config.multiColors.length > 1) {
                    const primaryColor = memberConfig[primaryMember]?.color;
                    if (primaryColor && config.multiColors.includes(primaryColor)) {
                        const filteredColors = config.multiColors.filter(c => c !== primaryColor);
                        config.multiColors = [primaryColor, ...filteredColors];
                    }
                }
            }
            return config;
        } else {
            if (category === 'A-SOUL') {
                category = '贝拉+嘉然+乃琳';
            } else if (category === '小心思') {
                category = '心宜+思诺';
            }
        }
    }

    // 处理多成员组合（如"贝拉等"）
    if (category.endsWith('等')) {
        const mainMember = category.replace('等', '');
        if (memberConfig[mainMember]) {
            return {
                ...memberConfig[mainMember],
                isMultiMember: true
            };
        }
    }

    // 处理多成员组合（如"贝拉+嘉然"）
    if (category.includes('+')) {
        const members = category.split('+').map(m => m.trim()).filter(m => m);

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
                return {
                    color: memberColors[0],
                    textColor: '#FFFFFF',
                    isMultiMember: true,
                    multiColors: memberColors.slice(0, 5)
                };
            } else {
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

    return memberConfig['其他'];
};

// 日期格式化
export const formatDateString = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}/${m}/${d}`;
};

// 转换为零点日期
export const toZeroDate = (val) => {
    const d = val ? new Date(typeof val === 'string' ? val.replace(/-/g, '/') : val) : new Date();
    d.setHours(0, 0, 0, 0);
    return d;
};

// 从文本中提取URL链接
export const extractUrlFromText = (text) => {
    if (!text) return '';

    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const matches = text.match(urlRegex);

    if (matches && matches.length > 0) {
        return matches[0];
    }

    const simplifiedRegex = /(www\.[^\s]+\.[a-z]{2,})|([a-z]+\.[a-z]{2,}(\/[^\s]*)?)/gi;
    const simplifiedMatches = text.match(simplifiedRegex);

    if (simplifiedMatches && simplifiedMatches.length > 0) {
        const url = simplifiedMatches[0];
        if (!url.startsWith('http')) {
            return 'https://' + url;
        }
        return url;
    }

    return '';
};
