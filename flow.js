const STORAGE_KEY = "smart-healthcare-draft";
const REPORT_KEY = "smart-healthcare-report";
const FEEDBACK_KEY = "smart-healthcare-feedback";

const defaults = {
  age: 32,
  gender: "female",
  bloodGroup: "",
  height: 168,
  weight: 62,
  heartRate: 88,
  temperature: 37.1,
  oxygen: 98,
  stressLevel: "moderate",
  activityLevel: "medium",
  lifestyleNotes: "",
  symptoms: []
};

const page = document.body.dataset.page;

initialize().catch(() => {
  window.location.href = "/";
});

async function initialize() {
  const user = await requireSession();
  hydrateUser(user);
  bindLogout();

  if (page === "details") initDetailsPage(user);
  if (page === "symptoms") initSymptomsPage();
  if (page === "report") initReportPage();
  if (page === "feedback") initFeedbackPage();
}

async function requireSession() {
  const response = await fetch("/api/session");
  if (!response.ok) throw new Error("Unauthenticated");
  const data = await response.json();
  return data.user;
}

function hydrateUser(user) {
  const welcomeTag = document.getElementById("welcomeTag");
  const userCardName = document.getElementById("userCardName");
  const userCardEmail = document.getElementById("userCardEmail");
  const profileName = document.getElementById("profileName");
  const profileEmail = document.getElementById("profileEmail");
  const profileAvatar = document.getElementById("profileAvatar");

  if (welcomeTag) welcomeTag.textContent = `Signed in as ${user.name}`;
  if (userCardName) userCardName.textContent = user.name;
  if (userCardEmail) userCardEmail.textContent = user.email;
  if (profileName) profileName.textContent = user.name;
  if (profileEmail) profileEmail.textContent = user.email;
  if (profileAvatar) profileAvatar.textContent = (user.name || "P").trim().charAt(0).toUpperCase();
}

function bindLogout() {
  const logoutButton = document.getElementById("logoutButton");
  const profileTrigger = document.getElementById("profileTrigger");
  const profileDropdown = document.getElementById("profileDropdown");
  if (!logoutButton) return;

  if (profileTrigger && profileDropdown) {
    profileTrigger.addEventListener("click", () => {
      const isOpen = !profileDropdown.hidden;
      profileDropdown.hidden = isOpen;
      profileTrigger.setAttribute("aria-expanded", String(!isOpen));
    });

    document.addEventListener("click", (event) => {
      if (!profileDropdown.hidden && !event.target.closest(".profile-menu")) {
        profileDropdown.hidden = true;
        profileTrigger.setAttribute("aria-expanded", "false");
      }
    });
  }

  logoutButton.addEventListener("click", async () => {
    await fetch("/api/logout", { method: "POST" });
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(REPORT_KEY);
    sessionStorage.removeItem(FEEDBACK_KEY);
    window.location.href = "/";
  });
}

function initDetailsPage(user) {
  const form = document.getElementById("detailsForm");
  const demoButton = document.getElementById("demoCase");
  const stored = getDraft();
  const merged = {
    ...defaults,
    ...stored,
    name: stored.name || user.name
  };

  setValue("name", merged.name);
  setValue("age", merged.age);
  setValue("gender", merged.gender);
  setValue("bloodGroup", merged.bloodGroup);
  setValue("height", merged.height);
  setValue("weight", merged.weight);
  setValue("heartRate", merged.heartRate);
  setValue("temperature", merged.temperature);
  setValue("oxygen", merged.oxygen);
  setValue("stressLevel", merged.stressLevel);
  setValue("activityLevel", merged.activityLevel);
  setValue("lifestyleNotes", merged.lifestyleNotes);

  demoButton.addEventListener("click", () => {
    setValue("name", user.name || "Emergency Case");
    setValue("age", 57);
    setValue("gender", "male");
    setValue("bloodGroup", "O+");
    setValue("height", 171);
    setValue("weight", 74);
    setValue("heartRate", 128);
    setValue("temperature", 38.9);
    setValue("oxygen", 89);
    setValue("stressLevel", "high");
    setValue("activityLevel", "low");
    setValue("lifestyleNotes", "Recent fatigue, poor sleep, chest discomfort, and reduced appetite.");
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!validateFields(["name", "age", "heartRate", "temperature", "oxygen"])) return;
    saveDraft({ ...getDraft(), ...collectDetails() });
    window.location.href = "/symptoms";
  });
}

