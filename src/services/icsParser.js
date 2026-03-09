import { DEFAULT_MEMBER_CONFIG } from '../constants';

// ICS 解析核心逻辑
export const parseICS = (icsText) => {
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
            const memberNames = Object.keys(DEFAULT_MEMBER_CONFIG).filter(name => name !== 'A-SOUL' && name !== '小心思' && name !== '其他');

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

// ICS 同步函数
export const syncIcsCalendars = async (icsUrls, existingSchedules) => {
    const urls = icsUrls.split('\n').filter(u => u.trim().startsWith('http'));
    const existingIds = new Set(existingSchedules.map(s => s.id));
    const newItems = [];
    let totalAdded = 0;

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

    return { newItems, totalAdded };
};
