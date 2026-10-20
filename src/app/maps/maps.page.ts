
import {
  Component,
  AfterViewInit,
  OnDestroy,
  inject
} from '@angular/core';

import { AlertController, NavController } from '@ionic/angular';
import { DataService } from '../data.service';
import * as L from 'leaflet';

const iconDefault = L.icon({
  iconRetinaUrl: 'assets/marker-icon-2x.png',
  iconUrl: 'assets/marker-icon.png',
  shadowUrl: 'assets/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = iconDefault;

@Component({
  selector: 'app-maps',
  templateUrl: './maps.page.html',
  styleUrls: ['./maps.page.scss'],
  standalone: false,
})
export class MapsPage implements AfterViewInit, OnDestroy {

  map!: L.Map;

  private dataService = inject(DataService);
  private alertCtrl = inject(AlertController);
  private navCtrl = inject(NavController);

  async ngAfterViewInit() {
    this.map = L.map('map').setView(
      [-7.7956, 110.3695],
      13
    );

    L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution: '&copy; OpenStreetMap contributors'
      }
    ).addTo(this.map);

    setTimeout(() => {
      this.map?.invalidateSize();
    }, 200);

    await this.loadPoints();
  }

  async loadPoints() {
    try {
      const points: Record<string, any> | null =
        await this.dataService.getPoints();

      if (!points) return;

      for (const key of Object.keys(points)) {
        const point = points[key];

        if (!point || typeof point.coordinates !== 'string') {
          continue;
        }

        const coordinates = point.coordinates
          .split(',')
          .map((value: string) => Number(value.trim()));

        if (
          coordinates.length !== 2 ||
          !coordinates.every(Number.isFinite) ||
          coordinates[0] < -90 ||
          coordinates[0] > 90 ||
          coordinates[1] < -180 ||
          coordinates[1] > 180
        ) {
          continue;
        }

        const marker = L.marker([
          coordinates[0],
          coordinates[1]
        ]).addTo(this.map);

        const popupContent = document.createElement('div');

        const title = document.createElement('strong');
        title.textContent = point.name || 'Tanpa nama';

        const description = document.createElement('p');
        description.textContent = point.description || '';

        const editLink = document.createElement('a');
        editLink.href = `/editpoint/${encodeURIComponent(key)}`;
        editLink.textContent = 'Edit';
        editLink.className = 'edit-link';

        const separator = document.createTextNode(' | ');

        const deleteLink = document.createElement('a');
        deleteLink.href = '#';
        deleteLink.textContent = 'Delete';
        deleteLink.className = 'delete-link';

        editLink.addEventListener('click', (event: MouseEvent) => {
          event.preventDefault();
          void this.navCtrl.navigateForward(
            `/editpoint/${encodeURIComponent(key)}`
          );
        });

        deleteLink.addEventListener('click', (event: MouseEvent) => {
          event.preventDefault();
          void this.deletePoint(key, marker);
        });

        popupContent.appendChild(title);
        popupContent.appendChild(description);
        popupContent.appendChild(editLink);
        popupContent.appendChild(separator);
        popupContent.appendChild(deleteLink);

        marker.bindPopup(popupContent);
      }
    } catch (error: any) {
      const alert = await this.alertCtrl.create({
        header: 'Gagal Memuat Point',
        message: error?.message || 'Data point gagal dibaca.',
        buttons: ['OK']
      });

      await alert.present();
    }
  }

  async deletePoint(key: string, marker: L.Marker) {
    try {
      await this.dataService.deletePoint(key);
      this.map.removeLayer(marker);
    } catch (error: any) {
      const alert = await this.alertCtrl.create({
        header: 'Gagal Menghapus Point',
        message: error?.message || 'Data point gagal dihapus.',
        buttons: ['OK']
      });

      await alert.present();
    }
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }
}
