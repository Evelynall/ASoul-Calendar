-- 创建 A-SOUL 日程同步数据表
-- 在 Supabase SQL Editor 中执行此脚本

-- 创建表
CREATE TABLE IF NOT EXISTS asoul_sync_data (
    id BIGSERIAL PRIMARY KEY,
    sync_id TEXT NOT NULL UNIQUE,
    user_data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_sync_id ON asoul_sync_data(sync_id);
CREATE INDEX IF NOT EXISTS idx_updated_at ON asoul_sync_data(updated_at);

-- 添加注释
COMMENT ON TABLE asoul_sync_data IS 'A-SOUL 日程表用户数据同步表';
COMMENT ON COLUMN asoul_sync_data.sync_id IS '同步ID，用于区分不同用户';
COMMENT ON COLUMN asoul_sync_data.user_data IS '用户数据JSON';
COMMENT ON COLUMN asoul_sync_data.updated_at IS '最后更新时间';
COMMENT ON COLUMN asoul_sync_data.created_at IS '创建时间';

-- 启用行级安全策略（RLS）
ALTER TABLE asoul_sync_data ENABLE ROW LEVEL SECURITY;

-- 创建策略：允许所有人读取和写入（因为使用 sync_id 进行隔离）
-- 注意：这是一个简化的策略，实际生产环境中应该使用更严格的认证机制
CREATE POLICY "允许所有操作" ON asoul_sync_data
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 或者使用更安全的策略（推荐）：
-- 只允许用户访问自己 sync_id 的数据
-- 注意：这需要在应用层传递 sync_id 作为查询条件
-- CREATE POLICY "用户只能访问自己的数据" ON asoul_sync_data
--     FOR ALL
--     USING (sync_id = current_setting('app.current_sync_id', true))
--     WITH CHECK (sync_id = current_setting('app.current_sync_id', true));
