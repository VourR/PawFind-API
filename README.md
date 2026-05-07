# Backend API Documentation

This is the backend API for managing pets and shelters, providing endpoints to list, retrieve, and create pets and shelters with image upload support.

---

## Base URL

The server runs on the port specified in the environment variable `PORT` or defaults to `4000`.

Base URL:  
```
http://localhost:<PORT>
```

---

## API Endpoints

### Admin Auth API

- **POST /api/admin/login**
  Login admin dan mendapatkan token JWT.
  **Request Body:**
  ```json
  {
    "username": "admin_username",
    "password": "admin_password"
  }
  ```
  **Response (200):**
  ```json
  {
    "message": "Login admin berhasil",
    "data": {
      "token": "jwt_token",
      "token_type": "Bearer",
      "expires_in": "8h",
      "api_key": "optional_admin_api_key"
    }
  }
  ```

Header untuk endpoint admin-only:
- `Authorization: Bearer <token>`
- atau `x-api-key: <ADMIN_API_KEY>`

### Pets API

- **GET /api/pets**  
  Retrieve a list of all pets.  
  **Response:** JSON object with success flag, message, and array of pet objects. Example:
  ```json
  {
    "success": true,
    "message": "Pets fetched successfully",
    "data": [
      {
        "id": "c6677863-2ba8-4d00-acfb-4934105e43a5",
        "shelter_id": "45e886e8-6cc6-4c78-b10d-adea7011517d",
        "name": "SigmaCat",
        "type": "cat",
        "age": null,
        "description": null,
        "image_url": "https://xezckrsmvdzrlujmvfgl.supabase.co/storage/v1/object/public/pet-images/pets/1763886459642-images.jpg",
        "created_at": "2025-11-23T08:26:57.100362"
      }
    ]
  }
  ```

- **GET /api/pets/:id**  
  Retrieve detailed information of a specific pet by its ID.  
  **Parameters:**  
  - `id` (path parameter): The unique identifier of the pet.  
  **Response:** JSON object with success, message, and pet data or 404 if not found. Example:
  ```json
  {
    "success": true,
    "message": "Pet fetched successfully",
    "data": {
      "id": "c6677863-2ba8-4d00-acfb-4934105e43a5",
      "shelter_id": "45e886e8-6cc6-4c78-b10d-adea7011517d",
      "name": "SigmaCat",
      "type": "cat",
      "age": null,
      "description": null,
      "image_url": "https://xezckrsmvdzrlujmvfgl.supabase.co/storage/v1/object/public/pet-images/pets/1763886459642-images.jpg",
      "created_at": "2025-11-23T08:26:57.100362"
    }
  }
  ```

- **POST /api/pets**  
  Create a new pet entry. Supports an optional image upload.  
  **Auth:** Admin only.
  **Request:**  
  - Content-Type: `multipart/form-data`  
  - Fields:  
    - Pet fields as JSON form fields (e.g., name, age, breed, etc.)  
    - `image` (file): Optional image file of the pet.  
  **Response:** JSON object with success, message, and the newly created pet object or 400 on validation error.

- **PUT /api/pets/:id**  
  Update an existing pet entry by ID. Supports optional image upload to replace the existing one.  
  **Auth:** Admin only.
  **Parameters:**  
  - `id` (path parameter): The unique identifier of the pet to update.  
  **Request:**  
  - Content-Type: `multipart/form-data`  
  - Fields:  
    - Pet fields to update as JSON form fields (optional; only fields present will be updated)  
    - `image` (file): Optional new image file of the pet.  
  **Response:** JSON object with success, message, and the updated pet object or 400 on validation error.

- **DELETE /api/pets/:id**  
  Delete a pet entry by ID.  
  **Auth:** Admin only.
  **Parameters:**  
  - `id` (path parameter): The unique identifier of the pet to delete.  
  **Response:** JSON object with success and message confirming deletion or 400 on error.


---

### Shelters API

- **GET /api/shelters**  
  Retrieve a list of all shelters.  
  **Response:** Array of shelter objects.

- **GET /api/shelters/:id**  
  Retrieve detailed information of a specific shelter by its ID.  
  **Parameters:**  
  - `id` (path parameter): The unique identifier of the shelter.  
  **Response:** Shelter object or 404 if not found.