function initSymptomsPage() {
  const form = document.getElementById("symptomsForm");
  const demoButton = document.getElementById("demoCase");
  const summary = document.getElementById("patientSummary");
  const draft = getDraft();

  if (!draft.name) {
    window.location.href = "/patient-details";
    return;
  }

  summary.innerHTML = `
    <p><strong>${draft.name}</strong></p>
    <p>Age: ${draft.age} | Gender: ${draft.gender || "not set"} | Blood group: ${draft.bloodGroup || "not set"}</p>
    <p>Heart rate: ${draft.heartRate} | Temperature: ${draft.temperature} C | Oxygen: ${draft.oxygen}%</p>
  `;

  const selectedSymptoms = new Set(draft.symptoms || []);
  document.querySelectorAll('.symptom-grid input[type="checkbox"]').forEach((box) => {
    box.checked = selectedSymptoms.has(box.value);
  });

  demoButton.addEventListener("click", () => {
    document.querySelectorAll('.symptom-grid input[type="checkbox"]').forEach((box) => {
      box.checked = ["chest_pain", "shortness_of_breath", "headache"].includes(box.value);
    });
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = {
      ...draft,
      symptoms: [...document.querySelectorAll('.symptom-grid input[type="checkbox"]:checked')].map((box) => box.value)
    };

    saveDraft(payload);

    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || "Assessment failed.");
      if (response.status === 401) window.location.href = "/";
      return;
    }

    sessionStorage.setItem(REPORT_KEY, JSON.stringify(data.record));
    window.location.href = "/report";
  });
}

async function initReportPage() {
  const record = getStoredReport();
  if (!record) {
    window.location.href = "/symptoms";
    return;
  }

  renderAssessment(record);
  bindFeedbackLink();
  await loadHistory();
}

function bindFeedbackLink() {
  const continueButton = document.getElementById("continueToFeedback");
  if (!continueButton) return;

  continueButton.addEventListener("click", () => {
    window.location.href = "/feedback";
  });
}

function renderAssessment(record) {
  setText("diagnosis", record.diagnosis);
  setText("urgency", record.urgency);
  setText("riskScore", String(record.riskScore));

  const engineBanner = document.getElementById("engineBanner");
  engineBanner.textContent = `Engine: ${record.engine || "unknown"} | ${record.engineMessage || "Assessment completed."}`;
  engineBanner.className = "engine-banner";
  if (record.engine === "fallback") engineBanner.classList.add("fallback");
  if (record.urgency === "critical") engineBanner.classList.add("critical");

  setList("doctorSpecialization", record.doctorSpecialization);
  setList("foodIntake", record.foodIntake);
  setList("foodsToAvoid", record.foodsToAvoid);
  setList("exercisePlan", record.exercisePlan);
  setList("dietPlan", record.dietPlan);
  setList("matchedRules", record.matchedRules);
  setList("observations", record.observations);
  setList("recommendations", record.recommendations);
  setList("precautions", record.precautions);
}

async function loadHistory() {
  const historyList = document.getElementById("historyList");
  if (!historyList) return;

  const response = await fetch("/api/history");
  const data = await response.json();

  historyList.innerHTML = "";

  if (!response.ok) {
    historyList.innerHTML = '<div class="history-item"><p>Please log in again to view your reports.</p></div>';
    return;
  }

  if (!data.records || !data.records.length) {
    historyList.innerHTML = '<div class="history-item"><p>No assessments stored yet.</p></div>';
    return;
  }

  data.records.forEach((record) => {
    const article = document.createElement("article");
    article.className = "history-item";
    const created = record.createdAt ? new Date(record.createdAt).toLocaleString() : "Unknown time";

    article.innerHTML = `
      <div class="history-header">
        <div>
          <strong>${record.name}</strong>
          <p>${record.diagnosis.replace(/_/g, " ")}</p>
        </div>
        <span class="history-pill ${record.urgency}">${record.urgency}</span>
      </div>
      <time>${created}</time>
      <p>Patient: ${record.age} years | ${record.gender || "not set"} | Blood group: ${record.bloodGroup || "not set"}</p>
      <p>Symptoms: ${(record.symptoms || []).join(", ") || "none reported"}</p>
      <p>Doctor: ${(record.doctorSpecialization || []).join(", ") || "General physician"}</p>
      <p>Food: ${(record.foodIntake || []).join(", ") || "Balanced home-cooked meals"}</p>
      <p>Avoid: ${(record.foodsToAvoid || []).join(", ") || "No food restrictions generated."}</p>
      <p>Exercise: ${(record.exercisePlan || []).join(", ") || "No exercise plan generated."}</p>
      <p>Diet: ${(record.dietPlan || []).join(", ") || "No diet plan generated."}</p>
      <p>Precautions: ${(record.precautions || []).join(", ") || "No precautions generated."}</p>
      <p>Engine: ${record.engine || "unknown"} | Risk score: ${record.riskScore}</p>
    `;

    historyList.appendChild(article);
  });
}

