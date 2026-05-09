// 更新日志数据
export const changelogData = [
    {
        version: '1.3.0',
        date: '2026-05-09',
        type: 'major', // major, minor, patch
        changes: [
            { type: 'feature', text: '添加链接参数，可通过https://www.evelynal.top/ASoul-Calendar/?set_link=[日程id]&link=[链接]的格式为日程添加跳转链接' },
            { type: 'feature', text: '新增对应的篡改猴脚本<a href="https://greasyfork.org/zh-CN/scripts/577237-%E6%9E%9D%E6%B1%9F%E8%BF%BD%E7%95%AA%E8%A1%A8%E8%BF%9B%E5%BA%A6%E4%BF%9D%E5%AD%98%E8%84%9A%E6%9C%AC">枝江追番表进度保存脚本</a>，在录播视频标题将会显示一个按钮，用于快捷保存观看进度至对应日程' },
            { type: 'feature', text: '修复了大多数情况下部分视频(特别是官方录播)跳转时显示视频已失效的问题' },
            { type: 'feature', text: '一些骚扰：当有未查看的重大更新时会有一个小的弹窗提示' }
        ]
    }, {
        version: '1.2.8',
        date: '2026-05-08',
        type: 'minor', // major, minor, patch
        changes: [
            { type: 'feature', text: '快捷链接添加枝江五人的录播链接' }
        ]
    }, {
        version: '1.2.7',
        date: '2026-04-02',
        type: 'minor', // major, minor, patch
        changes: [
            { type: 'feature', text: '添加失效日程同步功能，现在因故移动、请假的日程会同步点灰，若有说明会在注释中显示。（数据手动同步，无法保证时效性）' }
        ]
    }, {
        version: '1.2.6',
        date: '2026-03-27',
        type: 'minor', // major, minor, patch
        changes: [
            { type: 'feature', text: '日历视图添加快捷拉取日程按钮' },
            { type: 'feature', text: '日历视图添加两个云同步的上传按钮，整合上传与导出为数据同步按钮' }
        ]
    }, {
        version: '1.2.5',
        date: '2026-03-27',
        type: 'patch', // major, minor, patch
        changes: [
            { type: 'feature', text: '优化拉取逻辑，避免中转站的缓存导致日程更新延迟' }
        ]
    },
    {
        version: '1.2.4',
        date: '2026-03-18',
        type: 'patch', // major, minor, patch
        changes: [
            { type: 'feature', text: '优化拉取逻辑，现在能更及时的收到更新日程了' }
        ]
    },
    {
        version: '1.2.3',
        date: '2026-03-17',
        type: 'patch', // major, minor, patch
        changes: [
            { type: 'feature', text: '修复了可能拉取失败的问题，提高了拉取基础数据库的频率' }
        ]
    },
    {
        version: '1.2.2',
        date: '2026-03-10',
        type: 'patch', // major, minor, patch
        changes: [
            { type: 'feature', text: '修复了组合色的部分逻辑，现在已经可以选择是否开启组合色了。' }
        ]
    },
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
