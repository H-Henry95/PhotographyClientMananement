# PhotographyClientMananement

A lightweight photography booking studio dashboard built with React and Vite.

## Overview

This app helps photographers manage booking inquiries, client pipelines, shoot dates, workflows, communications, and revenue tracking. All data is stored locally in the browser using `window.storage`, so it works offline and stays private to your device.

## Features

- Dashboard showing active bookings, pending actions, upcoming shoots, and revenue
- Booking pipeline by stage, from inquiry through completed
- Calendar view with shoot date event cards
- Create and manage bookings with client contact info, shoot type, price, location, and notes
- Booking detail view with quick edits, workflow checklist, and communication logs
- Local persistence for bookings and activity

## Tech Stack

- React
- Vite
- JavaScript (JSX)
- Browser local storage

## Getting Started

### Install dependencies

```bash
npm install
```

### Run locally

```bash
npm run dev
```

Open the local server URL shown in the terminal to use the app.

### Build for production

```bash
npm run build
```

## Project Structure

- `index.html` – application shell
- `main.jsx` – React entrypoint
- `photographer-bookings.jsx` – booking dashboard app
- `vite.config.js` – Vite configuration

## Notes

- Data persists locally in the browser.
- No server or backend is required.
- Designed for managing photography bookings from inquiry through completion.
