"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeoService = void 0;
const common_1 = require("@nestjs/common");
const geolib_1 = require("geolib");
let GeoService = class GeoService {
    calculateDistance(point1, point2) {
        return (0, geolib_1.getDistance)({ latitude: point1.lat, longitude: point1.lng }, { latitude: point2.lat, longitude: point2.lng });
    }
    isWithinRadius(center, point, radiusMeters) {
        return this.calculateDistance(center, point) <= radiusMeters;
    }
    buildNearbyQuery(latitude, longitude, radiusKm = 10) {
        return `
      (6371 * acos(
        cos(radians(${latitude})) *
        cos(radians(latitude)) *
        cos(radians(longitude) - radians(${longitude})) +
        sin(radians(${latitude})) *
        sin(radians(latitude))
      )) * 1000
    `;
    }
    getBoundingBox(center, radiusKm) {
        const latDelta = radiusKm / 111.32;
        const lngDelta = radiusKm / (111.32 * Math.cos((center.lat * Math.PI) / 180));
        return {
            minLat: center.lat - latDelta,
            maxLat: center.lat + latDelta,
            minLng: center.lng - lngDelta,
            maxLng: center.lng + lngDelta,
        };
    }
};
exports.GeoService = GeoService;
exports.GeoService = GeoService = __decorate([
    (0, common_1.Injectable)()
], GeoService);
//# sourceMappingURL=geo.service.js.map