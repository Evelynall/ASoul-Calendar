import { useState } from 'react';
import Icon from './Icon';
import LinkCard from './LinkCard';

const LinksView = ({ links, setLinks }) => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingLink, setEditingLink] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        url: '',
        icon: 'link'
    });

    const iconOptions = [
        'link', 'external-link', 'globe', 'star', 'heart', 'bookmark',
        'video', 'music', 'image', 'file', 'folder', 'book',
        'github', 'bilibili', 'youtube', 'twitter'
    ];

    const handleOpenModal = (link = null) => {
        if (link) {
            setEditingLink(link);
            setFormData({
                title: link.title,
                description: link.description || '',
                url: link.url,
                icon: link.icon || 'link'
            });
        } else {
            setEditingLink(null);
            setFormData({
                title: '',
                description: '',
                url: '',
                icon: 'link'
            });
        }
        setIsAddModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsAddModalOpen(false);
        setEditingLink(null);
        setFormData({
            title: '',
            description: '',
            url: '',
            icon: 'link'
        });
    };

    const handleSubmit = () => {
        if (!formData.title || !formData.url) {
            alert('标题和链接为必填项');
            return;
        }

        if (editingLink) {
            // 编辑现有链接
            setLinks(prev => prev.map(link =>
                link.id === editingLink.id
                    ? { ...link, ...formData }
                    : link
            ));
        } else {
            // 添加新链接
            const newLink = {
                id: `link-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                ...formData
            };
            setLinks(prev => [...prev, newLink]);
        }

        handleCloseModal();
    };

    const handleDelete = (id) => {
        setLinks(prev => prev.filter(link => link.id !== id));
    };

    return (
        <>
            <div className="h-full max-w-5xl mx-auto p-4 md:p-8 flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <Icon name="link" className="w-5 h-5 text-blue-500" />
                        快捷链接 ({links.length})
                    </h3>
                    <p className='text-white/60 text-xs'>功能开发中，暂不支持导出与同步，数据结构可能会有变动，不建议使用自定义添加功能</p>
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs md:text-sm font-bold shadow-md hover:bg-blue-700 transition-all"
                    >
                        <Icon name="plus" className="w-3.5 h-3.5" />
                        <span>添加链接</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                    {links.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6">
                            {links.map(link => (
                                <LinkCard
                                    key={link.id}
                                    link={link}
                                    onEdit={handleOpenModal}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-600">
                            <Icon name="link" className="w-16 h-16 mb-4" />
                            <p className="text-lg font-bold mb-2">暂无快捷链接</p>
                            <p className="text-sm text-center max-w-md">点击上方按钮添加常用链接</p>
                        </div>
                    )}
                </div>
            </div>

            {/* 添加/编辑链接弹窗 */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleCloseModal}>
                    <div
                        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                {editingLink ? '编辑链接' : '添加链接'}
                            </h3>
                            <button
                                onClick={handleCloseModal}
                                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                            >
                                <Icon name="x" className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-1.5 block">标题 *</label>
                                <input
                                    type="text"
                                    className="w-full p-3 border dark:border-slate-700 rounded-xl text-sm outline-none bg-slate-50 dark:bg-slate-700"
                                    placeholder="输入链接标题"
                                    value={formData.title}
                                    onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-1.5 block">简短介绍</label>
                                <textarea
                                    className="w-full p-3 border dark:border-slate-700 rounded-xl text-sm outline-none bg-slate-50 dark:bg-slate-700 resize-none"
                                    placeholder="输入简短介绍（可选）"
                                    rows="2"
                                    value={formData.description}
                                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-1.5 block">链接地址 *</label>
                                <input
                                    type="url"
                                    className="w-full p-3 border dark:border-slate-700 rounded-xl text-sm outline-none bg-slate-50 dark:bg-slate-700"
                                    placeholder="https://example.com"
                                    value={formData.url}
                                    onChange={e => setFormData(prev => ({ ...prev, url: e.target.value }))}
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-1.5 block">图标</label>
                                <div className="grid grid-cols-8 gap-2">
                                    {iconOptions.map(iconName => (
                                        <button
                                            key={iconName}
                                            type="button"
                                            className={`p-2 rounded-lg border-2 transition-all ${formData.icon === iconName
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                                }`}
                                            onClick={() => setFormData(prev => ({ ...prev, icon: iconName }))}
                                        >
                                            <Icon name={iconName} className="w-5 h-5" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={handleCloseModal}
                                className="flex-1 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all"
                            >
                                {editingLink ? '保存' : '添加'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default LinksView;
