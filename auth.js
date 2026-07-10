const authForm = document.getElementById("authForm");
const authStatus = document.getElementById("authStatus");
const authSubmit = document.getElementById("authSubmit");
const authTitle = document.getElementById("authTitle");
const authEyebrow = document.getElementById("authEyebrow");
const nameField = document.getElementById("nameField");
const tabs = [...document.querySelectorAll(".auth-tab")];

let mode = "login";

tabs.forEach((tab) => {
  tab.addEventListener("click", () => setMode(tab.dataset.mode));
});

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  authStatus.textContent = "Checking your account...";

  const payload = {
    name: document.getElementById("name").value.trim(),
    email: document.getElementById("email").value.trim(),
    password: document.getElementById("password").value
  };

  const endpoint = mode === "register" ? "/api/register" : "/api/login";
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  if (!response.ok) {
    authStatus.textContent = data.error || "Authentication failed.";
    authStatus.classList.add("error");
    return;
  }

  authStatus.classList.remove("error");
  authStatus.textContent = `Welcome, ${data.user.name}. Redirecting to patient details...`;
  window.location.href = "/patient-details";
});

setMode("login");
checkSession();

function setMode(nextMode) {
  mode = nextMode;
  const isRegister = mode === "register";

  tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.mode === mode));
  nameField.classList.toggle("hidden", !isRegister);
  document.getElementById("name").toggleAttribute("required", isRegister);
  authSubmit.textContent = isRegister ? "Create Account" : "Login";
  authEyebrow.textContent = isRegister ? "Create patient account" : "Welcome back";
  authTitle.textContent = isRegister
    ? "Register for secure health monitoring"
    : "Access your wellness dashboard";
  authStatus.textContent = isRegister
    ? "New users can create an account and immediately begin storing assessments."
    : "Use the register tab to create a new patient account.";
  authStatus.classList.remove("error");
}

async function checkSession() {
  const response = await fetch("/api/session");
  if (response.ok) {
    window.location.href = "/patient-details";
  }
}
