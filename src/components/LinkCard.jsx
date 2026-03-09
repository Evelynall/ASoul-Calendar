import Icon from './Icon';

const LinkCard = ({ link, onEdit, onDelete }) => {
    const handleClick = () => {
        if (link.url) {
            window.open(link.url, '_blank');
        }
    };

    return (
        <div className="flex flex-col gap-1 px-1 mb-4">
            {/* 1. 背景从渐变色改为单色 #55ACEE */}
            <div
                className="group relative p-4 rounded-xl transition-all shadow-sm hover:shadow-md hover:scale-[1.01] cursor-pointer bg-[#55ACEE] text-white"
                onClick={handleClick}
            >
                <div className="flex items-start gap-3 mb-2">
                    {link.icon && (
                        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-white/20 rounded-lg">
                            <Icon name={link.icon} className="w-6 h-6" />
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <div className="text-base md:text-lg font-black leading-tight mb-1">{link.title}</div>
                        {link.description && (
                            <div className="text-xs opacity-90 line-clamp-2">{link.description}</div>
                        )}
                    </div>
                </div>

                <div className="absolute top-2 right-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* 2. 编辑按钮尺寸调小 */}
                    <button
                        title="编辑"
                        className="p-1 bg-black/10 hover:bg-black/20 rounded-full"
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(link);
                        }}
                    >
                        <Icon name="edit" className="w-3 h-3" />
                    </button>
                    {/* 3. 删除按钮尺寸调小 */}
                    <button
                        title="删除"
                        className="p-1 bg-black/10 hover:bg-black/20 rounded-full"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('确定删除这个链接吗？')) {
                                onDelete(link.id);
                            }
                        }}
                    >
                        <Icon name="trash-2" className="w-3 h-3" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LinkCard;