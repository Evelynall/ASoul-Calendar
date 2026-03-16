// 更新日志数据
export const changelogData = [
    {
        version: '1.2.1',
        date: '2026-03-10',
        type: 'patch', // major, minor, patch
        changes: [
            { type: 'feature', text: '基础日程库修改为加速链接，国内访问更稳定。感谢A-SOUL导航站运营者 @和泉-紗霧 的指导。' }
        ]
    },
    {
        version: '1.2.0',
        date: '2026-03-09',
        type: 'minor', // major, minor, patch
        changes: [
            { type: 'feature', text: '测试更新：添加快捷链接界面，可以跳转到现在已经没有直接入口的成员tag页（功能开发中，暂不支持导出与同步，数据结构可能会有变动，不建议使用自定义添加功能）' }
        ]
    },
    {
        version: '1.1.0',
        date: '2026-03-09',
        type: 'patch', // major, minor, patch
        changes: [
            { type: 'feature', text: '拆分了部分功能，优化了项目的可维护性(优化工程仍在持续中.ing)' }
        ]
    },
    {
        version: '1.0.1',
        date: '2026-03-09',
        type: 'patch', // major, minor, patch
        changes: [
            { type: 'feature', text: '用户数量比预料的要多，加强了浏览器本地数据的稳定性' }
        ]
    },
    {
        version: '1.0.0',
        date: '2026-03-08',
        type: 'major', // major, minor, patch
        changes: [
            { type: 'feature', text: '历经一周开发，项目正式上线' }
        ]
    }
];
