// Firebase reserved-URL config for the auth helper served at app.clearform.in.
// Mirrors init.json; the /__/auth/* pages are proxied to firebaseapp.com (see
// vercel.json) and load this config from the app origin.
if (typeof firebase !== 'undefined') {
  firebase.initializeApp({
    apiKey: 'AIzaSyDXlzu1BquoMP9eN-Ubt7nZz0OZtl-pSKc',
    authDomain: 'app.clearform.in',
    projectId: 'clearform-284ce',
    storageBucket: 'clearform-284ce.firebasestorage.app',
    messagingSenderId: '331026360088',
    appId: '1:331026360088:web:bfefc39379fd313225e06d',
    measurementId: 'G-G5EKK7FQ0X',
  });
}
