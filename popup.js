function formatTime(t) {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
}

async function loadList(keyword = "") {
    chrome.storage.local.get(null, async (data) => {
        const listEl = document.getElementById("list");
        listEl.innerHTML = "";

        const entries = Object.entries(data).filter(([k]) =>
            k.startsWith("progress_")
        );

        const items = [];

        for (const [key, time] of entries) {
            const bvid = key.replace("progress_", "");
            if (bvid.includes(keyword)) {
                const info = await getVideoInfo(bvid);
                items.push({ bvid, time, ...info });
            }
        }

        items.sort((a, b) => b.time - a.time);

        if (items.length === 0) {
            document.getElementById("empty").style.display = "block";
            return;
        }
        document.getElementById("empty").style.display = "none";

        items.forEach(item => {
            const card = document.createElement("div");
            card.className = "card";
            card.onclick = () => {
                chrome.tabs.create({
                    url: `https://www.bilibili.com/video/${item.bvid}`
                });
            };

            const percent = Math.min(100, (item.time / 3600) * 5); // 简易估算

            card.innerHTML = `
                <img src="${item.cover}">
                <div class="info">
                    <div class="title">${item.title}</div>
                    <div class="time">观看进度：${formatTime(item.time)}</div>
                    <div class="progress-bar">
                        <div class="progress-inner" style="width:${percent}%"></div>
                    </div>
                </div>
                <button class="del-btn">删除</button>
            `;

            card.querySelector(".del-btn").onclick = (e) => {
                e.stopPropagation();
                chrome.storage.local.remove("progress_" + item.bvid, () => loadList(keyword));
            };

            listEl.appendChild(card);
        });
    });
}

// 搜索
document.getElementById("search").addEventListener("input", (e) => {
    loadList(e.target.value);
});

// 导出
document.getElementById("export").onclick = () => {
    chrome.storage.local.get(null, (data) => {
        const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        chrome.downloads.download({
            url,
            filename: "bilibili_progress_backup.json"
        });
    });
};

// 导入
document.getElementById("import").onclick = () =>
    document.getElementById("importFile").click();

document.getElementById("importFile").onchange = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = () => {
        const json = JSON.parse(reader.result);
        chrome.storage.local.set(json, () => loadList());
    };

    reader.readAsText(file);
};

// 清理已看完（进度大于166分钟直接视为看完）
document.getElementById("clearFinished").onclick = async () => {
    chrome.storage.local.get(null, (data) => {
        for (const [k, v] of Object.entries(data)) {
            if (k.startsWith("progress_") && v > 9999) {
                chrome.storage.local.remove(k);
            }
        }
        loadList();
    });
};

loadList();
