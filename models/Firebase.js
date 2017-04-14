const firebase = require("firebase-admin");

const serviceAccount = require("../config/serviceAccount.json");


firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
  databaseURL: "https://tymo-edb9f.firebaseio.com"
});

module.exports = firebase; 