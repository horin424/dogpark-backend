"use client";
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import {
    getFirestore,
    initializeFirestore,
    persistentLocalCache,
    persistentMultipleTabManager,
    Firestore,
} from "firebase/firestore";
import { getAuth, Auth, signInAnonymously } from "firebase/auth";
import { getStorage, FirebaseStorage } from "firebase/storage";

const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let _app: FirebaseApp | null = null;
let _db: Firestore | null = null;
let _auth: Auth | null = null;
let _storage: FirebaseStorage | null = null;

function ensureApp(): FirebaseApp {
    if (_app) return _app;
    if (!config.apiKey || !config.projectId) {
        throw new Error(
            "Firebase config missing. Create .env.local with NEXT_PUBLIC_FIREBASE_* vars. See FIREBASE_SETUP.md.",
        );
    }
    _app = getApps()[0] ?? initializeApp(config as Record<string, string>);
    return _app;
}

export function db(): Firestore {
    if (_db) return _db;
    const app = ensureApp();
    try {
        _db = initializeFirestore(app, {
            ignoreUndefinedProperties: true,
            localCache: persistentLocalCache({
                tabManager: persistentMultipleTabManager(),
            }),
        });
    } catch {
        _db = getFirestore(app);
    }
    return _db;
}

export function auth(): Auth {
    if (!_auth) _auth = getAuth(ensureApp());
    return _auth;
}

export function storage(): FirebaseStorage {
    if (!_storage) _storage = getStorage(ensureApp());
    return _storage;
}

let _anonPromise: Promise<void> | null = null;

/** Sign in anonymously once per page load so Firestore/Storage rules accept us. */
export function ensureAnonAuth(): Promise<void> {
    if (typeof window === "undefined") return Promise.resolve();
    if (auth().currentUser) return Promise.resolve();
    if (!_anonPromise) {
        _anonPromise = signInAnonymously(auth())
            .then(() => undefined)
            .catch((err) => {
                _anonPromise = null;
                throw err;
            });
    }
    return _anonPromise;
}
