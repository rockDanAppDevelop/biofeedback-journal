import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';

import { auth, db } from '../../../lib/firebase';
import type { RoutineTemplate, RoutineTemplateItem } from '../types/routine-template.types';

export type CreateRoutineTemplateInput = {
  name: string;
  cycleLengthDays: number;
  items: Omit<RoutineTemplateItem, 'id' | 'sortOrder'>[];
};

export type UpdateRoutineTemplateInput = {
  name?: string;
  cycleLengthDays?: number;
  items?: RoutineTemplateItem[];
  isArchived?: boolean;
};

type FirebaseRoutineTemplateDocument = Omit<RoutineTemplate, 'id' | 'userId'>;

function getCurrentUserOrThrow() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('No authenticated user');
  }

  return user;
}

function createRoutineTemplateItemId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function mapRoutineTemplateDocument(
  docSnapshot: { id: string; data(): unknown },
  userId: string,
): RoutineTemplate {
  const data = docSnapshot.data() as FirebaseRoutineTemplateDocument;

  return {
    id: docSnapshot.id,
    userId,
    name: data.name,
    cycleLengthDays: data.cycleLengthDays,
    items: data.items ?? [],
    isArchived: data.isArchived ?? false,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export async function createRoutineTemplate(
  input: CreateRoutineTemplateInput,
): Promise<RoutineTemplate> {
  const user = getCurrentUserOrThrow();
  const templatesCollection = collection(db, 'users', user.uid, 'routineTemplates');
  const nowIso = new Date().toISOString();

  const docData: FirebaseRoutineTemplateDocument = {
    name: input.name.trim(),
    cycleLengthDays: input.cycleLengthDays,
    items: input.items.map((item, index) => ({
      id: createRoutineTemplateItemId(),
      sortOrder: index,
      ...item,
    })),
    isArchived: false,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  const docRef = await addDoc(templatesCollection, docData);

  return {
    id: docRef.id,
    userId: user.uid,
    ...docData,
  };
}

export async function listRoutineTemplates(): Promise<RoutineTemplate[]> {
  const user = getCurrentUserOrThrow();
  const templatesCollection = collection(db, 'users', user.uid, 'routineTemplates');
  const templatesQuery = query(templatesCollection, where('isArchived', '==', false));
  const snapshot = await getDocs(templatesQuery);

  return snapshot.docs
    .map((docSnapshot) => mapRoutineTemplateDocument(docSnapshot, user.uid))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getRoutineTemplateById(templateId: string): Promise<RoutineTemplate | null> {
  const user = getCurrentUserOrThrow();
  const templateRef = doc(db, 'users', user.uid, 'routineTemplates', templateId);
  const snapshot = await getDoc(templateRef);

  if (!snapshot.exists()) {
    return null;
  }

  return mapRoutineTemplateDocument(snapshot, user.uid);
}

export async function updateRoutineTemplate(
  templateId: string,
  input: UpdateRoutineTemplateInput,
): Promise<void> {
  const user = getCurrentUserOrThrow();
  const templateRef = doc(db, 'users', user.uid, 'routineTemplates', templateId);

  await updateDoc(templateRef, {
    ...input,
    ...(input.name !== undefined ? { name: input.name.trim() } : {}),
    updatedAt: new Date().toISOString(),
  });
}

export async function archiveRoutineTemplate(templateId: string): Promise<void> {
  await updateRoutineTemplate(templateId, {
    isArchived: true,
  });
}
