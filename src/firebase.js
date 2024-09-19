import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
    apiKey: "AIzaSyBcZ25bTey1Cv0_-DmHlKlgbAH08dwCmXg",
    authDomain: "pplx-test.firebaseapp.com",
    projectId: "pplx-test",
    storageBucket: "pplx-test.appspot.com",
    messagingSenderId: "284849894182",
    appId: "1:284849894182:web:5020a8c4ca5dccf89547e7",
    measurementId: "G-7G7WL4YTBZ"
  };

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

export { analytics, db };