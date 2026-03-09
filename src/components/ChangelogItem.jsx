import Icon from './Icon';

const ChangelogItem = ({ version, date, type, changes }) => {
    const typeColors = {
        major: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        minor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        patch: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    };

    const typeLabels = {
        major: '重大更新',
        minor: '功能更新',
        patch: '修复更新'
    };

    const changeTypeIcons = {
        feature: { icon: 'plus-circle', color: 'text-green-600 dark:text-green-400', label: '新增' },
        improvement: { icon: 'arrow-up-circle', color: 'text-blue-600 dark:text-blue-400', label: '改进' },
        fix: { icon: 'check-circle', color: 'text-orange-600 dark:text-orange-400', label: '修复' },
        breaking: { icon: 'alert-circle', color: 'text-red-600 dark:text-red-400', label: '破坏性变更' }
    };

    return (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border dark:border-slate-800 shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-2xl font-bold">v{version}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${typeColors[type]}`}>
                            {typeLabels[type]}
                        </span>
                    </div>
                    <p className="text-sm text-slate-500">{date}</p>
                </div>
            </div>

            <div className="space-y-3">
                {changes.map((change, index) => {
                    const changeType = changeTypeIcons[change.type] || changeTypeIcons.feature;
                    return (
                        <div key={index} className="flex items-start gap-3">
                            <Icon
                                name={changeType.icon}
                                className={`w-5 h-5 mt-0.5 flex-shrink-0 ${changeType.color}`}
                            />
                            <div className="flex-1">
                                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                    {changeType.label}:
                                </span>
                                <span className="text-sm ml-2">{change.text}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ChangelogItem;
