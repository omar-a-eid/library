# Library Management System

A RESTful API for managing a library system built with Node.js, TypeScript, Express, and PostgreSQL.

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Database Schema](#database-schema)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [API Documentation](#api-documentation)
- [Rate Limiting](#rate-limiting)
- [Environment Variables](#environment-variables)

## Features

- Book management with author relationships
- User management
- Shelf location tracking
- Borrowing and returning books
- Overdue book tracking
- Export borrowing reports (CSV/XLSX)
- Rate limiting for API protection
- Input validation with Zod
- Security with Helmet and CORS

## Technology Stack

- **Runtime:** Node.js
- **Language:** TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL
- **Validation:** Zod
- **Security:** Helmet, CORS, express-rate-limit
- **Export:** csv-writer, ExcelJS
- **Containerization:** Docker & Docker Compose

## Database Schema

See the database schema diagram: [library-database.png](./library-database.png)

### Tables

- **users** - User accounts (admin/borrower)
- **authors** - Book authors
- **books** - Book inventory
- **book_authors** - Many-to-many relationship between books and authors
- **shelf_locations** - Physical location of books
- **borrowing_transactions** - Track book checkouts and returns

## Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ (for local development)
- npm or yarn

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/omar-a-eid/-library.git
cd library
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/library
DB_HOST=postgres
DB_PORT=5432
DB_NAME=library
DB_USER=postgres
DB_PASSWORD=postgres
```

### 3. Start the Application with Docker

```bash
# Build and start all services
docker compose up -d

# Stop services
docker compose down
```

The API will be available at `http://localhost:3000`

### 4. Local Development (Without Docker)

```bash
# Install dependencies
npm install

# Start PostgreSQL (ensure it's running)
# Update .env to point to your local database

# Run in development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## API Documentation

Base URL: `http://localhost:3000/api/v1`

### Authors

#### Create Author

```http
POST /authors
Content-Type: application/json

{
  "name": "J.K. Rowling"
}

Response: 201 Created
{
  "status": "success",
  "data": {
    "id": 1,
    "name": "J.K. Rowling",
    "created_at": "2026-03-04T22:00:00.000Z",
    "updated_at": "2026-03-04T22:00:00.000Z"
  }
}
```

#### List Authors

```http
GET /authors?page=1&limit=10

Response: 200 OK
{
  "status": "success",
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

#### Get Author by ID

```http
GET /authors/:id

Response: 200 OK
{
  "status": "success",
  "data": {
    "id": 1,
    "name": "J.K. Rowling",
    "created_at": "2026-03-04T22:00:00.000Z",
    "updated_at": "2026-03-04T22:00:00.000Z"
  }
}
```

#### Update Author

```http
PUT /authors/:id
Content-Type: application/json

{
  "name": "Updated Name"
}

Response: 200 OK
```

#### Delete Author

```http
DELETE /authors/:id

Response: 200 OK
{
  "status": "success",
  "message": "Author deleted successfully"
}
```

### Books

#### Create Book

```http
POST /books
Content-Type: application/json

{
  "title": "Harry Potter and the Philosopher's Stone",
  "isbn": "978-0747532699",
  "available_qty": 5,
  "shelf_location": {
    "branch_name": "Main Branch",
    "floor_number": 2,
    "section_name": "Fiction",
    "shelf_code": "F-12"
  },
  "author_ids": [1, 2]
}

Response: 201 Created
{
  "status": "success",
  "data": {
    "id": 1,
    "title": "Harry Potter and the Philosopher's Stone",
    "isbn": "978-0747532699",
    "available_qty": 5,
    "authors": [...],
    "shelf_location": {
      "id": 1,
      "branch_name": "Main Branch",
      "floor_number": 2,
      "section_name": "Fiction",
      "shelf_code": "F-12"
    }
  }
}
```

#### List Books

```http
GET /books?page=1&limit=10

Response: 200 OK
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "title": "Harry Potter",
      "isbn": "978-0747532699",
      "available_qty": 5,
      "authors": [...],
      "shelf_location": {...}
    }
  ],
  "pagination": {...}
}
```

#### Search Books

```http
GET /books/search?title=Harry&author=Rowling&isbn=978

Response: 200 OK
```

#### Get Book by ID

```http
GET /books/:id

Response: 200 OK
```

#### Update Book

```http
PUT /books/:id
Content-Type: application/json

{
  "title": "Updated Title",
  "available_qty": 10
}

Response: 200 OK
```

#### Delete Book

```http
DELETE /books/:id