- **POST /api/shelters**  
  Create a new shelter entry. Supports an optional image upload.  
  **Auth:** Admin only.
  **Request:**  
  - Content-Type: `multipart/form-data`  
  - Fields:  
    - Shelter fields as JSON form fields (e.g., name, location, capacity, etc.)  
    - `image` (file): Optional image file of the shelter.  
  
  **Response:** Newly created shelter object or 400 on validation error.

---

### Adoption API

Base route: **/api/adopted-pets**

#### Public Endpoints

- **POST /api/adopted-pets/adopt**  
  Submit a new adoption request from an adopter.  
  **Request Body:**
  ```json
  {
    "pet_id": "uuid-pet",
    "adopter_name": "John Doe",
    "adopter_email": "john@example.com",
    "adopter_phone": "08123456789",
    "message": "Saya siap merawat dengan baik"
  }
  ```

- **GET /api/adopted-pets/check/:petId**  
  Check whether a pet is already adopted or still has a pending request.

- **GET /api/adopted-pets**  
  Get all adopted pets.

- **GET /api/adopted-pets/:id**  
  Get an adopted pet by ID.

- **GET /api/adopted-pets/shelter/:shelterId**  
  Get adopted pets by shelter ID.

#### Admin Endpoints

For admin-only endpoints, send one of these headers:
- `Authorization: Bearer <token>`
- `x-api-key: <ADMIN_API_KEY>`

- **GET /api/adopted-pets/requests**  
  Get all adoption requests. Supports optional query `status=pending|approved|rejected`.

- **POST /api/adopted-pets/requests/:requestId/approve**  
  Approve a pending adoption request.

- **POST /api/adopted-pets/requests/:requestId/reject**  
  Reject a pending adoption request.

- **PUT /api/adopted-pets/:id**  
  Update an adopted pet record. Admin only.

- **DELETE /api/adopted-pets/:id**  
  Remove an adopted pet record. Admin only.

---

## Image Upload

For POST requests to `/api/pets` and `/api/shelters`, you can upload an image file using the field name `image`. The backend uploads the file to a Supabase storage bucket and stores the public URL as `image_url` in the created record.

---

## Supabase Storage

The backend uses [Supabase](https://supabase.com/) storage for image uploads.  
- The storage bucket used is specified by the environment variable `SUPABASE_BUCKET`.  
- Uploaded files are stored under directories `pets/` or `shelters/` based on the resource.

---

## Running the Server

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file with the following variables:
```
PORT=4000
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_BUCKET=your_supabase_storage_bucket_name
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_admin_password
ADMIN_JWT_SECRET=your_super_secret_jwt_key
ADMIN_JWT_EXPIRES_IN=8h
ADMIN_API_KEY=optional_static_admin_api_key
```

3. Start the server:
```bash
node server.js
```

The backend will then be accessible at `http://localhost:4000` (or your specified PORT).

---

## Notes

- All API responses are JSON formatted.
- Error responses contain HTTP status codes and error messages.
- The API uses CORS middleware enabled for cross-origin requests.

---

## Database Schema Reference

### shelters Table

| Column     | Type      | Description                     |
|------------|-----------|---------------------------------|
| id         | uuid      | Primary key, generated UUID     |
| name       | text      | Shelter name, required          |
| city       | text      | City where shelter is located, required |
| address    | text      | Shelter address, optional       |
| phone      | text      | Shelter phone number, optional  |
| image_url  | text      | URL linking to shelter image stored in Supabase Storage |
| created_at | timestamp | Timestamp of creation, default to current time |

### pets Table

| Column      | Type      | Description                       |
|-------------|-----------|---------------------------------|
| id          | uuid      | Primary key, generated UUID      |
| shelter_id  | uuid      | Foreign key referencing shelters(id), cascade on delete |
| name        | text      | Pet name, required               |
| type        | text      | Pet type (cat, dog, rabbit, etc.), required |
| age         | int       | Pet age, optional                |
| description | text      | Additional description, optional|
| image_url   | text      | URL linking to pet image stored in Supabase Storage |
| created_at  | timestamp | Timestamp of creation, default to current time |

---
