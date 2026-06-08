import Icon from './Icon';
import { DISPLAY_MODE_KEY, LIVE_ROOM_URLS } from '../constants';
import { getMemberConfig, toZeroDate, isTouchDevice, toBilibiliScheme, isBilibiliUrl } from '../utils';

const ScheduleCard = ({
    item,
    showDate = false,
    toggleComplete,
    toggleFavorite,
    handleBilibiliSearch,
    setEditingNoteId,
    setTempNote,
    setTempLink,
    setSchedules,
    showSearchBtn = true,
    showDynamicBtn = true,
    mobileOptimize = true
}) => {
    const displayMode = localStorage.getItem(DISPLAY_MODE_KEY) || 'multi-color';
    // 是否启用手机端优化（需要开关开启 + 触屏设备）
    const isMobileMode = mobileOptimize && isTouchDevice();

    // 获取直播间URL（优先级：ICS直播间URL > 预定义直播间URL）
    const liveRoomUrl = item.liveRoomUrl || LIVE_ROOM_URLS[item.category];
    const config = getMemberConfig(item.category, displayMode, liveRoomUrl);

    // 根据手机端优化模式转换URL
    const getMobileUrl = (url) => {
        if (!url || !isMobileMode || !isBilibiliUrl(url)) return url;
        return toBilibiliScheme(url);
    };

    // 打开链接（手机端URL Scheme用 location.href，桌面端用 window.open）
    const openUrl = (url) => {
        const targetUrl = getMobileUrl(url);
        if (targetUrl.startsWith('bilibili://')) {
            window.location.assign(targetUrl);
        } else {
            window.open(targetUrl, '_blank');
        }
    };

    // 生成渐变背景样式
    const getBackgroundStyle = () => {
        if (displayMode === 'multi-color' && config.multiColors && config.multiColors.length > 1) {
            const colors = config.multiColors;
            const gradientStops = colors.map((color, index) => `${color} ${(index / (colors.length - 1)) * 100}%`).join(', ');
            return {
                background: `linear-gradient(135deg, ${gradientStops})`,
                color: config.textColor
            };
        }
        return {
            backgroundColor: config.color,
            color: config.textColor
        };
    };

    return (
        <div className="flex flex-col gap-1 px-1 mb-4">
            <div className="flex justify-between items-baseline px-0.5">
                <div className="text-[10px] font-black italic tracking-tighter opacity-60 text-slate-500 dark:text-slate-400">
                    {item.isAnime ? (
                        item.isFavorite ? (
                            <span className="text-yellow-500">收藏日程</span>
                        ) : (
                            <span className="text-orange-500">追番日程</span>
                        )
                    ) : (
                        showDate ? `${item.date.split('/').slice(1).join('/')} ${item.time}` : item.time
                    )}
                </div>
            </div>
            <div className={`group relative p-3 rounded-xl transition-all shadow-sm ${item.completed ? 'opacity-30 grayscale'
                : 'hover:shadow-md hover:scale-[1.01]'} cursor-pointer`} style={getBackgroundStyle()} onClick={() =>
                    toggleComplete(item.id)}>
                <div className="flex items-center gap-1.5 mb-1">
                    <span
                        className="px-1.5 py-0.5 rounded text-[9px] font-black bg-black/10 uppercase tracking-tighter">{item.type}</span>
                    <div className="text-[11px] font-bold opacity-80 truncate pr-4">{item.subTitle}</div>
                </div>
                <div className="text-xs md:text-sm font-black leading-tight line-clamp-2">{item.title}</div>

                {item.note && <div className="mt-2 p-1.5 rounded text-[10px] bg-black/5 flex items-start gap-1">
                    <Icon name="message-square" className="w-2.5 h-2.5 mt-0.5" /><span
                        className="italic opacity-90">{item.note}</span>
                </div>}

                <div className="absolute top-1 right-1 flex items-center gap-0.5">
                    {item.completed &&
                        <Icon name="check-circle-2" className="w-3.5 h-3.5 text-green-400" />}
                    <div className={`flex gap-0.5 ${isMobileMode ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                        {!item.isAnime && (() => {
                            // 用户自定义了 link 时不显示直播/录播按钮
                            if (item.link && item.link.trim()) return null;

                            // 优先级：ICS直播间URL > 预定义直播间URL
                            const liveRoomUrl = item.liveRoomUrl || LIVE_ROOM_URLS[item.category];
                            const hasOfficialRecord = item.officialRecordUrl && item.officialRecordUrl.trim();

                            if (hasOfficialRecord) {
                                // 有官方录播时显示录播按钮
                                const href = getMobileUrl(item.officialRecordUrl);
                                return <a href={href} target={href.startsWith('bilibili://') ? undefined : '_blank'} rel="noopener noreferrer" title="观看官方录播"
                                    className="p-1 bg-black/5 hover:bg-black/10 rounded-full"
                                    onClick={(e) => { e.stopPropagation(); if (href.startsWith('bilibili://')) e.preventDefault(), window.location.assign(href); }}>
                                    <Icon name="record-play" className="w-3 h-3" />
                                </a>;
                            } else if (liveRoomUrl) {
                                // 无官方录播时显示直播间按钮
                                return <button title="进入直播间" className="p-1 bg-black/5 hover:bg-black/10 rounded-full" onClick={(e) => {
                                    e.stopPropagation(); openUrl(liveRoomUrl);
                                }}>
                                    <Icon name="bilibili" className="w-3 h-3" />
                                </button>;
                            }
                            return null;
                        })()}
                        {item.link && (() => {
                            const href = getMobileUrl(item.link);
                            return <a href={href} target={href.startsWith('bilibili://') ? undefined : '_blank'} rel="noopener noreferrer" title="跳转链接"
                                className="p-1 bg-black/5 hover:bg-black/10 rounded-full"
                                onClick={(e) => { e.stopPropagation(); if (href.startsWith('bilibili://')) e.preventDefault(), window.location.assign(href); }}>
                                <Icon name="external-link" className="w-3 h-3" />
                            </a>;
                        })()}
                        {showDynamicBtn && !item.isAnime && item.dynamicUrl && <button title="查看动态"
                            className="p-1 bg-black/5 hover:bg-black/10 rounded-full" onClick={(e) => {
                                e.stopPropagation();
                                openUrl(item.dynamicUrl);
                            }}>
                            <Icon name="link" className="w-3 h-3" />
                        </button>}
                        {showSearchBtn && !item.isAnime && (() => {
                            // 判断日程日期是否为今天或过去
                            const scheduleDate = toZeroDate(item.date);
                            const today = toZeroDate();
                            const isPastOrToday = scheduleDate <= today; return isPastOrToday && (<button title="在B站搜索"
                                className="p-1 bg-black/5 hover:bg-black/10 rounded-full" onClick={(e) => {
                                    e.stopPropagation();
                                    handleBilibiliSearch(item);
                                }}>
                                <Icon name="search" className="w-3 h-3" />
                            </button>
                            );
                        })()}
                        {(!item.isAnime || item.isFavorite) && (
                            <button title={item.isFavorite ? "取消收藏" : "收藏到追番表"} className={`p-1 rounded-full ${item.isFavorite
                                ? 'bg-yellow-500 text-white' : 'bg-black/5 hover:bg-black/10'}`} onClick={(e) => {
                                    e.stopPropagation(); toggleFavorite(item.id);
                                }}
                            >
                                <Icon name="star" className="w-3 h-3" />
                            </button>
                        )}
                        <button title="编辑备注" className="p-1 bg-black/5 hover:bg-black/10 rounded-full" onClick={(e) => {
                            e.stopPropagation(); setEditingNoteId(item.id); setTempNote(item.note || '');
                            setTempLink(item.link || '');
                        }}>
                            <Icon name="message-square" className="w-3 h-3" />
                        </button>
                        <button title="删除日程" className="p-1 bg-black/5 hover:bg-black/10 rounded-full" onClick={(e) => {
                            e.stopPropagation(); if (confirm('确定删除吗？')) setSchedules(prev => prev.filter(s => s.id !==
                                item.id));
                        }}>
                            <Icon name="trash-2" className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScheduleCard;
