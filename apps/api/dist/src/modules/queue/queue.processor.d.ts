import { Job } from "bull";
import { PrismaService } from "../../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { GeoService } from "../geo/geo.service";
export declare class QueueProcessor {
    private prisma;
    private notifications;
    private geo;
    private readonly logger;
    constructor(prisma: PrismaService, notifications: NotificationsService, geo: GeoService);
    checkGeofence(job: Job<{
        entryId: string;
        barbershopId: string;
    }>): Promise<{
        skip: boolean;
        checked?: undefined;
        locationAge?: undefined;
    } | {
        checked: boolean;
        locationAge: number;
        skip?: undefined;
    }>;
    sendAppointmentReminder(job: Job<{
        appointmentId: string;
        minutesBefore: number;
    }>): Promise<void>;
    checkSubscriptionExpiry(job: Job<{
        subscriptionId: string;
        daysUntilExpiry: number;
    }>): Promise<void>;
}
