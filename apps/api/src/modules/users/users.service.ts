import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import * as sharp from "sharp";

@Injectable()
export class UsersService {
  private s3 = new S3Client({ region: process.env.AWS_REGION || "us-east-2" });
  private s3Bucket = process.env.AWS_S3_BUCKET || "barberprosuite-media";

  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        avatarUrl: true,
        createdAt: true,
        barberProfile: {
          include: {
            barbershop: true,
          },
        },
        clientProfile: true,
      },
    });

    if (!user) throw new NotFoundException("Usuario no encontrado");
    return user;
  }

  async updateProfile(userId: string, data: any) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        avatarUrl: data.avatarUrl,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
      },
    });
  }

  async uploadAvatar(userId: string, file: Express.Multer.File): Promise<{ avatarUrl: string }> {
    const compressed = await sharp(file.buffer)
      .resize(400, 400, { fit: "cover" })
      .jpeg({ quality: 85 })
      .toBuffer();

    const key = `avatars/${userId}/${uuidv4()}.jpg`;
    const region = process.env.AWS_REGION || "us-east-2";

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.s3Bucket,
        Key: key,
        Body: compressed,
        ContentType: "image/jpeg",
      })
    );

    const avatarUrl = `https://${this.s3Bucket}.s3.${region}.amazonaws.com/${key}`;

    await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });

    return { avatarUrl };
  }

  async getBarbers(barbershopId: string) {
    return this.prisma.barberProfile.findMany({
      where: { barbershopId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            email: true,
            phone: true,
          },
        },
      },
    });
  }
}
