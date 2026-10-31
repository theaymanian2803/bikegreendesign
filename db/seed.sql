-- Pathway Bike Shop — seed data for the mega menu tables, catalog tables and
-- store settings. Idempotent: menu rows are inserted OR IGNOREd, catalog rows
-- are inserted OR IGNOREd, categories/products are only seeded when their
-- tables are empty, settings default to their built-in values, so re-running
-- never clobbers edits.
--
-- NOTE: row sources use UNION ALL SELECT (not VALUES table constructors) for
-- compatibility with the SQLite build bundled in @libsql/client.

INSERT OR IGNORE INTO mega_menus (key, title, categories_title, products_title, left_banner_image, left_banner_alt, right_banner_image, right_banner_alt, sort_order) VALUES
('shop', 'Shop', 'Shop By', 'Top Rated', '/menu/hero-bike-snow.jpg', 'Mountain bike in the snow', '/menu/cta-road.jpg', 'Road bike wheel close up', 1),
('categories', 'Categories', 'Shop By', 'Top Rated', '/menu/hero-bike-snow.jpg', 'Mountain bike in the snow', '/menu/cta-road.jpg', 'Road bike wheel close up', 2),
('products', 'Products', 'Shop By', 'Best Sellers', '/menu/hero-bike-snow.jpg', 'Mountain bike in the snow', '/menu/cta-road.jpg', 'Road bike wheel close up', 3),
('top-deals', 'Top Deals', 'Shop By', 'Top Deals', '/menu/hero-bike-snow.jpg', 'Mountain bike in the snow', '/menu/cta-road.jpg', 'Road bike wheel close up', 4),
('elements', 'Elements', 'Shop By', 'Top Rated', '/menu/hero-bike-snow.jpg', 'Mountain bike in the snow', '/menu/cta-road.jpg', 'Road bike wheel close up', 5);

INSERT INTO mega_menu_categories (menu_key, label, image_url, href, sort_order)
SELECT m.key, c.label, c.image_url, '/shop', c.sort_order
FROM mega_menus m
CROSS JOIN (
  SELECT 'Helmets' AS label, '/menu/p-helmet-red.jpg' AS image_url, 1 AS sort_order
  UNION ALL SELECT 'Folding Bikes', '/menu/p-suspension.jpg', 2
  UNION ALL SELECT 'Repair Stands', '/menu/p-derailleur.jpg', 3
  UNION ALL SELECT 'Road Bikes', '/menu/p-crank.jpg', 4
  UNION ALL SELECT 'Chain Lubricants', '/menu/p-crank.jpg', 5
  UNION ALL SELECT 'Kickstands', '/menu/p-stem.jpg', 6
  UNION ALL SELECT 'Monocycles', '/menu/p-wheel.jpg', 7
  UNION ALL SELECT 'Mountain Bikes', '/menu/p-helmet-black.jpg', 8
) AS c
WHERE NOT EXISTS (SELECT 1 FROM mega_menu_categories);

INSERT INTO mega_menu_products (menu_key, name, price, old_price, badge, image_url, href, sort_order)
SELECT m.key, p.name, p.price, p.old_price, p.badge, p.image_url, '/shop', p.sort_order
FROM mega_menus m
CROSS JOIN (
  SELECT '110mm Adjustable Adustable Stem Bicycle Handlebar' AS name, 195 AS price, NULL AS old_price, NULL AS badge, '/menu/p-stem.jpg' AS image_url, 1 AS sort_order
  UNION ALL SELECT 'Shimano Alivio Crank Crankset Chainring 170mm', 372, 400, '-7%', '/menu/p-crank.jpg', 2
  UNION ALL SELECT 'Schrodinger Adult Bicycle Cycle Road Helmet', 340, NULL, NULL, '/menu/p-helmet-black.jpg', 3
  UNION ALL SELECT '4pcs Mountain Bike Lock Bicycle Disc Rotor', 333, 370, '-10%', '/menu/p-suspension.jpg', 4
  UNION ALL SELECT 'Moxic Aluminium Alloy Bicycle Stem Riser', 299, NULL, NULL, '/menu/p-crank.jpg', 5
  UNION ALL SELECT 'Trending Fuji Silhouette 1.7 Disc Wheelset', 650, NULL, 'Pack', '/menu/p-wheel.jpg', 6
) AS p
WHERE NOT EXISTS (SELECT 1 FROM mega_menu_products);

