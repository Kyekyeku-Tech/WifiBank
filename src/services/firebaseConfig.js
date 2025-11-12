// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
apiKey: "AIzaSyAi_d49wPWfG2CJNBXS1igAj3JRxXN-LgU",
authDomain: "kyekyeku-ca8e3.firebaseapp.com",
projectId: "kyekyeku-ca8e3",
storageBucket: "kyekyeku-ca8e3.appspot.com",
messagingSenderId: "107861040313",
appId: "1:107861040313:web:0b3cb81ba00e89e79f4f68"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
