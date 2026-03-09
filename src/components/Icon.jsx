import { Fragment } from 'react';

const Icon = ({ name, className = "w-4 h-4" }) => {
    const icons = {
        calendar:
            <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />,
        settings: (
            <Fragment>
                <path
                    d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z" />
                <circle cx="12" cy="12" r="3" />
            </Fragment>
        ),
        palette: (
            <Fragment>
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74" />
                <path d="M12 22a7 7 0 0 0 7-7c0-2.38-1.19-4.47-3-5.74" />
            </Fragment>
        ),
        x:
            <path d="M18 6 6 18M6 6l12 12" />,
        moon:
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />,
        sun: (
            <Fragment>
                <circle cx="12" cy="12" r="4" />
                <path
                    d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
            </Fragment>
        ),
        "chevron-left":
            <path d="m15 18-6-6 6-6" />,
        "chevron-right":
            <path d="m9 18 6-6-6-6" />,
        "check-circle-2": (
            <Fragment>
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                <path d="m9 12 2 2 4-4" />
            </Fragment>
        ),
        "message-square":
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
        plus:
            <path d="M5 12h14M12 5v14" />,
        refresh:
            <path
                d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8m0 0V3m0 5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16m0 0v5m0-5h5" />
        ,
        download:
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />,
        upload:
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />,
        "trash-2": (
            <Fragment>
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
            </Fragment>
        ),
        search: (
            <Fragment>
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
            </Fragment>
        ),
        "calendar-days": (
            <Fragment>
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                <line x1="16" x2="16" y1="2" y2="6" />
                <line x1="8" x2="8" y1="2" y2="6" />
                <line x1="3" x2="21" y1="10" y2="10" />
                <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" />
            </Fragment>
        ),
        bilibili: (
            <Fragment>
                <path d="M12 3L9 1M12 3l3-2" />
                <rect x="3" y="6" width="18" height="14" rx="3" />
                <path d="M8 12c.5 0 1 .5 1 1s-.5 1-1 1-1-.5-1-1 .5-1 1-1zm8 0c.5 0 1 .5 1 1s-.5 1-1 1-1-.5-1-1 .5-1 1-1z" />
                <path d="M9 17h6" />
            </Fragment>
        ),
        link:
            <path
                d="M 13 12 L 13 3 C 20 3 20 12 13 12 L 22 12 C 22 19 13 19 13 12 L 13 21 C 6 21 6 12 13 12 L 4 12 C 4 5 13 5 13 12" />
        ,
        "external-link":
            <path
                d="m 4 18 C 4 14 5 9 11 9 L 11 6 C 11 4 12 4 19 10 C 20 11 20 11 19 12 C 12 19 11 19 11 17 L 11 14 C 9 14 6 14 4 18" />
        ,
        star:
            <path d="m 5 21 C 13 17 9 17 17 21 C 16 12 15 15 20 10 C 12 9 15 11 11 3 C 7 11 10 9 2 10 C 7 15 6 12 5 21" />
    };
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" className={className}>
            {icons[name] || null}
        </svg>
    );
};

export default Icon;
