DROP TABLE IF EXISTS reviews, discounts, e_passes, payments, booking_seats, bookings,
  shows, coupons, time_slots, movies, seats, screens, theatres, users CASCADE;

CREATE TABLE users (
  email VARCHAR(255) PRIMARY KEY,
  password_hash TEXT NOT NULL,
  name VARCHAR(100) NOT NULL,
  age INT CHECK (age > 0),
  role VARCHAR(10) NOT NULL DEFAULT 'USER' CHECK (role IN ('USER','ADMIN')),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE theatres (
  theatre_id SERIAL PRIMARY KEY,
  theatre_name VARCHAR(150) NOT NULL,
  location VARCHAR(200) NOT NULL
);

CREATE TABLE screens (
  screen_id SERIAL PRIMARY KEY,
  theatre_id INT NOT NULL REFERENCES theatres ON DELETE CASCADE,
  screen_name VARCHAR(50) NOT NULL,
  total_seats INT NOT NULL CHECK (total_seats > 0),
  UNIQUE (theatre_id, screen_name)
);

CREATE TABLE seats (
  seat_id SERIAL PRIMARY KEY,
  screen_id INT NOT NULL REFERENCES screens ON DELETE CASCADE,
  seat_number VARCHAR(10) NOT NULL,
  seat_location VARCHAR(20) DEFAULT 'REGULAR',
  is_offline_reserved BOOLEAN DEFAULT FALSE,
  UNIQUE (screen_id, seat_number)
);

CREATE TABLE movies (
  movie_id SERIAL PRIMARY KEY,
  movie_name VARCHAR(200) NOT NULL,
  duration_min INT CHECK (duration_min > 0),
  language VARCHAR(50),
  genre VARCHAR(50),
  release_date DATE
);

CREATE TABLE time_slots (
  slot_id SERIAL PRIMARY KEY,
  slot_label VARCHAR(30) UNIQUE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL
);

CREATE TABLE coupons (
  coupon_id SERIAL PRIMARY KEY,
  coupon_code VARCHAR(30) UNIQUE NOT NULL,
  qr_code VARCHAR(100) UNIQUE,
  discount_type VARCHAR(10) NOT NULL CHECK (discount_type IN ('FLAT','PERCENT')),
  discount_value NUMERIC(10,2) NOT NULL CHECK (discount_value > 0),
  valid_from DATE NOT NULL,
  valid_until DATE NOT NULL,
  usage_limit INT NOT NULL DEFAULT 100,
  is_active BOOLEAN DEFAULT TRUE,
  CHECK (valid_until >= valid_from)
);

CREATE TABLE shows (
  show_id SERIAL PRIMARY KEY,
  movie_id INT NOT NULL REFERENCES movies ON DELETE CASCADE,
  screen_id INT NOT NULL REFERENCES screens ON DELETE CASCADE,
  slot_id INT NOT NULL REFERENCES time_slots,
  show_date DATE NOT NULL,
  base_price NUMERIC(10,2) NOT NULL CHECK (base_price >= 0),
  UNIQUE (movie_id, screen_id, slot_id, show_date)
);

CREATE TABLE bookings (
  booking_id SERIAL PRIMARY KEY,
  user_email VARCHAR(255) NOT NULL REFERENCES users,
  show_id INT NOT NULL REFERENCES shows,
  coupon_id INT REFERENCES coupons,
  booking_time TIMESTAMP DEFAULT NOW(),
  total_amount NUMERIC(10,2) NOT NULL CHECK (total_amount >= 0),
  booking_status VARCHAR(12) NOT NULL DEFAULT 'PENDING'
    CHECK (booking_status IN ('PENDING','CONFIRMED','CANCELLED'))
);

CREATE TABLE booking_seats (
  booking_id INT REFERENCES bookings ON DELETE CASCADE,
  seat_id INT REFERENCES seats,
  price NUMERIC(10,2) NOT NULL,
  PRIMARY KEY (booking_id, seat_id)
);

CREATE TABLE payments (
  payment_id SERIAL PRIMARY KEY,
  booking_id INT UNIQUE NOT NULL REFERENCES bookings,
  amount NUMERIC(10,2) NOT NULL,
  payment_time TIMESTAMP DEFAULT NOW(),
  payment_method VARCHAR(15) NOT NULL CHECK (payment_method IN ('UPI','CARD','NET_BANKING','CASH')),
  payment_status VARCHAR(10) NOT NULL CHECK (payment_status IN ('PENDING','SUCCESS','FAILED')),
  transaction_ref VARCHAR(60) UNIQUE NOT NULL
);

CREATE TABLE e_passes (
  epass_id SERIAL PRIMARY KEY,
  booking_id INT UNIQUE NOT NULL REFERENCES bookings,
  qr_code VARCHAR(200) UNIQUE NOT NULL,
  generated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE discounts (
  discount_id SERIAL PRIMARY KEY,
  show_id INT NOT NULL REFERENCES shows ON DELETE CASCADE,
  seat_id INT REFERENCES seats ON DELETE CASCADE,
  discount_name VARCHAR(100) NOT NULL,
  discount_type VARCHAR(10) NOT NULL CHECK (discount_type IN ('FLAT','PERCENT')),
  discount_value NUMERIC(10,2) NOT NULL CHECK (discount_value > 0),
  valid_from DATE NOT NULL,
  valid_until DATE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE reviews (
  review_id SERIAL PRIMARY KEY,
  user_email VARCHAR(255) NOT NULL REFERENCES users,
  movie_id INT NOT NULL REFERENCES movies,
  theatre_id INT NOT NULL REFERENCES theatres,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  review_date TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_email, movie_id, theatre_id)
);

-- ===== SAMPLE DATA (development only) =====
INSERT INTO theatres (theatre_name, location) VALUES
 ('PVR Treasure Island', 'Indore'), ('Cinepolis Malhar Mega', 'Indore');
INSERT INTO screens (theatre_id, screen_name, total_seats) VALUES (1,'Screen 1',20),(2,'Screen 1',20);
INSERT INTO seats (screen_id, seat_number, seat_location)
SELECT s.screen_id, r || n, CASE WHEN r IN ('A','B') THEN 'REGULAR' ELSE 'PREMIUM' END
FROM screens s, unnest(ARRAY['A','B','C','D']) r, generate_series(1,5) n;
INSERT INTO movies (movie_name,duration_min,language,genre,release_date) VALUES
 ('Inception',148,'English','Sci-Fi','2010-07-16'),
 ('3 Idiots',170,'Hindi','Comedy','2009-12-25');
INSERT INTO time_slots (slot_label,start_time,end_time) VALUES
 ('Morning','10:00','12:30'),('Evening','18:00','20:30');
INSERT INTO shows (movie_id,screen_id,slot_id,show_date,base_price) VALUES
 (1,1,1,CURRENT_DATE+1,250),(2,1,2,CURRENT_DATE+1,200),(1,2,2,CURRENT_DATE+1,300);
INSERT INTO coupons (coupon_code,discount_type,discount_value,valid_from,valid_until,usage_limit)
VALUES ('WELCOME50','FLAT',50,CURRENT_DATE,CURRENT_DATE+365,100),
       ('SAVE10','PERCENT',10,CURRENT_DATE,CURRENT_DATE+365,100);
INSERT INTO discounts (show_id,seat_id,discount_name,discount_type,discount_value,valid_from,valid_until)
VALUES (1,NULL,'Morning offer','PERCENT',10,CURRENT_DATE,CURRENT_DATE+30);
-- Admin: register via the app, then run:
-- UPDATE users SET role='ADMIN' WHERE email='admin@chalchitra.com';