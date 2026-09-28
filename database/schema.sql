
-- ============================================================
-- 1. USERS
-- ============================================================

CREATE TABLE users (
    email           VARCHAR(100) PRIMARY KEY,
    password_hash   VARCHAR(255) NOT NULL,
    name            VARCHAR(100) NOT NULL,
    age             INT NOT NULL,
    role            VARCHAR(10) NOT NULL DEFAULT 'USER',
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_user_age
        CHECK (age >= 0),

    CONSTRAINT chk_user_role
        CHECK (role IN ('USER', 'ADMIN'))
);


-- ============================================================
-- 2. THEATRES
-- ============================================================

CREATE TABLE theatres (
    theatre_id      SERIAL PRIMARY KEY,
    theatre_name    VARCHAR(100) NOT NULL,
    location        VARCHAR(200) NOT NULL
);


-- ============================================================
-- 3. SCREENS
-- ============================================================

CREATE TABLE screens (
    screen_id       SERIAL PRIMARY KEY,
    theatre_id      INT NOT NULL,
    screen_name     VARCHAR(50) NOT NULL,
    total_seats     INT NOT NULL,

    CONSTRAINT fk_screen_theatre
        FOREIGN KEY (theatre_id)
        REFERENCES theatres(theatre_id)
        ON DELETE CASCADE,

    CONSTRAINT chk_screen_seats
        CHECK (total_seats > 0),

    CONSTRAINT uq_screen_name
        UNIQUE (theatre_id, screen_name)
);


-- ============================================================
-- 4. SEATS
-- ============================================================

CREATE TABLE seats (
    seat_id               SERIAL PRIMARY KEY,
    screen_id             INT NOT NULL,
    seat_number           VARCHAR(10) NOT NULL,
    seat_location         VARCHAR(30) NOT NULL,
    is_offline_reserved   BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_seat_screen
        FOREIGN KEY (screen_id)
        REFERENCES screens(screen_id)
        ON DELETE CASCADE,

    CONSTRAINT uq_seat_number
        UNIQUE (screen_id, seat_number)
);


-- ============================================================
-- 5. MOVIES
-- ============================================================

CREATE TABLE movies (
    movie_id        SERIAL PRIMARY KEY,
    movie_name      VARCHAR(150) NOT NULL,
    duration_min    INT NOT NULL,
    language        VARCHAR(50) NOT NULL,
    genre           VARCHAR(50) NOT NULL,
    release_date    DATE,

    CONSTRAINT chk_movie_duration
        CHECK (duration_min > 0)
);


-- ============================================================
-- 6. TIME SLOTS
-- ============================================================

CREATE TABLE time_slots (
    slot_id         SERIAL PRIMARY KEY,
    slot_label      VARCHAR(30) NOT NULL UNIQUE,
    start_time      TIME NOT NULL,
    end_time        TIME NOT NULL
);


-- ============================================================
-- 7. COUPONS
-- ============================================================
-- Coupons are created before bookings because bookings
-- contains a foreign key referencing coupons.


CREATE TABLE coupons (
    coupon_id        SERIAL PRIMARY KEY,
    coupon_code      VARCHAR(50) NOT NULL UNIQUE,
    qr_code          VARCHAR(255) UNIQUE,
    discount_type    VARCHAR(20) NOT NULL,
    discount_value   NUMERIC(10,2) NOT NULL,
    valid_from       DATE NOT NULL,
    valid_until      DATE NOT NULL,
    usage_limit      INT,
    is_active        BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT chk_coupon_type
        CHECK (
            discount_type IN ('FLAT', 'PERCENTAGE')
        ),

    CONSTRAINT chk_coupon_value
        CHECK (discount_value >= 0),

    CONSTRAINT chk_coupon_percentage
        CHECK (
            discount_type = 'FLAT'
            OR discount_value <= 100
        ),

    CONSTRAINT chk_coupon_dates
        CHECK (valid_until >= valid_from),

    CONSTRAINT chk_coupon_usage
        CHECK (
            usage_limit IS NULL
            OR usage_limit > 0
        )
);


-- ============================================================
-- 8. SHOWS
-- ============================================================
-- A show connects:
-- Movie + Screen + Time Slot + Date + Price


