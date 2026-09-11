-- Fix infinite recursion in RLS policies
-- The admin policies on "profiles" table query profiles itself, causing infinite recursion.
-- Solution: create a SECURITY DEFINER function that bypasses RLS to check admin status.

-- 1. Create helper function (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 2. Fix profiles policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (public.is_admin());

-- 3. Fix categories policies
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;

CREATE POLICY "Admins can manage categories"
  ON categories FOR ALL
  USING (public.is_admin());

-- 4. Fix products policies
DROP POLICY IF EXISTS "Admins can manage products" ON products;

CREATE POLICY "Admins can manage products"
  ON products FOR ALL
  USING (public.is_admin());

-- 5. Fix dealer_profiles policies
DROP POLICY IF EXISTS "Admins can manage dealer profiles" ON dealer_profiles;

CREATE POLICY "Admins can manage dealer profiles"
  ON dealer_profiles FOR ALL
  USING (public.is_admin());

-- 6. Fix orders policies
DROP POLICY IF EXISTS "Admins can manage all orders" ON orders;

CREATE POLICY "Admins can manage all orders"
  ON orders FOR ALL
  USING (public.is_admin());

-- 7. Fix order_items policies
DROP POLICY IF EXISTS "Admins can manage all order items" ON order_items;

CREATE POLICY "Admins can manage all order items"
  ON order_items FOR ALL
  USING (public.is_admin());
