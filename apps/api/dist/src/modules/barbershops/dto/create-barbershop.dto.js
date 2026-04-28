"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateBarbershopDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateBarbershopDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { name: { required: true, type: () => String, minLength: 3, maxLength: 100 }, description: { required: false, type: () => String }, address: { required: true, type: () => String }, city: { required: true, type: () => String }, state: { required: true, type: () => String }, latitude: { required: true, type: () => Number, minimum: -90, maximum: 90 }, longitude: { required: true, type: () => Number, minimum: -180, maximum: 180 }, phone: { required: true, type: () => String }, email: { required: false, type: () => String, format: "email" } };
    }
}
exports.CreateBarbershopDto = CreateBarbershopDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "Barber Shop Elite" }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateBarbershopDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBarbershopDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "Calle 72 #10-34" }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBarbershopDto.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "Bogotá" }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBarbershopDto.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "Cundinamarca" }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBarbershopDto.prototype, "state", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 4.6721 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(-90),
    (0, class_validator_1.Max)(90),
    __metadata("design:type", Number)
], CreateBarbershopDto.prototype, "latitude", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: -74.0447 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(-180),
    (0, class_validator_1.Max)(180),
    __metadata("design:type", Number)
], CreateBarbershopDto.prototype, "longitude", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "+573001234567" }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBarbershopDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CreateBarbershopDto.prototype, "email", void 0);
//# sourceMappingURL=create-barbershop.dto.js.map