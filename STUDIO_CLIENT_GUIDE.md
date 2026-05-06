# Admin Dashboard Client Guide

Welcome! Your website content is managed through the **Admin Dashboard** using Firebase.

## How to Access the Admin Dashboard

Open: `http://localhost:3000/login` (local development)  
Or your production URL: `/login` (navbar Login link). After signing in you will be redirected to `/admin`.

---

## First-Time Setup (Admin Access)

1. Create a Firebase Auth user (email + password).
2. In Firestore, add a document in the `admins` collection:
	- Document ID: the user's UID
	- Fields: can be empty or `{ email: "name@domain.com" }`
3. Sign in at `/admin` with that user.

---

## Content Management

All site content is stored in one JSON document: `siteContent/main`.

### Edit Content
1. Sign in to `/admin`
2. Open **Site Content JSON**
3. Edit any text, image URL, or page section
4. Click **Save**

### Seed Defaults
If Firestore is empty, click **Seed Defaults** to populate the starting content.

---

## Image Management

### Where Images Are Stored

OK: **Images are stored in Firebase Storage**
- Uploads -> Firebase Storage -> URL saved in Firestore

### How to Upload Images

1. In `/admin`, open **Media Upload**
2. Choose a folder (e.g., `home`, `projects`, `about`)
3. Select an image file
4. Copy the generated URL
5. Paste it into the JSON for the relevant image field

---

## Editable Sections (JSON keys)

- `global` -> logo, nav items, footer
- `home` -> hero text, buttons, featured design, tiles
- `about` -> profile, licenses, services, awards
- `projectsPage` -> featured spotlight + extra panels
- `projectItems` -> all project cards and detail pages
- `contact` -> office info, contact details
- `gallery` -> gallery items

---

## Publishing Changes

After editing:
1. Click **Save**
2. Your changes go live immediately

---

## Image Best Practices

- Upload images in **modern formats** (AVIF, WebP, JPG)
- Use images **1200px wide or larger** for best quality
- Keep file names short and clear
