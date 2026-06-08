import { changelogData } from './changelog-data';

const STORAGE_KEY = 'changelog_lastViewedMajorVersion';

export const compareVersions = (v1, v2) => {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
        const num1 = parts1[i] || 0;
        const num2 = parts2[i] || 0;
        if (num1 > num2) return 1;
        if (num1 < num2) return -1;
    }
    return 0;
};

export const getLatestMajorVersion = () => {
    const majorVersions = changelogData
        .filter(log => log.type === 'major')
        .map(log => log.version);

    if (majorVersions.length === 0) return null;

    return majorVersions.reduce((latest, current) =>
        compareVersions(current, latest) > 0 ? current : latest
    );
};

export const checkUnreadMajorUpdate = () => {
    const latestMajor = getLatestMajorVersion();
    if (!latestMajor) return null;

    const lastViewed = localStorage.getItem(STORAGE_KEY);
    if (!lastViewed) return latestMajor;

    if (compareVersions(latestMajor, lastViewed) > 0) {
        return latestMajor;
    }

    return null;
};

export const markChangelogAsRead = () => {
    const latestMajor = getLatestMajorVersion();
    if (latestMajor) {
        localStorage.setItem(STORAGE_KEY, latestMajor);
    }
};
