import { useState, useEffect, useRef, useCallback } from 'react';
import './Pet.css';
import { QUOTES } from './quotes';

const PET_WIDTH = 200;
const PET_HEIGHT = 200;
const CHARACTERS = ['贝拉', '嘉然', '乃琳', '心宜', '思诺'];
const DIALOG_STACK_HEIGHT = 50;
const QUOTE_DIALOG_TYPE = 'quote';

const PetDialog = ({ dialog, onClose, petPosition, index }) => {
    if (!dialog) return null;

    const handleClick = (e) => {
        e.stopPropagation();
        if (dialog.onClick) {
            dialog.onClick();
        }
        if (dialog.closeOnClick !== false) {
            onClose(dialog.id);
        }
    };

    const handleLinkClick = (e, url) => {
        e.stopPropagation();
        e.preventDefault();
        window.open(url, '_blank');
        if (dialog.closeOnClick !== false) {
            onClose(dialog.id);
        }
    };

    const renderContent = () => {
        if (!dialog.content) return null;

        return dialog.content.map((item, index) => {
            if (item.type === 'link') {
                return (
                    <a
                        key={index}
                        href={item.url}
                        onClick={(e) => handleLinkClick(e, item.url)}
                        className="pet-dialog-link"
                        style={item.style}
                    >
                        {item.text}
                    </a>
                );
            }
            return (
                <span
                    key={index}
                    className={item.className || ''}
                    style={item.style}
                >
                    {item.text}
                </span>
            );
        });
    };

    return (
        <div
            className="pet-dialog"
            style={{
                left: `calc(${petPosition.x}% + 80px)`,
                top: `calc(${petPosition.y}% - 40px - ${index * DIALOG_STACK_HEIGHT}px)`,
                transform: 'translateX(-50%)',
                zIndex: 1003 + index
            }}
            onClick={handleClick}
        >
            <img src="pet/img/text-boxs.png" alt="对话框" className="pet-dialog-bg" />
            <div className="pet-dialog-content">
                {renderContent()}
            </div>
        </div>
    );
};

