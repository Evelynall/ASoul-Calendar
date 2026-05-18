import { useState, useEffect, useRef, useCallback } from 'react';
import { toZeroDate } from '../utils';

/**
 * useUrlParamLink Hook
 * 处理 URL 参数 ?set_link=<scheduleId>&link=<encodedUrl>
 * 支持精确匹配、小时前缀模糊匹配、候选弹窗
 *
 * @param {object} params
 * @param {Array}   params.schedules      - 当前日程列表
 * @param {boolean} params.isLoadingBase  - 是否还在加载
 * @param {Function} params.setSchedules  - 更新日程
 * @param {Function} params.setCurrentDate
 * @param {Function} params.setView
 */
export function useUrlParamLink({ schedules, isLoadingBase, setSchedules, setCurrentDate, setView }) {
    const urlParamHandledRef = useRef(false);

    // 候选弹窗状态（多日程匹配时使用）
    const [setLinkCandidateModal, setSetLinkCandidateModal] = useState({
        isOpen: false,
        candidates: [],
        pendingLink: ''
    });

    // 将链接写入指定日程并跳转视图
    const applyScheduleLink = useCallback((targetSchedule, decodedLink) => {
        setSchedules(prev =>
            prev.map(s => s.id === targetSchedule.id ? { ...s, link: decodedLink } : s)
        );
        const scheduleDate = targetSchedule.date;
        const isCalendarSchedule = scheduleDate && scheduleDate !== '追番/追番';
        if (isCalendarSchedule) {
            setCurrentDate(toZeroDate(scheduleDate));
            setView('calendar');
        } else {
            setView('anime');
        }
        alert(`已成功为日程「${targetSchedule.title || targetSchedule.subTitle}」设置链接：\n\n${decodedLink}`);
    }, [setSchedules, setCurrentDate, setView]);

    useEffect(() => {
        if (isLoadingBase || schedules.length === 0 || urlParamHandledRef.current) return;

        const params = new URLSearchParams(window.location.search);
        const targetId = params.get('set_link');
        const rawLink = params.get('link');

        if (!targetId || !rawLink) return;

        urlParamHandledRef.current = true;
        window.history.replaceState({}, '', window.location.pathname);

        let decodedLink;
        try {
            decodedLink = decodeURIComponent(rawLink);
        } catch {
            decodedLink = rawLink;
        }

        if (!decodedLink.startsWith('http://') && !decodedLink.startsWith('https://')) {
            alert(`URL 参数错误：链接格式无效，必须以 http:// 或 https:// 开头。\n\n收到的链接：${decodedLink}`);
            return;
        }

        // ── 精确匹配 ──
        const exactMatch = schedules.find(s => s.id === targetId);
        if (exactMatch) {
            applyScheduleLink(exactMatch, decodedLink);
            return;
        }

        // ── 模糊匹配（日期 + 标识符相同） ──
        const idParts = targetId.split('-');
        if (idParts.length < 3) {
            alert(`未找到 ID 为「${targetId}」的日程，且该 ID 格式无法进行模糊匹配。`);
            return;
        }
        const [datePart, timePart, ...restParts] = idParts;
        const identPart = restParts.join('-');

        const sameGroupSchedules = schedules.filter(s => {
            const sParts = s.id.split('-');
            if (sParts.length < 3) return false;
            const [sDate, , ...sRestParts] = sParts;
            const sIdent = sRestParts.join('-');
            return sDate === datePart && sIdent === identPart;
        });

        if (sameGroupSchedules.length === 0) {
            alert(`未找到 ID 为「${targetId}」的日程。\n\n日期「${datePart}」+ 标识符「${identPart}」的日程不存在，请检查 ID 是否正确。`);
            return;
        }

        const hourPrefix = timePart.slice(0, 2);
        const isTimeUnknown = timePart === '0000';

        if (isTimeUnknown) {
            if (sameGroupSchedules.length === 1) {
                applyScheduleLink(sameGroupSchedules[0], decodedLink);
            } else {
                setSetLinkCandidateModal({ isOpen: true, candidates: sameGroupSchedules, pendingLink: decodedLink });
            }
            return;
        }

        const hourMatches = sameGroupSchedules.filter(s => {
            const sTimePart = s.id.split('-')[1] || '';
            return sTimePart.startsWith(hourPrefix);
        });

        if (hourMatches.length === 1) {
            applyScheduleLink(hourMatches[0], decodedLink);
        } else if (hourMatches.length > 1) {
            setSetLinkCandidateModal({ isOpen: true, candidates: hourMatches, pendingLink: decodedLink });
        } else {
            setSetLinkCandidateModal({ isOpen: true, candidates: sameGroupSchedules, pendingLink: decodedLink });
        }
    }, [isLoadingBase, schedules, applyScheduleLink]);

    return {
        setLinkCandidateModal,
        setSetLinkCandidateModal,
        applyScheduleLink
    };
}
