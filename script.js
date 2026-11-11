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

const testimonyForm = document.querySelector("#testimony-form");
const testimonyButton = testimonyForm.querySelector('button[type="submit"]');
const testimonyStatus = document.querySelector("#testimony-status");
const testimonyButtonLabel = testimonyButton.innerHTML;

testimonyForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!testimonyForm.reportValidity()) return;

  testimonyButton.disabled = true;
  testimonyButton.setAttribute("aria-busy", "true");
  testimonyButton.innerHTML =
    'Submitting… <span class="submit-spinner" aria-hidden="true"></span>';
  testimonyStatus.textContent = "Sending your testimony…";
  testimonyStatus.dataset.state = "pending";

  try {
    const response = await fetch(testimonyForm.action, {
      method: testimonyForm.method.toUpperCase(),
      body: new FormData(testimonyForm),
      headers: { Accept: "application/json" },
    });

    if (!response.ok) throw new Error(`Form submission failed (${response.status})`);

    testimonyStatus.textContent = "Thank you. Your testimony has been sent to Rhoda.";
    testimonyStatus.dataset.state = "success";
    testimonyForm.reset();
  } catch (error) {
    testimonyStatus.textContent =
      "We couldn’t send your testimony. Please check your connection and try again.";
    testimonyStatus.dataset.state = "error";
  } finally {
    testimonyButton.disabled = false;
    testimonyButton.removeAttribute("aria-busy");
    testimonyButton.innerHTML = testimonyButtonLabel;
  }
});

const countNodes = document.querySelectorAll("[data-download-count]");
const downloadLinks = document.querySelectorAll(
  ".download-trigger, #download-link",
);
const downloadNote = document.querySelector("#download-note");

function showDownloadCount(value) {
  countNodes.forEach((node) => {
    node.textContent = Number(value).toLocaleString();
    node.dataset.countState = "ready";
  });
}

fetch("/api/downloads")
  .then((response) => {
    if (!response.ok) throw new Error("Counter unavailable");
    return response.json();
  })
  .then((data) => showDownloadCount(data.downloads))
  .catch(() => {
    countNodes.forEach((node) => {
      node.textContent = "—";
      node.dataset.countState = "unavailable";
    });
    if (downloadNote) {
      downloadNote.textContent = "Download count will appear when the site database is connected.";
    }
  });

downloadLinks.forEach((downloadLink) => {
  downloadLink.addEventListener("click", () => {
    fetch("/api/downloads", { method: "POST" })
      .then((response) => {
        if (!response.ok) throw new Error("Counter unavailable");
        return response.json();
      })
      .then((data) => {
        showDownloadCount(data.downloads);
        if (downloadNote) downloadNote.textContent = "Your download is starting.";
      })
      .catch(() => {
        if (downloadNote) downloadNote.textContent = "Your book download is starting. The shared count could not update.";
      });
  });
});
