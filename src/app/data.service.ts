
import { Injectable } from '@angular/core';
import { database } from './firebase.service';
import {
  ref,
  push,
  onValue
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

  // Mengambil data point dari Firebase
  getPoints(): Promise<any> {
    const pointsRef = ref(database, 'points');

    return new Promise((resolve, reject) => {
      onValue(
        pointsRef,
        (snapshot) => {
          resolve(snapshot.val());
        },
        (error) => {
          reject(error);
        },
        { onlyOnce: true }
      );
    });
  }
}
