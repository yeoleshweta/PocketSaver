-- db/init_dummy_transactions.sql

BEGIN;

-- Generate 100 random transactions for user_id = 2
INSERT INTO transactions (user_id, amount, rounded_diff, created_at)
SELECT
  2 AS user_id,
  -- random amount between 1.00 and 100.00
  (random() * 99 + 1)::numeric(10,2) AS amount,
  -- roundup difference = ceil(amount) - amount
  (ceil((random() * 99 + 1)::numeric) - (random() * 99 + 1)::numeric(10,2))::numeric(10,2) AS rounded_diff,
  -- created_at within the last 30 days
  NOW() - (interval '1 day' * (floor(random() * 30))::int) AS created_at
FROM generate_series(1,100);

COMMIT;