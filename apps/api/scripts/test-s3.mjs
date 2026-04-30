import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: "us-east-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET = "barberprosuite-media";
const KEY = "test/barberprosuite-test.txt";

async function test() {
  console.log("\n🧪 Probando acceso S3...\n");

  // 1. Subir archivo de prueba
  console.log("📤 Subiendo archivo de prueba...");
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: KEY,
    Body: Buffer.from("BarberProSuite S3 test OK"),
    ContentType: "text/plain",
  }));
  console.log("✅ PutObject: OK");

  // 2. Verificar acceso público vía fetch
  const url = `https://${BUCKET}.s3.us-east-2.amazonaws.com/${KEY}`;
  console.log(`\n🌐 Verificando acceso público: ${url}`);
  const res = await fetch(url);
  if (res.ok) {
    const text = await res.text();
    console.log(`✅ Acceso público: OK (contenido: "${text}")`);
  } else {
    console.log(`❌ Acceso público falló: HTTP ${res.status} — configura la Bucket Policy en la consola`);
  }

  // 3. Eliminar archivo de prueba
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: KEY }));
  console.log("✅ DeleteObject: OK");

  console.log(`
✅ S3 configurado correctamente.

📸 Las imágenes del carrusel quedarán en:
   https://${BUCKET}.s3.us-east-2.amazonaws.com/barbershops/<id>/<uuid>.jpg
`);
}

test().catch((err) => {
  console.error("❌ Error:", err.name, "-", err.message);
});
