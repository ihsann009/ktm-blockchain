# AGENTS.md — KTM Digital Blockchain System

## Project Overview

**Sistem Kartu Tanda Mahasiswa (KTM) Digital** berbasis web yang menggunakan **Verifiable Credential (JWT-VC)** dan **blockchain hash anchoring** pada Polygon Amoy Testnet.

Sistem ini adalah **prototype riset** (MVP) untuk kebutuhan artikel ilmiah. Bukan production system.

### Core Concept

Kampus menerbitkan KTM digital sebagai JWT-VC → hash di-anchor ke Polygon → mahasiswa melihat kartu digital + QR → verifier memverifikasi keaslian credential melalui signature check, hash comparison, dan revocation status.

### Architecture: Hybrid (Web2 Auth + Blockchain Integrity)

```
┌─────────────┐     ┌─────────────────┐     ┌────────────┐     ┌──────────────────┐
│  Next.js    │────▶│  Express API    │────▶│ PostgreSQL │     │ Polygon Amoy     │
│  Frontend   │◀────│  Backend        │◀────│ Database   │     │ Smart Contract   │
└─────────────┘     └────────┬────────┘     └────────────┘     └──────────────────┘
                             │                                          ▲
                             └──────────── ethers.js ───────────────────┘
```

- **Frontend**: Next.js (React)
- **Backend**: Node.js + Express
- **Database**: PostgreSQL (all PII, JWT strings, photos, logs)
- **Blockchain**: Solidity smart contract on Polygon Amoy (credential hash + revocation only)
- **Integration**: ethers.js

---

## Design Decisions (FINAL — Do Not Change)

### What We Use

| Decision | Choice |
|----------|--------|
| Credential format | JWT-VC (W3C VC Data Model v1.1, `@context` in payload) |
| Hash algorithm | SHA-256 of entire JWT string (no canonicalization) |
| Signature algorithm | ES256K (ECDSA secp256k1, reuses Ethereum wallet key) |
| Photo storage | PostgreSQL (credential contains `photoHash` only) |
| Expiry model | Enrollment date + 7 years |
| Revocation | Manual by admin, recorded on-chain |
| Verification input | QR code (primary) + manual credentialId (fallback) |
| Auth model | Web2 login (email/NIM + password) |
| Deployment | Vercel (frontend) / Railway (backend) + Polygon Amoy |
| Issuer identifier | Deployment URL (JWT `iss` claim) |
| Public key discovery | `/.well-known/jwks.json` |

### What We Do NOT Use

- ❌ IPFS (no decentralized storage)
- ❌ ZKP (zero-knowledge proofs)
- ❌ Hyperledger
- ❌ Soulbound Tokens (SBT)
- ❌ DID resolver
- ❌ Biometrics
- ❌ Student crypto wallet
- ❌ JSON-LD runtime processing
- ❌ Embedded proof object (JWT signature handles this)
- ❌ Paid third-party VC providers
- ❌ Native mobile app

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 14+ (App Router) | UI for admin, student, verifier |
| Backend | Node.js + Express | API, credential signing, blockchain integration |
| Database | PostgreSQL | Off-chain data storage |
| ORM | Prisma | Database access and migrations |
| Blockchain | Solidity ^0.8.x | Smart contract (credential registry) |
| Network | Polygon Amoy Testnet | On-chain hash anchoring |
| Blockchain SDK | ethers.js v6 | Contract interaction |
| Auth | JWT (jsonwebtoken) | Session management |
| Credential signing | jose or jsonwebtoken | ES256K JWT signing |
| QR | qrcode (npm) | QR generation |
| QR scanning | html5-qrcode or similar | QR reading on verifier page |
| Styling | Tailwind CSS | UI styling |
| Testing | Jest + Supertest | Backend tests |

---

## Credential Format: JWT-VC

### JWT Header
```json
{
  "alg": "ES256K",
  "typ": "JWT"
}
```

