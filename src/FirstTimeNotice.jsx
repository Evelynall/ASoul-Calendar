import { useState, useEffect } from 'react';
import './FirstTimeNotice.css';

const NOTICE_SHOWN_KEY = 'asoul_first_time_notice_shown';

const FirstTimeNotice = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // 检查是否已经显示过弹窗
        const hasShown = localStorage.getItem(NOTICE_SHOWN_KEY);
        if (!hasShown) {
            setIsVisible(true);
        }
    }, []);

    const handleClose = () => {
        // 标记为已显示
        localStorage.setItem(NOTICE_SHOWN_KEY, 'true');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="notice-overlay">
            <div className="notice-modal">
                <div className="notice-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                        <path d="M12 8v4" />
                        <path d="M12 16h.01" />
                    </svg>
                </div>
                <h2 className="notice-title">重要提示</h2>
                <p className="notice-message">
                    您的数据很重要！请时常用导出本地备份的按钮备份数据。
                </p>
                <button className="notice-button" onClick={handleClose}>
                    我知道了
                </button>
            </div>
        </div>
    );
};

export default FirstTimeNotice;
