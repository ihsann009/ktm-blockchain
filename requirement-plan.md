# Document Requirement Plan

## Project Title
**Implementasi Verifiable Credential pada Sistem Kartu Tanda Mahasiswa Digital Berbasis Blockchain**

## 1. Document Purpose
Dokumen ini mendefinisikan kebutuhan sistem untuk pengembangan **Sistem Kartu Tanda Mahasiswa Digital** berbasis web yang menggunakan **Verifiable Credential (VC)** sebagai credential utama dan **blockchain** sebagai media anchoring hash serta pencatatan status revocation. Dokumen ini menjadi acuan implementasi MVP untuk kebutuhan penelitian atau artikel ilmiah.

## 2. Project Overview
Sistem dirancang untuk memungkinkan kampus menerbitkan kartu tanda mahasiswa digital dalam bentuk credential terverifikasi. Credential ditandatangani oleh issuer pada backend, ditampilkan kepada mahasiswa dalam bentuk kartu digital dan QR code, lalu diverifikasi oleh petugas melalui pemeriksaan signature, integritas hash, masa berlaku, dan status revocation.

Sistem ini **tidak dirancang sebagai sistem identitas terdesentralisasi penuh**. Sistem ini menggunakan pendekatan hybrid, yaitu:
- autentikasi pengguna menggunakan login Web2
- data identitas mahasiswa dan foto disimpan off-chain
- blockchain digunakan secara terbatas untuk integritas credential dan status revocation

## 3. Project Objectives
Tujuan sistem adalah:
- membangun MVP kartu tanda mahasiswa digital yang layak diimplementasikan untuk penelitian
- menerbitkan credential mahasiswa dalam format JWT-VC (JSON Web Token for Verifiable Credentials)
- menjaga agar data identitas sensitif tetap berada off-chain
- memanfaatkan blockchain untuk mendukung integritas dan auditabilitas credential
- menyediakan mekanisme verifikasi berbasis QR code
- menyediakan proses pencabutan credential yang dapat diperiksa kembali

## 4. Final Design Decisions
Keputusan desain final yang digunakan dalam proyek ini adalah sebagai berikut:

- Platform sistem: **web-based**
- Frontend: **Next.js**
- Backend: **Node.js + Express**
- Database: **PostgreSQL**
- Smart contract: **Solidity**
- Blockchain integration: **ethers.js**
- Network: **Polygon Amoy Testnet**
- Login model: **Web2 login**
- Credential model: **JWT-VC (JSON Web Token for Verifiable Credentials, W3C VC Data Model v1.1 compliant)**
- Verification model: **QR code (primary) + input credentialId manual (fallback)**
- Student photo: **off-chain (PostgreSQL), credential menyimpan photoHash saja**
- Blockchain usage: **credential hash + issue metadata + revocation state**
- Hash formula: **SHA-256 dari JWT string lengkap**
- Signature algorithm: **ES256K (ECDSA secp256k1) — embedded dalam JWT signature**
- Expiry model: **tanggal masuk + 7 tahun (batas studi maksimal), dicatat di JWT `exp` claim + on-chain `expiresAt`**
- Revocation model: **manual oleh admin (on-chain)**
- Deployment: **cloud publik (Vercel/Railway) + Polygon Amoy Testnet**
- Issuer identifier: **URL deployment publik (JWT `iss` claim)**
- Metodologi paper: **DSRM (Peffers et al., 2007)**

Keputusan desain yang **tidak digunakan**:
- tidak menggunakan biometrik
- tidak menggunakan SBT
- tidak menggunakan DID resolver (issuer pakai URL publik)
- tidak menggunakan ZKP
- tidak menggunakan paid third-party VC provider
- tidak mewajibkan student crypto wallet
- tidak memasukkan IPFS ke requirement inti MVP
- tidak menggunakan JSON-LD runtime processing
- tidak menggunakan embedded proof (pakai JWT signature sebagai gantinya)
- tidak memerlukan domain kampus asli (prototype riset)

### 4.1 Credential Format: JWT-VC (Final)

Credential diterbitkan sebagai JSON Web Token (JWT) dengan payload mengikuti W3C VC Data Model.

**JWT Header:**
```json
{
  "alg": "ES256K",
  "typ": "JWT"
}
```

