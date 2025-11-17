// 获取视频信息（带缓存）
async function getVideoInfo(bvid) {
    const cacheKey = "cache_info_" + bvid;

    // 读取缓存
    const cache = await chrome.storage.local.get([cacheKey]);
    if (cache[cacheKey]) return cache[cacheKey];

    // 请求接口
    const url = `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`;
    try {
        const res = await fetch(url);
        const json = await res.json();

        if (json.code === 0) {
            const info = {
                title: json.data.title,
                cover: json.data.pic
            };
            chrome.storage.local.set({ [cacheKey]: info });
            return info;
        }
    } catch (e) {}

    return { title: bvid, cover: "" };
}

// 更稳定的“是否在稍后再看”
async function checkWatchLater(bvid) {
    try {
        const res = await fetch("https://api.bilibili.com/x/v2/history/toview");
        const json = await res.json();
        if (json.code === 0) {
            return json.data.list.some(v => v.bvid === bvid);
        }
    } catch (e) {}
    return false;
}
