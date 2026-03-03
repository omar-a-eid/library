-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('admin', 'borrower');
CREATE TYPE borrow_state AS ENUM ('checked_out', 'returned', 'overdue');

-- ============================================================
-- AUTHORS
-- ============================================================

CREATE TABLE authors (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(255) NOT NULL,
    created_at TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SHELF LOCATIONS
-- ============================================================

CREATE TABLE shelf_locations (
    id           SERIAL PRIMARY KEY,
    branch_name  VARCHAR(100) NOT NULL,
    floor_number SMALLINT     NOT NULL CHECK (floor_number >= 0),
    section_name VARCHAR(100) NOT NULL,
    shelf_code   VARCHAR(50)  NOT NULL,
    UNIQUE (branch_name, floor_number, section_name, shelf_code),
    created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- USERS
-- ============================================================

CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password        VARCHAR(255) NOT NULL,
    role            user_role    NOT NULL DEFAULT 'borrower',
    registered_date DATE         NOT NULL DEFAULT CURRENT_DATE,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- ============================================================
-- BOOKS
-- ============================================================

CREATE TABLE books (
    id                SERIAL PRIMARY KEY,
    title             VARCHAR(255) NOT NULL,
    shelf_location_id INT                   REFERENCES shelf_locations(id) ON DELETE SET NULL,
    isbn              VARCHAR(20)  NOT NULL UNIQUE,
    available_qty     SMALLINT     NOT NULL DEFAULT 1 CHECK (available_qty >= 0),
    created_at        TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_books_title              ON books USING gin(to_tsvector('english', title));
CREATE INDEX idx_books_shelf_location_id  ON books(shelf_location_id);

-- ============================================================
-- BOOK AUTHORS (Many-to-Many Junction Table)
-- ============================================================

CREATE TABLE book_authors (
    book_id    INT      NOT NULL REFERENCES books(id)   ON DELETE CASCADE,
    author_id  INT      NOT NULL REFERENCES authors(id) ON DELETE RESTRICT,
    position   SMALLINT NOT NULL DEFAULT 1 CHECK (position > 0),
    PRIMARY KEY (book_id, author_id)
);

CREATE INDEX idx_book_authors_book   ON book_authors(book_id);
CREATE INDEX idx_book_authors_author ON book_authors(author_id);

-- ============================================================
-- BORROWING TRANSACTIONS
-- ============================================================

CREATE TABLE borrowing_transactions (
    id            SERIAL       PRIMARY KEY,
    borrower_id   INT          NOT NULL REFERENCES users(id)  ON DELETE RESTRICT,
    book_id       INT          NOT NULL REFERENCES books(id)  ON DELETE RESTRICT,
    state         borrow_state NOT NULL DEFAULT 'checked_out',
    checkout_date DATE         NOT NULL DEFAULT CURRENT_DATE,
    due_date      DATE         NOT NULL,
    return_date   DATE                  DEFAULT NULL,

    CHECK (due_date > checkout_date),
    CHECK (return_date IS NULL OR return_date >= checkout_date)
);

CREATE INDEX idx_bt_borrower_id ON borrowing_transactions(borrower_id);
CREATE INDEX idx_bt_book_id     ON borrowing_transactions(book_id);
CREATE INDEX idx_bt_active      ON borrowing_transactions(due_date)
    WHERE state != 'returned';
