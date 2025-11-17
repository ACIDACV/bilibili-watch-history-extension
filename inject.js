(function () {
    function injectScript(file) {
        const script = document.createElement("script");
        script.src = chrome.runtime.getURL(file);
        document.documentElement.appendChild(script);
    }

    injectScript("utils.js");
})();