INSERT OR IGNORE INTO settings (key, value) VALUES
('free_shipping_threshold_cents', '30000'),
('flat_shipping_cents', '1900'),
('store_email', 'hello@pathwaybikeshop.com'),
('store_phone', '+1 (555) 010-2233');

-- ---------------------------------------------------------------------------
-- Catalog: categories + products. Products reference categories by slug so the
-- seed survives category id changes. Description/highlights/specs are left as
-- defaults and filled in by the API (src/integrations/turso/catalog.functions.ts).
-- ---------------------------------------------------------------------------

INSERT OR IGNORE INTO categories (slug, name, image_url, description, sort_order) VALUES
('balance-bikes', 'Balance Bikes', '', '', 1),
('monocycles', 'Monocycles', '', '', 2),
('police-bicycles', 'Police Bicycles', '', '', 3),
('track-bikes', 'Track Bikes', '', '', 4),
('bicycle-parts', 'Bicycle Parts', '/menu/p-derailleur.jpg', '', 5),
('bike-accessories', 'Bike Accessories', '/menu/p-wheel.jpg', '', 6),
('rider-clothing', 'Rider Clothing', '/menu/p-helmet-red.jpg', '', 7),
('mountain-bikes', 'Mountain Bikes', '/menu/p-suspension.jpg', '', 8);

INSERT OR IGNORE INTO products
  (slug, name, price, old_price, badge, rating, image_url, category_id, brand, sku, sort_order)
SELECT
  p.slug, p.name, p.price, p.old_price, p.badge, p.rating, p.image_url,
  c.id, p.brand, p.sku, p.sort_order
FROM (
  SELECT 'mtb-derailleur' AS slug, 'MTB Mountain Bike Mech Derailleur In Black Long' AS name, 280 AS price, NULL AS old_price, NULL AS badge, 5 AS rating, '/menu/p-derailleur.jpg' AS image_url, 'bicycle-parts' AS cat_slug, 'Cyclify' AS brand, 'PW-1000' AS sku, 1 AS sort_order
  UNION ALL SELECT 'narwheel-hub', 'Narwheel Thru Axle Bicycle Wheel Holder For Vans, Trucks', 246, NULL, NULL, 5, '/menu/p-wheel.jpg', 'bike-accessories', 'RoamZone', 'PW-1007', 2
  UNION ALL SELECT 'toronto-crank', 'New Toronto H20 Hybrid Cycle With Carbon Frame', 269, NULL, NULL, 5, '/menu/p-crank.jpg', 'bicycle-parts', 'MegaMod', 'PW-1014', 3
  UNION ALL SELECT 'strauss-helmet', 'Strauss Veloguard Cycling Light Weight Helmet', 325.5, 350, '-7%', 5, '/menu/p-helmet-red.jpg', 'rider-clothing', 'QuickCart', 'PW-1021', 4
  UNION ALL SELECT 'bullseye-wheels', 'Bullseye MonsterWheels 26 Inch Aluminum Bike Wheels', 304, 320, '-5%', 5, '/menu/p-wheel.jpg', 'bicycle-parts', 'Cyclify', 'PW-1028', 5
  UNION ALL SELECT 'fcc-racing', 'FCC Racing CNC Rear Thru Axle For Mountain Bike', 240, NULL, 'Out of stock', 5, '/menu/p-suspension.jpg', 'mountain-bikes', 'RoamZone', 'PW-1035', 6
  UNION ALL SELECT 'shimano-rr', 'Shimano RR Mech RX812 GRX 11 Speed Shadow+ Single 42T', 320, NULL, NULL, 4, '/menu/p-derailleur.jpg', 'bicycle-parts', 'MegaMod', 'PW-1042', 7
  UNION ALL SELECT 'giro-syntax', 'Giro Syntax MIPS Helmet Matte Black, M', 221, 260, '-15%', 5, '/menu/p-helmet-black.jpg', 'rider-clothing', 'QuickCart', 'PW-1049', 8
  UNION ALL SELECT 'mzpwjd-wheelset', 'MZPWJD Bicycle Wheelset 26 Inch MTB Bike Wheels', 230, NULL, NULL, 5, '/menu/p-wheel.jpg', 'bicycle-parts', 'Cyclify', 'PW-1056', 9
  UNION ALL SELECT 'calandis-stem', 'CALANDIS Bike Short Stem Aluminum Alloy Road Bicycle', 270, NULL, NULL, 5, '/menu/p-stem.jpg', 'bicycle-parts', 'RoamZone', 'PW-1063', 10
  UNION ALL SELECT 'djc-chainring', 'DJC Bike GXP Chainring Adapter Spider To 104BCD', 352.5, 375, '-6%', 5, '/menu/p-crank.jpg', 'bicycle-parts', 'MegaMod', 'PW-1070', 11
  UNION ALL SELECT 'bell-avenue', 'BELL Avenue Led Adult Road Bike Helmet - Matte Pink', 280, NULL, NULL, 5, '/menu/p-helmet-pink.jpg', 'rider-clothing', 'QuickCart', 'PW-1077', 12
) AS p
JOIN categories c ON c.slug = p.cat_slug
WHERE NOT EXISTS (SELECT 1 FROM products);

