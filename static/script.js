let selectedGallery = "";  // untuk menyimpan pilihan gallery
let identifyInterval = null;

let video = document.getElementById("video");
navigator.mediaDevices.getUserMedia({ video: true }).then(s => video.srcObject = s);

function capture() {
  let c = document.getElementById("canvas");
  c.width = video.videoWidth; c.height = video.videoHeight;
  c.getContext("2d").drawImage(video, 0, 0);
}

let action = "";

async function trigger(act) {
  action = act;

  if (act === "identify_face") {
    return await submitIdentifyFace();
  }

  const modal = document.getElementById("modal");
  const body = document.getElementById("modal-body");
  body.innerHTML = "";
  document.getElementById("modal-title").innerText = act.replace(/_/g, " ").toUpperCase();

  if (act === "create_gallery" || act === "delete_gallery") {
    body.innerHTML += `<label>Gallery ID:</label><input type="text" id="input-gallery" placeholder="contoh: riset.ai@production">`;
  } else if (act === "enroll_face") {
    body.innerHTML += `<label>User ID:</label><input type="text" id="input-userid" placeholder="contoh: user001">`;
    body.innerHTML += `<label>User Name:</label><input type="text" id="input-username" placeholder="contoh: John Doe">`;
  } else if (act === "verify_face" || act === "delete_face") {
    body.innerHTML += `<label>User ID:</label><input type="text" id="input-userid" placeholder="contoh: user001">`;
  }

  modal.style.display = "flex";
}




async function submitIdentifyFace() {
  const token = document.getElementById("token").value;
  const gallery = document.getElementById("static-gallery-dropdown")?.value;
  const image = getImage();
  const resultBox = document.getElementById("result");

  if (!token) {
    resultBox.innerText = "❗ Token belum diisi.";
    return;
  }

  if (!gallery || gallery === "Pilih Gallery") {
    resultBox.innerText = "❗ Gallery belum dipilih.";
    return;
  }

  const trx_id = Math.random().toString(36).substring(2, 12);

  const res = await fetch("/identify_face", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token,
      gallery_name: gallery,
      image_base64: image,
      trx_id
    })
  });

  const data = await res.json();

  const info = [
    `🔄 Action: identify_face`,
    `📁 Gallery: ${gallery}`,
    `📤 Response:`,
    JSON.stringify(data, null, 2)
  ].join("\n");

  resultBox.innerText = info;
}



function closeModal() {
  document.getElementById("modal").style.display = "none";
}

function getImage() {
  return document.getElementById("canvas").toDataURL("image/jpeg").split(",")[1];
}

