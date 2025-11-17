(async function () {
    const video = document.querySelector("video");
    if (!video) return;

    const bvid = location.pathname.split("/")[2];
    const key = "progress_" + bvid;

    // 判断是否在稍后再看
    const isWatchLater = await checkWatchLater(bvid);
    if (!isWatchLater) return;

    // 恢复进度
    chrome.storage.local.get([key], (res) => {
        const saved = res[key];
        if (saved) {
            // 视频必须 loaded 才能设置
            video.addEventListener("loadedmetadata", () => {
                video.currentTime = saved;
            });
        }
    });

    function save() {
        chrome.storage.local.set({ [key]: video.currentTime });
    }

    // 更精准
    video.addEventListener("pause", save);
    window.addEventListener("beforeunload", save);

    // 定时器兜底
    setInterval(save, 5000);
})();