CREATE TABLE shows (
    show_id         SERIAL PRIMARY KEY,
    movie_id        INT NOT NULL,
    screen_id       INT NOT NULL,
    slot_id         INT NOT NULL,
    show_date       DATE NOT NULL,
    base_price      NUMERIC(10,2) NOT NULL,

    CONSTRAINT fk_show_movie
        FOREIGN KEY (movie_id)
        REFERENCES movies(movie_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_show_screen
        FOREIGN KEY (screen_id)
        REFERENCES screens(screen_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_show_slot
        FOREIGN KEY (slot_id)
        REFERENCES time_slots(slot_id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_show_price
        CHECK (base_price >= 0),

    CONSTRAINT uq_show
        UNIQUE (movie_id, screen_id, slot_id, show_date)
);


-- ============================================================
-- 9. BOOKINGS
-- ============================================================


CREATE TABLE bookings (
    booking_id       SERIAL PRIMARY KEY,
    user_email       VARCHAR(100) NOT NULL,
    show_id          INT NOT NULL,
    coupon_id        INT,
    booking_time     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    total_amount     NUMERIC(10,2) NOT NULL,
    booking_status   VARCHAR(20) NOT NULL DEFAULT 'PENDING',

    CONSTRAINT fk_booking_user
        FOREIGN KEY (user_email)
        REFERENCES users(email)
        ON DELETE RESTRICT,

    CONSTRAINT fk_booking_show
        FOREIGN KEY (show_id)
        REFERENCES shows(show_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_booking_coupon
        FOREIGN KEY (coupon_id)
        REFERENCES coupons(coupon_id)
        ON DELETE SET NULL,

    CONSTRAINT chk_booking_amount
        CHECK (total_amount >= 0),

    CONSTRAINT chk_booking_status
        CHECK (
            booking_status IN (
                'PENDING',
                'CONFIRMED',
                'CANCELLED'
            )
        )
);


-- ============================================================
-- 10. BOOKING_SEATS
-- ============================================================
-- This is the bridge table between bookings and seats.
-- One booking can contain multiple seats.


CREATE TABLE booking_seats (
    booking_id      INT NOT NULL,
    seat_id         INT NOT NULL,
    price           NUMERIC(10,2) NOT NULL,

    CONSTRAINT pk_booking_seats
        PRIMARY KEY (booking_id, seat_id),

    CONSTRAINT fk_booking_seat_booking
        FOREIGN KEY (booking_id)
        REFERENCES bookings(booking_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_booking_seat_seat
        FOREIGN KEY (seat_id)
        REFERENCES seats(seat_id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_booking_seat_price
        CHECK (price >= 0)
);


-- ============================================================
-- 11. PAYMENTS
-- ============================================================


CREATE TABLE payments (
    payment_id       SERIAL PRIMARY KEY,
    booking_id       INT NOT NULL UNIQUE,
    amount           NUMERIC(10,2) NOT NULL,
    payment_time     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    payment_method   VARCHAR(30) NOT NULL,
    payment_status   VARCHAR(20) NOT NULL,
    transaction_ref  VARCHAR(100) UNIQUE,

    CONSTRAINT fk_payment_booking
        FOREIGN KEY (booking_id)
        REFERENCES bookings(booking_id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_payment_amount
        CHECK (amount >= 0),

    CONSTRAINT chk_payment_method
        CHECK (
            payment_method IN (
                'UPI',
                'CARD',
                'NET_BANKING',
                'CASH'
            )
        ),

    CONSTRAINT chk_payment_status
        CHECK (
            payment_status IN (
                'PENDING',
                'SUCCESS',
                'FAILED'
            )
        )
);


-- ============================================================
-- 12. E-PASSES
-- ============================================================


CREATE TABLE e_passes (
    epass_id       SERIAL PRIMARY KEY,
    booking_id     INT NOT NULL UNIQUE,
    qr_code        VARCHAR(255) NOT NULL UNIQUE,
    generated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_epass_booking
        FOREIGN KEY (booking_id)
        REFERENCES bookings(booking_id)
        ON DELETE CASCADE
);


-- ============================================================
-- 13. DISCOUNTS
-- ============================================================
-- A discount can apply to an entire show or to a particular
-- seat for that show.


CREATE TABLE discounts (
    discount_id      SERIAL PRIMARY KEY,
    show_id          INT NOT NULL,
    seat_id          INT,
    discount_name    VARCHAR(100) NOT NULL,
    discount_type    VARCHAR(20) NOT NULL,
    discount_value   NUMERIC(10,2) NOT NULL,
    valid_from       DATE NOT NULL,
    valid_until      DATE NOT NULL,
    is_active        BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_discount_show
        FOREIGN KEY (show_id)
        REFERENCES shows(show_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_discount_seat
        FOREIGN KEY (seat_id)
        REFERENCES seats(seat_id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_discount_type
        CHECK (
            discount_type IN (
                'FLAT',
                'PERCENTAGE'
            )
        ),

    CONSTRAINT chk_discount_value
        CHECK (discount_value >= 0),

    CONSTRAINT chk_discount_percentage
        CHECK (
            discount_type = 'FLAT'
            OR discount_value <= 100
        ),

    CONSTRAINT chk_discount_dates
        CHECK (valid_until >= valid_from)
);


-- ============================================================
-- 14. REVIEWS
-- ============================================================


CREATE TABLE reviews (
    review_id       SERIAL PRIMARY KEY,
    user_email      VARCHAR(100) NOT NULL,
    movie_id        INT NOT NULL,
    theatre_id      INT NOT NULL,
    rating          INT NOT NULL,
    review_text     VARCHAR(500),
    review_date     DATE NOT NULL DEFAULT CURRENT_DATE,

    CONSTRAINT fk_review_user
        FOREIGN KEY (user_email)
        REFERENCES users(email)
        ON DELETE CASCADE,

    CONSTRAINT fk_review_movie
        FOREIGN KEY (movie_id)
        REFERENCES movies(movie_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_review_theatre
        FOREIGN KEY (theatre_id)
        REFERENCES theatres(theatre_id)
        ON DELETE CASCADE,

    CONSTRAINT chk_review_rating
        CHECK (rating BETWEEN 1 AND 5),

    CONSTRAINT uq_user_movie_theatre_review
        UNIQUE (user_email, movie_id, theatre_id)
);