// IndexedDB 存储管理
const DB_NAME = 'asoul_calendar_db';
const DB_VERSION = 2; // 增加版本号以触发升级
const STORE_NAME = 'user_data';

// 打开或创建数据库
const openDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error('[IndexedDB] 打开数据库失败:', request.error);
            reject(request.error);
        };

        request.onsuccess = (event) => {
            const db = event.target.result;

            // 验证对象存储是否存在
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                console.error('[IndexedDB] 对象存储不存在，需要升级数据库');
                db.close();
                reject(new Error('对象存储不存在'));
                return;
            }

            console.log('[IndexedDB] 数据库打开成功');
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            console.log('[IndexedDB] 数据库升级中，版本:', event.oldVersion, '->', event.newVersion);
            const db = event.target.result;

            // 创建对象存储空间（如果不存在）
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
                objectStore.createIndex('timestamp', 'timestamp', { unique: false });
                console.log('[IndexedDB] 对象存储空间创建成功');
            }
        };

        request.onblocked = () => {
            console.warn('[IndexedDB] 数据库升级被阻塞，请关闭其他标签页');
        };
    });
};

// 删除整个数据库（用于重置）
export const deleteDatabase = () => {
    return new Promise((resolve, reject) => {
        console.log('[IndexedDB] 正在删除数据库...');
        const request = indexedDB.deleteDatabase(DB_NAME);

        request.onsuccess = () => {
            console.log('[IndexedDB] 数据库删除成功');
            resolve();
        };

        request.onerror = () => {
            console.error('[IndexedDB] 数据库删除失败:', request.error);
            reject(request.error);
        };

        request.onblocked = () => {
            console.warn('[IndexedDB] 数据库删除被阻塞，请关闭其他标签页');
        };
    });
};

// 保存数据到 IndexedDB
export const saveToIndexedDB = async (key, data) => {
    let db = null;
    try {
        db = await openDB();

        // 再次验证对象存储是否存在
        if (!db.objectStoreNames.contains(STORE_NAME)) {
            throw new Error('对象存储不存在');
        }

        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const objectStore = transaction.objectStore(STORE_NAME);

        const record = {
            key: key,
            data: data,
            timestamp: Date.now()
        };

        const request = objectStore.put(record);

        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                console.log(`[IndexedDB] 数据保存成功: ${key}`);
                resolve();
            };

            request.onerror = () => {
                console.error(`[IndexedDB] 数据保存失败: ${key}`, request.error);
                reject(request.error);
            };

            transaction.oncomplete = () => {
                if (db) db.close();
            };

            transaction.onerror = () => {
                console.error(`[IndexedDB] 事务失败:`, transaction.error);
                if (db) db.close();
                reject(transaction.error);
            };
        });
    } catch (error) {
        console.error('[IndexedDB] 保存操作失败:', error);
        if (db) db.close();
        throw error;
    }
};

// 从 IndexedDB 读取数据
export const loadFromIndexedDB = async (key) => {
    let db = null;
    try {
        db = await openDB();

        if (!db.objectStoreNames.contains(STORE_NAME)) {
            throw new Error('对象存储不存在');
        }

        const transaction = db.transaction([STORE_NAME], 'readonly');
        const objectStore = transaction.objectStore(STORE_NAME);
        const request = objectStore.get(key);

        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                if (request.result) {
                    console.log(`[IndexedDB] 数据读取成功: ${key}`);
                    resolve(request.result.data);
                } else {
                    console.log(`[IndexedDB] 未找到数据: ${key}`);
                    resolve(null);
                }
            };

            request.onerror = () => {
                console.error(`[IndexedDB] 数据读取失败: ${key}`, request.error);
                reject(request.error);
            };

            transaction.oncomplete = () => {
                if (db) db.close();
            };

            transaction.onerror = () => {
                console.error(`[IndexedDB] 事务失败:`, transaction.error);
                if (db) db.close();
                reject(transaction.error);
            };
        });
    } catch (error) {
        console.error('[IndexedDB] 读取操作失败:', error);
        if (db) db.close();
        throw error;
    }
};

// 删除 IndexedDB 中的数据
export const deleteFromIndexedDB = async (key) => {
    let db = null;
    try {
        db = await openDB();

        if (!db.objectStoreNames.contains(STORE_NAME)) {
            throw new Error('对象存储不存在');
        }

        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const objectStore = transaction.objectStore(STORE_NAME);
        const request = objectStore.delete(key);

        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                console.log(`[IndexedDB] 数据删除成功: ${key}`);
                resolve();
            };

            request.onerror = () => {
                console.error(`[IndexedDB] 数据删除失败: ${key}`, request.error);
                reject(request.error);
            };

            transaction.oncomplete = () => {
                if (db) db.close();
            };

            transaction.onerror = () => {
                console.error(`[IndexedDB] 事务失败:`, transaction.error);
                if (db) db.close();
                reject(transaction.error);
            };
        });
    } catch (error) {
        console.error('[IndexedDB] 删除操作失败:', error);
        if (db) db.close();
        throw error;
    }
};

// 获取所有存储的键
export const getAllKeys = async () => {
    let db = null;
    try {
        db = await openDB();

        if (!db.objectStoreNames.contains(STORE_NAME)) {
            throw new Error('对象存储不存在');
        }

        const transaction = db.transaction([STORE_NAME], 'readonly');
        const objectStore = transaction.objectStore(STORE_NAME);
        const request = objectStore.getAllKeys();

        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                console.log('[IndexedDB] 获取所有键成功:', request.result);
                resolve(request.result);
            };

            request.onerror = () => {
                console.error('[IndexedDB] 获取所有键失败:', request.error);
                reject(request.error);
            };

            transaction.oncomplete = () => {
                if (db) db.close();
            };

            transaction.onerror = () => {
                console.error(`[IndexedDB] 事务失败:`, transaction.error);
                if (db) db.close();
                reject(transaction.error);
            };
        });
    } catch (error) {
        console.error('[IndexedDB] 获取键操作失败:', error);
        if (db) db.close();
        throw error;
    }
};
