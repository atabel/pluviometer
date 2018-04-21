// @flow
import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin';
import atob from 'atob';

const serviceAccount = JSON.parse(atob(process.env.FIREBASE_PRIVATE_KEY));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const getDataBase = () => db;

export default getDataBase;
