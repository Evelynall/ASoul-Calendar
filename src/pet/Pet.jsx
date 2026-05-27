import { useState, useEffect, useRef } from 'react';
import './Pet.css';

const PET_WIDTH = 200;
const PET_HEIGHT = 200;
const CHARACTERS = ['贝拉', '嘉然', '乃琳', '心宜', '思诺'];

const Pet = ({ isEnabled, onToggleEnabled }) => {
    const getDefaultPosition = () => {
        const saved = localStorage.getItem('pet_position');
        if (saved) {
            const pos = JSON.parse(saved);
            if (pos.unit === '%') {
                return pos;
            }
        }
        return { x: 88, y: 75, unit: '%' };
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

    const petRef = useRef(null);
    const lastMousePos = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const handleMouseDown = (e) => {
        if (e.button === 0) {
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

    const handleMouseMove = (e) => {
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
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

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
        setPosition({ x: 88, y: 75, unit: '%' });
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
    }, [isDragging, dragOffset, position, isMenuOpen]);

    useEffect(() => {
        localStorage.setItem('pet_position', JSON.stringify(position));
    }, [position]);

    if (!isEnabled || isMobile) return null;

    return (
        <div className="pet-container">
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
                    <button onClick={handleHide} className="pet-menu-item pet-menu-item-danger">
                        隐藏桌宠
                    </button>
                </div>
            )}
        </div>
    );
};

export default Pet;
