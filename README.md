# Quran Tracker

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-20232a?style=flat&logo=react&logoColor=61dafb)](https://react.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=flat&logo=Prisma&logoColor=white)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

Quran Tracker is an inclusive, descriptive, and user-friendly web application that helps people track Quran reading, set daily goals, and stay consistent — during Ramadan and throughout the year. Whether you’re aiming for a full Khatma or steady daily reading, the app provides the tools to support your journey.

## ✨ Features

- Personalized reading goals based on Khatma plans
- Daily progress logging with clear visual feedback
- Ramadan-focused view to support month-long goals
- Integrated prayer times to plan reading around prayers
- Accessible, welcoming UX for readers of all backgrounds
- Secure authentication with Clerk

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Clerk API keys

### Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment variables:
   Create a `.env` (or `.env.local`) file in the project root with your database URL and Clerk credentials.
3. Run Prisma migrations and generate client:
   ```bash
   npx prisma migrate dev
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open http://localhost:3000 in your browser.

## 🧭 Scripts
- `npm run dev` — start the Next.js dev server
- `npm run build` — generate Prisma client and build the app
- `npm start` — run the production server

## 📖 Learn More
- Next.js: https://nextjs.org/docs
- Prisma: https://www.prisma.io/docs
- Clerk: https://clerk.com/docs
- Tailwind CSS: https://tailwindcss.com/docs

## 📄 License
This project is licensed under the MIT License — see the [LICENSE](./LICENSE) file for details.

---
Made with ❤️ for the community.
