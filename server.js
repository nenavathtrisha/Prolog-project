const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFile } = require("child_process");

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const RECORDS_FILE = path.join(DATA_DIR, "records.json");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const FEEDBACK_FILE = path.join(DATA_DIR, "feedback.json");
const PROLOG_FILE = path.join(ROOT, "prolog", "health_expert.pl");

const sessions = new Map();

const STATIC_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

ensureDataStore();

const server = createServer();

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Smart Healthcare app running at http://localhost:${PORT}`);
  });
}

function createServer() {
  return http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const cookies = parseCookies(req.headers.cookie || "");
      const session = cookies.sessionId ? sessions.get(cookies.sessionId) : null;

      if (req.method === "POST" && url.pathname === "/api/register") {
        const body = await readJsonBody(req);
        const user = registerUser(body);
        const sessionId = createSession(user);
        return sendJson(res, 201, { user: publicUser(user) }, createSessionHeaders(sessionId));
      }

      if (req.method === "POST" && url.pathname === "/api/login") {
        const body = await readJsonBody(req);
        const user = loginUser(body);
        const sessionId = createSession(user);
        return sendJson(res, 200, { user: publicUser(user) }, createSessionHeaders(sessionId));
      }

      if (req.method === "POST" && url.pathname === "/api/logout") {
        if (cookies.sessionId) sessions.delete(cookies.sessionId);
        return sendJson(res, 200, { ok: true }, {
          "Set-Cookie": "sessionId=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax"
        });
      }

      if (req.method === "GET" && url.pathname === "/api/session") {
        if (!session) {
          return sendJson(res, 401, { error: "Not authenticated" });
        }

        return sendJson(res, 200, { user: publicUser(session.user) });
      }

      if (req.method === "GET" && url.pathname === "/api/health") {
        return sendJson(res, 200, {
          ok: true,
          service: "Smart Health Care",
          date: new Date().toISOString()
        });
      }

      if (req.method === "GET" && url.pathname === "/api/history") {
        const authed = requireAuth(session);
        if (!authed.ok) return sendJson(res, 401, { error: authed.error });

        const records = readRecords()
          .filter((record) => record.userEmail === session.user.email)
          .slice(-10)
          .reverse();

        return sendJson(res, 200, { records });
      }

      if (req.method === "POST" && url.pathname === "/api/analyze") {
        const authed = requireAuth(session);
        if (!authed.ok) return sendJson(res, 401, { error: authed.error });

        const body = await readJsonBody(req);
        const payload = normalizePayload(body, session.user);
        const analysis = await runAnalysis(payload);
        const record = {
          ...payload,
          ...analysis,
          createdAt: new Date().toISOString()
        };

        const records = readRecords();
        records.push(record);
        fs.writeFileSync(RECORDS_FILE, JSON.stringify(records, null, 2));

        return sendJson(res, 200, { record });
      }

      if (req.method === "POST" && url.pathname === "/api/feedback") {
        const authed = requireAuth(session);
        if (!authed.ok) return sendJson(res, 401, { error: authed.error });

        const body = await readJsonBody(req);
        const feedback = normalizeFeedback(body, session.user);
        const feedbackEntries = readFeedback();
        feedbackEntries.push(feedback);
        fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(feedbackEntries, null, 2));

        return sendJson(res, 201, { feedback });
      }

      if (
        req.method === "GET" &&
        (
          url.pathname === "/" ||
          url.pathname === "/index.html" ||
          url.pathname === "/smart-health-care" ||
          url.pathname === "/smart-healthcare-and-wellness"
        )
      ) {
        return serveFile(path.join(ROOT, "index.html"), res);
      }

      if (
        req.method === "GET" &&
        ["/dashboard", "/patient-details", "/symptoms", "/report", "/feedback"].includes(url.pathname)
      ) {
        if (!session) {
          res.writeHead(302, { Location: "/" });
          res.end();
          return;
        }

        const fileName = url.pathname === "/dashboard"
          ? "patient-details.html"
          : `${url.pathname.slice(1)}.html`;
        return serveFile(path.join(ROOT, fileName), res);
      }

      const safePath = path.normalize(url.pathname).replace(/^(\.\.[/\\])+/, "");
      const filePath = path.join(ROOT, safePath);

      if (!filePath.startsWith(ROOT)) {
        return sendJson(res, 403, { error: "Forbidden" });
      }

      return serveFile(filePath, res);
    } catch (error) {
      return sendJson(res, 500, { error: error.message || "Internal server error" });
    }
  });
}

function ensureDataStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(RECORDS_FILE)) fs.writeFileSync(RECORDS_FILE, "[]");
  if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, "[]");
  if (!fs.existsSync(FEEDBACK_FILE)) fs.writeFileSync(FEEDBACK_FILE, "[]");
}

