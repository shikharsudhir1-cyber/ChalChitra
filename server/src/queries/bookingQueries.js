
// Locks the show row: concurrent bookings for the SAME show queue up here.
export const LOCK_SHOW = `SELECT show_id, base_price FROM shows WHERE show_id=$1 FOR UPDATE`;

export const CHECK_TAKEN = `
  SELECT bs.seat_id FROM booking_seats bs
  JOIN bookings b ON b.booking_id=bs.booking_id
  WHERE b.show_id=$1 AND bs.seat_id = ANY($2::int[])
    AND (b.booking_status='CONFIRMED'
      OR (b.booking_status='PENDING' AND b.booking_time > NOW() - INTERVAL '10 minutes'))`;

export const VALID_SEATS = `
  SELECT s.seat_id FROM seats s JOIN shows sh ON sh.screen_id=s.screen_id
  WHERE sh.show_id=$1 AND s.seat_id = ANY($2::int[]) AND s.is_offline_reserved=FALSE`;

export const SHOW_DISCOUNTS = `
  SELECT seat_id, discount_type, discount_value FROM discounts
  WHERE show_id=$1 AND is_active AND CURRENT_DATE BETWEEN valid_from AND valid_until`;

export const FIND_COUPON = `
  SELECT c.* FROM coupons c
  WHERE c.coupon_code=$1 AND c.is_active AND CURRENT_DATE BETWEEN c.valid_from AND c.valid_until
    AND (SELECT COUNT(*) FROM bookings b
         WHERE b.coupon_id=c.coupon_id AND b.booking_status<>'CANCELLED') < c.usage_limit`;

export const INSERT_BOOKING = `
  INSERT INTO bookings (user_email, show_id, coupon_id, total_amount)
  VALUES ($1,$2,$3,$4) RETURNING *`;

export const INSERT_BOOKING_SEAT = `
  INSERT INTO booking_seats (booking_id, seat_id, price) VALUES ($1,$2,$3)`;

export const LOCK_BOOKING = `SELECT * FROM bookings WHERE booking_id=$1 AND user_email=$2 FOR UPDATE`;

export const INSERT_PAYMENT = `
  INSERT INTO payments (booking_id, amount, payment_method, payment_status, transaction_ref)
  VALUES ($1,$2,$3,'SUCCESS',$4) RETURNING *`;

export const CONFIRM_BOOKING = `UPDATE bookings SET booking_status='CONFIRMED' WHERE booking_id=$1`;

export const INSERT_EPASS = `
  INSERT INTO e_passes (booking_id, qr_code) VALUES ($1,$2) RETURNING *`;

export const MY_BOOKINGS = `
  SELECT b.booking_id, b.booking_status, b.total_amount, b.booking_time,
         m.movie_name, t.theatre_name, sh.show_date, ts.slot_label,
         STRING_AGG(s.seat_number, ', ' ORDER BY s.seat_number) AS seats
  FROM bookings b
  JOIN shows sh ON sh.show_id=b.show_id
  JOIN movies m ON m.movie_id=sh.movie_id
  JOIN screens sc ON sc.screen_id=sh.screen_id
  JOIN theatres t ON t.theatre_id=sc.theatre_id
  JOIN time_slots ts ON ts.slot_id=sh.slot_id
  JOIN booking_seats bs ON bs.booking_id=b.booking_id
  JOIN seats s ON s.seat_id=bs.seat_id
  WHERE b.user_email=$1
  GROUP BY b.booking_id, m.movie_name, t.theatre_name, sh.show_date, ts.slot_label
  ORDER BY b.booking_time DESC`;

export const GET_EPASS = `
  SELECT e.qr_code, e.generated_at, b.booking_id, b.total_amount, m.movie_name,
         t.theatre_name, sc.screen_name, sh.show_date, ts.slot_label,
         STRING_AGG(s.seat_number, ', ' ORDER BY s.seat_number) AS seats
  FROM e_passes e
  JOIN bookings b ON b.booking_id=e.booking_id
  JOIN shows sh ON sh.show_id=b.show_id
  JOIN movies m ON m.movie_id=sh.movie_id
  JOIN screens sc ON sc.screen_id=sh.screen_id
  JOIN theatres t ON t.theatre_id=sc.theatre_id
  JOIN time_slots ts ON ts.slot_id=sh.slot_id
  JOIN booking_seats bs ON bs.booking_id=b.booking_id
  JOIN seats s ON s.seat_id=bs.seat_id
  WHERE b.booking_id=$1 AND b.user_email=$2
  GROUP BY e.epass_id, b.booking_id, m.movie_name, t.theatre_name, sc.screen_name, sh.show_date, ts.slot_label`;