// 判断是否在稍后再看列表中
async function isInWatchLater() {
    try {
        const res = await fetch("https://api.bilibili.com/x/v2/history/toview");
        const data = await res.json();
        if (!data.data || !data.data.list) return false;

        const list = data.data.list;
        const aid = unsafeWindow.aid || window.aid || null;

        return list.some(item => item.aid === aid);
    } catch (e) {
        console.warn("稍后再看状态判断失败", e);
        return false;
    }
}

// 解析视频信息（含多 P）
function getVideoInfo() {
    const url = location.href;

    const match = url.match(/\/video\/(BV[\w]+)/);
    if (!match) return null;

    const bvid = match[1];

    let p = 1;
    try {
        const search = new URL(url).searchParams;
        p = parseInt(search.get("p") || "1", 10);
    } catch (e) {}

    return {
        key: `${bvid}_p${p}`,
        bvid,
        p
    };
}

export { isInWatchLater, getVideoInfo };
