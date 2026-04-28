"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BarbershopsModule = void 0;
const common_1 = require("@nestjs/common");
const barbershops_controller_1 = require("./barbershops.controller");
const barbershops_service_1 = require("./barbershops.service");
const geo_module_1 = require("../geo/geo.module");
let BarbershopsModule = class BarbershopsModule {
};
exports.BarbershopsModule = BarbershopsModule;
exports.BarbershopsModule = BarbershopsModule = __decorate([
    (0, common_1.Module)({
        imports: [geo_module_1.GeoModule],
        controllers: [barbershops_controller_1.BarbershopsController],
        providers: [barbershops_service_1.BarbershopsService],
        exports: [barbershops_service_1.BarbershopsService],
    })
], BarbershopsModule);
//# sourceMappingURL=barbershops.module.js.map