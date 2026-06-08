import { useState, useMemo, useEffect } from 'react';
import './App.css';
import { getSupabaseConfig, saveSupabaseConfig } from './supabaseClient';
import { getSyncId, saveSyncId, getTimeUntilNextSync } from './supabaseSync';
import Icon from './components/Icon';
import FirstTimeNotice from './FirstTimeNotice';
import NetworkStatus from './components/NetworkStatus';
import LinksView from './components/LinksView';
import ChangelogNotification from './components/ChangelogNotification';
import { markChangelogAsRead } from './changelogUtils';
import {
    ICS_CONFIG_KEY,
    GIST_ID_KEY,
    CUSTOM_COLORS_KEY,
    LINKS_KEY,
    ANIME_VIEW_KEY,
    DISPLAY_MODE_KEY,
    SPECIAL_GROUP_COLOR_KEY,
    SHOW_SEARCH_BTN_KEY,
    SHOW_DYNAMIC_BTN_KEY,
    MOBILE_OPTIMIZE_KEY,
    SEARCH_PAGE_SIZE_KEY
} from './constants';
import { formatDateString, toZeroDate } from './utils';
import { getInitialLinks } from './data/defaultLinks';

// Hooks
import { useSchedules } from './hooks/useSchedules';
import { useAutoSync } from './hooks/useAutoSync';
import { useUrlParamLink } from './hooks/useUrlParamLink';
import { useTheme } from './hooks/useTheme';
import { useScheduleCommands } from './hooks/useScheduleCommands';
import { useDataImport } from './hooks/useDataImport';
import { useCloudSyncActions } from './hooks/useCloudSyncActions';
import { loadGistToken, saveGistToken } from './services/credentialStorage';

// Views
import CalendarView from './views/CalendarView';
import AnimeView from './views/AnimeView';
import SearchView from './views/SearchView';
import SettingsView from './views/SettingsView';

// Components
import AppHeader from './AppHeader';
import Pet from './pet/Pet';
import { getQuoteConfig, saveQuoteConfig, DEFAULT_QUOTE_CONFIG } from './pet/quotes';
import NoteModal from './components/modals/NoteModal';
import AddScheduleModal from './components/modals/AddScheduleModal';
import ExternalLinkModal from './components/modals/ExternalLinkModal';
import SetLinkCandidateModal from './components/modals/SetLinkCandidateModal';

// ── 计算当前周的七天 ─────────────────────────────────────────────────────────
function getWeekDays(currentDate) {
    const ref = toZeroDate(currentDate);
    const day = ref.getDay();
    const diffToMonday = day === 0 ? 6 : day - 1;
    const monday = new Date(ref);
    monday.setDate(ref.getDate() - diffToMonday);
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return formatDateString(d);
    });
}

