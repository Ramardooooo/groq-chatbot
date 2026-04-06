// ⚠️ JANGAN TARUH API KEY DI FRONTEND UNTUK PRODUCTION
const API_KEY = "ISI_API_KEY_LO";
const MODEL = "llama-3.1-8b-instant";

// 🔥 SYSTEM PROMPT (Ramardo AI)
const SYSTEM_PROMPT = {
  role: "system",
  content: `
Kamu adalah Ramardo, Gen Z Indonesia.

Gaya bicara:
- Santai, gaul, kadang pakai kata seperti "bro", "gas", "mantap"
- Tidak lebay, tetap jelas

Kepribadian:
- Suka membantu siapa saja
- Pintar teknologi (coding, bot, website)
- Cepat kasih solusi

Aturan:
- Jawaban harus jelas dan langsung ke poin
- Kalau coding, kasih contoh langsung
- Jangan toxic
`
};

// 🔥 DATA CHAT
let chats = JSON.parse(localStorage.getItem("chats")) || [];
let currentChat = [SYSTEM_PROMPT];

// 💾 SIMPAN
function save() {
  localStorage.setItem("chats", JSON.stringify(chats));
}

// 📜 RENDER HISTORY
function renderHistory() {
  const el = document.getElementById("history");
  el.innerHTML = "";

  chats.forEach((chat, i) => {
    const btn = document.createElement("button");
    btn.className = "w-full text-left p-2 bg-white/5 rounded hover:bg-white/10";

    // ambil pesan pertama user (skip system)
    const firstMsg = chat.find(m => m.role === "user");

    btn.innerText = firstMsg?.content.slice(0, 20) || "Chat";
    btn.onclick = () => loadChat(i);

    el.appendChild(btn);
  });
}

// 📂 LOAD CHAT
function loadChat(i) {
  currentChat = chats[i];
  renderChat();
}

// 🆕 CHAT BARU
function newChat() {
  currentChat = [SYSTEM_PROMPT];
  renderChat();
}

// 💬 RENDER CHAT
function renderChat() {
  const chatEl = document.getElementById("chat");
  chatEl.innerHTML = "";

  currentChat.forEach(msg => {
    if (msg.role === "system") return; // ❌ hide system

    const div = document.createElement("div");
    div.className = msg.role === "user" ? "text-right" : "text-left";

    div.innerHTML = `
      <span class="inline-block px-4 py-2 rounded ${
        msg.role === "user" ? "bg-blue-600" : "bg-gray-600"
      }">
        ${msg.content}
      </span>
    `;

    chatEl.appendChild(div);
  });

  chatEl.scrollTop = chatEl.scrollHeight;
}

// 🚀 KIRIM PESAN
async function send() {
  const input = document.getElementById("input");
  const text = input.value.trim();
  if (!text) return;

  currentChat.push({ role: "user", content: text });
  renderChat();
  input.value = "";

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + API_KEY
      },
      body: JSON.stringify({
        model: MODEL,
        messages: currentChat
      })
    });

    if (!res.ok) {
      throw new Error("HTTP error " + res.status);
    }

    const data = await res.json();

    if (!data.choices || !data.choices[0]) {
      throw new Error("Response kosong dari Groq");
    }

    const reply = data.choices[0].message.content;

    currentChat.push({ role: "assistant", content: reply });
    renderChat();

    // simpan ke history
    if (!chats.includes(currentChat)) {
      chats.push(currentChat);
    }

    save();
    renderHistory();

  } catch (err) {
    console.error(err);

    currentChat.push({
      role: "assistant",
      content: "⚠️ Error: " + err.message
    });

    renderChat();
  }
}

// ⌨️ ENTER = KIRIM
document.getElementById("input").addEventListener("keydown", function(e) {
  if (e.key === "Enter") send();
});

// 🔄 INIT
renderHistory();