async function submitModal() {
  closeModal();

  const token = document.getElementById("token").value;
  const gallery = document.getElementById("static-gallery-dropdown")?.value;
  const resultBox = document.getElementById("result");

  if (!token) {
    resultBox.innerText = "❗ Token belum diisi.";
    return;
  }

  if (!gallery && action !== "create_gallery" && action !== "delete_gallery") {
    resultBox.innerText = "❗ Gallery belum dipilih.";
    return;
  }

  const p = {
    token,
    trx_id: Math.random().toString(36).substring(2, 12)
  };

  if (action === "create_gallery" || action === "delete_gallery") {
    p.gallery_name = document.getElementById("input-gallery")?.value;
  }

  if (action === "enroll_face") {
    p.gallery_name = gallery;
    p.person_name = document.getElementById("input-userid")?.value;
    p.person_display_name = document.getElementById("input-username")?.value;
    p.image_base64 = getImage();
  }

  if (action === "verify_face") {
    p.gallery_name = gallery;
    p.person_name = document.getElementById("input-userid")?.value;
    p.image_base64 = getImage();
  }

  if (action === "identify_face") {
    p.gallery_name = gallery;
    p.image_base64 = getImage();
  }

  if (action === "delete_face") {
    p.gallery_name = gallery;
    p.person_name = document.getElementById("input-userid")?.value;
  }

  const res = await fetch(`/${action}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(p)
  });

  const data = await res.json();

  const debugInfo = [
    `🔄 Action: ${action}`,
    `📁 Gallery: ${p.gallery_name}`,
    p.person_name ? `🆔 User ID: ${p.person_name}` : null,
    p.person_display_name ? `👤 Username: ${p.person_display_name}` : null,
    p.image_base64 ? `🖼️ Image: (base64 captured)` : null,
    "",
    "📤 Response:",
    JSON.stringify(data, null, 2)
  ].filter(Boolean).join("\n");

  resultBox.innerText = debugInfo;
}



async function listGalleries() {
  const token = document.getElementById("token").value;

  const bodyPayload = token ? { token } : {};
  const r = await fetch("/list_galleries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bodyPayload)
  });

  const data = await r.json();
  document.getElementById("result").innerText = JSON.stringify(data, null, 2);

  // Populate dropdown jika tersedia
  const staticDropdown = document.getElementById("static-gallery-dropdown");
  if (staticDropdown) {
    const galleries = data.risetai?.facegalleries || data.facegallery_ids || data.galleries || [];

    // Bersihkan dropdown dan tambahkan opsi default
    staticDropdown.innerHTML = "";
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "select";
    defaultOption.disabled = true;
    defaultOption.selected = true;
    staticDropdown.appendChild(defaultOption);

    // Tambahkan semua gallery ke dropdown
    galleries.filter(Boolean).forEach(g => {
      const o = document.createElement("option");
      o.value = g;
      o.textContent = g;
      staticDropdown.appendChild(o);
    });
  }
}





async function loadGalleries() {
  const token = document.getElementById("token").value;
  const r = await fetch("/list_galleries", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token })
  });
  const data = await r.json();
  const sel = document.getElementById("input-gallery");
  if (!sel) return;
  sel.innerHTML = "";
  (data.facegallery_ids || data.galleries || []).forEach(g => {
    const o = document.createElement("option");
    o.value = g; o.innerText = g;
    sel.appendChild(o);
  });
}

async function loadFaces() {
  const token = document.getElementById("token").value;
  const gallery = document.getElementById("input-gallery")?.value;
  if (!gallery) return;
  const r = await fetch("/list_faces", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, gallery_name: gallery })
  });
  const data = await r.json();
  const sel = document.getElementById("input-user");
  if (!sel) return;
  sel.innerHTML = "";
  (data.user_ids || data.faces || []).forEach(u => {
    const o = document.createElement("option");
    o.value = u; o.innerText = u;
    sel.appendChild(o);
  });
} 

async function listFaces() {
  const token = document.getElementById("token").value;
  const gallery = selectedGallery;

  const resultBox = document.getElementById("result");

  if (!token) {
    resultBox.innerText = "❗ Token belum diisi.";
    return;
  }

  if (!gallery) {
    resultBox.innerText = "❗ Gallery belum dipilih.";
    return;
  }

  const trx_id = Math.random().toString(36).substring(2, 12);

  const res = await fetch("/list_faces", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token,
      gallery_name: gallery,
      trx_id: trx_id
    })
  });

  const data = await res.json();

  // Format info API
  const apiInfo = [
    `🔄 Action: list_face`,
    `📁 Gallery: ${gallery}`,
    `📤 Response:`,
    JSON.stringify(data, null, 2)
  ].join("\n");

  resultBox.innerText = apiInfo;
}

function getImage() {
  if (video.videoWidth === 0 || video.videoHeight === 0) {
    alert("Kamera belum siap. Mohon tunggu sebentar.");
    return null;
  }
  const canvas = document.getElementById("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext("2d").drawImage(video, 0, 0);
  return canvas.toDataURL("image/jpeg").split(",")[1];
}


function startAutoIdentify() {
  const token = document.getElementById("token").value;
  const gallery = document.getElementById("static-gallery-dropdown")?.value;
  const resultBox = document.getElementById("result");

  if (!token || !gallery) {
    resultBox.innerText = "❗ Token dan Gallery harus diisi sebelum menjalankan Auto-Identify.";
    return;
  }

  if (identifyInterval) {
    resultBox.innerText = "ℹ️ Auto-Identify sudah berjalan.";
    return;
  }

  resultBox.innerText = "▶️ Auto-Identify dimulai...";
  identifyInterval = setInterval(() => {
    autoIdentifyFace();
  }, 1000); // setiap 1 detik
}

function stopAutoIdentify() {
  if (identifyInterval) {
    clearInterval(identifyInterval);
    identifyInterval = null;
    document.getElementById("result").innerText = "⏹️ Auto-Identify dihentikan.";
  } else {
    document.getElementById("result").innerText = "ℹ️ Auto-Identify belum berjalan.";
  }
}

async function autoIdentifyFace() {
  const token = document.getElementById("token").value;
  const gallery = document.getElementById("static-gallery-dropdown")?.value;
  const image = getImage();
  const resultBox = document.getElementById("result");

  if (!image) {
    resultBox.innerText = "⚠️ Gagal mengambil gambar dari kamera.";
    return;
  }

  const trx_id = Math.random().toString(36).substring(2, 12);
  const res = await fetch("/identify_face", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token,
      gallery_name: gallery,
      image_base64: image,
      trx_id
    })
  });

  const data = await res.json();

  const name = data?.results?.[0]?.person_display_name || data?.results?.[0]?.person_name || "Unknown";

  resultBox.innerText = `🧠 Detected: ${name}\n\n${JSON.stringify(data, null, 2)}`;

  // Tambahkan rectangle hijau pada canvas
  drawGreenBox();
}

function drawGreenBox() {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");

  const boxWidth = 150;
  const boxHeight = 150;

  ctx.strokeStyle = "lime";
  ctx.lineWidth = 4;
  ctx.strokeRect(
    (canvas.width - boxWidth) / 2,
    (canvas.height - boxHeight) / 2,
    boxWidth,
    boxHeight
  );
}


// Initial load to populate static dropdown beside Face section
window.addEventListener("DOMContentLoaded", () => {
  listGalleries();

  // Event listener untuk menyimpan pilihan gallery dari dropdown
  document.getElementById("static-gallery-dropdown").addEventListener("change", function () {
    selectedGallery = this.value;
  });
}
);