**JWT Payload:**
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

**JWT Signature:** ES256K (ECDSA secp256k1) — sama dengan Ethereum wallet key.

**Credential disimpan sebagai:** satu string JWT (`header.payload.signature`).

**Mapping JWT Claims ke VC:**
| JWT Claim | Fungsi |
|-----------|--------|
| `iss` | Issuer identifier (URL publik) |
| `sub` | Subject identifier (NIM mahasiswa) |
| `iat` | Issued at (timestamp penerbitan) |
| `exp` | Expiration (tanggal masuk + 7 tahun) |
| `jti` | JWT ID = credentialId (UUID, disimpan di blockchain) |
| `vc` | Verifiable Credential object (W3C structure) |

**Hash untuk blockchain anchoring:**
```
credentialHash = SHA256(jwt_string_lengkap)
```

### 4.2 Verification Flow (JWT-VC)
```
1. Input: credentialId (dari QR scan atau manual input)
2. Ambil JWT string dari database
3. jwt.verify(token, issuer_public_key) → cek signature + expiry
4. Decode payload → ambil jti (credentialId)
5. Query blockchain: getCredential(jti) → hash + revoked
6. Bandingkan: SHA256(jwt_string) == on_chain_hash? (integritas)
7. Cek: revoked == false? (status pencabutan)
8. Return hasil verifikasi
```

**Verifikasi oleh pihak luar:**
- Pihak luar cukup: `jwt.verify(token, publicKey)` — library standar
- Untuk cek revocation: query smart contract di Polygon Amoy (publik)

### 4.3 QR Code Options
- **QR berisi credentialId saja** — verifier hit API, backend verify (butuh internet)
- **QR berisi JWT lengkap** — verifier bisa verify signature offline (hanya butuh internet untuk cek revocation)

### 4.4 Public Resources (untuk verifikasi pihak luar)
- Public key issuer: `/.well-known/jwks.json` (JSON Web Key Set)
- Blockchain registry info: `/.well-known/blockchain-registry.json`
- Public verification page: `/verify`
- Smart contract: Polygon Amoy (address dipublish setelah deploy)

## 5. Problem Statement
Sistem identitas mahasiswa digital konvensional umumnya bergantung pada basis data terpusat dan belum memiliki mekanisme verifikasi integritas credential yang kuat. Hal ini menyebabkan validitas credential sulit diverifikasi secara independen, khususnya ketika credential ditampilkan secara digital. Penelitian ini berfokus pada implementasi mekanisme credential digital yang dapat diverifikasi, dilacak statusnya, dan lebih sulit dimanipulasi setelah diterbitkan.

## 6. Scope of the System

### 6.1 In Scope
Sistem mencakup:
- autentikasi admin, mahasiswa, dan verifier
- pengelolaan data mahasiswa
- penerbitan credential mahasiswa
- penandatanganan credential oleh issuer pada backend
- penyimpanan credential dan metadata di database
- anchoring hash credential ke blockchain
- pencatatan status revocation di blockchain
- tampilan kartu mahasiswa digital
- tampilan QR code untuk verifikasi
- proses verifikasi credential
- penyimpanan riwayat issue, revoke, dan verification log
- penggunaan foto mahasiswa untuk visual verification support

### 6.2 Out of Scope
Sistem tidak mencakup:
- autentikasi biometrik
- student wallet login
- self-sovereign identity penuh
- DID resolver ecosystem
- selective disclosure
- zero-knowledge proof
- SBT-based student identity
- integrasi langsung dengan sistem akademik kampus yang sesungguhnya
- multi-campus federation
- native Android app
- full decentralized storage architecture
- pencegahan total terhadap fraud oleh issuer yang sah

## 7. Stakeholders and User Roles

### 7.1 Admin / Issuer
Admin adalah operator kampus yang bertugas menerbitkan dan mencabut credential.

Hak akses admin:
- login ke dashboard admin
- mengelola data mahasiswa
- menerbitkan credential
- mencabut credential
- melihat daftar credential
- melihat aktivitas sistem

### 7.2 Student / Holder
Mahasiswa adalah pemegang credential digital.

Hak akses mahasiswa:
- login ke portal mahasiswa
- melihat kartu mahasiswa digital
- melihat status credential
- menampilkan QR code

