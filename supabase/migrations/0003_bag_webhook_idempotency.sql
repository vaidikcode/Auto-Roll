-- Bag v1 checkout + signed webhook idempotency
-- Run this in your Supabase SQL editor after 0001_init.sql

alter table payment_links
  add column if not exists tx_hash text,
  add column if not exists last_webhook_delivery_id text;

-- Speed up webhook lookups by bag_link_id (checkout sessionId)
create index if not exists payment_links_bag_link_id_idx
  on payment_links(bag_link_id);
