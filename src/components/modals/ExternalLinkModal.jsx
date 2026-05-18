import Icon from '../Icon';

/**
 * 外部链接安全确认弹窗
 */
export default function ExternalLinkModal({ modal, onClose }) {
    if (!modal.isOpen) return null;

    const handleConfirm = () => {
        const a = document.createElement('a');
        a.href = modal.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        onClose();
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border dark:border-slate-800"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                        <Icon name="external-link" className="w-5 h-5 text-yellow-600 dark:text-yellow-500" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">外部链接提醒</h3>
                </div>

                <div className="mb-4 space-y-3">
                    <p className="text-sm text-slate-600 dark:text-slate-400">您即将跳转到外部网站：</p>
                    <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg break-all text-xs font-mono text-slate-700 dark:text-slate-300">
                        {modal.url}
                    </div>
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <p className="text-xs text-yellow-800 dark:text-yellow-200 leading-relaxed">
                            <span className="font-bold">⚠️ 免责声明：</span>
                            该链接指向外部网站，不属于 bilibili.com 域名。请注意网络安全，谨慎访问未知网站。本应用不对外部链接的内容和安全性负责。
                        </p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 transition-colors"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg transition-colors"
                    >
                        继续访问
                    </button>
                </div>
            </div>
        </div>
    );
}
