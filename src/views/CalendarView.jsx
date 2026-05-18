import Icon from '../components/Icon';
import ScheduleCard from '../components/ScheduleCard';
import { formatDateString, toZeroDate } from '../utils';
import { extractUserDataFromSchedules } from '../hooks/useSchedules';

const DAY_NAMES = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

/**
 * 日历视图（周视图 + 顶部工具栏）
 */
export default function CalendarView({
    weekDays,
    schedules,
    isLoadingBase,
    isSyncing,
    currentDate,
    setCurrentDate,
    setView,
    setIsAddModalOpen,
    setNewSchedule,
    handleUpdateBaseSchedules,
    handleSyncIcs,
    showSyncMenu,
    setShowSyncMenu,
    gistToken,
    syncId,
    handleSyncToGist,
    handleUploadToSupabase,
    isGistSyncing,
    // ScheduleCard props
    toggleComplete,
    toggleFavorite,
    handleBilibiliSearch,
    setEditingNoteId,
    setTempNote,
    setTempLink,
    setSchedules,
    setExternalLinkModal,
    showSearchBtn,
    showDynamicBtn,
    mobileOptimize
}) {
    const jumpToDate = (dateStr) => {
        setCurrentDate(toZeroDate(dateStr));
        setView('calendar');
    };

    return (
        <div className="h-full flex flex-col p-3 md:p-6 space-y-4">
            {/* 工具栏 */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2 md:gap-4">
                    <h2 className="text-sm md:text-lg font-bold min-w-[140px]">
                        {weekDays[0]} - {weekDays[6]}
                    </h2>
                    <div className="flex border rounded-lg shadow-sm overflow-hidden dark:border-slate-700 bg-white dark:bg-slate-800">
                        <button
                            onClick={() => setCurrentDate(prev => {
                                const d = new Date(prev); d.setDate(d.getDate() - 7); return d;
                            })}
                            className="p-1.5 md:p-2 border-r dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
                        >
                            <Icon name="chevron-left" />
                        </button>
                        <button
                            onClick={() => setCurrentDate(toZeroDate())}
                            className="px-3 py-1 text-xs md:text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
                        >
                            本周
                        </button>
                        <div className="date-input-wrapper border-l dark:border-slate-700 px-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400">
                            <Icon name="calendar-days" className="w-4 h-4" />
                            <input
                                type="date"
                                className="invisible-date-input"
                                onChange={e => { if (e.target.value) jumpToDate(e.target.value); }}
                            />
                        </div>
                        <button
                            onClick={() => setCurrentDate(prev => {
                                const d = new Date(prev); d.setDate(d.getDate() + 7); return d;
                            })}
                            className="p-1.5 md:p-2 border-l dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
                        >
                            <Icon name="chevron-right" />
                        </button>
                    </div>
                </div>

                <div className="flex gap-2">
                    {/* ICS 同步按钮（目前已隐藏） */}
                    <button
                        onClick={handleSyncIcs}
                        disabled={isSyncing}
                        className="hidden flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs md:text-sm font-bold shadow-md transition-all shrink-0"
                    >
                        <Icon name="refresh" className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">{isSyncing ? '同步中...' : '同步日历订阅'}</span>
                    </button>

                    {/* 添加日历日程 */}
                    <button
                        onClick={() => {
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
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs md:text-sm font-bold shadow-md hover:bg-blue-700 transition-all shrink-0"
                    >
                        <Icon name="plus" className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">添加日历日程</span>
                    </button>

                    {/* 更新基础日程库 */}
                    <button
                        onClick={handleUpdateBaseSchedules}
                        disabled={isLoadingBase}
                        className={`flex items-center gap-1.5 px-3 py-1.5 ${isLoadingBase ? 'bg-slate-400' : 'bg-indigo-600 hover:bg-indigo-700'} text-white rounded-lg text-xs md:text-sm font-bold shadow-md transition-all shrink-0`}
                    >
                        <Icon name="refresh" className={`w-3.5 h-3.5 ${isLoadingBase ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">{isLoadingBase ? '更新中...' : '更新基础日程库'}</span>
                    </button>

                    {/* 数据同步下拉菜单 */}
                    <div className="relative" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setShowSyncMenu(!showSyncMenu)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs md:text-sm font-bold shadow-md hover:bg-emerald-700 transition-all shrink-0"
                        >
                            <Icon name="upload" className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">数据同步</span>
                        </button>

                        {showSyncMenu && (
                            <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-lg border dark:border-slate-700 py-1 z-50">
                                {/* 导出本地备份 */}
                                <button
                                    onClick={() => {
                                        setShowSyncMenu(false);
                                        const userData = extractUserDataFromSchedules(schedules);
                                        const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
                                        const a = document.createElement('a');
                                        a.href = URL.createObjectURL(blob);
                                        a.download = `user-data-${new Date().toISOString().replace(/[\-:T.]/g, '').slice(0, 14)}.json`;
                                        a.click();
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                                >
                                    <Icon name="download" className="w-4 h-4 text-emerald-500" />
                                    导出本地备份
                                </button>

                                <div className="border-t dark:border-slate-700 my-1" />

                                {/* Gist 上传 */}
                                <button
                                    onClick={() => {
                                        setShowSyncMenu(false);
                                        if (!gistToken) {
                                            alert('请先在设置中配置 GitHub Token');
                                            setView('settings');
                                            return;
                                        }
                                        handleSyncToGist();
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                                >
                                    <Icon name="upload" className="w-4 h-4 text-purple-500" />
                                    上传到 Gist
                                </button>

                                {/* Supabase 上传 */}
                                <button
                                    onClick={() => {
                                        setShowSyncMenu(false);
                                        if (!syncId) {
                                            alert('请先在设置中配置同步 ID');
                                            setView('settings');
                                            return;
                                        }
                                        handleUploadToSupabase();
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                                >
                                    <Icon name="upload" className="w-4 h-4 text-green-500" />
                                    上传到云端
                                </button>

                                <div className="border-t dark:border-slate-700 my-1" />

                                <button
                                    onClick={() => { setShowSyncMenu(false); setView('settings'); }}
                                    className="w-full px-4 py-2 text-left text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                                >
                                    <Icon name="settings" className="w-4 h-4" />
                                    更多同步设置...
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 周视图网格 */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-7 gap-4 min-w-max md:min-w-0">
                    {weekDays.map((dayStr, idx) => {
                        const daySchedules = schedules
                            .filter(s => s.date === dayStr)
                            .sort((a, b) => a.time.localeCompare(b.time));
                        const isToday = formatDateString(new Date()) === dayStr;
                        return (
                            <div key={dayStr} className="flex flex-col min-w-[280px] md:min-w-0 h-full overflow-hidden">
                                <div className={`flex items-baseline gap-2 pb-2 px-1 shrink-0 ${isToday ? 'text-blue-500' : 'text-slate-500 dark:text-slate-400'}`}>
                                    <span className="text-sm md:text-base font-bold">{DAY_NAMES[idx]}</span>
                                    <span className="text-[10px] md:text-xs opacity-70">{dayStr.split('/').slice(1).join('/')}</span>
                                    {isToday && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />}
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
                                            showSearchBtn={showSearchBtn}
                                            showDynamicBtn={showDynamicBtn}
                                            mobileOptimize={mobileOptimize}
                                        />
                                    )) : (
                                        <div className="h-24 flex items-center justify-center italic text-[10px] text-slate-300 dark:text-slate-800 border-2 border-dashed border-slate-50 dark:border-slate-900 rounded-xl">
                                            暂无
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
