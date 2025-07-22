import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  "projectId": "geminipdf-chat-lq7rj",
  "appId": "1:989033345818:web:45b3303a27647cf54fb2a3",
  "storageBucket": "geminipdf-chat-lq7rj.firebasestorage.app",
  "apiKey": "AIzaSyAbXbbE0lppdQUfk--acckxzIzZsBNk22U",
  "authDomain": "geminipdf-chat-lq7rj.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "989033345818"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth };
