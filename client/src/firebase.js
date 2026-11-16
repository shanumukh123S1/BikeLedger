import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDkzJ9CCixVxkoe2JbeQ7_CoNO-df9-cEU",
  authDomain: "bikeledger-61867.firebaseapp.com",
  projectId: "bikeledger-61867",
  storageBucket: "bikeledger-61867.firebasestorage.app",
  messagingSenderId: "282713114383",
  appId: "1:282713114383:web:8f4f303210072cff48207a"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
