import { isInWatchLater, getVideoInfo } from "./utils.js";

(function () {

    let video = null;
    let lastSaved = 0;

    async function init() {
        const info = getVideoInfo();
        if (!info) return;

        // 使用 BV 判断是否在“稍后再看”
        const inWL = await isInWatchLater(info.bvid);
        if (!inWL) return;

        // 监听来自 inject.js 的事件
        window.addEventListener("bwh-player-ready", () => {
            waitVideoReady(info);
        });
    }

    //--------------------------------------
    // 监听 video 出现（MutationObserver）
    //--------------------------------------
    function waitVideoReady(info) {
        const check = () => {
            const v = document.querySelector("video");
            if (v) {
                video = v;
                setupTracker(info);
                checkRestore(info);
                return true;
            }
            return false;
        };

        if (check()) return;

        const observer = new MutationObserver(() => {
            if (check()) observer.disconnect();
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    //--------------------------------------
    // 恢复进度弹窗
    //--------------------------------------
    function checkRestore(info) {
        chrome.storage.local.get(info.key, res => {
            const history = res[info.key];
            if (!history || !history.time || history.time < 5) return;
            showRestoreDialog(history.time, info.key);
        });
    }

    function showRestoreDialog(time, key) {
    // 半透明背景遮罩
    const mask = document.createElement("div");
    mask.style = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0,0,0,.35);
        backdrop-filter: blur(4px);
        z-index: 999998;
        opacity: 0;
        transition: opacity .25s ease;
    `;

    // 弹窗主体
    const box = document.createElement("div");
    box.style = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        padding: 20px 24px;
        background: #fff;
        border-radius: 14px;
        width: 280px;
        box-shadow: 0 10px 25px rgba(0,0,0,.15);
        z-index: 999999;
        font-size: 15px;
        opacity: 0;
        transition: opacity .3s ease, transform .3s ease;
        transform: translate(-50%, calc(-50% + 15px));
    `;

    box.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 12px; font-size: 16px;">
            恢复观看？
        </div>

        <div style="color: #555; margin-bottom: 18px;">
            上次看到：<b>${formatTime(time)}</b>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 12px;">
            <button id="bwh_cancel"
                style="
                    padding: 6px 14px;
                    font-size: 14px;
                    border-radius: 6px;
                    border: 1px solid #ccc;
                    background: #f7f7f7;
                    cursor: pointer;"
            >取消</button>

            <button id="bwh_continue"
                style="
                    padding: 6px 14px;
                    font-size: 14px;
                    border-radius: 6px;
                    background: #00a1d6;
                    color: #fff;
                    border: none;
                    cursor: pointer;"
            >继续观看</button>
        </div>
    `;

    document.body.appendChild(mask);
    document.body.appendChild(box);

    // 延迟触发动画
    requestAnimationFrame(() => {
        mask.style.opacity = "1";
        box.style.opacity = "1";
        box.style.transform = "translate(-50%, -50%)";
    });

    // 事件
    document.getElementById("bwh_continue").onclick = () => {
        video.currentTime = time;
        closeDialog(box, mask);
    };

    document.getElementById("bwh_cancel").onclick = () => {
        closeDialog(box, mask);
    };
}

function closeDialog(box, mask) {
    mask.style.opacity = "0";
    box.style.opacity = "0";
    box.style.transform = "translate(-50%, calc(-50% + 15px))";

    setTimeout(() => {
        box.remove();
        mask.remove();
    }, 260);
}


    //--------------------------------------
    // 记录进度（每 2 秒检测一次，变化超过 5 秒才写入）
    //--------------------------------------
    function setupTracker(info) {
        setInterval(() => {
            if (!video) return;

            const ct = Math.floor(video.currentTime);
            if (Math.abs(ct - lastSaved) < 5) return;

            lastSaved = ct;

            chrome.storage.local.set({
                [info.key]: {
                    bvid: info.bvid,
                    p: info.p,
                    time: ct,
                    updated: Date.now()
                }
            });

        }, 2000);
    }

    //--------------------------------------
    // 时间格式化
    //--------------------------------------
    function formatTime(t) {
        const m = Math.floor(t / 60);
        const s = Math.floor(t % 60);
        return `${m}:${s.toString().padStart(2, "0")}`;
    }

    init();
})();
