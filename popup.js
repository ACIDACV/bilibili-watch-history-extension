const listEl = document.getElementById("list");
const searchEl = document.getElementById("search");

function render(items) {
    listEl.innerHTML = "";

    for (const [key, item] of Object.entries(items)) {
        const div = document.createElement("div");
        div.className = "item";
        div.innerHTML = `
            <b>${item.bvid}</b>（P${item.p}）
            <br>进度：${formatTime(item.time)}
            <br><small>${new Date(item.updated).toLocaleString()}</small>
        `;

        listEl.appendChild(div);
    }
}

function formatTime(t) {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
}

function load() {
    chrome.storage.local.get(null, items => {
        const keyword = searchEl.value.trim();
        let filtered = items;

        if (keyword) {
            filtered = Object.fromEntries(
                Object.entries(items).filter(([k, v]) =>
                    k.includes(keyword) ||
                    v.bvid.includes(keyword) ||
                    String(v.p) === keyword
                )
            );
        }

        render(filtered);
    });
}

searchEl.oninput = load;

document.getElementById("clear").onclick = () => {
    if (confirm("确认清空全部记录？")) chrome.storage.local.clear(load);
};

document.getElementById("export").onclick = () => {
    chrome.storage.local.get(null, items => {
        const blob = new Blob([JSON.stringify(items)], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "bwh-export.json";
        a.click();

        URL.revokeObjectURL(url);
    });
};

document.getElementById("import").onclick = () => {
    const input = document.createElement("input");
    input.type = "file";

    input.onchange = () => {
        const file = input.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            try {
                const data = JSON.parse(reader.result);
                chrome.storage.local.set(data, load);
            } catch {
                alert("文件格式错误");
            }
        };
        reader.readAsText(file);
    };

    input.click();
};

load();
