const fs = require('fs/promises');
const path = require('path');
const { createECDH, createHash, randomUUID } = require('crypto');
const { SignJWT, exportJWK, importJWK } = require('jose');

let issuerPrivateKeyPromise;
let issuerPublicJwkPromise;

function toBase64Url(buffer) {
  return buffer
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function getIssuerPrivateKeyHex() {
  const rawKey = process.env.ISSUER_PRIVATE_KEY;
  if (!rawKey) {
    throw new Error('ISSUER_PRIVATE_KEY is required');
  }

  const normalizedKey = rawKey.startsWith('0x') ? rawKey.slice(2) : rawKey;
  if (!/^[0-9a-fA-F]{64}$/.test(normalizedKey)) {
    throw new Error('ISSUER_PRIVATE_KEY must be a 32-byte hexadecimal secp256k1 private key');
  }

  return normalizedKey;
}

function buildIssuerPrivateJwk() {
  const privateKeyBytes = Buffer.from(getIssuerPrivateKeyHex(), 'hex');
  const ecdh = createECDH('secp256k1');
  ecdh.setPrivateKey(privateKeyBytes);

  const publicKey = ecdh.getPublicKey(undefined, 'uncompressed');
  const x = publicKey.subarray(1, 33);
  const y = publicKey.subarray(33, 65);

  return {
    kty: 'EC',
    crv: 'secp256k1',
    d: toBase64Url(privateKeyBytes),
    x: toBase64Url(x),
    y: toBase64Url(y),
  };
}

async function getIssuerPrivateKey() {
  if (!issuerPrivateKeyPromise) {
    issuerPrivateKeyPromise = importJWK(buildIssuerPrivateJwk(), 'ES256K');
  }

  return issuerPrivateKeyPromise;
}

async function getIssuerPublicJwk() {
  if (!issuerPublicJwkPromise) {
    issuerPublicJwkPromise = (async () => {
      const { x, y } = buildIssuerPrivateJwk();
      const publicKey = await importJWK(
        {
          kty: 'EC',
          crv: 'secp256k1',
          x,
          y,
        },
        'ES256K'
      );

      const jwk = await exportJWK(publicKey);
      return {
        ...jwk,
        use: 'sig',
        alg: 'ES256K',
        kid: createHash('sha256').update(`${x}.${y}`).digest('hex').slice(0, 16),
      };
    })();
  }

  return issuerPublicJwkPromise;
}

function calculateExpirationDate(enrollmentYear) {
  return new Date(Date.UTC(Number(enrollmentYear) + 7, 0, 1, 0, 0, 0));
}

async function generatePhotoHash(photoPath) {
  if (!photoPath) {
    return null;
  }

  const backendRoot = path.resolve(__dirname, '../..');
  const candidatePaths = path.isAbsolute(photoPath)
    ? [photoPath]
    : [path.resolve(backendRoot, photoPath), path.resolve(process.cwd(), photoPath)];

  for (const candidatePath of candidatePaths) {
    try {
      const fileBuffer = await fs.readFile(candidatePath);
      return `sha256:${createHash('sha256').update(fileBuffer).digest('hex')}`;
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  return null;
}

async function generateCredential(student) {
  if (!student) {
    throw new Error('Student data is required to generate a credential');
  }

  if (!process.env.ISSUER_URL) {
    throw new Error('ISSUER_URL is required');
  }

  const credentialId = randomUUID();
  const issuanceDate = new Date();
  const expirationDate = calculateExpirationDate(student.enrollmentYear);
  const issuedAtSeconds = Math.floor(issuanceDate.getTime() / 1000);
  const expirationSeconds = Math.floor(expirationDate.getTime() / 1000);
  const photoHash = await generatePhotoHash(student.photoPath);
  const privateKey = await getIssuerPrivateKey();
  const publicJwk = await getIssuerPublicJwk();

  const jwt = await new SignJWT({
    vc: {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiableCredential', 'StudentIdentityCredential'],
      credentialSubject: {
        nim: student.nim,
        fullName: student.fullName,
        faculty: student.faculty,
        department: student.department,
        enrollmentYear: student.enrollmentYear,
        academicStatus: student.academicStatus,
        photoHash,
      },
    },
  })
    .setProtectedHeader({ alg: 'ES256K', typ: 'JWT', kid: publicJwk.kid })
    .setIssuer(process.env.ISSUER_URL)
    .setSubject(student.nim)
    .setIssuedAt(issuedAtSeconds)
    .setExpirationTime(expirationSeconds)
    .setJti(credentialId)
    .sign(privateKey);

  const credentialHash = createHash('sha256').update(jwt).digest('hex');

  return {
    jwt,
    credentialId,
    credentialHash,
    issuanceDate,
    expirationDate,
  };
}

module.exports = {
  calculateExpirationDate,
  generateCredential,
  getIssuerPublicJwk,
};
