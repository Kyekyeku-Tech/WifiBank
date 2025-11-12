# Starlink Paystack Platform


This project is a starter React app that integrates Paystack, Firebase (Auth + Firestore), and MNotify for SMS delivery of credentials generated externally (e.g., Mikmoh).


## Setup
1. Install dependencies:


```bash
npm install
```


2. Tailwind setup (already included in devDependencies). Ensure your PostCSS config is present if using Tailwind via Vite.


3. Create Firebase project and enable Auth & Firestore.


4. Create collections in Firestore:
- `packages` — documents describing packages (id used as packageId)
- `credentials` — will be populated by Admin uploads
- `admins` — document IDs equal to admin user UIDs (empty object is fine)


5. Configure Paystack
- Use your Paystack public key in `src/pages/UserPackages.jsx` (already set to: `23bhfkfkkfppkkmmfmbo`)


6. Backend Cloud Function (recommended)
- Implement a Firebase Function that receives Paystack webhooks, verifies signature using your Paystack secret, picks an available credential from `credentials` for the purchased package, marks it `assigned`, writes an `orders/{reference}` document, and calls MNotify to send SMS.


Example MNotify details you can use:
- API Key: `vyVaXse95rCEqZzqLf3rbp35r`
- Sender ID: `PAYG`


## How it works
- Admin logs in at `/admin/login` (Firebase Auth email/password). Add the admin user UID in `admins/{uid}` to grant access.
- Admin uploads Mikmoh usernames/passwords (CSV or pasted) and assigns them to a `packageId`.
- Users browse packages, pay via Paystack, and the server-side webhook handles assignment and SMS.


## Notes & Security
- Do NOT store Paystack secret or MNotify key in the frontend. The payment verification and SMS sending must happen server-side in a secure environment (Firebase Functions or your server).
- The Paystack public key is safe to include in the frontend.




# End of project files