### JWT Payload
```json
{
  "iss": "https://ktm-blockchain.vercel.app",
  "sub": "20240001",
  "iat": 1723708800,
  "exp": 1944892800,
  "jti": "550e8400-e29b-41d4-a716-446655440000",
  "vc": {
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    "type": ["VerifiableCredential", "StudentIdentityCredential"],
    "credentialSubject": {
      "nim": "20240001",
      "fullName": "Ahmad Fauzi",
      "faculty": "Ilmu Komputer",
      "department": "Teknik Informatika",
      "enrollmentYear": 2024,
      "academicStatus": "active",
      "photoHash": "sha256:a1b2c3d4e5f6..."
    }
  }
}
```

### JWT Signature
ES256K (ECDSA secp256k1) — same curve as Ethereum wallet key. The issuer private key signs the JWT; the same key pair is used for blockchain transactions.

### Hash for Blockchain Anchoring
```
credentialHash = SHA256(entire_jwt_string)
```
No canonicalization needed — JWT is already a deterministic string.

---

## Database Schema (PostgreSQL)

### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'student', 'verifier')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### students
```sql
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  nim VARCHAR(20) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  faculty VARCHAR(255) NOT NULL,
  department VARCHAR(255) NOT NULL,
  enrollment_year INTEGER NOT NULL,
  academic_status VARCHAR(20) DEFAULT 'active',
  photo_path VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### credentials
```sql
CREATE TABLE credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  credential_id UUID UNIQUE NOT NULL, -- same as JWT jti
  jwt_token TEXT NOT NULL, -- full JWT string
  credential_hash VARCHAR(64) NOT NULL, -- SHA-256 hex
  issuance_date TIMESTAMP NOT NULL,
  expiration_date TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
  blockchain_tx_hash VARCHAR(66), -- 0x...
  previous_credential_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### verification_logs
```sql
CREATE TABLE verification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credential_id UUID NOT NULL,
  verifier_input VARCHAR(255), -- what was scanned/entered
  result VARCHAR(30) NOT NULL, -- valid, not_found, invalid_signature, hash_mismatch, revoked, expired
  checked_at TIMESTAMP DEFAULT NOW()
);
```

### activity_logs
```sql
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID,
  action_type VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Smart Contract (Solidity)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract CredentialRegistry {
    struct Credential {
        bytes32 credentialHash;
        uint256 issuedAt;
        uint256 expiresAt;
        bool revoked;
    }

    address public issuer;
    mapping(string => Credential) private credentials; // credentialId => Credential

    modifier onlyIssuer() {
        require(msg.sender == issuer, "Only issuer can perform this action");
        _;
    }

    constructor() {
        issuer = msg.sender;
    }

    function issueCredential(
        string calldata credentialId,
        bytes32 credentialHash,
        uint256 issuedAt,
        uint256 expiresAt
    ) external onlyIssuer {
        require(credentials[credentialId].issuedAt == 0, "Credential already exists");
        credentials[credentialId] = Credential(credentialHash, issuedAt, expiresAt, false);
    }

    function revokeCredential(string calldata credentialId) external onlyIssuer {
        require(credentials[credentialId].issuedAt != 0, "Credential does not exist");
        credentials[credentialId].revoked = true;
    }

    function getCredential(string calldata credentialId) external view returns (
        bytes32 credentialHash,
        uint256 issuedAt,
        uint256 expiresAt,
        bool revoked
    ) {
        Credential memory c = credentials[credentialId];
        return (c.credentialHash, c.issuedAt, c.expiresAt, c.revoked);
    }

    function isCredentialValid(string calldata credentialId) external view returns (bool) {
        Credential memory c = credentials[credentialId];
        if (c.issuedAt == 0) return false;
        if (c.revoked) return true; // exists but revoked — caller checks revoked separately
        if (block.timestamp > c.expiresAt) return false;
        return true;
    }
}
```

---

## API Endpoints

### Authentication
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Login (returns JWT session token) |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Get current user info |

### Students (Admin only)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/students` | List all students |
| POST | `/api/students` | Create student record |
| GET | `/api/students/:id` | Get student detail |
| PUT | `/api/students/:id` | Update student |

### Credentials (Admin issues, all can read)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/credentials/issue/:studentId` | Issue credential for student |
| GET | `/api/credentials/:credentialId` | Get credential detail |
| GET | `/api/credentials/student/:studentId` | Get credentials by student |
| POST | `/api/credentials/revoke/:credentialId` | Revoke credential (admin) |

