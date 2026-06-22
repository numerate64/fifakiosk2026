(() => {
  const render = () => {
    if (window.twemoji) {
      window.twemoji.parse(document.body, { folder: "svg", ext: ".svg" });
    }
  };
  const start = () => {
    const style = document.createElement("style");
    style.textContent = "img.emoji{height:1em;width:1em;margin:0 .06em;vertical-align:-.12em}";
    document.head.append(style);
    render();
    let queued = false;
    new MutationObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; render(); });
    }).observe(document.body, { childList: true, characterData: true, subtree: true });
  };
  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", start, { once: true })
    : start();
})();
