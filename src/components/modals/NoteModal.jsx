import Icon from '../Icon';

/**
 * 备注和跳转链接编辑弹窗
 */
export default function NoteModal({ editingNoteId, tempNote, setTempNote, tempLink, setTempLink, onSave, onClose }) {
    if (!editingNoteId) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm border dark:border-slate-800 p-5">
                <div className="font-bold mb-4 flex justify-between items-center text-slate-900 dark:text-slate-100">
                    <span className="flex items-center gap-2">
                        <Icon name="message-square" className="w-4 h-4" /> 备注和链接
                    </span>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400"
                    >
                        <Icon name="x" />
                    </button>
                </div>
                <div className="space-y-3">
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1.5 block">备注内容</label>
                        <textarea
                            autoFocus
                            className="w-full h-24 p-3 border dark:border-slate-700 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 outline-none text-slate-900 dark:text-slate-100"
                            value={tempNote}
                            onChange={e => setTempNote(e.target.value)}
                            placeholder="输入观看进度或其他备注..."
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1.5 block">跳转链接</label>
                        <input
                            type="url"
                            className="w-full p-3 border dark:border-slate-700 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 outline-none text-slate-900 dark:text-slate-100"
                            value={tempLink}
                            onChange={e => setTempLink(e.target.value)}
                            placeholder="输入链接或包含链接的文本，保存时自动提取纯链接..."
                        />
                    </div>
                </div>
                <div className="flex gap-2 mt-4">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm font-bold"
                    >
                        取消
                    </button>
                    <button
                        onClick={() => onSave(editingNoteId)}
                        className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold"
                    >
                        保存
                    </button>
                </div>
            </div>
        </div>
    );
}
