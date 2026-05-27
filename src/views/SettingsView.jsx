import { useRef } from 'react';
import Icon from '../components/Icon';
import SettingsSection from '../components/SettingsSection';
import ChangelogView from '../components/ChangelogView';
import { deleteDatabase } from '../indexedDBStorage';
import { isUsingDefaultConfig } from '../supabaseClient';
import { extractUserDataFromSchedules } from '../hooks/useSchedules';
import {
    DEFAULT_MEMBER_CONFIG,
    BASE_SCHEDULES_VERSION_KEY,
    BASE_SCHEDULES_LAST_FETCH_KEY,
    USER_DATA_KEY,
    BASE_SCHEDULES_KEY,
    DISPLAY_MODE_KEY,
    SPECIAL_GROUP_COLOR_KEY,
    SHOW_SEARCH_BTN_KEY,
    SHOW_DYNAMIC_BTN_KEY,
    MOBILE_OPTIMIZE_KEY
} from '../constants';

/**
 * 设置页面
 */
export default function SettingsView({
    view,
    setView,
    schedules,
    setSchedules,
    // 外观
    displayMode,
    setDisplayMode,
    useSpecialGroupColor,
    setUseSpecialGroupColor,
    showSearchBtn,
    setShowSearchBtn,
    showDynamicBtn,
    setShowDynamicBtn,
    mobileOptimize,
    setMobileOptimize,
    customColors,
    setCustomColors,
    // 基础日程库
    isLoadingBase,
    handleUpdateBaseSchedules,
    // Gist 同步
    gistToken,
    setGistToken,
    gistId,
    setGistId,
    gistAutoSync,
    setGistAutoSync,
    isGistSyncing,
    handleSyncToGist,
    handleLoadFromGist,
    handleReplaceFromGist,
    // Supabase 同步
    syncId,
    setSyncId,
    syncCooldown,
    isSupabaseSyncing,
    supabaseAutoSync,
    setSupabaseAutoSync,
    showCustomConfig,
    setShowCustomConfig,
    supabaseUrl,
    setSupabaseUrl,
    supabaseKey,
    setSupabaseKey,
    handleUploadToSupabase,
    handleDownloadFromSupabase,
    // 导入导出
    handleImportJSON,
    handleImportICSFile,
    handleSyncIcs,
    isSyncing,
    icsUrls,
    setIcsUrls,
    inputText,
    setInputText,
    parseText,
    petEnabled,
    setPetEnabled
}) {
    const fileInputRef = useRef(null);

    if (view === 'changelog') {
        return (
            <div className="h-full overflow-y-auto custom-scrollbar p-4 md:p-8">
                <ChangelogView />
            </div>
        );
    }

    // 导出用户数据
    const exportUserData = () => {
        const userData = extractUserDataFromSchedules(schedules);
        const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `user-data-${new Date().toISOString().replace(/[\-:T.]/g, '').slice(0, 14)}.json`;
        a.click();
    };

    const exportUserCreated = () => {
        const list = schedules.filter(s => s.isUserCreated).map(s => ({ ...s }));
        if (list.length === 0) { alert('没有用户创建的日程可以导出'); return; }
        const blob = new Blob([JSON.stringify(list, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `user-created-schedules-${new Date().toISOString().replace(/[\-:T.]/g, '').slice(0, 14)}.json`;
        a.click();
    };

    const exportClean = () => {
        const cleaned = schedules.map(s => {
            const c = { ...s };
            delete c.completed;
            return c;
        });
        const blob = new Blob([JSON.stringify(cleaned, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `schedules-clean-${new Date().toISOString().replace(/[\-:T.]/g, '').slice(0, 14)}.json`;
        a.click();
    };

    const clearUserData = () => {
        if (confirm('确定清空所有用户数据？\n\n这将清除：\n- 所有完成状态\n- 所有备注\n- 所有用户创建的日程\n- 所有收藏\n\n基础日程库不会被删除。')) {
            localStorage.removeItem(USER_DATA_KEY);
            const baseSchedules = JSON.parse(localStorage.getItem(BASE_SCHEDULES_KEY) || '[]');
            setSchedules(baseSchedules.map(item => ({
                ...item,
                completed: false,
                note: '',
                link: item.link || '',
                isFavorite: false,
                isAnime: item.isAnime || false,
                isBaseSchedule: true
            })));
            alert('用户数据已清空');
        }
    };

    // 开关组件
    const Toggle = ({ value, onChange }) => (
        <button
            onClick={() => onChange(!value)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}
        >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
    );

    return (
        <div className="h-full max-w-2xl mx-auto p-4 md:p-8 overflow-y-auto custom-scrollbar space-y-6 text-slate-900 dark:text-slate-100">

            {/* ── 外观选项 ── */}
            <SettingsSection title="外观选项" icon="palette" iconColor="text-purple-500" description="自定义日程的显示样式和配色方案">
                <div className="space-y-4">
                    <div className="p-4 rounded-lg border dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-medium">显示模式</div>
                                <div className="text-xs text-slate-500">
                                    {displayMode === 'single' ? '多成员日程使用主要成员颜色' : '多成员日程用渐变色显示所有成员颜色'}
                                </div>
                            </div>
                            <select
                                className="px-3 py-2 border dark:border-slate-700 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 outline-none text-slate-900 dark:text-slate-100"
                                value={displayMode}
                                onChange={e => { setDisplayMode(e.target.value); localStorage.setItem(DISPLAY_MODE_KEY, e.target.value); }}
                            >
                                <option value="single">单一颜色模式</option>
                                <option value="multi-color">多色分割模式</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <div>
                            <div className="font-medium">组合色配置</div>
                            <div className="text-xs text-slate-500">
                                {useSpecialGroupColor ? '使用A-SOUL和小心思的专用组合色（仅在单一色模式下生效）' : '按照多成员组合逻辑显示'}
                            </div>
                        </div>
                        <Toggle value={useSpecialGroupColor} onChange={v => { setUseSpecialGroupColor(v); localStorage.setItem(SPECIAL_GROUP_COLOR_KEY, v.toString()); }} />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <div>
                            <div className="font-medium">显示搜索按钮</div>
                            <div className="text-xs text-slate-500">{showSearchBtn ? '在过期日程上显示B站搜索按钮' : '已隐藏'}</div>
                        </div>
                        <Toggle value={showSearchBtn} onChange={v => { setShowSearchBtn(v); localStorage.setItem(SHOW_SEARCH_BTN_KEY, v.toString()); }} />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <div>
                            <div className="font-medium">显示动态按钮</div>
                            <div className="text-xs text-slate-500">{showDynamicBtn ? '显示B站动态跳转按钮' : '已隐藏'}</div>
                        </div>
                        <Toggle value={showDynamicBtn} onChange={v => { setShowDynamicBtn(v); localStorage.setItem(SHOW_DYNAMIC_BTN_KEY, v.toString()); }} />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <div>
                            <div className="font-medium">手机端优化</div>
                            <div className="text-xs text-slate-500">
                                {mobileOptimize ? '触屏设备上直接显示日程按钮，B站链接使用App跳转' : '已关闭'}
                            </div>
                        </div>
                        <Toggle value={mobileOptimize} onChange={v => { setMobileOptimize(v); localStorage.setItem(MOBILE_OPTIMIZE_KEY, v.toString()); }} />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <div>
                            <div className="font-medium">显示桌宠</div>
                            <div className="text-xs text-slate-500">
                                {petEnabled ? '显示可爱的桌宠，右键可打开菜单' : '已隐藏'}
                            </div>
                        </div>
                        <Toggle value={petEnabled} onChange={v => { setPetEnabled(v); localStorage.setItem('pet_enabled', v.toString()); }} />
                    </div>

                    <div className="p-4 rounded-lg border dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                        <div className="flex items-center justify-between mb-3">
                            <div className="font-medium">自定义成员颜色</div>
                            <button
                                onClick={() => { if (confirm('确定要恢复所有成员的默认颜色吗？')) setCustomColors({}); }}
                                className="text-xs px-2 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded text-slate-700 dark:text-slate-300 transition-colors"
                            >
                                恢复默认
                            </button>
                        </div>
                        <div className="text-xs text-slate-500 mb-3">点击颜色块可以自定义每个成员的背景色(组合颜色暂未完工)</div>
                        <div className="grid grid-cols-2 gap-3">
                            {Object.keys(DEFAULT_MEMBER_CONFIG).map(member => {
                                const currentColor = customColors[member]?.color || DEFAULT_MEMBER_CONFIG[member].color;
                                return (
                                    <div key={member} className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={currentColor}
                                            onChange={e => setCustomColors(prev => ({ ...prev, [member]: { color: e.target.value, textColor: '#FFFFFF' } }))}
                                            className="w-10 h-10 rounded cursor-pointer border-2 border-slate-300 dark:border-slate-600"
                                            title={`选择${member}的颜色`}
                                        />
                                        <div className="flex-1">
                                            <div className="text-sm font-medium">{member}</div>
                                            <div className="text-xs text-slate-500 font-mono">{currentColor}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </SettingsSection>

            {/* ── 基础日程库 ── */}
            <SettingsSection title="基础日程库" icon="refresh" iconColor="text-blue-500" description="从 GitHub 同步基础日程库（约2k条日程）">
                <div className="space-y-4">
                    <div className="p-4 rounded-lg border dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                        <div className="text-sm space-y-2">
                            <div className="flex justify-between">
                                <span className="text-slate-600 dark:text-slate-400">基础日程数量：</span>
                                <span className="font-bold">{schedules.filter(s => s.isBaseSchedule).length} 条</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-600 dark:text-slate-400">用户日程数量：</span>
                                <span className="font-bold">{schedules.filter(s => s.isUserCreated).length} 条</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-600 dark:text-slate-400">缓存版本：</span>
                                <span className="font-mono text-xs">{localStorage.getItem(BASE_SCHEDULES_VERSION_KEY) || '未缓存'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-600 dark:text-slate-400">最后获取：</span>
                                <span className="font-mono text-xs">
                                    {(() => {
                                        const last = localStorage.getItem(BASE_SCHEDULES_LAST_FETCH_KEY);
                                        if (!last) return '未记录';
                                        return new Date(parseInt(last, 10)).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
                                    })()}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handleUpdateBaseSchedules}
                        disabled={isLoadingBase}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                    >
                        {isLoadingBase ? <Icon name="refresh" className="w-4 h-4 animate-spin" /> : <Icon name="refresh" className="w-4 h-4" />}
                        {isLoadingBase ? '更新中...' : '手动更新基础日程库'}
                    </button>
                    <div className="text-xs text-slate-500 space-y-1">
                        <p>• 基础日程库会在每次打开页面时自动更新</p>
                        <p>• 你的备注、完成状态和自己添加的日程不会丢失</p>
                        <p>• 如果网络失败，会使用缓存的日程数据</p>
                    </div>
                </div>
            </SettingsSection>

            {/* ── 数据管理 ── */}
            <SettingsSection title="数据管理" icon="download" iconColor="text-blue-500" description="导入导出数据，管理本地存储">
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button onClick={exportUserData} className="flex items-center justify-center gap-2 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md transition-all">
                            <Icon name="download" /> 导出用户数据
                        </button>
                        <button onClick={() => fileInputRef.current.click()} className="flex items-center justify-center gap-2 p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md transition-all">
                            <Icon name="upload" /> 导入用户数据
                            <input type="file" ref={fileInputRef} onChange={handleImportJSON} accept=".json" className="hidden" />
                        </button>
                    </div>
                    <div className="text-xs text-slate-500 mb-3 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                        <strong>说明：</strong>导出的是用户个性化数据（完成状态、备注、用户创建的日程等），不包含基础日程库。
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button onClick={exportUserCreated} className="flex items-center justify-center gap-2 p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-md transition-all">
                            <Icon name="download" /> 仅导出添加的日程
                        </button>
                        <button onClick={exportClean} className="flex items-center justify-center gap-2 p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md transition-all">
                            <Icon name="download" /> 导出除完成状态以外的日程
                        </button>
                    </div>
                    <div className="text-xs text-slate-500 mb-3 p-3 bg-purple-50 dark:bg-purple-900/10 rounded-lg">
                        <strong>说明：</strong>仅添加的日程可用于分享日程表外的视频，除完成状态以外的日程则可以连同日程表中的备注一同分享
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <button onClick={clearUserData} className="flex items-center justify-center gap-2 p-3 text-red-600 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-xl font-bold transition-all">
                            <Icon name="trash-2" /> 清空用户数据
                        </button>
                    </div>

                    {/* 测试功能（隐藏） */}
                    <div className="hidden p-4 rounded-lg border border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/10">
                        <div className="font-medium text-orange-800 dark:text-orange-300 mb-2">测试功能：删除 localStorage</div>
                        <div className="text-xs text-orange-600 dark:text-orange-400 mb-3">
                            此按钮用于测试 IndexedDB 备份恢复功能。删除后刷新页面，系统将自动从 IndexedDB 恢复数据。
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <button
                                onClick={() => {
                                    if (confirm('⚠️ 测试功能\n\n这将删除 localStorage 中的用户数据，但 IndexedDB 备份会保留。\n\n刷新页面后，系统将自动从 IndexedDB 恢复数据。\n\n确定要继续吗？')) {
                                        localStorage.removeItem(USER_DATA_KEY);
                                        alert('localStorage 已删除！\n\n请刷新页面测试 IndexedDB 恢复功能。');
                                    }
                                }}
                                className="flex items-center justify-center gap-2 p-3 text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-900/20 hover:bg-orange-200 dark:hover:bg-orange-900/30 rounded-xl font-bold transition-all"
                            >
                                <Icon name="trash-2" /> 删除 localStorage
                            </button>
                            <button
                                onClick={async () => {
                                    if (confirm('⚠️ 重置 IndexedDB\n\n这将删除并重建 IndexedDB 数据库。\n\n确定要继续吗？')) {
                                        try {
                                            await deleteDatabase();
                                            alert('IndexedDB 已重置！\n\n刷新页面后将重新创建数据库。');
                                        } catch (error) {
                                            alert('删除失败：' + error.message);
                                        }
                                    }
                                }}
                                className="flex items-center justify-center gap-2 p-3 text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-900/20 hover:bg-orange-200 dark:hover:bg-orange-900/30 rounded-xl font-bold transition-all"
                            >
                                <Icon name="refresh" /> 重置 IndexedDB
                            </button>
                        </div>
                    </div>
                </div>
            </SettingsSection>

            {/* ── GitHub Gist 云同步 ── */}
            <SettingsSection title="GitHub Gist 云同步" icon="refresh" iconColor="text-purple-500" description="使用 GitHub Gist 在多设备间同步用户数据">
                <div className="text-xs text-slate-500 mb-3 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                    <strong>说明：</strong>只同步用户个性化数据（完成状态、备注、用户创建的日程等），不包含基础日程库。
                </div>
                <p className="text-xs text-slate-500 mb-4 italic">
                    需要 GitHub Personal Access Token（需要 gist 权限）。
                    <a href="https://github.com/settings/tokens/new?description=ASoul%20Calendar&scopes=gist" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline ml-1">点击创建 Token</a>
                </p>
                <div className="space-y-3">
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1.5 block">GitHub Token</label>
                        <input type="password" className="w-full p-3 border dark:border-slate-700 rounded-xl text-sm outline-none bg-slate-50 dark:bg-slate-800 font-mono" placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" value={gistToken} onChange={e => setGistToken(e.target.value)} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1.5 block">Gist ID（首次同步后自动生成，也可手动填入已有的 Gist ID）</label>
                        <input type="text" className="w-full p-3 border dark:border-slate-700 rounded-xl text-sm outline-none bg-slate-50 dark:bg-slate-800 font-mono" placeholder="自动生成或手动输入" value={gistId} onChange={e => setGistId(e.target.value)} />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        <div>
                            <div className="font-medium text-sm">自动云同步</div>
                            <div className="text-xs text-slate-500">用户操作后自动同步到云端</div>
                        </div>
                        <button onClick={() => setGistAutoSync(!gistAutoSync)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${gistAutoSync ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}>
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${gistAutoSync ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                        <button onClick={handleSyncToGist} disabled={isGistSyncing || !gistToken} className="py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2">
                            {isGistSyncing ? <Icon name="refresh" className="w-4 h-4 animate-spin" /> : <Icon name="upload" className="w-4 h-4" />}
                            {isGistSyncing ? '同步中...' : '上传用户数据'}
                        </button>
                        <button onClick={handleLoadFromGist} disabled={isGistSyncing || !gistToken || !gistId} className="py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2">
                            {isGistSyncing ? <Icon name="refresh" className="w-4 h-4 animate-spin" /> : <Icon name="download" className="w-4 h-4" />}
                            合并用户数据
                        </button>
                        <button onClick={handleReplaceFromGist} disabled={isGistSyncing || !gistToken || !gistId} className="py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-400 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2">
                            {isGistSyncing ? <Icon name="refresh" className="w-4 h-4 animate-spin" /> : <Icon name="refresh" className="w-4 h-4" />}
                            替换用户数据
                        </button>
                    </div>
                    <div className="text-xs text-slate-500 space-y-1 pt-2">
                        <p>• 上传用户数据：将用户数据上传到 GitHub Gist（首次会创建新 Gist）</p>
                        <p>• 合并用户数据：从 Gist 下载数据并与本地数据智能合并</p>
                        <p>• 替换用户数据：用 Gist 中的数据完全替换本地用户数据</p>
                        <p>• 兼容旧格式：自动识别并转换旧版本的完整数据格式</p>
                    </div>
                </div>
            </SettingsSection>

            {/* ── Supabase 云同步 ── */}
            <SettingsSection title="Supabase 云同步" icon="refresh" iconColor="text-green-500" description="使用 Supabase 数据库在多设备间同步用户数据">
                <div className="text-xs text-slate-500 mb-3 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                    <strong>说明：</strong>只同步用户个性化数据（完成状态、备注、用户创建的日程等），不包含基础日程库。
                </div>
                <div className="text-xs text-slate-500 mb-3 p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg">
                    <strong>⚠️ 默认云同步限制：</strong>
                    <ul className="mt-1 space-y-0.5 list-disc list-inside">
                        <li>数据大小限制：100 KB（仅支持轻量体验）</li>
                        <li>同步频率限制：每 5 分钟可执行一次同步</li>
                        <li>数据安全性：公开数据库，无法保证数据安全</li>
                    </ul>
                    <div className="mt-2 font-semibold">💡 如需同步更多数据或稳定使用，请使用自定义 Supabase 服务器（个人使用免费，无限制）</div>
                </div>
                <div className="space-y-3">
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1.5 block">同步 ID（用于区分不同用户的数据，请设置一个唯一的标识符）</label>
                        <input type="text" className="w-full p-3 border dark:border-slate-700 rounded-xl text-sm outline-none bg-slate-50 dark:bg-slate-800 font-mono" placeholder="例如：user_12345 或任意唯一标识" value={syncId} onChange={e => setSyncId(e.target.value)} />
                        <div className="text-xs text-slate-500 mt-1">⚠️ 同步 ID 相同的设备会共享数据，请妥善保管</div>
                    </div>

                    {syncCooldown > 0 && (
                        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg text-xs text-yellow-700 dark:text-yellow-400">
                            ⏱️ 同步冷却中，还需等待 {Math.floor(syncCooldown / 60)}分{syncCooldown % 60}秒
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                        <button onClick={handleUploadToSupabase} disabled={isSupabaseSyncing || !syncId || syncCooldown > 0} className="py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2">
                            {isSupabaseSyncing ? <Icon name="refresh" className="w-4 h-4 animate-spin" /> : <Icon name="upload" className="w-4 h-4" />}
                            {isSupabaseSyncing ? '上传中...' : '上传到云端'}
                        </button>
                        <button onClick={handleDownloadFromSupabase} disabled={isSupabaseSyncing || !syncId || syncCooldown > 0} className="py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2">
                            {isSupabaseSyncing ? <Icon name="refresh" className="w-4 h-4 animate-spin" /> : <Icon name="download" className="w-4 h-4" />}
                            {isSupabaseSyncing ? '下载中...' : '从云端下载'}
                        </button>
                    </div>

                    <div className="text-xs text-slate-500 space-y-1 pt-2">
                        <p>• 上传到云端：将用户数据上传到 Supabase 数据库</p>
                        <p>• 从云端下载：从 Supabase 下载数据并与本地数据智能合并</p>
                        <p>• {isUsingDefaultConfig() ? '默认云同步：100 KB 大小限制，每 5 分钟可同步一次' : '自定义服务器：无大小和频率限制'}</p>
                        <p>• 数据隔离：不同的同步 ID 之间数据完全隔离</p>
                    </div>

                    {/* 自定义 Supabase 服务器 */}
                    <div className="border-t dark:border-slate-700 pt-4 mt-4">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <div className="font-medium text-sm">使用自定义 Supabase 服务器</div>
                                <div className="text-xs text-slate-500">配置自己的 Supabase 项目，无大小和频率限制</div>
                            </div>
                            <button onClick={() => setShowCustomConfig(!showCustomConfig)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${showCustomConfig ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}>
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showCustomConfig ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>

                        {showCustomConfig && (
                            <div className="space-y-3 mt-3">
                                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                    <div>
                                        <div className="font-medium text-sm">自动云同步</div>
                                        <div className="text-xs text-slate-500">用户操作后自动同步到云端</div>
                                    </div>
                                    <button onClick={() => setSupabaseAutoSync(!supabaseAutoSync)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${supabaseAutoSync ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}>
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${supabaseAutoSync ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">Supabase URL</label>
                                    <input type="text" className="w-full p-3 border dark:border-slate-700 rounded-xl text-sm outline-none bg-slate-50 dark:bg-slate-800 font-mono" placeholder="https://xxxxx.supabase.co" value={supabaseUrl} onChange={e => setSupabaseUrl(e.target.value)} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">Supabase Anon Key</label>
                                    <input type="password" className="w-full p-3 border dark:border-slate-700 rounded-xl text-sm outline-none bg-slate-50 dark:bg-slate-800 font-mono" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." value={supabaseKey} onChange={e => setSupabaseKey(e.target.value)} />
                                </div>
                                <div className="text-xs text-slate-500 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                                    <strong>提示：</strong>需要自己创建 Supabase 项目并执行数据库初始化脚本。
                                    <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline ml-1">前往 Supabase 控制台</a>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </SettingsSection>

            {/* ICS 订阅（隐藏） */}
            <div className="hidden">
                <SettingsSection title="ICS 日历订阅" icon="refresh" iconColor="text-emerald-500" description="输入 ICS 订阅链接，同步日历数据">
                    <p className="text-xs text-slate-500 mb-4 italic">同步时将自动提取 Tag 和 B 站链接。首次使用，请前往枝江站(asoul.love)获取订阅链接，<a href="https://asoul.love/calendar/latest" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline ml-1">点此前往</a></p>
                    <textarea className="w-full h-24 p-3 border dark:border-slate-700 rounded-xl text-sm outline-none bg-slate-50 dark:bg-slate-800 font-mono mb-2" placeholder="https://example.com/calendar.ics" value={icsUrls} onChange={e => setIcsUrls(e.target.value)} />
                    <button onClick={handleSyncIcs} disabled={isSyncing} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2">
                        {isSyncing ? <Icon name="refresh" className="w-4 h-4 animate-spin" /> : null}
                        {isSyncing ? '同步中...' : '保存并立即同步'}
                    </button>
                    <div className="mt-3">
                        <input type="file" accept=".ics" onChange={handleImportICSFile} className="hidden" id="ics-file-input" />
                        <label htmlFor="ics-file-input" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 cursor-pointer">
                            <Icon name="upload" className="w-4 h-4" />
                            导入本地ICS文件
                        </label>
                    </div>
                </SettingsSection>
            </div>

            {/* 解析文本（隐藏） */}
            <div className="hidden">
                <SettingsSection title="解析文本日程" icon="plus" iconColor="text-blue-500" description="粘贴文本格式的日程数据进行批量导入">
                    <textarea className="w-full h-48 p-3 border dark:border-slate-700 rounded-xl text-sm outline-none bg-slate-50 dark:bg-slate-800 font-mono" placeholder="在此粘贴日程文本..." value={inputText} onChange={e => setInputText(e.target.value)} />
                    <button onClick={() => parseText(inputText)} disabled={!inputText.trim()} className="mt-4 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold disabled:opacity-50 transition-all">导入并保存</button>
                </SettingsSection>
            </div>

            {/* ── 关于 ── */}
            <SettingsSection title="关于" icon="calendar" iconColor="text-blue-500" description="应用信息和免责声明">
                <div className="space-y-4">
                    <div className="text-sm">
                        <div className="font-medium text-slate-900 dark:text-slate-100">枝江追番表</div>
                        <div className="text-slate-500 dark:text-slate-400">一个受<a href="https://asoul.love/" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">枝江日程表</a>启发制作的一个方便补录播的工具。</div>
                        <div className="text-slate-500 dark:text-slate-400">整体画面风格均仿照枝江日程表设计。感谢未署名的枝江日程表开发者。</div>
                    </div>
                    <div className="text-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-medium text-slate-900 dark:text-slate-100">版本信息</div>
                                <div className="text-slate-500 dark:text-slate-400">v1.7.0</div>
                            </div>
                            <button onClick={() => setView('changelog')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                                <Icon name="file-text" className="w-4 h-4" />
                                查看更新日志
                            </button>
                        </div>
                    </div>
                    <div className="text-sm">
                        <div className="font-medium text-slate-900 dark:text-slate-100">主要功能</div>
                        <ul className="text-slate-500 dark:text-slate-400 list-disc list-inside space-y-1">
                            <li>日历视图显示直播日程</li>
                            <li>追番表管理进度</li>
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<font size="1">支持设置任意跳转链接，使用B站网页端自带的精准空降链接即可实现跳转到上次观看位置</font>
                            <li>ICS 日历订阅同步（订阅自<a href="https://asoul.love/" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">枝江日程表</a>）</li>
                            <li>多成员颜色配置</li>
                            <li>数据导入导出</li>
                        </ul>
                    </div>
                    <div className="text-sm">
                        <div className="font-medium text-slate-900 dark:text-slate-100">免责声明</div>
                        <div className="text-slate-500 dark:text-slate-400">本站为粉丝自发搭建的非营利性第三方工具，<br />
                            与A-SOUL、枝江娱乐、乐华娱乐等官方无任何关联。<br /><br />
                            所有数据来源于 Bilibili 公开动态或用户自行填充，<br />
                            版权归原作者所有。如有侵权，请联系我们删除。<br /><br />
                            信息可能存在误差，请以官方发布为准。 本站不对因信息错误导致的任何损失承担责任。</div>
                    </div>
                    <div className="text-sm">
                        <div className="font-medium text-slate-900 dark:text-slate-100">技术支持</div>
                        <div className="text-slate-500 dark:text-slate-400">如有问题或建议，请联系开发者</div>
                    </div>
                </div>
            </SettingsSection>
        </div>
    );
}
