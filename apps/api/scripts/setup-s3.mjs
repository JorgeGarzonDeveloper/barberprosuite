/**
 * Script para configurar el bucket S3 de BarberProSuite
 */

import {
  S3Client,
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketCorsCommand,
  PutBucketPolicyCommand,
  PutPublicAccessBlockCommand,
  GetBucketLocationCommand,
} from "@aws-sdk/client-s3";

const ACCESS_KEY = process.env.AWS_ACCESS_KEY_ID;
const SECRET_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const BUCKET = "barberprosuite-media";

// Primero detectamos la región real del bucket
async function getBucketRegion() {
  // Usar us-east-1 para el HeadBucket inicial (detecta la región via 301)
  const s3Global = new S3Client({
    region: "us-east-1",
    credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
    followRegionRedirects: true,
  });

  try {
    const res = await s3Global.send(new GetBucketLocationCommand({ Bucket: BUCKET }));
    // null o "" significa us-east-1
    return res.LocationConstraint || "us-east-1";
  } catch (err) {
    if (err.$metadata?.httpStatusCode === 404) return null; // No existe
    throw err;
  }
}

async function setup() {
  console.log(`\n🚀 Configurando bucket S3: ${BUCKET}\n`);

  // Detectar región
  console.log("🔍 Detectando región del bucket...");
  let REGION = await getBucketRegion();

  const s3 = new S3Client({
    region: REGION || "us-east-1",
    credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
  });

  if (REGION === null) {
    console.log(`📦 Bucket no existe, creando en us-east-1...`);
    REGION = "us-east-1";
    await s3.send(new CreateBucketCommand({ Bucket: BUCKET }));
    console.log(`✅ Bucket creado.`);
  } else {
    console.log(`✅ Bucket encontrado en región: ${REGION}`);
  }

  // Actualizar region si es diferente
  const s3r = new S3Client({
    region: REGION,
    credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
  });

  // Deshabilitar bloqueo de acceso público
  console.log("🔓 Configurando acceso público...");
  await s3r.send(
    new PutPublicAccessBlockCommand({
      Bucket: BUCKET,
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: false,
        IgnorePublicAcls: false,
        BlockPublicPolicy: false,
        RestrictPublicBuckets: false,
      },
    })
  );
  console.log("✅ Acceso público habilitado.");

  // Política de lectura pública — omitida si hay deny explícito
  // Configurar manualmente en la consola de AWS S3 → Bucket → Permissions → Bucket policy

  // CORS
  console.log("🌐 Configurando CORS...");
  await s3r.send(
    new PutBucketCorsCommand({
      Bucket: BUCKET,
      CORSConfiguration: {
        CORSRules: [{
          AllowedHeaders: ["*"],
          AllowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
          AllowedOrigins: ["*"],
          ExposeHeaders: ["ETag"],
          MaxAgeSeconds: 3600,
        }],
      },
    })
  );
  console.log("✅ CORS configurado.");

  const endpoint = REGION === "us-east-1"
    ? `https://${BUCKET}.s3.amazonaws.com`
    : `https://${BUCKET}.s3.${REGION}.amazonaws.com`;

  console.log(`
✅ ¡Bucket listo!

📸 URL base de imágenes:
   ${endpoint}/<key>

⚙️  Agrega en Railway (variables de entorno):
   AWS_REGION=${REGION}
   AWS_ACCESS_KEY_ID=${ACCESS_KEY}
   AWS_S3_BUCKET=${BUCKET}
`);
}

setup().catch((err) => {
  console.error("\n❌ Error:", err.name, "-", err.message);
  if (err.name === "AccessDenied" || err.$metadata?.httpStatusCode === 403) {
    console.error(`
   El usuario IAM no tiene permisos suficientes. Necesita estas políticas en AWS IAM:
   - s3:GetBucketLocation
   - s3:PutBucketPolicy
   - s3:PutBucketCORS
   - s3:PutPublicAccessBlock
   - s3:PutObject
   - s3:DeleteObject
   - s3:GetObject

   Ve a: https://console.aws.amazon.com/iam → Users → tu_usuario → Add permissions
`);
  }
  process.exit(1);
});
