import { extractUrlFromText, isTouchDevice, toBilibiliScheme, toZeroDate } from '../utils';

export function useScheduleCommands({
    schedules,
    setSchedules,
    setCurrentDate,
    setView,
    newSchedule,
    setIsAddModalOpen,
    tempNote,
    tempLink,
    setEditingNoteId,
    setInputText,
    mobileOptimize
}) {
    const toggleComplete = (id) => {
        setSchedules(prev => prev.map(s => s.id === id ? { ...s, completed: !s.completed } : s));
    };

    const toggleFavorite = (id) => {
        setSchedules(prev => prev.map(s => {
            if (s.id !== id) return s;
            const newFav = !s.isFavorite;
            return { ...s, isFavorite: newFav, isAnime: newFav ? true : false };
        }));
    };

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
        if (!newSchedule.title) {
            alert('标题为必填项');
            return;
        }

        let formattedDate = newSchedule.date.replace(/-/g, '/');
        let time = newSchedule.time;
        if (newSchedule.isAnime) {
            formattedDate = '追番/追番';
            time = '追番';
        }

        const id = `manual-${formattedDate}-${time}-${Math.random().toString(36).substr(2, 4)}`;
        setSchedules(prev => [...prev, { ...newSchedule, id, date: formattedDate, time, completed: false, note: '', isUserCreated: true }]);
        setIsAddModalOpen(false);
        if (!newSchedule.isAnime) setCurrentDate(toZeroDate(formattedDate));
        setView(newSchedule.isAnime ? 'anime' : 'calendar');
    };

    const parseText = (text) => {
        if (!text.trim()) return;
        const lines = text.split('\n').map(l => l.trim()).filter(l => l !== '');
        const newSchedules = [];
        let activeDate = '';
        const dateRegex = /(\d{4}[/-]\d{2}[/-]\d{2})/;
        const timeRegex = /^(\d{2}:\d{2})$/;
        const fingerprint = (item) => `${item.date}|${item.time}|${item.subTitle}|${item.title}`.replace(/\s+/g, '');
        const existing = new Set(schedules.map(fingerprint));

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const dateMatch = line.match(dateRegex);
            if (dateMatch) {
                activeDate = dateMatch[1].replace(/-/g, '/');
                continue;
            }

            const timeMatch = line.match(timeRegex);
            if (timeMatch && activeDate) {
                const time = timeMatch[1];
                const type = lines[i + 1] || '未知';
                const subTitle = lines[i + 2] || '';
                const rawTitle = lines[i + 3] || '';
                const finalTitle = (rawTitle === '动态' || !rawTitle) ? subTitle : rawTitle;
                const fp = `${activeDate}|${time}|${subTitle}|${finalTitle}`.replace(/\s+/g, '');
                if (existing.has(fp)) {
                    i += 3;
                    continue;
                }

                let category = '其他';
                const categorySource = subTitle + finalTitle;
                if (categorySource.includes('贝拉')) category = '贝拉';
                else if (categorySource.includes('嘉然')) category = '嘉然';
                else if (categorySource.includes('乃琳')) category = '乃琳';
                else if (categorySource.includes('思诺')) category = '思诺';
                else if (categorySource.includes('心宜')) category = '心宜';
                else if (categorySource.includes('A-SOUL')) category = 'A-SOUL';
                else if (categorySource.includes('有点宜思') || categorySource.includes('心宜思诺') || categorySource.includes('小心思')) category = '小心思';

                const id = `parse-${activeDate}-${time}-${Math.random().toString(36).substr(2, 4)}`.replace(/\s+/g, '');
                newSchedules.push({ id, date: activeDate, time, type, subTitle, title: finalTitle, category, completed: false, note: '' });
                existing.add(fp);
                i += 3;
            }
        }

        if (newSchedules.length > 0) {
            setSchedules(prev => [...prev, ...newSchedules]);
            alert(`成功导入 ${newSchedules.length} 项新日程。`);
            setInputText('');
            setView('calendar');
        } else if (text.trim()) {
            alert('未发现新日程。');
        }
    };

    return {
        toggleComplete,
        toggleFavorite,
        saveNote,
        handleBilibiliSearch,
        handleManualAdd,
        parseText
    };
}