### 7.3 Verifier / Officer
Verifier adalah petugas atau staf kampus yang memeriksa validitas credential.

Hak akses verifier:
- login ke halaman verifier
- memindai atau membaca QR code
- melihat hasil verifikasi
- mencocokkan foto mahasiswa dengan orang yang hadir secara visual

## 8. Authentication Model
Sistem menggunakan **Web2 login** untuk mengakses aplikasi.

### 8.1 Admin Login
- menggunakan email dan password

### 8.2 Student Login
- menggunakan NIM atau email dan password

### 8.3 Verifier Login
- menggunakan akun verifier atau petugas yang disediakan sistem

### 8.4 Authentication Principle
Blockchain **tidak digunakan untuk login**. Blockchain hanya digunakan untuk mendukung validasi integritas dan status credential.

## 9. High-Level Architecture
Arsitektur sistem terdiri atas empat lapisan utama.

### 9.1 Frontend Layer
Dibangun menggunakan Next.js.

Komponen frontend:
- halaman login
- dashboard admin
- dashboard mahasiswa
- halaman verifier
- tampilan kartu digital
- tampilan QR code
- hasil verifikasi

### 9.2 Backend Layer
Dibangun menggunakan Node.js dan Express.

Tanggung jawab backend:
- autentikasi
- manajemen user dan student record
- pembuatan credential
- penandatanganan credential
- penghitungan hash credential
- integrasi ke blockchain
- proses verifikasi
- audit logging

### 9.3 Database Layer
Dibangun menggunakan PostgreSQL.

Data yang disimpan:
- akun pengguna
- data mahasiswa
- JWT string (credential lengkap)
- metadata credential (hash, tx_hash, status)
- foto mahasiswa
- verification logs
- activity logs
- riwayat issue dan revoke

### 9.4 Blockchain Layer
Dibangun menggunakan Solidity di Polygon Amoy.

Data yang disimpan di blockchain:
- credentialId
- credentialHash
- issuedAt
- expiresAt
- revoked

## 10. Data Placement Policy

### 10.1 On-Chain Data
Data yang disimpan on-chain hanya:
- credentialId
- credentialHash
- issuedAt
- expiresAt
- revoked status

### 10.2 Off-Chain Data
Data yang disimpan off-chain:
- nama mahasiswa
- NIM
- fakultas
- program studi
- tahun masuk
- academic status
- foto mahasiswa
- credential JSON lengkap
- logs

### 10.3 Off-Chain Rule
Data identitas pribadi tidak boleh disimpan langsung di blockchain.

## 11. Photo and Visual Verification Policy
Foto mahasiswa digunakan sebagai elemen pendukung untuk pencocokan identitas secara visual.

Kebijakan foto:
- foto mahasiswa disimpan secara off-chain
- foto ditampilkan pada kartu mahasiswa digital
- foto dapat ditampilkan saat verifikasi
- foto tidak diproses sebagai biometrik oleh sistem
- pencocokan identitas dilakukan secara visual oleh verifier

Makna kebijakan ini:
- sistem memverifikasi keaslian credential
- verifier membantu memverifikasi kecocokan orang dengan foto

## 12. Credential Model
Sistem menggunakan **JWT-VC (JSON Web Token for Verifiable Credentials)** sebagai bentuk utama credential mahasiswa digital. Credential diterbitkan sebagai JWT string dengan payload mengikuti W3C VC Data Model v1.1.

### 12.1 JWT Claims (Required)
JWT harus memuat:
- `alg`: ES256K (header)
- `iss`: issuer URL
- `sub`: NIM mahasiswa
- `iat`: issued at timestamp
- `exp`: expiration timestamp (tanggal masuk + 7 tahun)
- `jti`: credentialId (UUID)
- `vc`: object berisi @context, type, dan credentialSubject

### 12.2 Credential Subject Fields
Field minimum dalam `vc.credentialSubject`:
- nim
- fullName
- faculty
- department
- enrollmentYear
- academicStatus
- photoHash (SHA-256 dari file foto)

### 12.3 Signature
Signature di-handle oleh JWT mechanism (ES256K). Tidak ada field `proof` terpisah — signature adalah bagian ketiga dari JWT string (`header.payload.signature`).