Response: 200 OK
```

### Users

#### Create User

```http
POST /users
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepass123",
  "role": "borrower"
}

Response: 201 Created
```

#### List Users

```http
GET /users?page=1&limit=10

Response: 200 OK
```

#### Get User by ID

```http
GET /users/:id

Response: 200 OK
```

#### Update User

```http
PUT /users/:id
Content-Type: application/json

{
  "name": "Updated Name",
  "email": "newemail@example.com"
}

Response: 200 OK
```

#### Delete User

```http
DELETE /users/:id

Response: 200 OK
```

### Borrowings

#### Checkout Book

```http
POST /borrowings/checkout
Content-Type: application/json

{
  "borrower_id": 1,
  "book_id": 5,
  "due_days": 14
}

Response: 201 Created
{
  "status": "success",
  "data": {
    "id": 1,
    "borrower_id": 1,
    "book_id": 5,
    "state": "checked_out",
    "checkout_date": "2026-03-04T00:00:00.000Z",
    "due_date": "2026-03-18T00:00:00.000Z",
    "return_date": null
  }
}
```

**Rate Limit:** 10 requests per minute

#### Return Book

```http
POST /borrowings/:id/return

Response: 200 OK
{
  "status": "success",
  "data": {
    "id": 1,
    "state": "returned",
    "return_date": "2026-03-04T00:00:00.000Z",
    ...
  }
}
```

#### List All Borrowings

```http
GET /borrowings?page=1&limit=10&borrower_id=1&state=checked_out

Query Parameters:
- page (optional): Page number (default: 1)
- limit (optional): Items per page (default: 10)
- borrower_id (optional): Filter by borrower
- state (optional): checked_out, returned, overdue

Response: 200 OK
{
  "status": "success",
  "data": [...],
  "pagination": {...}
}
```

#### Get Borrowing by ID

```http
GET /borrowings/:id

Response: 200 OK
```

#### Get Borrower's Current Books

```http
GET /borrowings/borrower/:borrower_id/current?page=1&limit=10

Response: 200 OK
```

#### List Overdue Books

```http
GET /borrowings/overdue?page=1&limit=10

Response: 200 OK
```

#### Export Borrowings

```http
GET /borrowings/export?start_date=2026-03-01&end_date=2026-03-31&format=csv

Query Parameters:
- start_date (required): YYYY-MM-DD format
- end_date (required): YYYY-MM-DD format
- format (optional): csv or xlsx (default: csv)

Response: 200 OK (File download)
Content-Type: text/csv or application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="borrowings_2026-03-01_to_2026-03-31.csv"
```

**Rate Limit:** 5 requests per 15 minutes

#### Export Overdue Borrowings

```http
GET /borrowings/overdue/export?start_date=2026-03-01&end_date=2026-03-31&format=xlsx

Response: 200 OK (File download)
```

**Rate Limit:** 5 requests per 15 minutes

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Checkout Endpoint:** 10 requests per minute
- **Export Endpoints:** 5 requests per 15 minutes

When rate limit is exceeded:

```json
{
  "status": "error",
  "message": "Too many requests, please try again later"
}
```

## Environment Variables

| Variable       | Description                       | Default  |
| -------------- | --------------------------------- | -------- |
| `PORT`         | API server port                   | 3001     |
| `DATABASE_URL` | Full PostgreSQL connection string | -        |
| `DB_HOST`      | Database host                     | postgres |
| `DB_PORT`      | Database port                     | 5432     |
| `DB_NAME`      | Database name                     | library  |
| `DB_USER`      | Database user                     | postgres |
| `DB_PASSWORD`  | Database password                 | postgres |

## Error Responses

All errors follow this format:

```json
{
  "status": "error",
  "message": "Error description"
}
```

Common HTTP Status Codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `404` - Not Found
- `429` - Too Many Requests (rate limit)
- `500` - Internal Server Error

## Development

### Project Structure

```
library/
├── src/
│   ├── config/          # Database configuration
│   ├── middleware/      # Express middleware
│   ├── modules/         # Feature modules
│   │   ├── authors/
│   │   ├── books/
│   │   ├── borrowings/
│   │   ├── shelf-locations/
│   │   └── users/
│   ├── types/           # TypeScript types
│   ├── utils/           # Utility functions
│   └── index.ts         # Application entry point
├── dist/                # Compiled JavaScript
├── Dockerfile
├── docker-compose.yml
├── init-db.sql          # Database schema
└── package.json
```

### Database Initialization

The database is automatically initialized with the schema from `init-db.sql` when you first run Docker Compose.
