import { Injectable } from "@nestjs/common";
import { getDistance } from "geolib";

interface LatLng {
  lat: number;
  lng: number;
}

@Injectable()
export class GeoService {
  /**
   * Calcula la distancia en metros entre dos puntos geográficos
   * usando la fórmula Haversine (alta precisión)
   */
  calculateDistance(point1: LatLng, point2: LatLng): number {
    return getDistance(
      { latitude: point1.lat, longitude: point1.lng },
      { latitude: point2.lat, longitude: point2.lng }
    );
  }

  /**
   * Verifica si un punto está dentro de un radio dado (en metros)
   */
  isWithinRadius(
    center: LatLng,
    point: LatLng,
    radiusMeters: number
  ): boolean {
    return this.calculateDistance(center, point) <= radiusMeters;
  }

  /**
   * Genera la query SQL para buscar barberias cercanas usando PostGIS
   * Usa la formula Haversine en SQL puro para no requerir extensión PostGIS
   */
  buildNearbyQuery(
    latitude: number,
    longitude: number,
    radiusKm: number = 10
  ): string {
    return `
      (6371 * acos(
        cos(radians(${latitude})) *
        cos(radians(latitude)) *
        cos(radians(longitude) - radians(${longitude})) +
        sin(radians(${latitude})) *
        sin(radians(latitude))
      )) * 1000
    `; // Resultado en metros
  }

  /**
   * Convierte coordenadas a un bounding box para queries eficientes
   */
  getBoundingBox(center: LatLng, radiusKm: number) {
    const latDelta = radiusKm / 111.32;
    const lngDelta =
      radiusKm / (111.32 * Math.cos((center.lat * Math.PI) / 180));

    return {
      minLat: center.lat - latDelta,
      maxLat: center.lat + latDelta,
      minLng: center.lng - lngDelta,
      maxLng: center.lng + lngDelta,
    };
  }
}