function readRecords() {
  return JSON.parse(fs.readFileSync(RECORDS_FILE, "utf8"));
}

function readUsers() {
  return JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
}

function readFeedback() {
  return JSON.parse(fs.readFileSync(FEEDBACK_FILE, "utf8"));
}

function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function parseCookies(cookieHeader) {
  return cookieHeader.split(";").reduce((acc, part) => {
    const [rawKey, ...rest] = part.trim().split("=");
    if (!rawKey) return acc;
    acc[rawKey] = decodeURIComponent(rest.join("="));
    return acc;
  }, {});
}

function sendJson(res, statusCode, payload, extraHeaders = {}) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    ...extraHeaders
  });
  res.end(JSON.stringify(payload));
}

function serveFile(filePath, res) {
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const type = STATIC_TYPES[ext] || "application/octet-stream";
  res.writeHead(200, { "Content-Type": type });
  res.end(fs.readFileSync(filePath));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Payload too large"));
        req.destroy();
      }
    });

    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });

    req.on("error", reject);
  });
}

function registerUser(body) {
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");

  if (!name || !email || !password) {
    throw new Error("Name, email, and password are required.");
  }

  const users = readUsers();
  if (users.some((user) => user.email === email)) {
    throw new Error("An account with this email already exists.");
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const passwordHash = hashPassword(password, salt);
  const user = {
    id: crypto.randomUUID(),
    name,
    email,
    salt,
    passwordHash,
    createdAt: new Date().toISOString()
  };

  users.push(user);
  writeUsers(users);
  return user;
}

function loginUser(body) {
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const user = readUsers().find((entry) => entry.email === email);

  if (!user) {
    throw new Error("Invalid email or password.");
  }

  const attemptedHash = hashPassword(password, user.salt);
  const isMatch = crypto.timingSafeEqual(
    Buffer.from(attemptedHash, "hex"),
    Buffer.from(user.passwordHash, "hex")
  );

  if (!isMatch) {
    throw new Error("Invalid email or password.");
  }

  return user;
}

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

function createSession(user) {
  const sessionId = crypto.randomBytes(24).toString("hex");
  sessions.set(sessionId, {
    user: publicUser(user),
    createdAt: Date.now()
  });
  return sessionId;
}

function createSessionHeaders(sessionId) {
  return {
    "Set-Cookie": `sessionId=${sessionId}; HttpOnly; Path=/; Max-Age=${60 * 60 * 12}; SameSite=Lax`
  };
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email
  };
}

function requireAuth(session) {
  if (!session || !session.user) {
    return { ok: false, error: "Please log in to continue." };
  }

  return { ok: true };
}

function normalizePayload(body, user) {
  const symptoms = Array.isArray(body.symptoms)
    ? body.symptoms.filter(Boolean).map((item) => String(item).trim().toLowerCase())
    : [];

  return {
    userId: user.id,
    userEmail: user.email,
    name: String(body.name || user.name || "Anonymous Patient").trim(),
    age: Number(body.age || 0),
    gender: String(body.gender || "not_specified").toLowerCase(),
    bloodGroup: String(body.bloodGroup || "").trim().toUpperCase(),
    height: Number(body.height || 0),
    weight: Number(body.weight || 0),
    heartRate: Number(body.heartRate || 0),
    temperature: Number(body.temperature || 0),
    oxygen: Number(body.oxygen || 0),
    stressLevel: String(body.stressLevel || "moderate").toLowerCase(),
    activityLevel: String(body.activityLevel || "medium").toLowerCase(),
    lifestyleNotes: String(body.lifestyleNotes || "").trim(),
    symptoms
  };
}

function normalizeFeedback(body, user) {
  const stars = Number(body.stars || 0);
  const recordId = String(body.recordCreatedAt || "").trim();

  if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
    throw new Error("Feedback stars must be between 1 and 5.");
  }

  return {
    userId: user.id,
    userEmail: user.email,
    patientName: String(body.patientName || user.name || "Anonymous Patient").trim(),
    diagnosis: String(body.diagnosis || "").trim(),
    stars,
    comments: String(body.comments || "").trim(),
    recordCreatedAt: recordId,
    createdAt: new Date().toISOString()
  };
}

async function runAnalysis(payload) {
  try {
    return await runPrologAnalysis(payload);
  } catch {
    const fallback = runFallbackAnalysis(payload);
    return {
      ...fallback,
      engine: "fallback",
      engineMessage: "SWI-Prolog was not detected, so the built-in JavaScript mirror rules were used."
    };
  }
}

