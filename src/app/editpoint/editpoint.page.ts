
import {
  Component,
  AfterViewInit,
  OnDestroy,
  inject
} from '@angular/core';

import { ActivatedRoute } from '@angular/router';
import { NavController, AlertController } from '@ionic/angular';
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
  selector: 'app-editpoint',
  templateUrl: './editpoint.page.html',
  styleUrls: ['./editpoint.page.scss'],
  standalone: false,
})
export class EditpointPage implements AfterViewInit, OnDestroy {

  map!: L.Map;
  key = '';
  name = '';
  coordinates = '';

  private route = inject(ActivatedRoute);
  private navCtrl = inject(NavController);
  private alertCtrl = inject(AlertController);
  private dataService = inject(DataService);

  async ngAfterViewInit() {
    this.key = this.route.snapshot.paramMap.get('key') || '';

    if (!this.key) {
      await this.showAlert('Point tidak ditemukan.');
      return;
    }

    try {
      const point: any = await this.dataService.getPoint(this.key);

      if (!point || typeof point.coordinates !== 'string') {
        await this.showAlert('Data point tidak ditemukan.');
        return;
      }

      this.name = point.name || '';
      this.coordinates = point.coordinates;

      const parts = this.coordinates
        .split(',')
        .map((value: string) => Number(value.trim()));

      if (
        parts.length !== 2 ||
        !parts.every(Number.isFinite) ||
        parts[0] < -90 || parts[0] > 90 ||
        parts[1] < -180 || parts[1] > 180
      ) {
        await this.showAlert('Koordinat point tidak valid.');
        return;
      }

      this.map = L.map('mapedit').setView(
        [parts[0], parts[1]],
        13
      );

      const osm = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
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

      const tooltip =
        'Drag the marker to change the coordinates of the location';

      const marker = L.marker(
        [parts[0], parts[1]],
        { draggable: true }
      ).addTo(this.map);

      marker.bindPopup(tooltip);
      marker.openPopup();

      marker.on('dragend', () => {
        const latlng = marker.getLatLng();

        this.coordinates =
          `${latlng.lat.toFixed(9)},${latlng.lng.toFixed(9)}`;
      });

      setTimeout(() => {
        this.map?.invalidateSize();
      }, 200);

    } catch (error: any) {
      await this.showAlert(
        error?.message || 'Gagal memuat data point.'
      );
    }
  }

  async save() {
    const name = this.name.trim();
    const parts = this.coordinates
      .split(',')
      .map((value: string) => Number(value.trim()));

    if (!name || !this.coordinates.trim()) {
      await this.showAlert('Name dan Coordinates wajib diisi.');
      return;
    }

    if (
      parts.length !== 2 ||
      !parts.every(Number.isFinite) ||
      parts[0] < -90 || parts[0] > 90 ||
      parts[1] < -180 || parts[1] > 180
    ) {
      await this.showAlert(
        'Koordinat tidak valid. Gunakan format latitude,longitude.'
      );
      return;
    }

    try {
      await this.dataService.updatePoint(this.key, {
        name,
        coordinates: `${parts[0]},${parts[1]}`
      });

      this.navCtrl.back();
    } catch (error: any) {
      await this.showAlert(
        error?.message || 'Data point gagal diperbarui.'
      );
    }
  }

  private async showAlert(message: string) {
    const alert = await this.alertCtrl.create({
      header: 'Informasi',
      message,
      buttons: ['OK']
    });

    await alert.present();
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }
}
