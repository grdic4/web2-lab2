(function () {
  function postToggle(key, value) {
    return fetch("/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body:
        "key=" +
        encodeURIComponent(key) +
        "&value=" +
        encodeURIComponent(value),
      credentials: "same-origin",
    }).then((r) => r.json());
  }

  function init() {
    var elX = document.getElementById("toggle-xss");
    var elB = document.getElementById("toggle-bac");
    var delBtn = document.getElementById("btn-delete-all");
    var outDel = document.getElementById("delete-result");
    const form = document.getElementById("comment-form");

    if (elX) {
      elX.addEventListener("change", async function (e) {
        try {
          const json = await postToggle("xssEnabled", e.target.checked);
          const xssStatus = document.getElementById("xss-status");
          if (xssStatus && json.toggles) {
            xssStatus.textContent = json.toggles.xssEnabled
              ? "Nesigurno"
              : "Sigurno";
          }
        } catch (err) {
          console.error(err);
          alert("Error toggling XSS.");
        }
      });
    }

    if (elB) {
      elB.addEventListener("change", async function (e) {
        try {
          const json = await postToggle(
            "brokenAccessEnabled",
            e.target.checked
          );
          const bacStatus = document.getElementById("bac-status");
          if (bacStatus && json.toggles) {
            bacStatus.textContent = json.toggles.brokenAccessEnabled
              ? "Nesigurno"
              : "Sigurno";
          }
        } catch (err) {
          console.error(err);
          alert("Error toggling BAC.");
        }
      });
    }

    async function sendComment(author, content) {
      try {
        const body =
          "author=" +
          encodeURIComponent(author) +
          "&content=" +
          encodeURIComponent(content);
        const res = await fetch(form.action, {
          method: form.method || "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: body,
          credentials: "same-origin",
        });
        location.reload();
      } catch (err) {
        console.error(err);
        console.log("Greška kod slanja: " + err.message);
      }
    }

    async function sendDelete() {
      try {
        const res = await fetch("/admin/delete-all", {
          method: "DELETE",
          credentials: "same-origin",
        });
        const text = await res.text();
        let body;
        try {
          body = JSON.parse(text);
        } catch (e) {
          body = text;
        }
        const commentsContainer = document.querySelectorAll(".comment");
        commentsContainer.forEach((el) => el.remove());
        if (res.ok) outDel.textContent = body.message || JSON.stringify(body);
        else outDel.textContent = body.error || JSON.stringify(body);
      } catch (err) {
        console.log(err);
      }
    }
    if (form)
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        const author =
          form.author && form.author.value ? form.author.value : "anon";
        const content =
          form.content && form.content.value ? form.content.value : "";
        sendComment(author, content);
      });

    if (delBtn) delBtn.addEventListener("click", sendDelete);
    window.sendDelete = sendDelete;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
