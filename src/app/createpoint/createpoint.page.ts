
import {
  Component,
  AfterViewInit,
  OnDestroy,
  inject
} from '@angular/core';

import {
  NavController,
  AlertController
} from '@ionic/angular';

import { DataService } from '../data.service';
import * as L from 'leaflet';
import { icon, Marker } from 'leaflet';

const iconDefault = icon({
  iconRetinaUrl: 'assets/marker-icon-2x.png',
  iconUrl: 'assets/marker-icon.png',
  shadowUrl: 'assets/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

Marker.prototype.options.icon = iconDefault;

@Component({
  selector: 'app-createpoint',
  templateUrl: './createpoint.page.html',
  styleUrls: ['./createpoint.page.scss'],
  standalone: false,
})
export class CreatepointPage implements AfterViewInit, OnDestroy {

  map!: L.Map;

  name = '';
  coordinates = '';
  description = '';

  private navCtrl = inject(NavController);
  private alertCtrl = inject(AlertController);
  private dataService = inject(DataService);

  ngAfterViewInit() {
    this.map = L.map('mapcreate').setView(
      [-7.7956, 110.3695],
      13
    );

    const osm = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution: '&copy; OpenStreetMap contributors'
      }
    );

    const esri = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: 'Tiles &copy; Esri'
      }
    );

    osm.addTo(this.map);

    L.control.layers({
      'OpenStreetMap': osm,
      'Esri World Imagery': esri
    }).addTo(this.map);

    const marker = L.marker(
      [-7.7956, 110.3695],
      { draggable: true }
    ).addTo(this.map);

    marker.bindPopup(
      'Drag the marker to change the coordinates of the location'
    );

    marker.openPopup();

    // Mengisi koordinat awal
    this.updateCoordinates(marker.getLatLng());

    // Memperbarui koordinat saat marker selesai digeser
    marker.on('dragend', () => {
      this.updateCoordinates(marker.getLatLng());
    });

    // Memperbaiki ukuran peta setelah elemen tampil
    setTimeout(() => {
      this.map.invalidateSize();
    }, 200);
  }

  private updateCoordinates(latlng: L.LatLng) {
    const lat = latlng.lat.toFixed(9);
    const lng = latlng.lng.toFixed(9);

    this.coordinates = `${lat},${lng}`;
  }

  async save() {
    if (!this.name.trim() || !this.coordinates.trim()) {
      const alert = await this.alertCtrl.create({
        header: 'Input belum lengkap',
        message: 'Name dan Coordinates wajib diisi.',
        buttons: ['OK']
      });

      await alert.present();
      return;
    }

    // Validasi format koordinat latitude,longitude
    const parts = this.coordinates.split(',').map(
      (value) => Number(value.trim())
    );

    if (
      parts.length !== 2 ||
      !parts.every((value) => Number.isFinite(value)) ||
      parts[0] < -90 ||
      parts[0] > 90 ||
      parts[1] < -180 ||
      parts[1] > 180
    ) {
      const alert = await this.alertCtrl.create({
        header: 'Koordinat tidak valid',
        message: 'Masukkan koordinat dalam format latitude,longitude.',
        buttons: ['OK']
      });

      await alert.present();
      return;
    }

    try {
      const pointData = {
        name: this.name.trim(),
        coordinates: `${parts[0]},${parts[1]}`,
        description: this.description.trim()
      };

      await this.dataService.savePoint(pointData);

      this.navCtrl.navigateBack('/tabs/maps');
    } catch (error: any) {
      const alert = await this.alertCtrl.create({
        header: 'Save Failed',
        message: error?.message || 'Data gagal disimpan ke Firebase.',
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
