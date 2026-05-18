/**
 * 默认快捷链接数据
 * 包含录播合集、官方账号、成员 tag 动态等
 */

export const DEFAULT_REPLAY_LINKS = [
    {
        id: 'default-replay-1',
        title: '贝拉录播',
        description: '贝拉直播录播合集',
        url: 'https://space.bilibili.com/672353429/lists/222938?type=series',
        icon: 'bilibili'
    },
    {
        id: 'default-replay-2',
        title: '嘉然录播',
        description: '嘉然直播录播合集',
        url: 'https://space.bilibili.com/672328094/lists/222940?type=series',
        icon: 'bilibili'
    },
    {
        id: 'default-replay-3',
        title: '乃琳录播',
        description: '乃琳直播录播合集',
        url: 'https://space.bilibili.com/672342685/lists/222754?type=series',
        icon: 'bilibili'
    },
    {
        id: 'default-replay-4',
        title: '心宜录播',
        description: '心宜直播录播合集',
        url: 'https://space.bilibili.com/3537115310721181/lists/3698069?type=series',
        icon: 'bilibili'
    },
    {
        id: 'default-replay-5',
        title: '思诺录播',
        description: '思诺直播录播合集',
        url: 'https://space.bilibili.com/3537115310721781/lists/3692011?type=series',
        icon: 'bilibili'
    }
];

export const DEFAULT_MISC_LINKS = [
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

/**
 * 获取初始链接列表（从 localStorage 加载，缺失录播链接时自动补充）
 */
export function getInitialLinks() {
    const saved = localStorage.getItem('asoul_quick_links');
    if (saved) {
        const existing = JSON.parse(saved);
        const existingIds = new Set(existing.map(l => l.id));
        const toAdd = DEFAULT_REPLAY_LINKS.filter(l => !existingIds.has(l.id));
        return toAdd.length > 0 ? [...toAdd, ...existing] : existing;
    }
    return [...DEFAULT_REPLAY_LINKS, ...DEFAULT_MISC_LINKS];
}
