-- Migration: Add 'stripe' to payment_method enum
-- Run this in the Supabase SQL Editor

ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'stripe';