## 13. Credential Lifecycle Policy
Untuk menjaga integritas historis, sistem harus mendukung lifecycle credential yang jelas.

### 13.1 Issuance
- credential diterbitkan oleh admin atau issuer
- credential ditandatangani pada backend
- credential hash di-anchor ke blockchain
- credential metadata disimpan di database

### 13.2 Verification
- credential diverifikasi menggunakan signature, hash, expiry, dan revocation state

### 13.3 Revocation
- credential dapat dicabut oleh admin
- revocation dicatat pada blockchain
- status lokal credential diperbarui di database

### 13.4 Historical Integrity
- credential yang sudah diterbitkan tidak boleh diam-diam ditimpa
- perubahan data penting harus menghasilkan credential baru
- credential lama tetap harus tersimpan untuk audit
- credential baru harus memiliki referensi lifecycle yang jelas bila merupakan hasil reissue

## 14. Core Workflows

### 14.1 Credential Issuance Flow
1. Admin login ke dashboard.
2. Admin membuat atau memilih data mahasiswa.
3. Backend membentuk JWT payload (vc object + standard claims).
4. Backend menandatangani JWT menggunakan issuer private key (ES256K).
5. Backend menghitung hash dari JWT string lengkap (SHA-256).
6. Backend mengirim credentialId (jti), hash, issuedAt, expiresAt ke smart contract.
7. Backend menyimpan JWT string dan metadata ke database.
8. Mahasiswa dapat melihat kartu digital setelah credential diterbitkan.

### 14.2 Student Card Presentation Flow
1. Mahasiswa login.
2. Mahasiswa membuka halaman kartu digital.
3. Sistem menampilkan foto, data identitas, status credential, dan QR code.

### 14.3 Verification Flow
1. Verifier memindai QR code atau input credentialId secara manual.
2. Sistem mengambil JWT string dari database.
3. Sistem memverifikasi JWT signature menggunakan issuer public key (jwt.verify).
4. Sistem menghitung SHA-256 dari JWT string.
5. Sistem query blockchain: getCredential(credentialId) → hash + revoked + expiresAt.
6. Sistem mencocokkan hash hasil hitung dengan hash on-chain.
7. Sistem memeriksa status revoked.
8. Sistem memeriksa expiration (dari JWT exp claim dan on-chain expiresAt).
9. Sistem menampilkan hasil verifikasi + foto mahasiswa.
10. Verifier mencocokkan foto dengan orang yang hadir secara visual.

### 14.4 Revocation Flow
1. Admin mencabut credential.
2. Backend menulis status revocation ke blockchain.
3. Backend memperbarui status di database.
4. Credential tersebut akan gagal pada proses verifikasi berikutnya.

## 15. Functional Requirements

### FR-01 Authentication
Sistem harus:
- menyediakan login untuk admin, mahasiswa, dan verifier
- menerapkan role-based access control
- menjaga sesi pengguna secara aman

### FR-02 Student Management
Sistem harus:
- menambah data mahasiswa
- memperbarui data mahasiswa
- melihat data mahasiswa
- mencari mahasiswa berdasarkan identitas tertentu
- menonaktifkan data mahasiswa bila diperlukan

### FR-03 Credential Generation
Sistem harus:
- menghasilkan credential mahasiswa dalam format JWT-VC
- memberikan credentialId unik (UUID) sebagai JWT `jti` claim
- mengisi issuer URL sebagai JWT `iss` claim
- mengisi issuance date (iat) dan expiration date (exp)
- memuat credentialSubject dalam vc object

### FR-04 Credential Signing
Sistem harus:
- menandatangani JWT menggunakan algoritma ES256K di backend
- menjaga issuer private key tetap berada di backend
- menghasilkan JWT string lengkap (header.payload.signature)

### FR-05 Credential Storage
Sistem harus:
- menyimpan JWT string lengkap
- menyimpan credential hash (SHA-256 dari JWT string)
- menyimpan issuance metadata
- menyimpan transaction hash blockchain jika tersedia

### FR-06 Blockchain Anchoring
Sistem harus:
- menghitung SHA-256 hash dari JWT string lengkap
- menyimpan credentialId (jti) ke blockchain
- menyimpan credentialHash ke blockchain
- menyimpan issuedAt (dari JWT iat)
- menyimpan expiresAt (dari JWT exp)
- menyimpan revoked status (default: false)