function initFeedbackPage() {
  const record = getStoredReport();
  const form = document.getElementById("feedbackForm");
  const summary = document.getElementById("feedbackSummary");
  const status = document.getElementById("feedbackStatus");

  if (!record) {
    window.location.href = "/report";
    return;
  }

  if (summary) {
    summary.innerHTML = `
      <p><strong>${record.name}</strong></p>
      <p>Diagnosis: ${record.diagnosis.replace(/_/g, " ")}</p>
      <p>Urgency: ${record.urgency} | Risk score: ${record.riskScore}</p>
    `;
  }

  restoreFeedbackStars();
  bindStarInputs();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const stars = Number(document.querySelector('input[name="stars"]:checked')?.value || 0);
    const comments = getValue("feedbackComments");

    if (!stars) {
      status.textContent = "Please choose a star rating before submitting.";
      status.classList.add("error");
      return;
    }

    const payload = {
      patientName: record.name,
      diagnosis: record.diagnosis,
      recordCreatedAt: record.createdAt,
      stars,
      comments
    };

    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      status.textContent = data.error || "Could not save feedback.";
      status.classList.add("error");
      return;
    }

    sessionStorage.setItem(FEEDBACK_KEY, JSON.stringify(data.feedback));
    status.textContent = "Thank you. Your feedback has been submitted successfully.";
    status.classList.remove("error");
    form.reset();
    clearStarSelection();
  });
}

function bindStarInputs() {
  document.querySelectorAll('input[name="stars"]').forEach((input) => {
    input.addEventListener("change", () => {
      highlightStars(Number(input.value));
    });
  });
}

function restoreFeedbackStars() {
  const saved = JSON.parse(sessionStorage.getItem(FEEDBACK_KEY) || "null");
  if (!saved?.stars) return;

  const target = document.querySelector(`input[name="stars"][value="${saved.stars}"]`);
  if (target) {
    target.checked = true;
    highlightStars(saved.stars);
  }

  setValue("feedbackComments", saved.comments || "");
}

function clearStarSelection() {
  document.querySelectorAll('input[name="stars"]').forEach((input) => {
    input.checked = false;
  });
  highlightStars(0);
  setValue("feedbackComments", "");
}

function highlightStars(value) {
  document.querySelectorAll(".star-option").forEach((option) => {
    const score = Number(option.dataset.value || 0);
    option.classList.toggle("active", score <= value && value > 0);
  });
}

function collectDetails() {
  return {
    name: getValue("name"),
    age: Number(getValue("age")),
    gender: getValue("gender"),
    bloodGroup: getValue("bloodGroup"),
    height: Number(getValue("height") || 0),
    weight: Number(getValue("weight") || 0),
    heartRate: Number(getValue("heartRate")),
    temperature: Number(getValue("temperature")),
    oxygen: Number(getValue("oxygen")),
    stressLevel: getValue("stressLevel"),
    activityLevel: getValue("activityLevel"),
    lifestyleNotes: getValue("lifestyleNotes"),
    symptoms: getDraft().symptoms || []
  };
}

function validateFields(ids) {
  return ids.every((id) => document.getElementById(id).reportValidity());
}

function getDraft() {
  return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "{}");
}

function saveDraft(data) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getStoredReport() {
  return JSON.parse(sessionStorage.getItem(REPORT_KEY) || "null");
}

function setList(id, items) {
  const node = document.getElementById(id);
  if (!node) return;
  node.innerHTML = "";
  const safeItems = items && items.length ? items : ["No guidance generated yet."];
  safeItems.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    node.appendChild(li);
  });
}

function setText(id, value) {
  const node = document.getElementById(id);
  if (node) node.textContent = value;
}

function setValue(id, value) {
  const node = document.getElementById(id);
  if (node) node.value = value;
}

function getValue(id) {
  const node = document.getElementById(id);
  return node ? node.value : "";
}
