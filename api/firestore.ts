import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { AppData } from '../types';

// A type guard to validate data retrieved from Firestore.
const isAppData = (data: any): data is AppData => {
  return (
    data &&
    typeof data.appName === 'string' &&
    Array.isArray(data.categoryGroups) &&
    Array.isArray(data.transactions) &&
    Array.isArray(data.accounts)
  );
};

/**
 * Recursively removes fields with `undefined` values from an object or array.
 * Firestore does not support `undefined` and will throw an error.
 * @param data The object or array to clean.
 * @returns A new object or array with all `undefined` values removed.
 */
const cleanDataForFirestore = (data: any): any => {
  if (data === null || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    // Recursively clean each item in the array.
    return data.map(item => cleanDataForFirestore(item));
  }

  // For objects, create a new object with only defined values.
  return Object.entries(data).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      // Recursively clean nested objects/arrays.
      acc[key] = cleanDataForFirestore(value);
    }
    return acc;
  }, {} as { [key: string]: any });
};

export class FirestoreService {
  private userDocRef;

  constructor(userId: string) {
    if (!userId) {
      throw new Error("Необхідний ID користувача для ініціалізації FirestoreService.");
    }
    // Each user's data is stored in a single document within the 'users' collection.
    this.userDocRef = doc(db, 'users', userId);
  }

  /**
   * Saves the entire application data object to the user's document in Firestore.
   * Creates the document if it doesn't exist, or overwrites it if it does.
   * This method first cleans the data to remove any `undefined` values.
   * @param appData The complete application data state.
   */
  async saveData(appData: AppData): Promise<void> {
    try {
      console.log('Data before cleaning for Firestore:', appData);
      const cleanedData = cleanDataForFirestore(appData);
      console.log('Data after cleaning for Firestore:', cleanedData);
      
      await setDoc(this.userDocRef, cleanedData);
    } catch (error) {
      console.error("Error saving data to Firestore:", error);
      throw new Error("Не вдалося зберегти дані. Перевірте з'єднання з Інтернетом.");
    }
  }

  /**
   * Loads the application data from the user's document in Firestore.
   * @returns The AppData object if found, otherwise null.
   */
  async loadData(): Promise<AppData | null> {
    try {
      const docSnap = await getDoc(this.userDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (isAppData(data)) {
          return data;
        } else {
           console.warn("Дані у Firestore мають неправильний формат AppData.");
           return null;
        }
      } else {
        // No document found for this user, which is expected for a first-time sign-in.
        return null;
      }
    } catch (error) {
      console.error("Error loading data from Firestore:", error);
      throw new Error("Не вдалося завантажити дані. Перевірте з'єднання з Інтернетом.");
    }
  }
}