-- ---------------------------------------------------------------------------
-- Reviews. A handful of approved reviews per highlighted product plus one
-- pending review so the admin "Reviews" queue is not empty on first load.
-- Idempotent: only seeded when the reviews table is empty.
-- ---------------------------------------------------------------------------

INSERT INTO reviews (product_id, author_name, rating, title, body, status)
SELECT p.id, r.author, r.rating, r.title, r.body, r.status
FROM products p
JOIN (
  SELECT 'mtb-derailleur' AS slug, 'Marcus L.' AS author, 5 AS rating, 'Crisp shifting' AS title, 'Fitted straight onto my gravel build, shifting has never been crisper.' AS body, 'approved' AS status
  UNION ALL SELECT 'mtb-derailleur', 'Ana P.', 5, 'Same-day fitting', 'Great quality for the price and the shop fitted it the same day.', 'approved'
  UNION ALL SELECT 'giro-syntax', 'Sara K.', 5, 'Comfortable and light', 'Best helmet I have owned. Barely notice it on long rides.', 'approved'
  UNION ALL SELECT 'giro-syntax', 'Devon R.', 4, 'Runs a touch small', 'Snug fit but excellent protection. Size up if you are between sizes.', 'approved'
  UNION ALL SELECT 'bell-avenue', 'Priya M.', 5, 'Bright and comfy', 'The integrated light is a genius touch for night rides.', 'approved'
  UNION ALL SELECT 'shimano-rr', 'Tom H.', 5, 'Smooth gear changes', 'Upgraded my drivetrain and the difference is night and day.', 'pending'
) r ON r.slug = p.slug
WHERE NOT EXISTS (SELECT 1 FROM reviews);

-- ---------------------------------------------------------------------------
-- Landing page sections. Seeded once per unique section_key; edits made in
-- /admin/landing are never overwritten by re-running db:setup.
-- ---------------------------------------------------------------------------

INSERT OR IGNORE INTO landing_sections
  (section_key, type, title, subtitle, image_url, visible, sort_order, config) VALUES
('hero', 'hero', 'Here You Find Right
City E-Bike', 'Cyclocross / Hybrid Bike', '/menu/hero-bike-snow.jpg', 1, 1,
 '{"ctaLabel":"Shop Now","ctaHref":"/shop"}'),

