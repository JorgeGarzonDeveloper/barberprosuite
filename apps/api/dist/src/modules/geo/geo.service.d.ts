interface LatLng {
    lat: number;
    lng: number;
}
export declare class GeoService {
    calculateDistance(point1: LatLng, point2: LatLng): number;
    isWithinRadius(center: LatLng, point: LatLng, radiusMeters: number): boolean;
    buildNearbyQuery(latitude: number, longitude: number, radiusKm?: number): string;
    getBoundingBox(center: LatLng, radiusKm: number): {
        minLat: number;
        maxLat: number;
        minLng: number;
        maxLng: number;
    };
}
export {};