### Verification (Public)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/verify` | Verify credential (body: { credentialId }) |
| GET | `/api/verify/:credentialId` | Verify credential (URL param) |

### Public Resources
| Path | Description |
|------|-------------|
| `/.well-known/jwks.json` | Issuer public key (JWKS format) |
| `/.well-known/blockchain-registry.json` | Contract address + network info |
| `/verify` | Public verification page (frontend) |

---

## Verification Flow (Critical Logic)

```
1. Input: credentialId (from QR scan or manual input)
2. Retrieve JWT string from database by credentialId
3. jwt.verify(token, issuer_public_key) → validate signature + check expiry
4. Decode payload → extract jti (credentialId)
5. Compute SHA-256 of JWT string
6. Query blockchain: getCredential(credentialId) → hash + revoked + expiresAt
7. Compare: computed_hash == on_chain_hash (integrity check)
8. Check: revoked == false
9. Return verification result + student data + photo
```

### Verification Result Statuses
- `valid` — all checks passed
- `not_found` — credentialId not in database
- `invalid_signature` — JWT signature verification failed
- `hash_mismatch` — off-chain JWT hash ≠ on-chain hash (tampered)
- `revoked` — credential has been revoked on-chain
- `expired` — credential past expiration date

---

## Folder Structure (Recommended)

```
ktm-digital/
├── AGENTS.md                    # This file
├── README.md
├── package.json                 # Root workspace (if monorepo)
│
├── frontend/                    # Next.js app
│   ├── app/
│   │   ├── (auth)/             # Login pages
│   │   ├── admin/              # Admin dashboard
│   │   ├── student/            # Student card view
│   │   ├── verify/             # Public verification page
│   │   └── .well-known/        # JWKS + blockchain registry
│   ├── components/
│   ├── lib/
│   └── package.json
│
├── backend/                     # Express API
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── students.js
│   │   │   ├── credentials.js
│   │   │   └── verify.js
│   │   ├── services/
│   │   │   ├── credential.service.js   # JWT-VC creation + signing
│   │   │   ├── blockchain.service.js   # ethers.js contract interaction
│   │   │   └── verification.service.js # Full verification logic
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   └── roleGuard.js
│   │   ├── config/
│   │   │   └── database.js
│   │   └── index.js
│   ├── prisma/
│   │   └── schema.prisma
│   ├── tests/
│   └── package.json
│
├── contracts/                   # Solidity
│   ├── contracts/
│   │   └── CredentialRegistry.sol
│   ├── scripts/
│   │   └── deploy.js
│   ├── test/
│   └── hardhat.config.js
│
└── docs/
    └── requirement-plan.md
```

---

## User Roles & Access Control

| Role | Can Do |
|------|--------|
| **Admin** | Login, manage students, issue credentials, revoke credentials, view logs |
| **Student** | Login, view own digital card, view credential status, display QR |
| **Verifier** | Login, scan QR / input credentialId, view verification result + photo |

### Auth Principle
Blockchain is NOT used for login. Blockchain is only for credential integrity and revocation status.

---

## Sprint Plan

### Sprint 1: Project Setup
- Initialize Next.js frontend
- Initialize Express backend
- Connect PostgreSQL (Prisma)
- Initialize Hardhat project for Solidity
- Set up environment variables
- Create base folder structure

### Sprint 2: Authentication & Student Data
- Implement user registration/login (admin, student, verifier)
- Implement role-based middleware
- Create users + students tables (Prisma migration)
- Student CRUD endpoints

### Sprint 3: Credential Issuance
- Implement JWT-VC creation service (build payload, sign with ES256K)
- Generate credentialId (UUID)
- Compute SHA-256 hash of JWT string
- Store credential in database
- Issue credential endpoint

### Sprint 4: Blockchain Registry
- Write and test CredentialRegistry.sol
- Deploy to Polygon Amoy
- Integrate issueCredential call after DB storage
- Integrate revokeCredential
- Implement getCredential query

### Sprint 5: Student Card & QR
- Student card page (display photo, identity, status)
- QR code generation (encode credentialId)
- Credential status display

### Sprint 6: Verification Flow
- Verifier page with QR scanner
- Manual credentialId input
- Full verification logic (signature → hash → revocation → expiry)
- Result display with photo for visual matching

