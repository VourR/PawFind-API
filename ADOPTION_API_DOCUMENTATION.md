# Dokumentasi API Adopsi Pet

## Deskripsi Flow Baru
Saat adopter menekan tombol Adopsi Sekarang, backend tidak langsung membuat transaksi di tabel `adopted_pets`.

Alur sekarang:
1. Frontend kirim form identitas adopter + pesan ke `POST /api/adopted-pets/adopt`.
2. Backend simpan data adopter ke tabel `adopters`.
3. Backend buat request baru di tabel `adoption_requests` dengan status `pending`.
4. Admin review request.
5. Hanya jika admin approve, backend membuat transaksi di tabel `adopted_pets`.

Dengan flow ini, adopter tidak bisa langsung mengadopsi hewan tanpa persetujuan admin.

## Database Schema

```sql
CREATE TABLE adopters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE adopted_pets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pet_id UUID NOT NULL,
    pet_name VARCHAR(100) NOT NULL,
    pet_type VARCHAR(50) NOT NULL,
    pet_breed VARCHAR(100),
    pet_age INTEGER,
    pet_gender VARCHAR(20),
    pet_description TEXT,
    pet_image_url TEXT,
    shelter_id UUID NOT NULL,
    shelter_name VARCHAR(255),
    adopter_id UUID NOT NULL,
    adoption_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_adopter FOREIGN KEY (adopter_id) REFERENCES adopters(id),
    CONSTRAINT fk_pet FOREIGN KEY (pet_id) REFERENCES pets(id),
    CONSTRAINT fk_shelter FOREIGN KEY (shelter_id) REFERENCES shelters(id)
);

CREATE TABLE adoption_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pet_id UUID NOT NULL,
    adopter_id UUID NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    reviewed_by VARCHAR(255),
    admin_notes TEXT,
    adopted_pet_id UUID,
    CONSTRAINT adoption_requests_status_check CHECK (status IN ('pending', 'approved', 'rejected')),
    CONSTRAINT fk_adoption_request_pet FOREIGN KEY (pet_id) REFERENCES pets(id),
    CONSTRAINT fk_adoption_request_adopter FOREIGN KEY (adopter_id) REFERENCES adopters(id)
);
```

## API Endpoints

Base URL: `/api/adopted-pets`

### 1. Buat Pengajuan Adopsi

Endpoint: `POST /api/adopted-pets/adopt`

Deskripsi:
- Simpan identitas adopter.
- Buat request adopsi dengan status `pending`.
- Belum membuat data di `adopted_pets`.

Request Body:
```json
{
  "pet_id": "uuid-pet",
  "adopter_name": "John Doe",
  "adopter_email": "john@example.com",
  "adopter_phone": "08123456789",
  "message": "Saya siap merawat dengan baik"
}
```

Required Fields:
- `pet_id`
- `adopter_name`
- `adopter_email`
- `adopter_phone`

Optional Fields:
- `message`
- `notes` (alias legacy untuk `message`)

Response Success (201):
```json
{
  "message": "Pengajuan adopsi berhasil dikirim dan menunggu persetujuan admin",
  "data": {
    "id": "uuid-request",
    "pet_id": "uuid-pet",
    "adopter_id": "uuid-adopter",
    "status": "pending",
    "requested_at": "2026-03-13T10:30:00.000Z",
    "reviewed_at": null,
    "reviewed_by": null,
    "admin_notes": null,
    "adopted_pet_id": null,
    "adopter": {
      "id": "uuid-adopter",
      "full_name": "John Doe",
      "email": "john@example.com",
      "phone": "08123456789",
      "message": "Saya siap merawat dengan baik"
    },
    "adopter_name": "John Doe",
    "adopter_email": "john@example.com",
    "adopter_phone": "08123456789",
    "notes": "Saya siap merawat dengan baik"
  }
}
```

### 2. Cek Status Adopsi Pet

Endpoint: `GET /api/adopted-pets/check/:petId`

Response Success (200):
```json
{
  "pet_id": "uuid-pet",
  "is_adopted": false,
  "has_pending_request": true
}
```

### 3. List Request Adopsi (Admin)

Endpoint: `GET /api/adopted-pets/requests`

Query Params (optional):
- `status=pending|approved|rejected`

### 4. Approve Request (Admin)

Endpoint: `POST /api/adopted-pets/requests/:requestId/approve`

Deskripsi:
- Khusus request `pending`.
- Backend membuat transaksi di `adopted_pets`.
- Status request berubah jadi `approved`.

Request Body (optional):
```json
{
  "reviewed_by": "admin@petcare.id",
  "admin_notes": "Dokumen lengkap, approved"
}
```

### 5. Reject Request (Admin)

Endpoint: `POST /api/adopted-pets/requests/:requestId/reject`

Deskripsi:
- Khusus request `pending`.
- Tidak membuat transaksi di `adopted_pets`.
- Status request berubah jadi `rejected`.

Request Body (optional):
```json
{
  "reviewed_by": "admin@petcare.id",
  "admin_notes": "Data rumah belum lengkap"
}
```

### 6. Endpoint `adopted_pets` Lainnya

Endpoint berikut tetap ada dan bekerja untuk data yang sudah approved:
- `GET /api/adopted-pets`
- `GET /api/adopted-pets/:id`
- `GET /api/adopted-pets/shelter/:shelterId`
- `PUT /api/adopted-pets/:id`
- `DELETE /api/adopted-pets/:id`

## Contoh Integrasi Frontend

### Form Submit (Adopter)

```javascript
const submitAdoptionForm = async (petId, formValues) => {
  const response = await fetch('/api/adopted-pets/adopt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pet_id: petId,
      adopter_name: formValues.name,
      adopter_email: formValues.email,
      adopter_phone: formValues.phone,
      message: formValues.message
    })
  });

  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Gagal mengirim pengajuan');
  return result.data;
};
```

### Approve dari Admin Panel

```javascript
const approveRequest = async (requestId, adminEmail, note) => {
  const response = await fetch(`/api/adopted-pets/requests/${requestId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      reviewed_by: adminEmail,
      admin_notes: note
    })
  });

  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Gagal approve request');
  return result;
};
```

## Setup

1. Jalankan SQL di `adopted_pets.sql`.
2. Install dependency:
```bash
npm install
```
3. Isi `.env`:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
PORT=4000
```
4. Start server:
```bash
npm start
```
