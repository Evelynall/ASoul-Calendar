import Icon from '../components/Icon';
import ScheduleCard from '../components/ScheduleCard';

/**
 * 追番表视图
 */
export default function AnimeView({
    schedules,
    setIsAddModalOpen,
    setNewSchedule,
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
    const animeSchedules = schedules
        .filter(item => item.isAnime || item.isFavorite)
        .sort((a, b) => new Date(b.date.replace(/\//g, '-')) - new Date(a.date.replace(/\//g, '-')));

    const openAddAnime = () => {
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
    };

    return (
        <div className="h-full max-w-3xl mx-auto p-4 md:p-8 flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Icon name="calendar-days" className="w-5 h-5 text-orange-500" />
                追番表 ({animeSchedules.length})
            </h3>
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                    {animeSchedules.map(item => (
                        <ScheduleCard
                            key={item.id}
                            item={item}
                            showDate={false}
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
                    ))}

                    {animeSchedules.length === 0 && (
                        <div className="col-span-2 flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-600">
                            <Icon name="calendar-days" className="w-16 h-16 mb-4" />
                            <p className="text-lg font-bold mb-2">追番表为空</p>
                            <p className="text-sm text-center max-w-md">点击下方按钮添加追番日程</p>
                            <button
                                onClick={openAddAnime}
                                className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-600 transition-all"
                            >
                                添加追番日程
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
