(function () {
    function injectScript() {
        if (window.__bwh_injected__) return;
        window.__bwh_injected__ = true;

        const script = document.createElement("script");
        script.textContent =
            `
(function () {
    if (window.__bwh_player_hooked__) return;
    window.__bwh_player_hooked__ = true;

    function waitPlayer() {
        const video = document.querySelector("video");
        if (!video) return setTimeout(waitPlayer, 800);

        window.dispatchEvent(new CustomEvent("bwh-player-ready", {
            detail: { video }
        }));
    }
    waitPlayer();
})();
`;
        document.documentElement.appendChild(script);
    }

    injectScript();
})();
