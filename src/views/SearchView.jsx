import Icon from '../components/Icon';
import ScheduleCard from '../components/ScheduleCard';

/**
 * 搜索结果视图
 */
export default function SearchView({
    filteredSchedules,
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
    return (
        <div className="h-full max-w-3xl mx-auto p-4 md:p-8 flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Icon name="search" className="w-5 h-5" />
                搜索结果 ({filteredSchedules.length})
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
                            showSearchBtn={showSearchBtn}
                            showDynamicBtn={showDynamicBtn}
                            mobileOptimize={mobileOptimize}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
