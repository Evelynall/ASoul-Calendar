import { describe, expect, it } from 'vitest';
import { extractUserDataFromSchedules, mergeSchedules } from '../hooks/useSchedules';
import { mergeUserData } from '../services/gistSync';
import { parseICS } from '../services/icsParser';

describe('schedule data helpers', () => {
    it('合并基础日程和用户修改，并保留用户创建日程', () => {
        const baseSchedules = [
            { id: 'base-1', title: '直播', date: '2026/01/01', time: '20:00', liveRoomUrl: 'https://live.example' }
        ];
        const userData = {
            'base-1': { completed: true, note: '看到 30 分钟', link: 'https://video.example', isFavorite: true },
            'manual-1': { id: 'manual-1', title: '自定义', isUserCreated: true, date: '2026/01/02', time: '12:00' }
        };

        const merged = mergeSchedules(baseSchedules, userData);

        expect(merged).toHaveLength(2);
        expect(merged[0]).toMatchObject({
            id: 'base-1',
            completed: true,
            note: '看到 30 分钟',
            link: 'https://video.example',
            isFavorite: true,
            isBaseSchedule: true
        });
        expect(merged[1]).toMatchObject({ id: 'manual-1', isUserCreated: true });
    });

    it('只提取用户有意义的修改，忽略系统链接', () => {
        const userData = extractUserDataFromSchedules([
            {
                id: 'base-1',
                isBaseSchedule: true,
                completed: true,
                note: '备注',
                link: 'https://live.example',
                liveRoomUrl: 'https://live.example'
            },
            {
                id: 'base-2',
                isBaseSchedule: true,
                link: 'https://custom.example',
                liveRoomUrl: 'https://live.example'
            },
            {
                id: 'manual-1',
                isUserCreated: true,
                title: '自定义'
            }
        ]);

        expect(userData).toEqual({
            'base-1': { completed: true, note: '备注' },
            'base-2': { link: 'https://custom.example' },
            'manual-1': { id: 'manual-1', isUserCreated: true, title: '自定义' }
        });
    });
});

describe('gist data merge', () => {
    it('合并备注并保留完成、收藏和链接字段', () => {
        const current = { item1: { note: '本地备注' } };
        const imported = {
            item1: { note: '远端备注', completed: true, link: 'https://example.com', isFavorite: true },
            item2: { note: '新增备注' }
        };

        const result = mergeUserData(current, imported);

        expect(result.addedCount).toBe(1);
        expect(result.updatedCount).toBe(1);
        expect(result.mergedData.item1).toMatchObject({
            note: '本地备注\n---\n远端备注',
            completed: true,
            link: 'https://example.com',
            isFavorite: true
        });
        expect(result.mergedData.item2).toEqual({ note: '新增备注' });
    });
});

describe('ICS parser', () => {
    it('解析基本 VEVENT、标题、成员和链接', () => {
        const ics = [
            'BEGIN:VCALENDAR',
            'BEGIN:VEVENT',
            'UID:test-event-1',
            'SUMMARY:【节目】贝拉：晚间直播',
            'DTSTART:20260608T120000Z',
            'DESCRIPTION:直播 | 贝拉动态：https://www.bilibili.com/video/BV123',
            'URL:https://live.bilibili.com/22632424',
            'END:VEVENT',
            'END:VCALENDAR'
        ].join('\n');

        const events = parseICS(ics);

        expect(events).toHaveLength(1);
        expect(events[0]).toMatchObject({
            id: 'test-event-1',
            type: '直播',
            subTitle: '贝拉',
            title: '晚间直播',
            category: '贝拉',
            dynamicUrl: 'https://www.bilibili.com/video/BV123',
            liveRoomUrl: 'https://live.bilibili.com/22632424'
        });
        expect(events[0].date).toMatch(/^\d{4}\/\d{2}\/\d{2}$/);
        expect(events[0].time).toMatch(/^\d{2}:\d{2}$/);
    });
});
