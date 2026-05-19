import { useMemo } from 'react';
import Icon from '../components/Icon';
import ScheduleCard from '../components/ScheduleCard';

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
    mobileOptimize,
    searchPageSize,
    setSearchPageSize,
    searchCurrentPage,
    setSearchCurrentPage
}) {
    const totalPages = Math.ceil(filteredSchedules.length / searchPageSize);
    
    const paginatedSchedules = useMemo(() => {
        const start = (searchCurrentPage - 1) * searchPageSize;
        const end = start + searchPageSize;
        return filteredSchedules.slice(start, end);
    }, [filteredSchedules, searchCurrentPage, searchPageSize]);

    const handlePageSizeChange = (e) => {
        const newSize = parseInt(e.target.value, 10);
        setSearchPageSize(newSize);
        setSearchCurrentPage(1);
    };

    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) {
            setSearchCurrentPage(page);
        }
    };

    const pageSizeOptions = [5, 10, 20, 50];

    return (
        <div className="h-full max-w-3xl mx-auto p-4 md:p-8 flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Icon name="search" className="w-5 h-5" />
                搜索结果 ({filteredSchedules.length})
            </h3>
            
            {filteredSchedules.length > 0 && (
                <div className="flex flex-wrap items-center gap-3 mb-4 text-sm">
                    <div className="flex items-center gap-2">
                        <span className="text-slate-600 dark:text-slate-400">每页</span>
                        <select
                            value={searchPageSize}
                            onChange={handlePageSizeChange}
                            className="px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {pageSizeOptions.map(size => (
                                <option key={size} value={size}>{size}条</option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="flex items-center gap-1 ml-auto">
                        <button
                            onClick={() => goToPage(1)}
                            disabled={searchCurrentPage === 1}
                            className="px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700"
                            title="首页"
                        >
                            <Icon name="chevrons-left" className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => goToPage(searchCurrentPage - 1)}
                            disabled={searchCurrentPage === 1}
                            className="px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700"
                            title="上一页"
                        >
                            <Icon name="chevron-left" className="w-4 h-4" />
                        </button>
                        
                        <span className="px-3 py-1 text-slate-600 dark:text-slate-400">
                            {searchCurrentPage} / {totalPages}
                        </span>
                        
                        <button
                            onClick={() => goToPage(searchCurrentPage + 1)}
                            disabled={searchCurrentPage === totalPages}
                            className="px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700"
                            title="下一页"
                        >
                            <Icon name="chevron-right" className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => goToPage(totalPages)}
                            disabled={searchCurrentPage === totalPages}
                            className="px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700"
                            title="末页"
                        >
                            <Icon name="chevrons-right" className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
            
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                    {paginatedSchedules.map(item => (
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
