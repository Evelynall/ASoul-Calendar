import Icon from '../Icon';
import { DEFAULT_MEMBER_CONFIG } from '../../constants';

/**
 * 手动新增日程弹窗
 */
export default function AddScheduleModal({ isOpen, newSchedule, setNewSchedule, onAdd, onClose }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border dark:border-slate-800 p-6 space-y-4">
                <div className="font-bold flex justify-between items-center text-slate-900 dark:text-slate-100">
                    <span className="flex items-center gap-2">
                        <Icon name="plus" className="w-4 h-4 text-blue-500" /> 手动新增
                    </span>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                    >
                        <Icon name="x" />
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1.5 block">成员</label>
                        <select
                            className="w-full p-2.5 border dark:border-slate-700 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 outline-none text-slate-900 dark:text-slate-100"
                            value={newSchedule.category}
                            onChange={e => setNewSchedule({ ...newSchedule, category: e.target.value })}
                        >
                            {Object.keys(DEFAULT_MEMBER_CONFIG).map(name => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1.5 block">类型</label>
                        <input
                            type="text"
                            className="w-full p-2.5 border dark:border-slate-700 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 outline-none text-slate-900 dark:text-slate-100"
                            value={newSchedule.type}
                            onChange={e => setNewSchedule({ ...newSchedule, type: e.target.value })}
                            placeholder="直播"
                        />
                    </div>
                </div>

                {/* 追番开关 */}
                <div className="flex items-center justify-between p-3 rounded-lg border dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    <div>
                        <div className="font-medium text-sm">标记为追番</div>
                        <div className="text-xs text-slate-500">此日程将显示在追番表中，不在日历中显示</div>
                    </div>
                    <button
                        onClick={() => setNewSchedule({ ...newSchedule, isAnime: !newSchedule.isAnime })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${newSchedule.isAnime ? 'bg-orange-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${newSchedule.isAnime ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>

                {newSchedule.isAnime && (
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1.5 block">跳转链接</label>
                        <input
                            type="text"
                            className="w-full p-2.5 border dark:border-slate-700 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 outline-none text-slate-900 dark:text-slate-100"
                            value={newSchedule.link}
                            onChange={e => setNewSchedule({ ...newSchedule, link: e.target.value })}
                            placeholder="https://example.com"
                        />
                    </div>
                )}

                {!newSchedule.isAnime && (
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1.5 block">日期</label>
                            <input
                                type="date"
                                className="w-full p-2.5 border dark:border-slate-700 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 outline-none text-slate-900 dark:text-slate-100"
                                value={newSchedule.date.replace(/\//g, '-')}
                                onChange={e => setNewSchedule({ ...newSchedule, date: e.target.value.replace(/-/g, '/') })}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1.5 block">时间</label>
                            <input
                                type="time"
                                className="w-full p-2.5 border dark:border-slate-700 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 outline-none text-slate-900 dark:text-slate-100"
                                value={newSchedule.time}
                                onChange={e => setNewSchedule({ ...newSchedule, time: e.target.value })}
                            />
                        </div>
                    </div>
                )}

                <div>
                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">副标题</label>
                    <input
                        type="text"
                        className="w-full p-2.5 border dark:border-slate-700 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 outline-none text-slate-900 dark:text-slate-100"
                        value={newSchedule.subTitle}
                        onChange={e => setNewSchedule({ ...newSchedule, subTitle: e.target.value })}
                        placeholder="直播"
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">主标题</label>
                    <input
                        type="text"
                        className="w-full p-2.5 border dark:border-slate-700 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 outline-none text-slate-900 dark:text-slate-100"
                        value={newSchedule.title}
                        onChange={e => setNewSchedule({ ...newSchedule, title: e.target.value })}
                        placeholder="《嘉然的奇妙冒险》"
                    />
                </div>

                <div className="flex gap-3 pt-4">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm font-bold"
                    >
                        取消
                    </button>
                    <button
                        onClick={onAdd}
                        className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg"
                    >
                        确认添加
                    </button>
                </div>
            </div>
        </div>
    );
}
