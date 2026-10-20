
import { Injectable } from '@angular/core';
import { database } from './firebase.service';
import {
  ref,
  push,
  onValue,
  remove,
  update,
  get
} from 'firebase/database';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  // Menyimpan point baru ke Firebase
  savePoint(point: {
    name: string;
    coordinates: string;
    description: string;
  }) {
    const pointsRef = ref(database, 'points');
    return push(pointsRef, point);
  }

  // Mengambil seluruh point dari Firebase
  getPoints(): Promise<any> {
    const pointsRef = ref(database, 'points');

    return new Promise((resolve, reject) => {
      onValue(
        pointsRef,
        (snapshot) => {
          const data = snapshot.val();
          resolve(data);
        },
        (error) => {
          reject(error);
        },
        { onlyOnce: true }
      );
    });
  }

  // Menghapus point berdasarkan key
  deletePoint(key: string) {
    const pointRef = ref(database, `points/${key}`);
    return remove(pointRef);
  }

  // Mengambil satu point berdasarkan key
  async getPoint(key: string): Promise<any> {
    const pointRef = ref(database, `points/${key}`);
    const snapshot = await get(pointRef);
    return snapshot.val();
  }

  // Memperbarui nama dan koordinat point
  updatePoint(key: string, point: {
    name: string;
    coordinates: string;
  }) {
    const pointRef = ref(database, `points/${key}`);
    return update(pointRef, point);
  }
}
