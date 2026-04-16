-- EcoLoop Database Schema for Supabase
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'driver', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Addresses
CREATE TABLE user_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Waste Requests
CREATE TABLE waste_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  waste_type TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  pickup_date DATE NOT NULL,
  pickup_time TIME,
  address TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  special_instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vehicles (must be created before collections)
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_number TEXT UNIQUE NOT NULL,
  vehicle_type TEXT NOT NULL,
  capacity DECIMAL(10,2),
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'maintenance')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drivers (must be created before collections)
CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  license_number TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'on_duty', 'off_duty')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Collections (references vehicles and drivers)
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  waste_request_id UUID REFERENCES waste_requests(id),
  user_id UUID REFERENCES profiles(id),
  vehicle_id UUID REFERENCES vehicles(id),
  driver_id UUID REFERENCES drivers(id),
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed')),
  pickup_date DATE,
  pickup_time TIME,
  actual_pickup_time TIMESTAMP WITH TIME ZONE,
  completion_time TIMESTAMP WITH TIME ZONE,
  collection_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transportation
CREATE TABLE transportations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id UUID REFERENCES collections(id),
  vehicle_id UUID REFERENCES vehicles(id),
  driver_id UUID REFERENCES drivers(id),
  start_location TEXT,
  destination TEXT,
  current_location TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_transit', 'completed')),
  estimated_departure TIMESTAMP WITH TIME ZONE,
  estimated_arrival TIMESTAMP WITH TIME ZONE,
  actual_departure TIMESTAMP WITH TIME ZONE,
  actual_arrival TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Waste Categories
CREATE TABLE waste_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Segregations
CREATE TABLE segregations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id UUID REFERENCES collections(id),
  category_id UUID REFERENCES waste_categories(id),
  quantity DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Collection Feedback
CREATE TABLE collection_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id UUID UNIQUE REFERENCES collections(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  pickup_rating INT NOT NULL CHECK (pickup_rating BETWEEN 1 AND 5),
  driver_behavior_rating INT NOT NULL CHECK (driver_behavior_rating BETWEEN 1 AND 5),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE waste_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transportations ENABLE ROW LEVEL SECURITY;
ALTER TABLE waste_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE segregations ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for User Addresses
CREATE POLICY "Users can view own addresses" ON user_addresses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own addresses" ON user_addresses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own addresses" ON user_addresses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own addresses" ON user_addresses
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for Waste Requests
CREATE POLICY "Users can view own requests" ON waste_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own requests" ON waste_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own requests" ON waste_requests
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all requests" ON waste_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all requests" ON waste_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for Collections
CREATE POLICY "Users can view own collections" ON collections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all collections" ON collections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for Vehicles (Admin only)
CREATE POLICY "Admins can manage vehicles" ON vehicles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can view vehicles" ON vehicles
  FOR SELECT USING (true);

-- RLS Policies for Drivers (Admin only)
CREATE POLICY "Admins can manage drivers" ON drivers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can view drivers" ON drivers
  FOR SELECT USING (true);

CREATE POLICY "Drivers can view own profile" ON drivers
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Drivers can update own status" ON drivers
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Drivers can view assigned collections" ON collections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM drivers
      WHERE drivers.id = collections.driver_id
      AND drivers.user_id = auth.uid()
    )
  );

CREATE POLICY "Drivers can update assigned collections" ON collections
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM drivers
      WHERE drivers.id = collections.driver_id
      AND drivers.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM drivers
      WHERE drivers.id = collections.driver_id
      AND drivers.user_id = auth.uid()
    )
  );

-- RLS Policies for Collection Feedback
CREATE POLICY "Users can view own feedback" ON collection_feedback
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feedback" ON collection_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own feedback" ON collection_feedback
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage feedback" ON collection_feedback
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Drivers can view feedback for assigned collections" ON collection_feedback
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM collections
      JOIN drivers ON drivers.id = collections.driver_id
      WHERE collections.id = collection_feedback.collection_id
        AND drivers.user_id = auth.uid()
    )
  );

-- RLS Policies for Transportation
CREATE POLICY "Users can view own transportation" ON transportations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM collections 
      WHERE collections.id = transportations.collection_id 
      AND collections.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage transportation" ON transportations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Drivers can view assigned transportation" ON transportations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM drivers
      WHERE drivers.id = transportations.driver_id
      AND drivers.user_id = auth.uid()
    )
  );

CREATE POLICY "Drivers can update assigned transportation" ON transportations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM drivers
      WHERE drivers.id = transportations.driver_id
      AND drivers.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM drivers
      WHERE drivers.id = transportations.driver_id
      AND drivers.user_id = auth.uid()
    )
  );

-- RLS Policies for Waste Categories (Public read, Admin write)
CREATE POLICY "Anyone can view categories" ON waste_categories
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage categories" ON waste_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for Segregations
CREATE POLICY "Users can view own segregations" ON segregations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM collections 
      WHERE collections.id = segregations.collection_id 
      AND collections.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage segregations" ON segregations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_user_addresses_user_id ON user_addresses(user_id);
CREATE INDEX idx_waste_requests_user_id ON waste_requests(user_id);
CREATE INDEX idx_waste_requests_status ON waste_requests(status);
CREATE INDEX idx_collections_user_id ON collections(user_id);
CREATE INDEX idx_collections_status ON collections(status);
CREATE INDEX idx_transportations_collection_id ON transportations(collection_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_waste_requests_updated_at BEFORE UPDATE ON waste_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collection_feedback_updated_at BEFORE UPDATE ON collection_feedback
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collections_updated_at BEFORE UPDATE ON collections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transportations_updated_at BEFORE UPDATE ON transportations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default waste categories
INSERT INTO waste_categories (name, description, color, icon) VALUES
  ('Organic', 'Biodegradable waste like food scraps and yard waste', '#10b981', 'leaf'),
  ('Recyclable', 'Paper, plastic, glass, and metal that can be recycled', '#3b82f6', 'recycle'),
  ('Electronic', 'E-waste like computers, phones, and appliances', '#8b5cf6', 'cpu'),
  ('Hazardous', 'Dangerous materials requiring special handling', '#ef4444', 'alert-triangle'),
  ('General', 'Non-recyclable, non-hazardous waste', '#6b7280', 'trash-2');

-- Insert sample admin user (you'll need to create this user in Supabase Auth first)
-- After creating admin@ecoloop.com in Supabase Auth, run:
-- INSERT INTO profiles (id, name, role) VALUES ('USER_ID_FROM_AUTH', 'Admin User', 'admin');

-- Link a driver row to an authenticated account (run this after creating the driver user in Auth)
-- UPDATE drivers
-- SET user_id = 'DRIVER_PROFILE_USER_ID'
-- WHERE id = 'DRIVER_ROW_ID';

-- For existing databases: allow 'driver' role and set a driver account role
-- ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
-- ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('user', 'driver', 'admin'));
-- UPDATE profiles p
-- SET role = 'driver'
-- FROM auth.users u
-- WHERE p.id = u.id AND lower(u.email) = 'driver1@ecoloop.com';
