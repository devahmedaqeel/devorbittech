# Dev Orbit Tech — Official Website

> Code. Create. Innovate.

Official website for **Dev Orbit Tech** — a modern technology startup focused on delivering innovative digital solutions and empowering students with future-ready technical skills.

**Live Site:** [devorbittech.org](https://devorbittech.org)
**GitHub Pages:** [devahmedaqeel.github.io/devorbittech](https://devahmedaqeel.github.io/devorbittech/)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JS |
| 3D Background | Three.js |
| Serverless API | Vercel Functions (Node.js) |
| Email | Nodemailer + Gmail |
| Hosting | Vercel |

---

## Project Structure

```
devorbittech-email/
├── frontend/               # Static website files
│   ├── index.html
│   ├── css/style.css
│   ├── js/main.js
│   └── images/
├── api/                    # Vercel serverless functions
│   ├── submit-contact.js   # Contact form → sends email
│   └── get-stats.js        # Message counter
├── netlify/functions/      # Netlify functions (backup)
├── server.js               # Local dev server
├── vercel.json             # Vercel config
├── netlify.toml            # Netlify config
└── package.json
```

---

## Features

- Animated Three.js particle background
- Custom cursor with trail effect
- Hero typewriter animation
- 3D card tilt on hover
- Scroll reveal animations
- Animated statistics counters
- Contact form with email notifications
- Success popup after form submission
- Fully responsive design
- CEO & Founder section

---

## Services

- Artificial Intelligence (AI)
- Web Development
- Mobile Application Development
- Graphic Designing
- Software Documentation
- Digital Innovation

---

## Local Development

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Add your Gmail credentials in .env

# Start local server
npm start
# Visit http://localhost:8888
```

### Environment Variables

```env
GMAIL_USER=your@gmail.com
GMAIL_APP_PASSWORD=your_app_password
ADMIN_EMAIL=your@gmail.com
```

---

## Deployment

### Vercel
```bash
npx vercel --prod
```

### Netlify
```bash
npx netlify-cli deploy --prod --dir=frontend --functions=netlify/functions
```

---

## Contact

- **Email:** official.devorbittech@gmail.com
- **Founder:** Engr. Ahmed Aqeel — CEO & Founder
- **Location:** Software Technology Park, University of Kotli (AJK)

---

&copy; 2025 Dev Orbit Tech. All rights reserved.