function runPrologAnalysis(payload) {
  return new Promise((resolve, reject) => {
    const symptomList = payload.symptoms.length ? payload.symptoms.join(",") : "none";
    const args = [
      "-q",
      "-s",
      PROLOG_FILE,
      "-g",
      `health_assessment_json('${escapeAtom(payload.name)}',${safeNumber(payload.age)},${safeNumber(payload.heartRate)},${safeNumber(payload.temperature)},${safeNumber(payload.oxygen)},${prologAtom(payload.stressLevel)},${prologAtom(payload.activityLevel)},'${escapeAtom(symptomList)}',Json),write(Json),halt.`,
      "-t",
      "halt"
    ];

    execFile("swipl", args, { cwd: ROOT, timeout: 10000 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message));
        return;
      }

      try {
        resolve(JSON.parse(stdout.trim()));
      } catch {
        reject(new Error(`Failed to parse Prolog output: ${stdout}`));
      }
    });
  });
}

function safeNumber(value) {
  return Number.isFinite(value) ? value : 0;
}

function escapeAtom(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function prologAtom(value) {
  return `'${escapeAtom(String(value).toLowerCase())}'`;
}

function runFallbackAnalysis(payload) {
  const symptoms = new Set(payload.symptoms);
  const observations = [];
  const recommendations = [];
  const precautions = [];
  const doctorSpecialization = [];
  const foodIntake = [];
  const foodsToAvoid = [];
  const exercisePlan = [];
  const dietPlan = [];
  const matched = [];
  let urgency = "low";
  let riskScore = 18;

  if (symptoms.has("fever") && symptoms.has("cough") && symptoms.has("fatigue")) {
    matched.push("viral_infection");
    observations.push("Symptom pattern matches a likely viral infection profile.");
    recommendations.push("Rest well, stay hydrated, and arrange a physician review if symptoms persist.");
    precautions.push("Avoid dehydration, crowded exposure, and heavy physical exertion until recovery.");
    doctorSpecialization.push("General physician", "Pulmonologist");
    foodIntake.push("Warm fluids", "Citrus fruits", "Light soups", "Soft cooked vegetables");
    foodsToAvoid.push("Deep-fried foods", "Ice-cold drinks", "Processed snacks");
    exercisePlan.push("Complete rest during fever", "Resume with short walks after recovery");
    dietPlan.push("Soft, warm, easy-to-digest meals", "Frequent fluids and vitamin-rich foods");
    riskScore += 20;
  }

  if (symptoms.has("chest_pain") && (symptoms.has("shortness_of_breath") || payload.oxygen < 93)) {
    matched.push("cardiac_alert");
    observations.push("Chest pain with breathing difficulty indicates a possible cardiac emergency.");
    recommendations.push("Seek urgent doctor attention immediately.");
    precautions.push("Avoid self-driving, strenuous activity, and delaying emergency evaluation.");
    doctorSpecialization.push("Cardiologist", "Emergency medicine specialist");
    foodIntake.push("Low-salt meals", "Oats", "Boiled vegetables", "Plenty of water unless medically restricted");
    foodsToAvoid.push("High-salt packaged food", "Deep-fried food", "Sugary beverages");
    exercisePlan.push("Avoid exercise until cleared by a doctor", "Focus on supervised breathing control and recovery");
    dietPlan.push("Low-sodium heart-friendly meals", "Small balanced meals with whole grains and vegetables");
    urgency = "critical";
    riskScore += 55;
  }

  if (symptoms.has("headache") && payload.stressLevel === "high") {
    matched.push("stress_overload");
    observations.push("Headache combined with high stress suggests stress overload.");
    recommendations.push("Reduce workload, improve sleep, and practice guided relaxation.");
    precautions.push("Avoid overwork, sleep loss, and excessive caffeine until symptoms settle.");
    doctorSpecialization.push("Neurologist", "Mental health counselor");
    foodIntake.push("Hydrating fluids", "Bananas", "Nuts in moderation", "Magnesium-rich foods");
    foodsToAvoid.push("Excess coffee", "Energy drinks", "Late-night junk food");
    exercisePlan.push("Gentle stretching", "Breathing exercises for 10 to 15 minutes", "Light yoga or walking");
    dietPlan.push("Regular meals without skipping", "Hydration-focused diet with magnesium-rich foods");
    riskScore += 12;
  }

  if (symptoms.has("thirst") && symptoms.has("frequent_urination")) {
    matched.push("diabetes_risk");
    observations.push("Frequent urination with thirst suggests diabetic-risk screening is needed.");
    recommendations.push("Schedule blood sugar testing and clinical review.");
    precautions.push("Avoid excess sugar intake, skipped meals, and ignoring repeat symptoms.");
    doctorSpecialization.push("Endocrinologist", "Diabetologist");
    foodIntake.push("High-fiber foods", "Whole grains", "Leafy vegetables", "Controlled-portion meals");
    foodsToAvoid.push("Sugary sweets", "Refined flour items", "Sweetened soft drinks");
    exercisePlan.push("Brisk walking for 30 minutes", "Light strength training 3 times a week");
    dietPlan.push("Low-sugar diabetic-friendly meal plan", "High-fiber foods with portion control");
    riskScore += 24;
  }

  if (payload.temperature >= 38.5) {
    observations.push("Temperature is elevated above the healthy threshold.");
    recommendations.push("Monitor fever closely and continue hydration.");
    precautions.push("Avoid cold drinks, alcohol, and poor hydration while fever is elevated.");
    riskScore += 10;
    urgency = urgency === "critical" ? "critical" : "medium";
  }

  if (payload.oxygen > 0 && payload.oxygen < 92) {
    observations.push("Oxygen saturation is low and needs urgent review.");
    recommendations.push("Use emergency care channels if oxygen remains low.");
    precautions.push("Avoid exertion and monitor oxygen readings closely when saturation is low.");
    urgency = "critical";
    riskScore += 35;
  }

  if (payload.heartRate > 110) {
    observations.push("Heart rate is elevated and should be monitored.");
    recommendations.push("Rest and repeat the measurement after a short interval.");
    precautions.push("Avoid intense exercise until heart rate returns closer to normal.");
    riskScore += 8;
    if (urgency === "low") urgency = "medium";
  }

  if (payload.activityLevel === "low") {
    recommendations.push("Add light daily movement and walking to improve wellness.");
    exercisePlan.push("Begin with 20 to 30 minutes of walking", "Use simple mobility exercises daily");
  }

  if (payload.stressLevel === "high") {
    recommendations.push("High stress detected. Include mindfulness and sleep recovery in the care plan.");
    exercisePlan.push("Practice meditation or breathing exercises each day");
  }

  if (payload.lifestyleNotes) {
    observations.push(`Lifestyle note captured: ${payload.lifestyleNotes}`);
  }

  if (matched.length === 0) {
    matched.push("general_wellness");
    observations.push("No strong disease rule was triggered from the current information.");
    recommendations.push("Maintain balanced diet, exercise, hydration, and regular check-ups.");
    precautions.push("Avoid irregular sleep, poor hydration, and a prolonged sedentary routine.");
    doctorSpecialization.push("General physician");
    foodIntake.push("Seasonal fruits", "Vegetables", "Protein-rich meals", "Adequate water intake");
    foodsToAvoid.push("Highly processed food", "Sugary packaged snacks", "Excess oily meals");
    exercisePlan.push("30 minutes of walking", "Light stretching", "Basic body-weight exercise 3 to 4 times weekly");
    dietPlan.push("Balanced diet with protein, vegetables, fruits, and whole grains");
  }

  if (payload.weight > 0 && payload.height > 0) {
    const heightInMeters = payload.height / 100;
    const bmi = payload.weight / (heightInMeters * heightInMeters);
    if (bmi >= 25) {
      observations.push("Body weight is above the ideal range based on the provided height.");
      recommendations.push("Follow a portion-controlled meal plan and routine exercise schedule.");
      precautions.push("Avoid frequent fried foods and sugary packaged snacks.");
      foodIntake.push("High-fiber salads", "Lean proteins", "Low-oil home-cooked meals");
      foodsToAvoid.push("Fried snacks", "Bakery sweets", "High-calorie fast food");
      exercisePlan.push("Low-impact cardio 4 to 5 times a week", "Strength training with gradual progression");
      dietPlan.push("Calorie-aware diet with high fiber and lean protein choices");
    }
  }

  if (urgency === "low" && riskScore > 45) urgency = "medium";
  if (urgency !== "critical" && riskScore > 70) urgency = "high";

  return {
    diagnosis: matched[0],
    matchedRules: matched,
    observations,
    recommendations: [...new Set(recommendations)],
    precautions: [...new Set(precautions)],
    doctorSpecialization: [...new Set(doctorSpecialization)],
    foodIntake: [...new Set(foodIntake)],
    foodsToAvoid: [...new Set(foodsToAvoid)],
    exercisePlan: [...new Set(exercisePlan)],
    dietPlan: [...new Set(dietPlan)],
    urgency,
    riskScore: Math.min(riskScore, 96)
  };
}

module.exports = {
  createServer,
  normalizePayload,
  runAnalysis,
  runFallbackAnalysis
};
