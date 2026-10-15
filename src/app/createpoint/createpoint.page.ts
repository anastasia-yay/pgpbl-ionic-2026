import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { NavController, AlertController } from '@ionic/angular';
import { DataService } from '../data.service';
import * as L from 'leaflet';
import { icon, Marker } from 'leaflet';

// Konfigurasi ikon marker tanpa shadow
const iconDefault = icon({
  iconRetinaUrl: 'assets/marker-icon2.png',
  iconUrl: 'assets/marker-icon2.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28]
});

Marker.prototype.options.icon = iconDefault;

@Component({
  selector: 'app-createpoint',
  templateUrl: './createpoint.page.html',
  styleUrls: ['./createpoint.page.scss'],
  standalone: false,
})
export class CreatepointPage implements OnInit, OnDestroy {

  map!: L.Map;

  name = '';
  coordinates = '';
  description = '';

  private navCtrl = inject(NavController);
  private alertCtrl = inject(AlertController);
  private dataService = inject(DataService);

  ngOnInit() {
    setTimeout(() => {
      // Membuat peta
      this.map = L.map('mapcreate').setView(
        [-7.7956, 110.3695],
        13
      );

      // OpenStreetMap
      const osm = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }
      );

      // Esri World Imagery
      const esri = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles &copy; Esri'
        }
      );

      // Menampilkan basemap awal
      osm.addTo(this.map);

      // Kontrol pilihan basemap
      const baseMaps = {
        'OpenStreetMap': osm,
        'Esri World Imagery': esri
      };

      L.control.layers(baseMaps).addTo(this.map);

      // Petunjuk pada marker
      const tooltip =
        'Drag the marker or move the map<br>' +
        'to change the coordinates<br>' +
        'of the location';

      // Marker yang dapat digeser
      const marker = L.marker(
        [-7.7956, 110.3695],
        { draggable: true }
      ).addTo(this.map);

      marker.bindPopup(tooltip);
      marker.openPopup();

      // Mengisi koordinat awal
      this.updateCoordinates(marker.getLatLng());

      // Memperbarui koordinat setelah marker digeser
      marker.on('dragend', (e: L.LeafletEvent) => {
        const currentMarker = e.target as L.Marker;
        const latlng = currentMarker.getLatLng();

        this.updateCoordinates(latlng);
        console.log(this.coordinates);
      });

      // Memastikan tampilan peta sesuai ukuran elemen
      setTimeout(() => {
        this.map.invalidateSize();
      }, 200);

    }, 0);
  }

  // Mengubah posisi marker menjadi teks koordinat
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

    const parts = this.coordinates.split(',').map(
      value => Number(value.trim())
    );

    if (
      parts.length !== 2 ||
      !parts.every(value => Number.isFinite(value)) ||
      parts[0] < -90 || parts[0] > 90 ||
      parts[1] < -180 || parts[1] > 180
    ) {
      const alert = await this.alertCtrl.create({
        header: 'Koordinat tidak valid',
        message: 'Gunakan format latitude,longitude.',
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

      // Kembali ke halaman sebelumnya
      this.navCtrl.back();

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