const Pet = ({ isEnabled, onToggleEnabled, quoteConfig }) => {
    const getDefaultPosition = () => {
        const saved = localStorage.getItem('pet_position');
        if (saved) {
            const pos = JSON.parse(saved);
            if (pos.unit === '%') {
                return pos;
            }
        }
        return { x: 80, y: 75, unit: '%' };
    };

    const getDefaultCharacter = () => {
        const saved = localStorage.getItem('pet_character');
        if (saved && CHARACTERS.includes(saved)) {
            return saved;
        }
        return '嘉然';
    };

    const [position, setPosition] = useState(getDefaultPosition);
    const [currentCharacter, setCurrentCharacter] = useState(getDefaultCharacter);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [keyboardPressed, setKeyboardPressed] = useState(false);
    const [mousePressed, setMousePressed] = useState(null);
    const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
    const [showCharacterSubmenu, setShowCharacterSubmenu] = useState(false);
    const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
    const [dialogs, setDialogs] = useState([]);
    const [showQuoteModal, setShowQuoteModal] = useState(false);
    const dialogIdCounter = useRef(0);

    const petRef = useRef(null);
    const lastMousePos = useRef({ x: 0, y: 0 });
    const quoteTimerRef = useRef(null);
    const clickStartPos = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const showDialog = useCallback((options) => {
        const newDialog = {
            ...options,
            id: dialogIdCounter.current++
        };

        if (options.type === QUOTE_DIALOG_TYPE) {
            setDialogs(prev => {
                const filtered = prev.filter(d => d.type !== QUOTE_DIALOG_TYPE);
                return [...filtered, newDialog];
            });
        } else {
            setDialogs(prev => [...prev, newDialog]);
        }
    }, []);

    const closeDialog = (id) => {
        setDialogs(prev => prev.filter(d => d.id !== id));
    };

    const closeAllDialogs = () => {
        setDialogs([]);
    };

    const getRandomQuote = useCallback(() => {
        const availableQuotes = QUOTES.filter(q =>
            q.character === 'all' || q.character === currentCharacter
        );
        if (availableQuotes.length === 0) return null;
        return availableQuotes[Math.floor(Math.random() * availableQuotes.length)];
    }, [currentCharacter]);

    const showRandomQuote = useCallback(() => {
        const quote = getRandomQuote();
        if (quote) {
            showDialog({
                type: QUOTE_DIALOG_TYPE,
                content: quote.content,
                onClick: quote.onClick,
                closeOnClick: quote.closeOnClick
            });
        }
    }, [getRandomQuote, showDialog]);


    const handleMouseDown = (e) => {
        if (e.button === 0) {
            clickStartPos.current = { x: e.clientX, y: e.clientY };
            setIsDragging(true);
            const currentX = position.unit === '%'
                ? (position.x / 100) * window.innerWidth
                : position.x;
            const currentY = position.unit === '%'
                ? (position.y / 100) * window.innerHeight
                : position.y;
            setDragOffset({
                x: e.clientX - currentX,
                y: e.clientY - currentY
            });
            setIsMenuOpen(false);
            setShowCharacterSubmenu(false);
        }
    };

    const handleMouseMove = useCallback((e) => {
        if (isDragging) {
            const newX = e.clientX - dragOffset.x;
            const newY = e.clientY - dragOffset.y;
            const maxPercentX = 100 - (PET_WIDTH / window.innerWidth * 100);
            const maxPercentY = 100 - (PET_HEIGHT / window.innerHeight * 100);
            const percentX = Math.max(0, Math.min(maxPercentX, (newX / window.innerWidth) * 100));
            const percentY = Math.max(0, Math.min(maxPercentY, (newY / window.innerHeight) * 100));
            setPosition({ x: percentX, y: percentY, unit: '%' });
        }

        const deltaX = e.clientX - lastMousePos.current.x;
        const deltaY = e.clientY - lastMousePos.current.y;

        setMouseOffset(prev => {
            const newX = Math.max(-20, Math.min(20, prev.x + deltaX * 0.1));
            const newY = Math.max(-20, Math.min(20, prev.y + deltaY * 0.1));
            return { x: newX * 0.95, y: newY * 0.95 };
        });

        lastMousePos.current = { x: e.clientX, y: e.clientY };
    }, [dragOffset.x, dragOffset.y, isDragging]);

    const handleMouseUp = useCallback((e) => {
        setIsDragging(false);

        const deltaX = Math.abs(e.clientX - clickStartPos.current.x);
        const deltaY = Math.abs(e.clientY - clickStartPos.current.y);

        if (deltaX < 5 && deltaY < 5) {
            showRandomQuote();
        }
    }, [showRandomQuote]);

    const handleContextMenu = (e) => {
        e.preventDefault();
        setMenuPosition({ x: e.clientX, y: e.clientY });
        setIsMenuOpen(true);
        setShowCharacterSubmenu(false);
    };

    const handleHide = () => {
        onToggleEnabled(false);
        setIsMenuOpen(false);
    };

    const handleResetPosition = () => {
        setPosition({ x: 80, y: 75, unit: '%' });
        setIsMenuOpen(false);
    };

    const handleGetSameStyle = () => {
        window.open('https://www.bilibili.com/video/BV1htc6zJEzb/', '_blank');
        setIsMenuOpen(false);
    };

    const handleCharacterChange = (character) => {
        setCurrentCharacter(character);
        setShowCharacterSubmenu(false);
        setIsMenuOpen(false);
    };

    const handleToggleCharacterSubmenu = (e) => {
        e.stopPropagation();
        setShowCharacterSubmenu(!showCharacterSubmenu);
    };

    const handleOpenQuoteModal = () => {
        setShowQuoteModal(true);
        setIsMenuOpen(false);
    };

    const handleCloseQuoteModal = () => {
        setShowQuoteModal(false);
    };


    useEffect(() => {
        localStorage.setItem('pet_character', currentCharacter);
    }, [currentCharacter]);

    useEffect(() => {
        const handleKeyDown = () => {
            setKeyboardPressed(true);
            setTimeout(() => setKeyboardPressed(false), 100);
        };

        const handleKeyUp = () => {
            setKeyboardPressed(false);
        };

        const handleClick = (e) => {
            if (e.button === 0) {
                setMousePressed('left');
                setTimeout(() => setMousePressed(null), 200);
            }
        };

        const handleGlobalClick = (e) => {
            if (isMenuOpen && !e.target.closest('.pet-menu')) {
                setIsMenuOpen(false);
                setShowCharacterSubmenu(false);
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('click', handleClick);
        window.addEventListener('click', handleGlobalClick);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('click', handleClick);
            window.removeEventListener('click', handleGlobalClick);
        };
    }, [handleMouseMove, handleMouseUp, isMenuOpen]);

    useEffect(() => {
        localStorage.setItem('pet_position', JSON.stringify(position));
    }, [position]);

    useEffect(() => {
        if (!isEnabled || isMobile || !quoteConfig.enabled) return;

        const scheduleNextQuote = () => {
            quoteTimerRef.current = setTimeout(() => {
                showRandomQuote();
                scheduleNextQuote();
            }, Math.random() * (quoteConfig.maxInterval - quoteConfig.minInterval) + quoteConfig.minInterval);
        };

        scheduleNextQuote();

        return () => {
            if (quoteTimerRef.current) {
                clearTimeout(quoteTimerRef.current);
            }
        };
    }, [isEnabled, isMobile, quoteConfig.enabled, quoteConfig.maxInterval, quoteConfig.minInterval, showRandomQuote]);

    if (!isEnabled || isMobile) return null;

    return (
        <div className="pet-container">
            {dialogs.map((dialog, index) => (
                <PetDialog
                    key={dialog.id}
                    dialog={dialog}
                    onClose={closeDialog}
                    petPosition={position}
                    index={index}
                />
            ))}

            <div
                ref={petRef}
                className={`pet ${isDragging ? 'dragging' : ''}`}
                style={{
                    left: `${position.x}${position.unit}`,
                    top: `${position.y}${position.unit}`,
                    cursor: isDragging ? 'grabbing' : 'grab',
                    transform: isDragging ? 'scale(1.05) translate(-10%, -10%)' : 'translate(-10%, -10%)'
                }}
                onMouseDown={handleMouseDown}
                onContextMenu={handleContextMenu}
            >
                <div className="pet-layer pet-bg">
                    <img src={`pet/img/${currentCharacter}/bgImage.png`} alt="背景" />
                </div>

                <div className={`pet-layer pet-keyboard ${keyboardPressed ? 'pressed' : ''}`}>
                    <img src={`pet/img/${currentCharacter}/keyboardImage.png`} alt="键盘" />
                </div>

                <div className="pet-layer pet-mouse" style={{
                    transform: `translate(${mouseOffset.x}px, ${mouseOffset.y}px)`
                }}>
                    <img src={`pet/img/${currentCharacter}/mouseImage.png`} alt="鼠标" />
                </div>

                <div className="pet-layer pet-click pet-left-click" style={{
                    transform: `translate(${mouseOffset.x}px, ${mouseOffset.y}px)`,
                    opacity: mousePressed === 'left' ? 1 : 0
                }}>
                    <img src={`pet/img/${currentCharacter}/leftClickImage.png`} alt="左键" />
                </div>

                <div className="pet-layer pet-click pet-right-click" style={{
                    transform: `translate(${mouseOffset.x}px, ${mouseOffset.y}px)`,
                    opacity: mousePressed === 'right' ? 1 : 0
                }}>
                    <img src={`pet/img/${currentCharacter}/rightClickImage.png`} alt="右键" />
                </div>
            </div>

            {isMenuOpen && (
                <div
                    className="pet-menu"
                    style={{
                        left: `${menuPosition.x}px`,
                        top: `${menuPosition.y}px`
                    }}
                >
                    <button onClick={handleResetPosition} className="pet-menu-item">
                        重置位置
                    </button>

                    <div className="pet-menu-submenu-container">
                        <button onClick={handleToggleCharacterSubmenu} className="pet-menu-item pet-menu-item-submenu">
                            切换角色 ▼
                        </button>
                        {showCharacterSubmenu && (
                            <div className="pet-menu-submenu">
                                {CHARACTERS.map(char => (
                                    <button
                                        key={char}
                                        onClick={() => handleCharacterChange(char)}
                                        className={`pet-menu-item ${char === currentCharacter ? 'pet-menu-item-active' : ''}`}
                                    >
                                        {char}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <button onClick={handleGetSameStyle} className="pet-menu-item pet-menu-item-link">
                        想要同款？
                    </button>
                    <button onClick={handleOpenQuoteModal} className="pet-menu-item pet-menu-item-link">
                        推荐语录
                    </button>
                    {dialogs.length > 0 && (
                        <button onClick={closeAllDialogs} className="pet-menu-item">
                            关闭所有对话框
                        </button>
                    )}
                    <button onClick={handleHide} className="pet-menu-item pet-menu-item-danger">
                        隐藏桌宠
                    </button>
                </div>
            )}

            {showQuoteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleCloseQuoteModal}>
                    <div
                        className="bg-white dark:bg-slate-800 rounded-xl max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-6 border-b dark:border-slate-700">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">推荐语录</h3>
                                <button
                                    onClick={handleCloseQuoteModal}
                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-2xl font-bold leading-none"
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                个人收集能力有限，如果你有有趣的语录想要添加，可以通过以下方式提交：
                            </p>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <span className="text-blue-600 dark:text-blue-400 font-mono text-sm">GitHub</span>
                                    <a
                                        href="https://github.com/Evelynall/ASoul-Calendar"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex-1 truncate"
                                    >
                                        github.com/Evelynall/ASoul-Calendar
                                    </a>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                    <span className="text-green-600 dark:text-green-400 font-mono text-sm">Email</span>
                                    <span className="text-sm text-slate-700 dark:text-slate-300 flex-1">
                                        Evelynalll@outlook.com
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                    <span className="text-purple-600 dark:text-purple-400 font-mono text-sm">B站</span>
                                    <a
                                        href="https://space.bilibili.com/33374590"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-purple-600 dark:text-purple-400 hover:underline flex-1 truncate"
                                    >
                                        space.bilibili.com/33374590
                                    </a>
                                </div>
                            </div>

                            <div className="border-t dark:border-slate-700 pt-4">
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                                    提交格式：
                                </p>

                                <div className="space-y-3">
                                    <div>
                                        <button
                                            onClick={() => {
                                                const el = document.getElementById('json-format');
                                                el.style.display = el.style.display === 'none' ? 'block' : 'none';
                                            }}
                                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                        >
                                            <span>📋 JSON 格式（完整）</span>
                                        </button>
                                        <div id="json-format" className="hidden mt-2 p-3 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-x-auto">
                                            <pre className="text-xs text-slate-700 dark:text-slate-300 font-mono whitespace-pre-wrap">
                                                {`{
  "character": "嘉然",
  "content": [
    { "text": "这是一段文字", "style": { "fontSize": "13px", "color": "#ff6b9d" } },
    { "type": "link", "text": "点击跳转", "url": "https://example.com" }
  ],
  "onClick": null,
  "closeOnClick": true
}`}
                                            </pre>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            ✏️ 文字说明（简单）：
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 pl-3">
                                            角色：嘉然<br />
                                            内容：今天也要元气满满哦！<br />
                                            样式（可选）：粉色、加粗
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t dark:border-slate-700 pt-4">
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                    支持的功能：
                                </p>
                                <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1 list-disc list-inside">
                                    <li><strong>加粗</strong></li>
                                    <li><strong>颜色</strong>：支持十六进制颜色值（如 #ff6b9d）</li>
                                    <li><strong>超链接</strong>：可添加跳转链接</li>
                                    <li><strong>点击事件</strong>：如播放音效等</li>
                                    <li><strong>角色专属</strong>：指定角色或设置为 all（通用）</li>
                                </ul>
                            </div>

                            <div className="text-xs text-slate-500 dark:text-slate-400 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                                💡 提示：推荐与A-SOUL成员相关的有趣梗、经典台词或正能量语录
                            </div>
                        </div>
                        <div className="p-4 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                            <button
                                onClick={handleCloseQuoteModal}
                                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                            >
                                我知道了
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Pet;
