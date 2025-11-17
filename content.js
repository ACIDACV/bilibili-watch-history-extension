import { isInWatchLater, getVideoInfo } from "./utils.js";

(function () {

    let video = null;
    let lastSaved = 0;

    async function init() {
        const info = getVideoInfo();
        if (!info) return;

        if (!(await isInWatchLater())) return;

        window.addEventListener("bwh-player-ready", async (e) => {
            video = document.querySelector("video");
            if (!video) return;

            setupTracker(info);
            checkRestore(info);
        });
    }

    // 恢复进度弹窗
    async function checkRestore(info) {
        chrome.storage.local.get(info.key, res => {
            if (!res[info.key]) return;

            const history = res[info.key];
            if (!history.time || history.time < 5) return;

            showRestoreDialog(history.time, info.key);
        });
    }

    // 弹窗
    function showRestoreDialog(time, key) {
        const box = document.createElement("div");
        box.style = `
            position: fixed;
            top: 80px;
            right: 30px;
            padding: 14px 18px;
            background: #fff;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,.15);
            z-index: 999999;
            font-size: 14px;
        `;

        box.innerHTML = `
            <div>检测到你上次看到：${formatTime(time)}</div>
            <div style="margin-top: 10px; text-align: right;">
                <button id="bwh_continue" style="margin-right: 10px;">继续观看</button>
                <button id="bwh_cancel">取消</button>
            </div>
        `;

        document.body.appendChild(box);

        document.getElementById("bwh_continue").onclick = () => {
            video.currentTime = time;
            box.remove();
        };
        document.getElementById("bwh_cancel").onclick = () => box.remove();
    }

    // 时间格式
    function formatTime(t) {
        const m = Math.floor(t / 60);
        const s = Math.floor(t % 60);
        return `${m}:${s.toString().padStart(2, "0")}`;
    }

    // 记录进度
    function setupTracker(info) {
        setInterval(() => {
            if (!video) return;

            const ct = Math.floor(video.currentTime);

            if (Math.abs(ct - lastSaved) >= 5) {
                lastSaved = ct;
                chrome.storage.local.set({
                    [info.key]: {
                        bvid: info.bvid,
                        p: info.p,
                        time: ct,
                        updated: Date.now()
                    }
                });
            }
        }, 2000);
    }

    init();
})();