### FR-07 Student Card View
Sistem harus:
- menampilkan kartu mahasiswa digital bagi mahasiswa yang login
- menampilkan foto mahasiswa
- menampilkan claim utama credential
- menampilkan status credential
- menampilkan QR code

### FR-08 Verification
Sistem harus:
- membaca atau menerima QR payload
- mengambil credential yang dimaksud
- memverifikasi issuer signature
- memverifikasi hash terhadap blockchain
- memeriksa expiration status
- memeriksa revoked status
- menampilkan hasil verifikasi secara jelas
- membantu verifier melakukan pencocokan visual terhadap foto

### FR-09 Revocation
Sistem harus:
- memungkinkan admin mencabut credential
- memperbarui status revocation pada blockchain
- memperbarui status credential pada database
- menolak credential revoked pada proses verifikasi

### FR-10 Logging and Audit
Sistem harus:
- mencatat aktivitas issuance
- mencatat aktivitas revocation
- mencatat verification attempts
- mencatat aktivitas login admin
- mencatat riwayat credential lifecycle

## 16. Non-Functional Requirements

### NFR-01 Simplicity
Sistem harus cukup sederhana untuk dibangun oleh satu pengembang dalam konteks penelitian.

### NFR-02 Security
Sistem harus:
- menjaga issuer key di backend
- menjaga data identitas mahasiswa tetap off-chain
- memvalidasi input backend
- membatasi akses berdasarkan role

### NFR-03 Performance
Sistem sebaiknya:
- menyelesaikan verifikasi dalam beberapa detik pada kondisi MVP
- meminimalkan penulisan data ke blockchain

### NFR-04 Reliability
Sistem harus:
- menangani kegagalan blockchain secara aman
- menjaga konsistensi metadata credential antara database dan blockchain sejauh memungkinkan
- menghasilkan status error yang jelas ketika verifikasi gagal

### NFR-05 Maintainability
Sistem harus:
- memisahkan frontend, backend, database, dan contract logic
- menggunakan struktur kode modular
- menggunakan environment variables untuk konfigurasi

### NFR-06 Usability
Sistem harus:
- memberikan alur admin yang jelas untuk issue dan revoke
- memberikan tampilan kartu yang sederhana bagi mahasiswa
- memberikan hasil verifikasi yang mudah dibaca oleh verifier

### NFR-07 Traceability
Sistem harus menyediakan log yang cukup untuk menelusuri issuance, revocation, dan verification.

## 17. Data Requirements

### 17.1 User Entity
Field:
- id
- email
- password_hash
- role
- created_at
- updated_at

### 17.2 Student Entity
Field:
- id
- user_id
- nim
- full_name
- faculty
- department
- enrollment_year
- academic_status
- photo_path
- created_at
- updated_at

### 17.3 Credential Entity
Field:
- id
- student_id
- credential_id (UUID, sama dengan JWT jti)
- jwt_token (JWT string lengkap)
- credential_hash (SHA-256 dari jwt_token)
- issuance_date
- expiration_date
- status (active/revoked/expired)
- blockchain_tx_hash
- previous_credential_id
- created_at
- updated_at

### 17.4 Verification Log Entity
Field:
- id
- credential_id
- verifier_input
- result
- checked_at

### 17.5 Activity Log Entity
Field:
- id
- actor_id
- action_type
- description
- created_at

## 18. Smart Contract Requirements
Smart contract berfungsi sebagai credential registry.

### 18.1 Stored Data
Smart contract harus menyimpan:
- credentialId
- credentialHash
- issuedAt
- expiresAt
- revoked

### 18.2 Required Functions
Smart contract harus menyediakan:
- issueCredential
- revokeCredential
- getCredential
- isCredentialValid

### 18.3 Access Rules
- hanya issuer/admin wallet yang boleh issue
- hanya issuer/admin wallet yang boleh revoke

## 19. API Requirements

### 19.1 Authentication Endpoints
- POST /auth/login
- POST /auth/logout
- GET /auth/me

### 19.2 Student Endpoints
- GET /students
- POST /students
- PUT /students/:id
- GET /students/:id

### 19.3 Credential Endpoints
- POST /credentials/issue/:studentId
- GET /credentials/:credentialId
- GET /credentials/student/:studentId
- POST /credentials/revoke/:credentialId

