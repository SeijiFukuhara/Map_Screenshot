import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  Timestamp,
  where,
} from 'firebase/firestore';
import type { Place, RouteCard, RouteOption } from '@routecard/shared';

import { ensureSignedIn, getFirebaseDb } from './firebase';

const CARDS_COLLECTION = 'routeCards';
const EXPIRES_AFTER_DAYS = 7;

export interface CreateCardInput {
  origin: Place;
  destination: Place;
  route: RouteOption;
  memo: string;
}

// FirestoreのTTLポリシーはTimestamp型のフィールドにしか設定できないため、
// expiresAtだけはFirestore Timestampとして保存する（他の日時項目は共有のISO文字列のまま）
type StoredRouteCard = Omit<RouteCard, 'expiresAt'> & { expiresAt: Timestamp };

export async function createCard(input: CreateCardInput): Promise<string> {
  const user = await ensureSignedIn();
  if (!user) throw new Error('サインインに失敗しました');

  const expiresAtDate = new Date(input.route.departureTime);
  expiresAtDate.setDate(expiresAtDate.getDate() + EXPIRES_AFTER_DAYS);

  const card: StoredRouteCard = {
    origin: input.origin,
    destination: input.destination,
    searchType: input.route.searchType,
    departureTime: input.route.departureTime,
    arrivalTime: input.route.arrivalTime,
    legs: input.route.legs,
    fare: input.route.fare,
    memo: input.memo,
    createdBy: user.uid,
    createdAt: new Date().toISOString(),
    expiresAt: Timestamp.fromDate(expiresAtDate),
  };

  const ref = await addDoc(collection(getFirebaseDb(), CARDS_COLLECTION), card);
  return ref.id;
}

export async function listMyCards(): Promise<(RouteCard & { id: string })[]> {
  const user = await ensureSignedIn();
  if (!user) return [];

  const q = query(
    collection(getFirebaseDb(), CARDS_COLLECTION),
    where('createdBy', '==', user.uid),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data() as StoredRouteCard;
    return { id: d.id, ...data, expiresAt: data.expiresAt.toDate().toISOString() };
  });
}

export async function deleteCard(cardId: string): Promise<void> {
  await deleteDoc(doc(getFirebaseDb(), CARDS_COLLECTION, cardId));
}
