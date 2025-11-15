# WiFiBank – Admin & User Credential Management Platform

A full React + Firebase platform for managing and selling WiFi credentials (Bronze, Silver, Gold, and VIP). The system includes an Admin Dashboard, User Management, Credential Assignment, Usage Tracking, and protected routes.

---

## 📁 Folder Structure

```
WIFIBANK/
├── server/
│   └── index.js
├── src/
│   ├── components/
│   │   ├── LogoutButton.jsx
│   │   └── PrivateRoute.jsx
│   ├── pages/
│   │   ├── AdminDashboard.jsx
│   │   ├── AdminLogin.jsx
│   │   ├── NotFound.jsx
│   │   ├── UserManagement.jsx
│   │   └── ZionWifiBank.jsx
│   ├── services/
│   ├── styles/
│   ├── App.js
│   ├── firebase.js
│   └── index.js
├── .env
├── .gitignore
├── package-lock.json
├── package.json
├── README.md
└── tailwind.config.js
```

---

## 🚀 Features

* 🔐 **Admin Authentication (Firebase Auth)**
* 📦 **Credential Assignment by Packages:** Bronze, Silver, Gold, VIP
* 📊 **Filters for:**

  * Package Type
  * Transaction Type
  * Used / Unused Credentials
* 🟢 **Real-time Firestore Sync**
* 🧩 **Protected Admin Routes**
* 🎛️ **Interactive Admin Dashboard**
* 💾 **Automatic Credential Status Update (used / unused)**
* 📱 **Responsive UI built with TailwindCSS**

---

## 🎯 Tech Stack

| Layer      | Technology                          |
| ---------- | ----------------------------------- |
| Frontend   | React + Vite / CRA                  |
| Styling    | Tailwind CSS                        |
| Backend    | Node.js (server folder optional)    |
| Database   | Firebase Firestore                  |
| Auth       | Firebase Authentication             |
| Deployment |  Vercel App / Firebase Hosting |

---

## 🛠️ Installation & Setup

Follow these steps after cloning the repository.

### 1️⃣ Clone the project

```
git clone https://github.com/your-username/WIFIBANK.git
cd WIFIBANK
```

### 2️⃣ Install dependencies

```
npm install
```

### 3️⃣ Setup Firebase

Create a `.env` file and add:

```
VITE_API_KEY=your_key
VITE_AUTH_DOMAIN=your_auth
VITE_PROJECT_ID=your_id
VITE_STORAGE_BUCKET=your_bucket
VITE_MESSAGING_SENDER_ID=your_sender_id
VITE_APP_ID=your_app_id
```

### 4️⃣ Run the development server

```
npm run dev
```

you should see:

```
  ➜  Local:   http://localhost:5173
```

---

## 🔐 Admin Login

Default admin login can be created manually in Firebase Authentication.

* **Email:** [youremail@example.com](mailto:youremail@example.com)
* **Password:** yourpassword

You may also create a custom SuperAdmin system.

---

## 🧠 Credential Flow

1. Admin selects user
2. Admin assigns package → Bronze / Silver / Gold / VIP
3. A username + password is auto-generated or selected
4. Firestore saves:

```
username
password
packageId
used (true/false)
createdAt
assignedTo
```

5. User enters credentials into WiFi login portal
6. Status updates to `used: true`

---

## 📊 Dashboard Sections

### 🟩 Total Credentials

Shows number of credentials created.

### 🔵 Available Credentials

Shows unused / unassigned credentials.

### 🔴 Used Credentials

Shows credentials which have been consumed.

### 📦 Filter by package

* Bronze
* Silver
* Gold
* VIP

### ⚡ Transaction Log.

Keeps history of who purchased which WiFi package.

---

## 📡 API Documentation (server folder)

The `server/index.js` allows external integrations.

### ▶️ Start backend server

```
node server/index.js
```

### Available Endpoints

| Method | Endpoint  | Description                |
| ------ | --------- | -------------------------- |
| GET    | /         | Test server response       |
| POST   | /purchase | Logs a credential purchase |

More endpoints can be added depending on your integration needs.

---

## 🖼️ Screenshots



📁 <div align="center">
  <img src="https://i.postimg.cc/cJchYZxW/Screenshot-2025-11-15-195148.png" width="600" height="200"/>
</div>

---

## 🧪 Testing

```
npm run test
```

---

## 📦 Build for Production

```
npm run build
```

Dist folder will be created for deployment.

---

## 🚀 Deployment Options

✔ Netlify
✔ Vercel
✔ Firebase Hosting
✔ cPanel build upload

---

## 🤝 Contributing

Pull requests are welcome. For major changes, open an issue first.

---

## 📄 License

This project is under the **MIT License**.

---

## 💬 Support

If you need help, contact the developer +233545454000 or open an issue on GitHub.

<p align="center">
  <img src="https://github-readme-stats.vercel.app/api/top-langs/?username=Kyekyeku-Tech&layout=compact&theme=vision-friendly-dark" />
</p>

---

### ⭐ If you use this project, don't forget to give it a GitHub star!
