import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, signInAnonymously, type Auth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore, type Firestore } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions, type Functions } from 'firebase/functions';

// 値はEAS/expoの環境変数（EXPO_PUBLIC_*）から読み込む。実際の値は .env に設定する
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Firebaseプロジェクトを未デプロイのまま`firebase emulators:start`だけで開発できるようにする。
// 実機（Expo Go）から使う場合はlocalhostではなくPCのLAN IPが必要なため、
// EXPO_PUBLIC_FIREBASE_EMULATOR_HOSTで上書きできるようにしてある
const useEmulator = process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATOR === 'true';
const emulatorHost = process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST ?? 'localhost';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let functions: Functions | null = null;

// firebaseConfig未設定（.env未作成）だとgetAuth()等がモジュール読み込み時点で例外を投げ、
// Firebaseを使わない画面までアプリ全体がクラッシュする。そのため初期化は実際に使う直前まで遅延する
function getFirebaseApp(): FirebaseApp {
  if (!app) {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  }
  return app;
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
    if (useEmulator) connectAuthEmulator(auth, `http://${emulatorHost}:9099`, { disableWarnings: true });
  }
  return auth;
}

export function getFirebaseDb(): Firestore {
  if (!db) {
    db = getFirestore(getFirebaseApp());
    if (useEmulator) connectFirestoreEmulator(db, emulatorHost, 8080);
  }
  return db;
}

export function getFirebaseFunctions(): Functions {
  if (!functions) {
    functions = getFunctions(getFirebaseApp(), 'asia-northeast1');
    if (useEmulator) connectFunctionsEmulator(functions, emulatorHost, 5001);
  }
  return functions;
}

// TODO: 現状は既定の永続化（メモリ）のため、アプリ再起動でサインインし直しになり、
// 過去に作成したカードの createdBy と一致しなくなる（再共有・削除が失敗する）。
// firebase JS SDKのReact Native向け永続化（AsyncStorage）の最新の設定方法を確認して対応する。

/** 匿名認証でサインインする。カード作成（Firestore create）に必要 */
export async function ensureSignedIn() {
  const authInstance = getFirebaseAuth();
  if (!authInstance.currentUser) {
    await signInAnonymously(authInstance);
  }
  return authInstance.currentUser;
}
