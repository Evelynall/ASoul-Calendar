import Icon from './components/Icon';

/**
 * 顶部导航栏
 */
export default function AppHeader({
    view,
    setView,
    searchQuery,
    setSearchQuery,
    setSearchCurrentPage,
    themeMode,
    toggleTheme
}) {
    return (
        <header className="border-b px-4 md:px-6 py-3 flex items-center justify-between shadow-sm shrink-0 bg-white dark:bg-slate-900 dark:border-slate-800 gap-4 text-slate-900 dark:text-slate-100">
            {/* Logo */}
            <div className="flex items-center gap-3 shrink-0">
                <Icon name="calendar" className="text-blue-500 w-5 h-5 md:w-6 md:h-6" />
                <h1 className="hidden md:block text-lg md:text-xl font-bold tracking-tight">枝江追番表</h1>
            </div>

            {/* 视图切换 */}
            <div className="flex gap-1">
                <button
                    onClick={() => setView('calendar')}
                    className={`px-2 sm:px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${view === 'calendar' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                    <Icon name="grid" className="w-4 h-4 shrink-0" />
                    <span className="hidden sm:inline">日历视图</span>
                </button>
                <button
                    onClick={() => setView('anime')}
                    className={`px-2 sm:px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${view === 'anime' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                    <Icon name="tv" className="w-4 h-4 shrink-0" />
                    <span className="hidden sm:inline">追番表</span>
                </button>
                <button
                    onClick={() => setView('links')}
                    className={`px-2 sm:px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${view === 'links' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                    <Icon name="layout-grid" className="w-4 h-4 shrink-0" />
                    <span className="hidden sm:inline">快捷链接</span>
                </button>
            </div>

            {/* 搜索框 */}
            <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Icon name="search" className="w-4 h-4" />
                </div>
                <input
                    type="text"
                    placeholder="搜索日程、成员、备注..."
                    className="w-full pl-10 pr-4 py-1.5 md:py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-full text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                    value={searchQuery}
                    onChange={e => {
                        setSearchQuery(e.target.value);
                        setSearchCurrentPage(1);
                        if (e.target.value.trim()) setView('search');
                        else if (view === 'search') setView('calendar');
                    }}
                />
            </div>

            {/* 右侧操作 */}
            <div className="flex items-center gap-2 shrink-0">
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400"
                >
                    {themeMode === 'dark' ? <Icon name="sun" /> : <Icon name="moon" />}
                </button>
                <button
                    onClick={() => setView(view === 'settings' ? 'calendar' : 'settings')}
                    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400"
                >
                    {view === 'settings' ? <Icon name="x" /> : <Icon name="settings" />}
                </button>
            </div>
        </header>
    );
}
