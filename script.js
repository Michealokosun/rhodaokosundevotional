const cover = document.querySelector("#cover-toggle");
const hint = document.querySelector("#cover-hint-text");
cover.addEventListener("click", () => {
  const flipped = cover.classList.toggle("is-flipped");
  cover.setAttribute("aria-pressed", String(flipped));
  cover.setAttribute(
    "aria-label",
    flipped ? "Show front cover" : "Show back cover",
  );
  hint.textContent = flipped
    ? "Tap the cover to return to the front"
    : "Tap the cover to read the back";
});

// This browser-only count is a local estimate. A shared visitor total requires a server-side counter.
const countNodes = document.querySelectorAll("[data-download-count]");
const downloadLinks = document.querySelectorAll(
  ".download-trigger, #download-link",
);
const downloadNote = document.querySelector("#download-note");
const storageKey = "called-for-more-downloads";
const savedCount = String(
  Math.max(50, Number(localStorage.getItem(storageKey) || 50)),
);
localStorage.setItem(storageKey, savedCount);
countNodes.forEach((node) => {
  node.textContent = savedCount;
});

downloadLinks.forEach((downloadLink) => {
  downloadLink.addEventListener("click", (event) => {
    event.preventDefault();
    const fileUrl = new URL(
      downloadLink.getAttribute("href"),
      window.location.href,
    );
    fetch(fileUrl, { method: "HEAD" })
      .then((response) => {
        if (!response.ok) throw new Error("Book file unavailable");
        const next =
          Math.max(50, Number(localStorage.getItem(storageKey) || 50)) + 1;
        localStorage.setItem(storageKey, String(next));
        countNodes.forEach((node) => {
          node.textContent = String(next);
        });
        if (downloadNote) downloadNote.textContent = "Your download is ready.";
        const file = document.createElement("a");
        file.href = fileUrl.href;
        file.download = "called-for-more.pdf";
        file.click();
      })
      .catch(() => {
        if (downloadNote)
          downloadNote.textContent =
            "The book PDF will be available here soon.";
      });
  });
});
