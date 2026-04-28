import { CreateBarbershopDto } from "./create-barbershop.dto";
declare const UpdateBarbershopDto_base: import("@nestjs/common").Type<Partial<CreateBarbershopDto>>;
export declare class UpdateBarbershopDto extends UpdateBarbershopDto_base {
    isActive?: boolean;
    workingHours?: any[];
    logoUrl?: string;
    coverImageUrl?: string;
}
export {};