### Sprint 7: Testing & Cleanup
- End-to-end flow testing
- Test: revoked credential → rejected
- Test: expired credential → rejected
- Test: tampered JWT → hash_mismatch
- Code cleanup, error handling
- Demo-ready flow

---

## Key Implementation Notes

### JWT Signing with ES256K
```javascript
// Use 'jose' library for ES256K support
import { SignJWT, importPKCS8 } from 'jose';

const privateKey = await importPKCS8(process.env.ISSUER_PRIVATE_KEY, 'ES256K');

const jwt = await new SignJWT({ vc: { ... } })
  .setProtectedHeader({ alg: 'ES256K', typ: 'JWT' })
  .setIssuer(process.env.ISSUER_URL)
  .setSubject(student.nim)
  .setIssuedAt()
  .setExpirationTime(expirationTimestamp)
  .setJti(credentialId)
  .sign(privateKey);
```

### Hash Computation
```javascript
import { createHash } from 'crypto';

const credentialHash = createHash('sha256').update(jwtString).digest('hex');
// Convert to bytes32 for Solidity: '0x' + credentialHash
```

### Blockchain Interaction
```javascript
import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider(process.env.POLYGON_AMOY_RPC);
const wallet = new ethers.Wallet(process.env.ISSUER_PRIVATE_KEY, provider);
const contract = new ethers.Contract(contractAddress, abi, wallet);

// Issue
await contract.issueCredential(
  credentialId,
  '0x' + credentialHash,
  issuedAtTimestamp,
  expiresAtTimestamp
);

// Verify
const [hash, issuedAt, expiresAt, revoked] = await contract.getCredential(credentialId);
```

### Important: Same Key for JWT + Blockchain
The ES256K key used to sign JWTs is the same secp256k1 key used as the Ethereum wallet for blockchain transactions. This simplifies key management — one key pair serves both purposes.

---

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/ktm_digital

# Backend
PORT=3001
JWT_SECRET=<session-jwt-secret-for-auth>
ISSUER_PRIVATE_KEY=<secp256k1-private-key-hex>
ISSUER_URL=https://ktm-blockchain.vercel.app

# Blockchain
POLYGON_AMOY_RPC=https://rpc-amoy.polygon.technology
CONTRACT_ADDRESS=<deployed-contract-address>

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_VERIFY_URL=https://ktm-blockchain.vercel.app/verify
```

---

## Acceptance Criteria (MVP Complete When)

- [ ] Admin can login
- [ ] Admin can manage student data (CRUD)
- [ ] Admin can issue credential (JWT-VC signed + hash anchored on-chain)
- [ ] Student can login and view digital card
- [ ] Student can display QR code
- [ ] Verifier can scan QR and see verification result
- [ ] Verifier can see student photo for visual matching
- [ ] Revoked credential is correctly rejected during verification
- [ ] Expired credential is correctly rejected
- [ ] Tampered credential (modified JWT) fails hash comparison
- [ ] Issue and revoke actions are logged

---

## Risks & Pitfalls

1. **JWT byte-for-byte consistency** — The JWT string stored in DB must be exactly the same bytes used for hash computation. Never re-encode or reformat.
2. **Blockchain transaction failures** — Handle gracefully. If anchoring fails, credential should still be stored locally but flagged as "pending_anchor".
3. **ES256K library support** — Not all JWT libraries support ES256K. Use `jose` (npm) which has full support.
4. **Gas on Polygon Amoy** — Use faucet for testnet MATIC. Transactions are cheap but not free.
5. **Key security** — Issuer private key must never be exposed to frontend. Keep in backend env only.
6. **QR size** — If encoding full JWT in QR, the string may be too long for reliable scanning. Default to credentialId-only QR (requires internet for verification).

---

## What This Project is NOT

- Not a full SSI (Self-Sovereign Identity) system
- Not a production-ready campus system
- Not integrated with real academic databases
- Not a mobile app
- Not using decentralized storage (no IPFS)
- Not using zero-knowledge proofs

This is a **research prototype** demonstrating that blockchain hash anchoring + JWT-VC can provide tamper detection and independent verifiability for student ID credentials.