### 19.4 Verification Endpoints
- POST /verify
- GET /verify/:credentialId

## 20. Verification Logic
Urutan verifikasi harus sebagai berikut:
1. parse QR payload (credentialId) atau terima input manual
2. retrieve JWT string dari database berdasarkan credentialId
3. jwt.verify(token, issuer_public_key) → validasi signature + expiry
4. decode JWT payload → ambil jti sebagai credentialId
5. hitung SHA-256 dari JWT string
6. query blockchain: getCredential(credentialId) → hash + revoked
7. bandingkan hash lokal dengan hash on-chain
8. cek revoked == false
9. tampilkan hasil verifikasi + data mahasiswa + foto
10. verifier melakukan pencocokan visual dengan orang yang hadir

Possible final statuses:
- valid
- not_found
- invalid_signature
- hash_mismatch
- revoked
- expired

## 21. Security Guarantees and Limitations

### 21.1 What the System Guarantees
Sistem ini menjamin atau meningkatkan:
- deteksi perubahan credential setelah diterbitkan
- deteksi credential palsu melalui signature dan hash mismatch
- deteksi status revoked
- deteksi credential expired
- keterlacakan aktivitas issuance dan revocation

### 21.2 What the System Does Not Fully Guarantee
Sistem ini tidak sepenuhnya menjamin:
- kejujuran issuer saat menerbitkan data awal
- pencegahan total insider fraud
- pembuktian identitas fisik tanpa bantuan verifier
- pencegahan total terhadap penyalahgunaan issuer key

## 22. Sprint Plan

### Sprint 1: Project Setup
Deliverables:
- Next.js frontend initialized
- Express backend initialized
- PostgreSQL connected
- Solidity project initialized
- environment configuration ready
- base folder structure created

### Sprint 2: Authentication and Student Data
Deliverables:
- admin login
- student login
- verifier login
- users table
- students table
- student CRUD

### Sprint 3: Credential Issuance
Deliverables:
- credential JSON structure
- issuer signature service
- credentials table
- issue credential endpoint
- store credential metadata in database

### Sprint 4: Blockchain Registry
Deliverables:
- smart contract registry
- deployment to Polygon Amoy
- issue-to-chain integration
- revoke-on-chain integration
- fetch status from chain

### Sprint 5: Student Card and QR
Deliverables:
- student card page
- student photo display
- credential status display
- QR code generation

### Sprint 6: Verification Flow
Deliverables:
- verifier page
- QR parse logic
- signature verification
- hash comparison with blockchain
- expiration check
- revocation check
- visual verification support
- result UI

### Sprint 7: Testing and Cleanup
Deliverables:
- end-to-end testing
- revoked credential test
- expired credential test
- tampered credential test
- code cleanup
- demo-ready flow

## 23. Acceptance Criteria
Sistem dianggap memenuhi requirement MVP jika:
- admin dapat login
- admin dapat mengelola data mahasiswa
- admin dapat menerbitkan credential
- credential berhasil ditandatangani
- credential hash berhasil dicatat di blockchain
- mahasiswa dapat melihat kartu digital
- mahasiswa dapat menampilkan QR code
- verifier dapat memverifikasi credential
- verifier dapat melihat foto mahasiswa untuk visual comparison
- credential revoked terdeteksi dengan benar
- credential expired terdeteksi dengan benar
- credential yang diubah gagal diverifikasi
- issue dan revoke tercatat di log

## 24. Main Risks
Risiko utama sistem:
- JWT string harus disimpan persis sama (byte-for-byte) karena hash dihitung dari string lengkap
- kegagalan transaksi blockchain menyebabkan sinkronisasi metadata terganggu
- issuer key tidak dikelola dengan aman
- QR payload dirancang terlalu terbuka
- verifier terlalu bergantung pada sistem tanpa melakukan visual check

## 25. Final Recommendation
Dokumen requirement ini digunakan sebagai baseline final untuk MVP penelitian. Setelah dokumen ini disetujui, tahap berikutnya adalah:
- finalisasi database schema
- finalisasi project folder structure
- finalisasi API contract
- finalisasi credential JSON format
- finalisasi smart contract schema
- implementasi bertahap per sprint

