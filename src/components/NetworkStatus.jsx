import { useState, useEffect } from 'react';

const NetworkStatus = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showOfflineMessage, setShowOfflineMessage] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            setShowOfflineMessage(false);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowOfflineMessage(true);
            // 3秒后自动隐藏离线提示
            setTimeout(() => setShowOfflineMessage(false), 3000);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (!showOfflineMessage && isOnline) return null;

    return (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg transition-all duration-300 ${isOnline
                ? 'bg-green-500 text-white'
                : 'bg-orange-500 text-white'
            }`}>
            {isOnline ? (
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>网络已连接</span>
                </div>
            ) : (
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full opacity-50"></div>
                    <span>网络连接中断，使用离线模式</span>
                </div>
            )}
        </div>
    );
};

export default NetworkStatus;