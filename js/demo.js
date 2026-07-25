const BASE_URL = "https://smart-ajo.onrender.com";
const DEMO_EMAIL_PASSWORD = "DemoPass123!";

let demoData = null;
let currentGroupId = null;

async function request(method, endpoint, body = null) {
  let cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  if (!cleanEndpoint.endsWith("/")) cleanEndpoint += "/";
  const url = `${BASE_URL}${cleanEndpoint}`;
  const options = { method, headers: { "Content-Type": "application/json" } };
  if (body) options.body = JSON.stringify(body);
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Server Error" }));
      throw new Error(errorData.message || errorData.detail || `Error ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`[DEMO API ERROR] ${method} ${url}`, error);
    throw error;
  }
}

async function fetchDemoData(groupId) {
  const data = await request("GET", `api/demo/data/${groupId}/`);
  demoData = data;
  currentGroupId = groupId;
  return data;
}

async function triggerTransfer(groupId, userId) {
  return request("POST", "api/demo/trigger-transfer/", { group_id: groupId, user_id: userId });
}

async function simulatePosPayin(groupId, userId, payinCode) {
  return request("POST", "api/demo/simulate-pos-payin/", {
    group_id: groupId,
    user_id: userId,
    payin_code: payinCode,
  });
}

async function resetDemo(groupId) {
  return request("POST", "api/demo/reset/", { group_id: groupId });
}

function getGroupIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("group") || "techstars-01";
}

function renderDashboard(data) {
  if (data.group_id === "techstars-01") {
    renderTechStars(data);
  } else if (data.group_id === "balogun-02") {
    renderBalogun(data);
  }
}

function renderTechStars(data) {
  document.title = `${data.name} — Smart Ajo Demo`;
  document.getElementById("groupName").textContent = data.name;
  document.getElementById("groupTagline").textContent =
    `${data.name} · ₦${Number(data.contribution_amount).toLocaleString()}/mo · Cycle ${data.current_cycle} Active`;

  document.getElementById("cycleInfo").innerHTML = `
    <span class="font-mono text-brandGreen font-bold">Cycle ${data.current_cycle}</span>
    <span class="text-brandMuted text-sm">of ${data.members.length}</span>
  `;

  const paidCount = data.members.filter(m => m.status === "PAID").length;
  const totalMembers = data.members.length;
  document.getElementById("progressBar").innerHTML = `
    <div class="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
      <div class="bg-brandGreen h-full rounded-full transition-all duration-700" style="width: ${(paidCount / totalMembers) * 100}%"></div>
    </div>
    <div class="flex justify-between text-xs text-brandMuted mt-1">
      <span>${paidCount} of ${totalMembers} paid</span>
      <span>${Math.round((paidCount / totalMembers) * 100)}%</span>
    </div>
  `;

  document.getElementById("healthScore").innerHTML = `
    <p class="text-3xl font-bold text-brandGreen font-mono">${data.overall_health_score}</p>
    <p class="text-xs text-brandMuted">/100 · Group Health</p>
  `;

  const membersContainer = document.getElementById("membersList");
  membersContainer.innerHTML = data.members.map(m => {
    const isWinner = m.is_current_winner;
    const isActionTarget = m.monnify_account_number && m.status === "UNPAID";

    let statusBadge = "";
    if (m.status === "PAID") {
      statusBadge = `<span class="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full uppercase">Paid ✓</span>`;
    } else if (m.is_current_winner) {
      statusBadge = `<span class="text-[10px] font-bold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full uppercase">Pending Payout</span>`;
    } else {
      statusBadge = `<span class="text-[10px] font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full uppercase">Awaiting Payment</span>`;
    }

    return `
      <div class="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 ${isActionTarget ? 'ring-2 ring-brandGold ring-offset-2' : ''} ${isWinner ? 'bg-gradient-to-r from-blue-50 to-white' : ''}">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${m.role === 'ADMIN' ? 'bg-brandGreen' : 'bg-brandGold'}">
            ${m.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
          </div>
          <div>
            <p class="text-sm font-bold text-slate-900">${m.name}</p>
            <div class="flex items-center gap-2 text-[10px] text-brandMuted">
              <span>${m.role}</span>
              <span>·</span>
              <span class="${m.trust_score >= 80 ? 'text-emerald-600' : m.trust_score >= 60 ? 'text-amber-600' : 'text-red-600'}">
                Trust: ${m.trust_score}
              </span>
              ${isActionTarget ? `<span class="text-brandGold font-bold">· ACTION NEEDED</span>` : ""}
            </div>
          </div>
        </div>
        ${statusBadge}
      </div>
    `;
  }).join("");

  document.getElementById("judgeBarButtons").innerHTML = `
    <span class="font-mono text-xs text-slate-400 hidden sm:inline">🎮 DEMO CONTROLS</span>
    <div class="flex gap-2 sm:gap-3">
      <button onclick="window.handleSimulateTransfer()" class="bg-emerald-600 hover:bg-emerald-500 text-white px-4 sm:px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 shadow-lg">
        <span>⚡</span>
        <span class="hidden sm:inline">Simulate Monnify Transfer (₦100,000)</span>
        <span class="sm:hidden">Transfer</span>
      </button>
      <button onclick="window.handleReset()" class="bg-slate-700 hover:bg-slate-600 text-white px-4 sm:px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2">
        <span>🔄</span>
        <span class="hidden sm:inline">Reset Group State</span>
        <span class="sm:hidden">Reset</span>
      </button>
    </div>
  `;
}

function renderBalogun(data) {
  document.title = `${data.name} — Smart Ajo Demo`;
  document.getElementById("groupName").textContent = data.name;
  document.getElementById("groupTagline").textContent =
    `${data.name} · ₦${Number(data.contribution_amount).toLocaleString()}/wk · Cycle ${data.current_cycle}`;

  const flaggedMember = data.members.find(m => m.status === "OVERDUE_FLAGGED");

  document.getElementById("riskBanner").innerHTML = flaggedMember ? `
    <div class="bg-red-50 border-2 border-red-200 rounded-2xl p-4 mb-6 animate-fade-up">
      <div class="flex items-start gap-3">
        <span class="text-xl">⚠️</span>
        <div>
          <p class="font-bold text-red-800 text-sm">AI ALERT: Member ${flaggedMember.name} is ${flaggedMember.days_overdue}hrs overdue.</p>
          <p class="text-xs text-red-600 mt-1">
            Trust score degraded to ${flaggedMember.trust_score} (High Risk).
            BVN/KYC Status: ${flaggedMember.bvn_match || "Verified Match"}.
          </p>
        </div>
      </div>
    </div>
  ` : "";

  document.getElementById("cycleInfo").innerHTML = `
    <span class="font-mono text-amber-600 font-bold">Cycle ${data.current_cycle}</span>
    <span class="text-brandMuted text-sm">of ${data.members.length}</span>
  `;

  const paidCount = data.members.filter(m => m.status === "PAID").length;
  const totalMembers = data.members.length;
  document.getElementById("progressBar").innerHTML = `
    <div class="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
      <div class="bg-amber-500 h-full rounded-full transition-all duration-700" style="width: ${(paidCount / totalMembers) * 100}%"></div>
    </div>
    <div class="flex justify-between text-xs text-brandMuted mt-1">
      <span>${paidCount} of ${totalMembers} paid</span>
      <span>${Math.round((paidCount / totalMembers) * 100)}%</span>
    </div>
  `;

  const healthColor = data.overall_health_score >= 80 ? "text-emerald-600" : data.overall_health_score >= 60 ? "text-amber-600" : "text-red-600";
  document.getElementById("healthScore").innerHTML = `
    <p class="text-3xl font-bold font-mono ${healthColor}">${data.overall_health_score}</p>
    <p class="text-xs text-brandMuted">/100 · Group Health</p>
  `;

  const membersContainer = document.getElementById("membersList");
  membersContainer.innerHTML = data.members.map(m => {
    const isActionTarget = m.offline_payin_code && m.status === "UNPAID";
    const isFlagged = m.status === "OVERDUE_FLAGGED";

    let statusBadge = "";
    if (m.status === "PAID") {
      statusBadge = `<span class="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full uppercase">Paid ✓</span>`;
    } else if (isFlagged) {
      statusBadge = `<span class="text-[10px] font-bold text-red-700 bg-red-100 px-2.5 py-1 rounded-full uppercase">OVERDUE 🚨</span>`;
    } else {
      statusBadge = `<span class="text-[10px] font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full uppercase">Awaiting Payment</span>`;
    }

    return `
      <div class="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 ${isActionTarget ? 'ring-2 ring-brandGold ring-offset-2' : ''} ${isFlagged ? 'bg-red-50 border-red-200' : ''}">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${m.role === 'ADMIN' ? 'bg-brandGreen' : isFlagged ? 'bg-red-500' : 'bg-brandGold'}">
            ${m.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
          </div>
          <div>
            <p class="text-sm font-bold text-slate-900">${m.name}</p>
            <div class="flex items-center gap-2 text-[10px] text-brandMuted">
              <span>${m.role}</span>
              <span>·</span>
              <span class="${m.trust_score >= 80 ? 'text-emerald-600' : m.trust_score >= 60 ? 'text-amber-600' : 'text-red-600'}">
                Trust: ${m.trust_score}
              </span>
              ${isFlagged ? `<span class="text-red-600 font-bold">· HIGH RISK</span>` : ""}
              ${isActionTarget ? `<span class="text-brandGold font-bold">· NEEDS PAY-IN</span>` : ""}
            </div>
            ${isFlagged ? `
              <div class="flex gap-2 mt-1">
                <span class="text-[9px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">KYC Verified</span>
                <span class="text-[9px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">BVN: ${m.bvn_match}</span>
              </div>
            ` : ""}
          </div>
        </div>
        ${statusBadge}
      </div>
    `;
  }).join("");

  document.getElementById("judgeBarButtons").innerHTML = `
    <span class="font-mono text-xs text-slate-400 hidden sm:inline">🎮 DEMO CONTROLS</span>
    <div class="flex gap-2 sm:gap-3">
      <button onclick="window.handleSimulatePosPayin()" class="bg-amber-600 hover:bg-amber-500 text-white px-4 sm:px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 shadow-lg">
        <span>🏬</span>
        <span class="hidden sm:inline">Simulate Moniepoint POS Cash Pay-in</span>
        <span class="sm:hidden">POS Pay-in</span>
      </button>
      ${flaggedMember ? `
        <button onclick="window.showKycdModal()" class="bg-blue-600 hover:bg-blue-500 text-white px-4 sm:px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2">
          <span>🔍</span>
          <span class="hidden sm:inline">View KYC Verification</span>
          <span class="sm:hidden">KYC</span>
        </button>
      ` : ""}
      <button onclick="window.handleReset()" class="bg-slate-700 hover:bg-slate-600 text-white px-4 sm:px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2">
        <span>🔄</span>
        <span class="hidden sm:inline">Reset</span>
        <span class="sm:hidden">Reset</span>
      </button>
    </div>
  `;
}

function showSuccessModal(message) {
  const overlay = document.createElement("div");
  overlay.className = "fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4";
  overlay.innerHTML = `
    <div class="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl animate-fade-up relative overflow-hidden">
      <div class="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-brandGreen to-brandGold"></div>
      <div class="text-5xl mb-4 mt-2">🎉</div>
      <h3 class="font-display text-xl font-bold text-slate-900 mb-3">Success!</h3>
      <p class="text-brandMuted text-sm mb-6 leading-relaxed">${message}</p>
      <button onclick="this.closest('.fixed').remove()" class="bg-brandGreen text-white px-8 py-3 rounded-xl font-bold hover:bg-opacity-90 transition-all">
        Continue Demo
      </button>
    </div>
  `;
  document.body.appendChild(overlay);

  createConfetti();
}

function createConfetti() {
  const colors = ["#1b5e3b", "#f2a83b", "#22C55E", "#3B82F6", "#EC4899", "#8B5CF6"];
  for (let i = 0; i < 60; i++) {
    const confetti = document.createElement("div");
    confetti.style.cssText = `
      position: fixed; z-index: 9999; width: ${Math.random() * 8 + 4}px; height: ${Math.random() * 8 + 4}px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      left: ${Math.random() * 100}%; top: -10px;
      border-radius: ${Math.random() > 0.5 ? "50%" : "2px"};
      animation: confettiFall ${Math.random() * 2 + 2}s linear forwards;
      animation-delay: ${Math.random() * 0.5}s;
      opacity: ${Math.random() * 0.7 + 0.3};
      pointer-events: none;
    `;
    document.body.appendChild(confetti);
    setTimeout(() => confetti.remove(), 4000);
  }
}

const confettiStyle = document.createElement("style");
confettiStyle.textContent = `
  @keyframes confettiFall {
    0% { transform: translateY(0) rotate(0deg); }
    100% { transform: translateY(110vh) rotate(720deg); }
  }
`;
document.head.appendChild(confettiStyle);

function showKycModal() {
  const flaggedMember = demoData?.members.find(m => m.status === "OVERDUE_FLAGGED");
  if (!flaggedMember) return;

  const overlay = document.createElement("div");
  overlay.className = "fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4";
  overlay.innerHTML = `
    <div class="bg-white rounded-3xl p-8 max-w-sm w-full text-left shadow-2xl animate-fade-up">
      <div class="flex items-center justify-between mb-6">
        <h3 class="font-display text-lg font-bold">KYC Verification Details</h3>
        <button onclick="this.closest('.fixed').remove()" class="text-slate-400 hover:text-slate-600 text-xl">&times;</button>
      </div>
      <div class="space-y-4">
        <div class="flex justify-between p-3 bg-gray-50 rounded-xl">
          <span class="text-sm text-brandMuted">Full Name</span>
          <span class="text-sm font-bold">${flaggedMember.name}</span>
        </div>
        <div class="flex justify-between p-3 bg-gray-50 rounded-xl">
          <span class="text-sm text-brandMuted">BVN Status</span>
          <span class="text-sm font-bold text-green-700">${flaggedMember.bvn_match || "VERIFIED_MATCH"}</span>
        </div>
        <div class="flex justify-between p-3 bg-gray-50 rounded-xl">
          <span class="text-sm text-brandMuted">KYC Level</span>
          <span class="text-sm font-bold text-green-700">Verified</span>
        </div>
        <div class="flex justify-between p-3 bg-gray-50 rounded-xl">
          <span class="text-sm text-brandMuted">Trust Score</span>
          <span class="text-sm font-bold text-red-600">${flaggedMember.trust_score}/100 (Degraded)</span>
        </div>
        <div class="flex justify-between p-3 bg-gray-50 rounded-xl">
          <span class="text-sm text-brandMuted">Days Overdue</span>
          <span class="text-sm font-bold text-red-600">${flaggedMember.days_overdue} days</span>
        </div>
      </div>
      <button onclick="this.closest('.fixed').remove()" class="w-full mt-6 bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-all">
        Close
      </button>
    </div>
  `;
  document.body.appendChild(overlay);
}

async function handleSimulateTransfer() {
  if (!demoData) return;
  const actionMember = demoData.members.find(m => m.monnify_account_number && m.status === "UNPAID");
  if (!actionMember) {
    showSuccessModal("All members have already paid! Click Reset to start over.");
    return;
  }
  try {
    const btn = document.querySelector(".bg-emerald-600");
    if (btn) { btn.disabled = true; btn.innerHTML = "⏳ Processing..."; btn.style.opacity = "0.7"; }

    const result = await triggerTransfer(demoData.group_id, actionMember.id);

    if (btn) { btn.disabled = false; btn.innerHTML = '⚡ Simulate Transfer'; }

    let msg = `Payment Received via Monnify Reserved Account! `;
    if (result.payout) {
      msg += `₦${Number(result.payout.amount).toLocaleString()} Payout Auto-Disbursed to ${result.payout.recipient_name}!`;
    }
    showSuccessModal(msg);
    await refreshDemo();
  } catch (err) {
    alert("Error: " + err.message);
    const btn = document.querySelector(".bg-emerald-600");
    if (btn) { btn.disabled = false; btn.innerHTML = '⚡ Simulate Transfer'; }
  }
}

async function handleSimulatePosPayin() {
  if (!demoData) return;
  const actionMember = demoData.members.find(m => m.offline_payin_code && m.status === "UNPAID");
  if (!actionMember) {
    showSuccessModal("All members have already paid! Click Reset to start over.");
    return;
  }
  try {
    const btn = document.querySelector(".bg-amber-600");
    if (btn) { btn.disabled = true; btn.innerHTML = "⏳ Processing..."; btn.style.opacity = "0.7"; }

    const result = await simulatePosPayin(
      demoData.group_id,
      actionMember.id,
      actionMember.offline_payin_code,
    );

    if (btn) { btn.disabled = false; btn.innerHTML = '🏬 Simulate POS Pay-in'; }

    const scoreIncrease = result.new_trust_score - actionMember.trust_score;
    showSuccessModal(
      `Cash pay-in verified! Nkechi Eze's card turned green. AI trust score boosted from ${actionMember.trust_score} → ${result.new_trust_score} (+${scoreIncrease})!`
    );
    await refreshDemo();
  } catch (err) {
    alert("Error: " + err.message);
    const btn = document.querySelector(".bg-amber-600");
    if (btn) { btn.disabled = false; btn.innerHTML = '🏬 Simulate POS Pay-in'; }
  }
}

async function handleReset() {
  if (!demoData) return;
  try {
    await resetDemo(demoData.group_id);
    showSuccessModal("Group state has been reset to initial demo state.");
    await refreshDemo();
  } catch (err) {
    alert("Error: " + err.message);
  }
}

async function refreshDemo() {
  const groupId = getGroupIdFromUrl();
  try {
    const data = await fetchDemoData(groupId);
    renderDashboard(data);
  } catch (err) {
    document.getElementById("membersList").innerHTML = `
      <div class="text-center py-12 text-brandMuted">
        <p class="text-4xl mb-4">⚠️</p>
        <p class="font-bold">Could not load demo data.</p>
        <p class="text-sm mt-2">Make sure the backend is running and seed_demo_data has been executed.</p>
      </div>
    `;
  }
}

window.handleSimulateTransfer = handleSimulateTransfer;
window.handleSimulatePosPayin = handleSimulatePosPayin;
window.handleReset = handleReset;
window.showKycModal = showKycModal;

document.addEventListener("DOMContentLoaded", async () => {
  const groupId = getGroupIdFromUrl();
  try {
    const data = await fetchDemoData(groupId);
    renderDashboard(data);
  } catch (err) {
    document.getElementById("app").innerHTML = `
      <div class="text-center py-24 px-6">
        <p class="text-5xl mb-6">⚠️</p>
        <h2 class="font-display text-2xl font-bold text-slate-900 mb-4">Demo Data Not Available</h2>
        <p class="text-brandMuted mb-8 max-w-md mx-auto">
          Please ensure the backend is running and the seed command has been executed:
        </p>
        <div class="bg-slate-900 text-green-400 font-mono text-sm p-4 rounded-2xl max-w-md mx-auto text-left mb-8">
          python manage.py seed_demo_data
        </div>
        <a href="landing-page.html" class="text-brandGreen font-bold hover:underline">← Back to Landing Page</a>
      </div>
    `;
  }
});
