import { useState } from 'react';
import Icon from './Icon';

const SettingsSection = ({ title, icon, iconColor, description, children }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <section className="rounded-2xl bg-white dark:bg-slate-900 border dark:border-slate-800 shadow-sm overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <Icon name={icon} className={`w-5 h-5 ${iconColor}`} />
                    <div className="text-left">
                        <h3 className="font-bold text-lg">{title}</h3>
                        {description && (
                            <p className="text-xs text-slate-500 mt-0.5">{description}</p>
                        )}
                    </div>
                </div>
                <Icon
                    name="chevron-right"
                    className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                />
            </button>
            {isOpen && (
                <div className="px-6 pb-6">
                    {children}
                </div>
            )}
        </section>
    );
};

export default SettingsSection;
