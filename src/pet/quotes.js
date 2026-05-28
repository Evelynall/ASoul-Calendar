const QUOTES = [
    {
        character: "all",
        content: [
            { text: "会者不难🤚难者也不会🦽", style: {"fontSize":"14px","color":"#ff6b9d"} }
        ],
        onClick: null,
        closeOnClick: true
    },

    {
        character: "all",
        content: [
            { text: "A-SOUL时代，沸腾期待", style: {"fontSize":"13px"} }
        ],
        onClick: null,
        closeOnClick: true
    },

    {
        character: "嘉然",
        content: [
            { text: "(是谁说的)嘉心糖屁用没有", style: {"fontSize":"13px","color":"#ff6b9d"} }
        ],
        onClick: null,
        closeOnClick: true
    },

    {
        character: "贝拉",
        content: [
            { text: "(晕3D,于是转身向红潮走去)", style: {"fontSize":"13px","color":"#ff4278"} }
        ],
        onClick: null,
        closeOnClick: true
    },

    {
        character: "乃琳",
        content: [
            { text: "好想做嘉然小姐的狗啊……", style: {"fontSize":"13px","color":"#9b59b6"} }
        ],
        onClick: null,
        closeOnClick: true
    },

    {
        character: "心宜",
        content: [
            { text: "我这么好懂吗？(嚼嚼嚼)", style: {"fontSize":"13px","color":"#ff85eb"} }
        ],
        onClick: null,
        closeOnClick: true
    },

    {
        character: "思诺",
        content: [
            { text: "我不喜欢市区，我喜欢郊区", style: {"fontSize":"13px","color":"#3498db"} }
        ],
        onClick: null,
        closeOnClick: true
    },

    {
        character: "all",
        content: [
            { text: "记得按时吃饭哦~", style: {"fontSize":"13px"} }
        ],
        onClick: null,
        closeOnClick: true
    },

    {
        character: "贝拉",
        content: [
            { text: "好想做嘉然小姐的狗啊……", style: {"fontSize":"14px","fontWeight":"bold","color":"#9ed5ff"} }
        ],
        onClick: null,
        closeOnClick: true
    },

    {
        character: "心宜",
        content: [
            { text: "胡萝卜不是动物吗？", style: {"fontSize":"13px","color":"#ffadfc"} }
        ],
        onClick: null,
        closeOnClick: true
    },

    {
        character: "心宜",
        content: [
            { text: "梅雨季不是季节吗？", style: {"fontSize":"13px","color":"#ff8fbc"} }
        ],
        onClick: null,
        closeOnClick: true
    },

    {
        character: "思诺",
        content: [
            { text: "御姐心宜到底在哪？", style: {"fontSize":"13px","color":"#347aea"} }
        ],
        onClick: null,
        closeOnClick: true
    },

    {
        character: "乃琳",
        content: [
            { text: "0/28 加 6选5不中很难得好不好！", style: {"fontSize":"13px","color":"#ff8080"} }
        ],
        onClick: null,
        closeOnClick: true
    },

    {
        character: "嘉然",
        content: [
            { text: "乃琳团子快跑什么冠军？", style: {"fontSize":"13px","color":"#ffcd9e"} }
        ],
        onClick: null,
        closeOnClick: true
    },

    {
        character: "乃琳",
        content: [
            { text: "想喊妈妈大大方方喊", style: {"fontSize":"13px","color":"#8fbaff"} }
        ],
        onClick: null,
        closeOnClick: true
    },

    {
        character: "乃琳",
        content: [
            { text: "能过就能过，也可以过是什么意思", style: {"fontSize":"13px","color":"#ff3d3d"} }
        ],
        onClick: null,
        closeOnClick: true
    },

    {
        character: "贝拉",
        content: [
            { text: "劳资蜀道山！", style: {"fontSize":"13px","color":"#ff2929"} }
        ],
        onClick: null,
        closeOnClick: true
    },

    {
        character: "乃琳",
        content: [
            { text: "尝尝咸淡！", style: {"fontSize":"13px","color":"#adcdff"} }
        ],
        onClick: null,
        closeOnClick: true
    },

    {
        character: "贝拉",
        content: [
            { text: "(x", style: {"fontSize":"13px"} }
        ],
        onClick: null,
        closeOnClick: true
    },

    {
        character: "嘉然",
        content: [
            { text: "警告一次", style: {"fontSize":"13px","color":"#ff7575"} }
        ],
        onClick: null,
        closeOnClick: true
    },

    {
        character: "贝拉",
        content: [
            { text: "你们都是我的翅膀😭", style: {"fontSize":"13px","color":"#bdd6ff"} }
        ],
        onClick: null,
        closeOnClick: true
    },

    {
        character: "贝拉",
        content: [
            { text: "别拿锤子，平底锅也不行！", style: {"fontSize":"13px","color":"#75aaff"} }
        ],
        onClick: null,
        closeOnClick: true
    },

    {
        character: "贝拉",
        content: [
            { text: "贝极星真的不想跟我围着篝火跳舞嘛😭", style: {"fontSize":"13px","color":"#ffa27a"} }
        ],
        onClick: null,
        closeOnClick: true
    },

    {
        character: "嘉然",
        content: [
            { text: "猛兽苏醒了！😠", style: {"fontSize":"13px","color":"#ff674d"} }
        ],
        onClick: null,
        closeOnClick: true
    },

    {
        character: "嘉然",
        content: [
            { text: "是啊吃什么？", style: {"fontSize":"13px","color":"#ff7ace"} }
        ],
        onClick: null,
        closeOnClick: true
    },

    {
        character: "嘉然",
        content: [
            { text: "我好紧张(心率70", style: {"fontSize":"13px","color":"#b8d3ff"} }
        ],
        onClick: null,
        closeOnClick: true
    },

    {
        character: "心宜",
        content: [
            { text: "今晚一起看完电影的人都是过命的交情🤝", style: {"fontSize":"13px","color":"#ff75b8"} }
        ],
        onClick: null,
        closeOnClick: true
    }
];

const DEFAULT_QUOTE_CONFIG = {
    minInterval: 30000,
    maxInterval: 120000,
    enabled: true
};

const QUOTE_CONFIG_STORAGE_KEY = 'quote_config';

function getQuoteConfig() {
    try {
        const saved = localStorage.getItem(QUOTE_CONFIG_STORAGE_KEY);
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (e) {
        console.warn('Failed to load quote config from localStorage');
    }
    return { ...DEFAULT_QUOTE_CONFIG };
}

function saveQuoteConfig(config) {
    try {
        localStorage.setItem(QUOTE_CONFIG_STORAGE_KEY, JSON.stringify(config));
    } catch (e) {
        console.warn('Failed to save quote config to localStorage');
    }
}

export { QUOTES, DEFAULT_QUOTE_CONFIG, getQuoteConfig, saveQuoteConfig };
export default QUOTES;