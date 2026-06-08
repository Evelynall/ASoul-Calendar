import { useEffect, useState } from 'react';
import Icon from './Icon';
import { checkUnreadMajorUpdate } from '../changelogUtils';

const ChangelogNotification = ({ onOpenChangelog }) => {
    const [unreadVersion] = useState(() => checkUnreadMajorUpdate());
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (!unreadVersion) return;
        const timer = setTimeout(() => setIsVisible(true), 2000);
        return () => clearTimeout(timer);
    }, [unreadVersion]);

    const handleClick = () => {
        onOpenChangelog();
        setIsVisible(false);
    };

    const handleClose = (e) => {
        e.stopPropagation();
        setIsVisible(false);
    };

    if (!isVisible || !unreadVersion) return null;

    return (
        <div
            onClick={handleClick}
            className="fixed bottom-6 right-6 z-50 max-w-sm bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-3xl animate-slide-in-right"
        >
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                    <Icon name="bell" className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                            重大更新
                        </span>
                        <span className="text-xs text-slate-500">v{unreadVersion}</span>
                    </div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        发现新版本更新
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        点击查看更新详情 →
                    </p>
                </div>

                <button
                    onClick={handleClose}
                    className="flex-shrink-0 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                    <Icon name="x" className="w-4 h-4 text-slate-400" />
                </button>
            </div>
        </div>
    );
};

export default ChangelogNotification;
