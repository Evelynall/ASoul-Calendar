import Icon from '../Icon';

/**
 * URL 参数设置链接时，多候选日程选择弹窗
 */
export default function SetLinkCandidateModal({ modal, onSelect, onClose }) {
    if (!modal.isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[110] p-4"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border dark:border-slate-800"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                        <Icon name="link" className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">找到多个匹配日程</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">请选择要设置链接的目标日程</p>
                    </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl mb-4">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">待设置的链接：</p>
                    <p className="text-xs font-mono text-slate-700 dark:text-slate-300 break-all leading-relaxed">
                        {modal.pendingLink}
                    </p>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {modal.candidates.map(s => {
                        const timeStr = s.id.split('-')[1] || '';
                        const displayTime = timeStr.length === 4
                            ? `${timeStr.slice(0, 2)}:${timeStr.slice(2)}`
                            : timeStr;
                        return (
                            <button
                                key={s.id}
                                onClick={() => onSelect(s, modal.pendingLink)}
                                className="w-full text-left p-3 rounded-xl border border-slate-200 dark:border-slate-700
                                    hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20
                                    transition-colors group"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                                            {s.title || s.subTitle || '（无标题）'}
                                        </p>
                                        {s.title && s.subTitle && (
                                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{s.subTitle}</p>
                                        )}
                                    </div>
                                    <span className="shrink-0 text-xs font-mono text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-lg">
                                        {displayTime}
                                    </span>
                                </div>
                                <p className="text-[10px] text-slate-400 dark:text-slate-600 mt-1 font-mono truncate">{s.id}</p>
                            </button>
                        );
                    })}
                </div>

                <button
                    onClick={onClose}
                    className="mt-4 w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700
                        rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 transition-colors"
                >
                    取消
                </button>
            </div>
        </div>
    );
}