('services', 'services', 'Full Service Shop', 'Our Services', '', 1, 2,
 '{"items":[{"title":"Part Replacement","label":"Bike Service","description":"Quality components fitted and tuned by our mechanics.","image":"/menu/service-part.jpg"},{"title":"Bike Maintenance","label":"Bike Service","description":"A complete safety check, clean and tune for smoother miles.","image":"/menu/service-maintenance.jpg"},{"title":"Damage Repairing","label":"Bike Service","description":"Frame, wheel and drivetrain repairs handled in our workshop.","image":"/menu/service-repair.jpg"},{"title":"E-Bike Test","label":"Bike Service","description":"Battery, motor and brake diagnostics for confident e-bike riding.","image":"/menu/service-test.jpg"}]}'),

('about', 'about', 'We Are The Best Shop & Repair Bicycles', 'About Us', '/menu/about-shop.jpg', 1, 3,
 '{"body":"Our workshop is run by mechanics who ride every day. We service everything from entry-level commuters to carbon race bikes, and every repair leaves the stand with a full safety check. Bring the bike in, tell us how it rides, and we will tell you exactly what it needs - nothing more.","secondaryImage":"/menu/about-mechanic.jpg","ctaLabel":"Read More","ctaHref":"/shop"}'),

('gear', 'product_row', 'Shop Gear & Accessories', 'Parts & Accessories', '', 1, 4,
 '{"source":"latest","category":"","productIds":[],"limit":8,"offset":0}'),

('cta', 'cta', 'Unleash The Thrill Of
The Open Road!', 'Exclusive Bicycle', '/menu/cta-road.jpg', 1, 5,
 '{"ctaLabel":"Shop Now","ctaHref":"/shop"}'),

('features', 'features', '', '', '', 1, 6,
 '{"items":[{"icon":"bike","title":"Best Bikes In City","text":"A carefully picked range built for every road and every rider."},{"icon":"shopping-bag","title":"Clothing & Gear","text":"Helmets, jerseys and protection from the brands we trust."},{"icon":"award","title":"Experience","text":"Over twenty years of wrenching, fitting and building bikes."},{"icon":"tag","title":"No Charges","text":"Free tune-up checks on every bike bought in our store."}]}'),

('category_cards', 'category_cards', '', '', '', 1, 7,
 '{"items":[{"label":"New Collection","title":"Strattos S3 Bicycle","image":"/menu/cat-red-bike.jpg","href":"/shop"},{"label":"Best Seller","title":"Grd Bicycle 7 Speed Gear","image":"/menu/cat-blue-bike.jpg","href":"/shop"}]}'),

('parts', 'product_row', 'Shop Bicycle Parts', '', '', 1, 8,
 '{"source":"latest","category":"","productIds":[],"limit":4,"offset":6}'),

('testimonials', 'testimonials', 'See What They Said About Client', 'Our Testimonials', '', 1, 9,
 '{"items":[{"name":"Leslie Alexander","role":"Customer","text":"They stripped, cleaned and rebuilt my entire drivetrain in a single day. The bike shifts like it did the week I bought it."},{"name":"Cristofer Bailey","role":"Customer","text":"Honest advice, fair prices and nobody upsells you. I have sent half of my riding club here already."}],"brands":["Cycling","One Biker''s","Biking","Bicycle","Go Cycling"]}'),

('gallery', 'gallery', 'From The Gallery', '', '', 1, 10,
 '{"items":[{"title":"How To Write A Blog Post Your Readers Will Love In 5 Steps","image":"/menu/service-repair.jpg"},{"title":"9 Content Marketing Trends And Ideas Worth Trying","image":"/menu/service-maintenance.jpg"},{"title":"The Ultimate Guide To Marketing Strategies For Your Store","image":"/menu/service-part.jpg"}]}'),

('promo_popup', 'promo_popup', 'Get 10% off your first order', 'Join the Pathway crew and take 10% off your first order over $100.', '/menu/cta-road.jpg', 1, 999,
 '{"enabled":false,"couponCode":"PATHWAY10","delaySeconds":4,"ctaLabel":"Shop now","ctaHref":"/shop"}');

