# Smart Health Care

Smart Health Care is a web-based healthcare and wellness application with:

- Login and registration
- Patient details entry
- Symptom selection
- Prolog-backed health analysis with JavaScript fallback
- Report generation with diet, exercise, and food guidance
- Final star-rating feedback page

## Tech stack

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js HTTP server
- Expert system: SWI-Prolog
- Storage: local JSON files in `data/`

## Run locally

1. Install Node.js 18 or newer.
2. Start the app:

```bash
npm start
```

3. Open:

```text
http://localhost:3000/smart-health-care
```

## Open on phone

If your phone and computer are on the same Wi-Fi network, start the app and open:

```text
http://YOUR-COMPUTER-IP:3000/smart-health-care
```

Example:

```text
http://192.168.1.5:3000/smart-health-care
```

## Deploy publicly

This project is now prepared for Render deployment with:

- `render.yaml`
- `PORT` support
- health endpoint at `/api/health`

### Render steps

1. Push this project to GitHub.
2. Create a new Web Service in Render.
3. Connect your GitHub repository.
4. Render will detect `render.yaml`.
5. Deploy the app.
6. Open the public URL Render gives you on your phone.

After deployment, your site will open on a public link like:

```text
https://smart-health-care.onrender.com
```

You can later connect a custom domain if you want.

## Important deployment note

This app currently stores users, reports, and feedback in local JSON files:

- `data/users.json`
- `data/records.json`
- `data/feedback.json`

On many hosting platforms, local filesystem data is not permanent across redeploys or restarts.

For production use, replace JSON storage with a real database such as:

- PostgreSQL
- MongoDB
- MySQL

## Prolog engine

If SWI-Prolog is installed and `swipl` is available on the server PATH, the app uses the real Prolog expert rules.

If SWI-Prolog is not available, the app automatically falls back to built-in JavaScript rules.

## Main files

- `index.html` - login page
- `patient-details.html` - patient details form
- `symptoms.html` - symptom selection
- `report.html` - generated health report
- `feedback.html` - final star-rating feedback page
- `server.js` - backend server and API
- `prolog/health_expert.pl` - expert system rules
- `styles.css` - shared UI theme
- `flow.js` - front-end flow logic