function App() {
    // ── 基础状态 ────────────────────────────────────────────────────────────
    const [currentDate, setCurrentDate] = useState(() => toZeroDate());
    const [view, setView] = useState(() => localStorage.getItem(ANIME_VIEW_KEY) || 'calendar');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSyncing, setIsSyncing] = useState(false);
    const [showSyncMenu, setShowSyncMenu] = useState(false);

    // ── 主题 ────────────────────────────────────────────────────────────────
    const { themeMode, toggleTheme } = useTheme();

    // ── 日程数据 ────────────────────────────────────────────────────────────
    const {
        schedules,
        setSchedules,
        isLoadingBase,
        fetchError,
        setFetchError,
        handleUpdateBaseSchedules
    } = useSchedules();

    // ── 外观设置 ────────────────────────────────────────────────────────────
    const [displayMode, setDisplayMode] = useState(() => localStorage.getItem(DISPLAY_MODE_KEY) || 'multi-color');
    const [useSpecialGroupColor, setUseSpecialGroupColor] = useState(
        () => localStorage.getItem(SPECIAL_GROUP_COLOR_KEY) !== 'false'
    );
    const [customColors, setCustomColors] = useState(() => {
        const saved = localStorage.getItem(CUSTOM_COLORS_KEY);
        return saved ? JSON.parse(saved) : {};
    });
    const [showSearchBtn, setShowSearchBtn] = useState(() => localStorage.getItem(SHOW_SEARCH_BTN_KEY) !== 'false');
    const [showDynamicBtn, setShowDynamicBtn] = useState(() => localStorage.getItem(SHOW_DYNAMIC_BTN_KEY) !== 'false');
    const [mobileOptimize, setMobileOptimize] = useState(() => localStorage.getItem(MOBILE_OPTIMIZE_KEY) !== 'false');
    const [petEnabled, setPetEnabled] = useState(() => localStorage.getItem('pet_enabled') !== 'false');
    const [quoteConfig, setQuoteConfig] = useState(() => getQuoteConfig());
    const [searchPageSize, setSearchPageSize] = useState(() => {
        const saved = localStorage.getItem(SEARCH_PAGE_SIZE_KEY);
        return saved ? parseInt(saved, 10) : 10;
    });
    const [searchCurrentPage, setSearchCurrentPage] = useState(1);

    // ── 链接 ────────────────────────────────────────────────────────────────
    const [links, setLinks] = useState(() => getInitialLinks());

    // ── ICS ─────────────────────────────────────────────────────────────────
    const [icsUrls, setIcsUrls] = useState(() => {
        const saved = localStorage.getItem(ICS_CONFIG_KEY);
        return saved ? JSON.parse(saved) : '';
    });

    // ── Gist 同步 ────────────────────────────────────────────────────────────
    const [gistToken, setGistToken] = useState(() => loadGistToken());
    const [gistId, setGistId] = useState(() => localStorage.getItem(GIST_ID_KEY) || '');
    const [isGistSyncing, setIsGistSyncing] = useState(false);

    // ── Supabase 同步 ────────────────────────────────────────────────────────
    const [supabaseUrl, setSupabaseUrl] = useState(() => {
        const config = getSupabaseConfig();
        return config.isCustom ? config.url : '';
    });
    const [supabaseKey, setSupabaseKey] = useState(() => {
        const config = getSupabaseConfig();
        return config.isCustom ? config.key : '';
    });
    const [syncId, setSyncId] = useState(() => getSyncId() || '');
    const [isSupabaseSyncing, setIsSupabaseSyncing] = useState(false);
    const [syncCooldown, setSyncCooldown] = useState(0);
    const [showCustomConfig, setShowCustomConfig] = useState(() => {
        const config = getSupabaseConfig();
        return config.isCustom;
    });

    // ── 自动同步 ─────────────────────────────────────────────────────────────
    const { gistAutoSync, setGistAutoSync, supabaseAutoSync, setSupabaseAutoSync, showAutoSyncToast, autoSyncToastMessage } =
        useAutoSync({ schedules, isLoadingBase, gistToken, gistId, setGistId, supabaseUrl, supabaseKey, syncId });

    // ── URL 参数设置链接 ─────────────────────────────────────────────────────
    const { setLinkCandidateModal, setSetLinkCandidateModal, applyScheduleLink } =
        useUrlParamLink({ schedules, isLoadingBase, setSchedules, setCurrentDate, setView });

    // ── 备注弹窗 ─────────────────────────────────────────────────────────────
    const [editingNoteId, setEditingNoteId] = useState(null);
    const [tempNote, setTempNote] = useState('');
    const [tempLink, setTempLink] = useState('');

    // ── 新增日程弹窗 ─────────────────────────────────────────────────────────
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newSchedule, setNewSchedule] = useState({
        date: formatDateString(new Date()),
        time: '20:00',
        type: '直播',
        subTitle: '',
        title: '',
        category: '嘉然',
        isAnime: false,
        link: '',
        isFavorite: false
    });

    // ── 外部链接确认弹窗 ─────────────────────────────────────────────────────
    const [externalLinkModal, setExternalLinkModal] = useState({ isOpen: false, url: '' });

    // ── 文本解析（隐藏功能） ─────────────────────────────────────────────────
    const [inputText, setInputText] = useState('');

    // ── 副作用：持久化 ────────────────────────────────────────────────────────
    useEffect(() => { localStorage.setItem(ICS_CONFIG_KEY, JSON.stringify(icsUrls)); }, [icsUrls]);
    useEffect(() => { saveGistToken(gistToken); }, [gistToken]);
    useEffect(() => { if (gistId) localStorage.setItem(GIST_ID_KEY, gistId); else localStorage.removeItem(GIST_ID_KEY); }, [gistId]);
    useEffect(() => { localStorage.setItem(CUSTOM_COLORS_KEY, JSON.stringify(customColors)); setSchedules(prev => [...prev]); }, [customColors, setSchedules]);
    useEffect(() => { setSchedules(prev => [...prev]); }, [useSpecialGroupColor, setSchedules]);
    useEffect(() => { localStorage.setItem(LINKS_KEY, JSON.stringify(links)); }, [links]);
    useEffect(() => { if (showCustomConfig && supabaseUrl && supabaseKey) { saveSupabaseConfig(supabaseUrl, supabaseKey); } else if (!showCustomConfig) { saveSupabaseConfig('', ''); } }, [supabaseUrl, supabaseKey, showCustomConfig]);
    useEffect(() => { if (syncId) saveSyncId(syncId); }, [syncId]);
    useEffect(() => { localStorage.setItem(ANIME_VIEW_KEY, view); }, [view]);
    useEffect(() => { localStorage.setItem(SEARCH_PAGE_SIZE_KEY, searchPageSize.toString()); }, [searchPageSize]);
    useEffect(() => { saveQuoteConfig(quoteConfig); }, [quoteConfig]);

    // 同步冷却倒计时
    useEffect(() => {
        const updateCooldown = () => setSyncCooldown(getTimeUntilNextSync());
        updateCooldown();
        const interval = setInterval(updateCooldown, 1000);
        return () => clearInterval(interval);
    }, []);

    // 点击外部关闭同步菜单
    useEffect(() => {
        const handler = () => { if (showSyncMenu) setShowSyncMenu(false); };
        document.addEventListener('click', handler);
        return () => document.removeEventListener('click', handler);
    }, [showSyncMenu]);

    // ── Memos ────────────────────────────────────────────────────────────────
    const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);

    const filteredSchedules = useMemo(() => {
        if (!searchQuery.trim()) return [];
        const keywords = searchQuery.toLowerCase().split(/\s+/).filter(k => k.length > 0);
        return schedules.filter(s => {
            const text = [s.title, s.subTitle, s.category, s.type, s.note || '', s.date].join(' ').toLowerCase();
            return keywords.every(kw => text.includes(kw));
        }).sort((a, b) => new Date(b.date.replace(/\//g, '-')) - new Date(a.date.replace(/\//g, '-')));
    }, [schedules, searchQuery]);

    // ── 操作函数 ─────────────────────────────────────────────────────────────
    const {
        toggleComplete,
        toggleFavorite,
        saveNote,
        handleBilibiliSearch,
        handleManualAdd,
        parseText
    } = useScheduleCommands({
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
    });

    const {
        handleSyncIcs,
        handleImportJSON,
        handleImportICSFile
    } = useDataImport({ schedules, setSchedules, icsUrls, setIsSyncing, setView });

    const {
        handleSyncToGist,
        handleLoadFromGist,
        handleReplaceFromGist,
        handleUploadToSupabase,
        handleDownloadFromSupabase
    } = useCloudSyncActions({
        schedules,
        setSchedules,
        gistToken,
        gistId,
        setGistId,
        setIsGistSyncing,
        syncId,
        setIsSupabaseSyncing,
        setSyncCooldown
    });

    // ── 公共 ScheduleCard props ───────────────────────────────────────────────
    const scheduleCardProps = {
        toggleComplete, toggleFavorite, handleBilibiliSearch,
        setEditingNoteId, setTempNote, setTempLink,
        setSchedules,
        showSearchBtn, showDynamicBtn, mobileOptimize
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <>
            <FirstTimeNotice />
            <NetworkStatus />
            <Pet isEnabled={petEnabled} onToggleEnabled={setPetEnabled} quoteConfig={quoteConfig} />

            {/* 基础日程库拉取失败提示 */}
            {fetchError && (
                <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg bg-red-500 text-white flex items-center gap-3">
                    <span>日程库拉取失败，请检查网络连接</span>
                    <button onClick={() => setFetchError(false)} className="text-white/80 hover:text-white text-lg leading-none">×</button>
                </div>
            )}

            {/* 自动同步 Toast */}
            {showAutoSyncToast && (
                <div className="fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg bg-green-500 text-white flex items-center gap-3 animate-pulse">
                    <Icon name="check-circle-2" className="w-5 h-5" />
                    <span>{autoSyncToastMessage}</span>
                </div>
            )}

            <div className="flex flex-col h-screen transition-colors duration-300 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
                {/* 顶部导航 */}
                <AppHeader
                    view={view}
                    setView={setView}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    setSearchCurrentPage={setSearchCurrentPage}
                    themeMode={themeMode}
                    toggleTheme={toggleTheme}
                />

                {/* 主内容区 */}
                <main className="flex-1 overflow-hidden relative pb-10">
                    {view === 'calendar' && (
                        <CalendarView
                            weekDays={weekDays}
                            schedules={schedules}
                            isLoadingBase={isLoadingBase}
                            isSyncing={isSyncing}
                            currentDate={currentDate}
                            setCurrentDate={setCurrentDate}
                            setView={setView}
                            setIsAddModalOpen={setIsAddModalOpen}
                            setNewSchedule={setNewSchedule}
                            handleUpdateBaseSchedules={handleUpdateBaseSchedules}
                            handleSyncIcs={handleSyncIcs}
                            showSyncMenu={showSyncMenu}
                            setShowSyncMenu={setShowSyncMenu}
                            gistToken={gistToken}
                            syncId={syncId}
                            handleSyncToGist={handleSyncToGist}
                            handleUploadToSupabase={handleUploadToSupabase}
                            isGistSyncing={isGistSyncing}
                            {...scheduleCardProps}
                        />
                    )}

                    {view === 'anime' && (
                        <AnimeView
                            schedules={schedules}
                            setIsAddModalOpen={setIsAddModalOpen}
                            setNewSchedule={setNewSchedule}
                            {...scheduleCardProps}
                        />
                    )}

                    {view === 'links' && (
                        <LinksView links={links} setLinks={setLinks} mobileOptimize={mobileOptimize} />
                    )}

                    {view === 'search' && (
                        <SearchView
                            filteredSchedules={filteredSchedules}
                            searchPageSize={searchPageSize}
                            setSearchPageSize={setSearchPageSize}
                            searchCurrentPage={searchCurrentPage}
                            setSearchCurrentPage={setSearchCurrentPage}
                            {...scheduleCardProps}
                        />
                    )}

                    {view === 'changelog' && (
                        <SettingsView view="changelog" setView={setView} schedules={schedules} setSchedules={setSchedules} />
                    )}

                    {view === 'settings' && (
                        <SettingsView
                            view={view}
                            setView={setView}
                            schedules={schedules}
                            setSchedules={setSchedules}
                            displayMode={displayMode} setDisplayMode={setDisplayMode}
                            useSpecialGroupColor={useSpecialGroupColor} setUseSpecialGroupColor={setUseSpecialGroupColor}
                            showSearchBtn={showSearchBtn} setShowSearchBtn={setShowSearchBtn}
                            showDynamicBtn={showDynamicBtn} setShowDynamicBtn={setShowDynamicBtn}
                            mobileOptimize={mobileOptimize} setMobileOptimize={setMobileOptimize}
                            customColors={customColors} setCustomColors={setCustomColors}
                            isLoadingBase={isLoadingBase} handleUpdateBaseSchedules={handleUpdateBaseSchedules}
                            gistToken={gistToken} setGistToken={setGistToken}
                            gistId={gistId} setGistId={setGistId}
                            gistAutoSync={gistAutoSync} setGistAutoSync={setGistAutoSync}
                            isGistSyncing={isGistSyncing}
                            handleSyncToGist={handleSyncToGist}
                            handleLoadFromGist={handleLoadFromGist}
                            handleReplaceFromGist={handleReplaceFromGist}
                            syncId={syncId} setSyncId={setSyncId}
                            syncCooldown={syncCooldown}
                            isSupabaseSyncing={isSupabaseSyncing}
                            supabaseAutoSync={supabaseAutoSync} setSupabaseAutoSync={setSupabaseAutoSync}
                            showCustomConfig={showCustomConfig} setShowCustomConfig={setShowCustomConfig}
                            supabaseUrl={supabaseUrl} setSupabaseUrl={setSupabaseUrl}
                            supabaseKey={supabaseKey} setSupabaseKey={setSupabaseKey}
                            handleUploadToSupabase={handleUploadToSupabase}
                            handleDownloadFromSupabase={handleDownloadFromSupabase}
                            handleImportJSON={handleImportJSON}
                            handleImportICSFile={handleImportICSFile}
                            handleSyncIcs={handleSyncIcs}
                            isSyncing={isSyncing}
                            icsUrls={icsUrls} setIcsUrls={setIcsUrls}
                            inputText={inputText} setInputText={setInputText}
                            parseText={parseText}
                            petEnabled={petEnabled} setPetEnabled={setPetEnabled}
                            quoteConfig={quoteConfig} setQuoteConfig={setQuoteConfig}
                        />
                    )}
                </main>

                {/* 弹窗层 */}
                <NoteModal
                    editingNoteId={editingNoteId}
                    tempNote={tempNote} setTempNote={setTempNote}
                    tempLink={tempLink} setTempLink={setTempLink}
                    onSave={saveNote}
                    onClose={() => setEditingNoteId(null)}
                />

                <AddScheduleModal
                    isOpen={isAddModalOpen}
                    newSchedule={newSchedule}
                    setNewSchedule={setNewSchedule}
                    onAdd={handleManualAdd}
                    onClose={() => setIsAddModalOpen(false)}
                />

                <ExternalLinkModal
                    modal={externalLinkModal}
                    onClose={() => setExternalLinkModal({ isOpen: false, url: '' })}
                />

                <SetLinkCandidateModal
                    modal={setLinkCandidateModal}
                    onSelect={(s, link) => { applyScheduleLink(s, link); setSetLinkCandidateModal({ isOpen: false, candidates: [], pendingLink: '' }); }}
                    onClose={() => setSetLinkCandidateModal({ isOpen: false, candidates: [], pendingLink: '' })}
                />

                {/* 页脚 */}
                <footer className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-t dark:border-slate-800 py-2 px-4 z-10">
                    <div className="max-w-6xl mx-auto flex justify-center items-center">
                        <span className="text-xs text-slate-600 dark:text-slate-400">
                            <a href="https://github.com/Evelynall/ASoul-Calendar" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline ml-1">项目Github</a>
                            &nbsp;&nbsp;
                            <a href="https://greasyfork.org/zh-CN/scripts/577237-%E6%9E%9D%E6%B1%9F%E8%BF%BD%E7%95%AA%E8%A1%A8%E8%BF%9B%E5%BA%A6%E4%BF%9D%E5%AD%98%E8%84%9A%E6%9C%AC" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline ml-1">进度保存脚本</a>
                            &nbsp;&nbsp; 所有日程数据均来自枝江站(asoul.love)，感谢
                            <a href="https://asoul.love/" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline ml-1">枝江站</a>
                            &nbsp;的分享与许可！&nbsp;
                            <a onClick={(e) => { e.preventDefault(); markChangelogAsRead(); setView('changelog'); }} className="text-blue-600 dark:text-blue-400 hover:underline ml-1" href="#">查看更新日志</a>
                        </span>
                    </div>
                </footer>

                {/* 重大更新通知 */}
                <ChangelogNotification onOpenChangelog={() => { markChangelogAsRead(); setView('changelog'); }} />
            </div>
        </>
    );
}

export default App;
