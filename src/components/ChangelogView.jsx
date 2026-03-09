import { useState } from 'react';
import Icon from './Icon';
import ChangelogItem from './ChangelogItem';
import { changelogData } from '../changelog-data';

const ChangelogView = ({ onBack }) => {
    const [filter, setFilter] = useState('all'); // all, major, minor, patch

    const filteredChangelogs = filter === 'all'
        ? changelogData
        : changelogData.filter(log => log.type === filter);

    return (
        <div className="max-w-4xl mx-auto">
            {/* 头部 */}
            <div className="mb-8">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 mb-4 transition-colors"
                >
                    <Icon name="arrow-left" className="w-5 h-5" />
                    <span>返回</span>
                </button>

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">更新日志</h1>
                        <p className="text-slate-600 dark:text-slate-400">
                            查看应用的所有版本更新记录
                        </p>
                    </div>
                    <Icon name="file-text" className="w-12 h-12 text-slate-300 dark:text-slate-700" />
                </div>
            </div>

            {/* 筛选器 */}
            <div className="flex gap-2 mb-6">
                {[
                    { value: 'all', label: '全部' },
                    { value: 'major', label: '重大更新' },
                    { value: 'minor', label: '功能更新' },
                    { value: 'patch', label: '修复更新' }
                ].map(({ value, label }) => (
                    <button
                        key={value}
                        onClick={() => setFilter(value)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === value
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* 更新日志列表 */}
            <div className="space-y-6">
                {filteredChangelogs.length > 0 ? (
                    filteredChangelogs.map((log) => (
                        <ChangelogItem key={log.version} {...log} />
                    ))
                ) : (
                    <div className="text-center py-12 text-slate-500">
                        <Icon name="inbox" className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p>暂无该类型的更新记录</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChangelogView;
