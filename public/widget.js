(function () {
  var WIDGET_ID = "vaigence-chat-widget";
  if (document.getElementById(WIDGET_ID)) return;

  var script = document.currentScript;
  var orgId = script ? script.getAttribute("data-org") || "" : "";
  var API_BASE = script ? (script.getAttribute("data-api") || "") : "";
  var LS_KEY = "vaigence_chat_" + orgId;

  // ---- Styles ----
  var css = `
    #${WIDGET_ID}-btn {
      position: fixed; bottom: 24px; right: 24px; z-index: 99999;
      width: 56px; height: 56px; border-radius: 50%; border: none; cursor: pointer;
      background: #7c3aed; color: #fff; box-shadow: 0 4px 20px rgba(124,58,237,.4);
      display: flex; align-items: center; justify-content: center;
      transition: transform .2s, box-shadow .2s;
    }
    #${WIDGET_ID}-btn:hover { transform: scale(1.08); box-shadow: 0 6px 28px rgba(124,58,237,.55); }
    #${WIDGET_ID}-btn svg { width: 24px; height: 24px; }

    #${WIDGET_ID}-panel {
      position: fixed; bottom: 92px; right: 24px; z-index: 99999;
      width: 350px; height: 450px; border-radius: 16px; overflow: hidden;
      background: #1a1a2e; border: 1px solid #2d2d44;
      box-shadow: 0 8px 40px rgba(0,0,0,.5);
      display: none; flex-direction: column; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    #${WIDGET_ID}-panel.open { display: flex; }

    .vw-header {
      padding: 14px 16px; background: #7c3aed; color: #fff;
      display: flex; align-items: center; justify-content: space-between;
    }
    .vw-header-title { display: flex; align-items: center; gap: 10px; }
    .vw-header-title img { width: 32px; height: 32px; border-radius: 50%; }
    .vw-header-title span { font-size: 14px; font-weight: 600; }
    .vw-close { background: none; border: none; color: #fff; cursor: pointer; font-size: 20px; line-height: 1; padding: 4px; }

    .vw-messages {
      flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 10px;
    }
    .vw-msg { max-width: 80%; padding: 10px 14px; border-radius: 12px; font-size: 13px; line-height: 1.45; word-break: break-word; }
    .vw-msg.sent { align-self: flex-end; background: #7c3aed; color: #fff; border-bottom-right-radius: 4px; }
    .vw-msg.received { align-self: flex-start; background: #2d2d44; color: #e0e0e0; border-bottom-left-radius: 4px; }

    .vw-input-area {
      padding: 12px; border-top: 1px solid #2d2d44; display: flex; gap: 8px; background: #1a1a2e;
    }
    .vw-input-area input {
      flex: 1; height: 38px; border-radius: 8px; border: 1px solid #2d2d44; background: #16162a;
      color: #e0e0e0; padding: 0 12px; font-size: 13px; outline: none;
    }
    .vw-input-area input:focus { border-color: #7c3aed; }
    .vw-input-area input::placeholder { color: #666; }
    .vw-send-btn {
      width: 38px; height: 38px; border-radius: 8px; border: none; cursor: pointer;
      background: #7c3aed; color: #fff; display: flex; align-items: center; justify-content: center;
      transition: background .2s;
    }
    .vw-send-btn:hover { background: #6d28d9; }
    .vw-send-btn:disabled { opacity: .5; cursor: not-allowed; }
  `;

  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  // ---- Load conversation from localStorage ----
  function loadMessages() {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch (e) { return []; }
  }
  function saveMessages(msgs) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(msgs)); } catch (e) {}
  }

  var messages = loadMessages();

  // ---- Chat icon SVG ----
  var chatSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
  var sendSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>';

  // ---- Floating button ----
  var btn = document.createElement("button");
  btn.id = WIDGET_ID + "-btn";
  btn.innerHTML = chatSvg;
  btn.setAttribute("aria-label", "Open chat");
  document.body.appendChild(btn);

  // ---- Panel ----
  var panel = document.createElement("div");
  panel.id = WIDGET_ID + "-panel";
  panel.innerHTML = [
    '<div class="vw-header">',
    '  <div class="vw-header-title">',
    '    <span>Chat with Sales Sammy</span>',
    '  </div>',
    '  <button class="vw-close" aria-label="Close chat">&times;</button>',
    '</div>',
    '<div class="vw-messages" id="' + WIDGET_ID + '-msgs"></div>',
    '<div class="vw-input-area">',
    '  <input type="text" placeholder="Type a message..." id="' + WIDGET_ID + '-input" />',
    '  <button class="vw-send-btn" id="' + WIDGET_ID + '-send">' + sendSvg + '</button>',
    '</div>',
  ].join("\n");
  document.body.appendChild(panel);

  var msgsEl = document.getElementById(WIDGET_ID + "-msgs");
  var inputEl = document.getElementById(WIDGET_ID + "-input");
  var sendBtn = document.getElementById(WIDGET_ID + "-send");
  var closeBtn = panel.querySelector(".vw-close");

  // ---- Render messages ----
  function render() {
    msgsEl.innerHTML = "";
    if (messages.length === 0) {
      var welcome = document.createElement("div");
      welcome.className = "vw-msg received";
      welcome.textContent = "Hey! I'm Sales Sammy. How can I help you today?";
      msgsEl.appendChild(welcome);
    }
    messages.forEach(function (m) {
      var div = document.createElement("div");
      div.className = "vw-msg " + m.role;
      div.textContent = m.text;
      msgsEl.appendChild(div);
    });
    msgsEl.scrollTop = msgsEl.scrollHeight;
  }

  // ---- Send message ----
  function sendMessage() {
    var text = inputEl.value.trim();
    if (!text) return;
    inputEl.value = "";

    messages.push({ role: "sent", text: text });
    render();
    saveMessages(messages);

    sendBtn.disabled = true;

    // POST to inbound endpoint
    var payload = JSON.stringify({
      org_id: orgId,
      channel: "website",
      sender_name: "Website Visitor",
      sender_contact: "",
      message: text,
    });

    fetch((API_BASE || "") + "/api/replies/inbound", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
    }).catch(function () {}).finally(function () {
      // Auto-reply
      setTimeout(function () {
        messages.push({ role: "received", text: "Thanks! Sammy will respond shortly. We typically reply within a few minutes." });
        render();
        saveMessages(messages);
        sendBtn.disabled = false;
      }, 600);
    });
  }

  // ---- Events ----
  btn.addEventListener("click", function () {
    panel.classList.toggle("open");
    if (panel.classList.contains("open")) {
      render();
      inputEl.focus();
    }
  });

  closeBtn.addEventListener("click", function () {
    panel.classList.remove("open");
  });

  sendBtn.addEventListener("click", sendMessage);
  inputEl.addEventListener("keydown", function (e) {
    if (e.key === "Enter") sendMessage();
  });

  // Initial render if panel was somehow open
  render();
})();
