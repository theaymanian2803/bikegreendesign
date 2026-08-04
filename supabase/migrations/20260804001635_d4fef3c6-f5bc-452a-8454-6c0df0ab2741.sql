CREATE TABLE public.mega_menus (
  key text PRIMARY KEY,
  title text NOT NULL,
  categories_title text NOT NULL DEFAULT 'Shop By',
  products_title text NOT NULL DEFAULT 'Top Rated',
  left_banner_image text,
  left_banner_alt text,
  right_banner_image text,
  right_banner_alt text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.mega_menu_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_key text NOT NULL REFERENCES public.mega_menus(key) ON DELETE CASCADE,
  label text NOT NULL,
  image_url text NOT NULL DEFAULT '',
  href text NOT NULL DEFAULT '/shop',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.mega_menu_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_key text NOT NULL REFERENCES public.mega_menus(key) ON DELETE CASCADE,
  name text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  old_price numeric,
  badge text,
  image_url text NOT NULL DEFAULT '',
  href text NOT NULL DEFAULT '/shop',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mega_menus TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mega_menu_categories TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mega_menu_products TO anon, authenticated;
GRANT ALL ON public.mega_menus TO service_role;
GRANT ALL ON public.mega_menu_categories TO service_role;
GRANT ALL ON public.mega_menu_products TO service_role;

ALTER TABLE public.mega_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mega_menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mega_menu_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mega_menus public manage" ON public.mega_menus FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "mega_menu_categories public manage" ON public.mega_menu_categories FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "mega_menu_products public manage" ON public.mega_menu_products FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER mega_menus_updated BEFORE UPDATE ON public.mega_menus FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER mega_menu_categories_updated BEFORE UPDATE ON public.mega_menu_categories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER mega_menu_products_updated BEFORE UPDATE ON public.mega_menu_products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.mega_menus (key, title, categories_title, products_title, left_banner_image, left_banner_alt, right_banner_image, right_banner_alt, sort_order) VALUES
('shop','Shop','Shop By','Top Rated','/menu/hero-bike-snow.jpg','Mountain bike in the snow','/menu/cta-road.jpg','Road bike wheel close up',1),
('categories','Categories','Shop By','Top Rated','/menu/hero-bike-snow.jpg','Mountain bike in the snow','/menu/cta-road.jpg','Road bike wheel close up',2),
('products','Products','Shop By','Best Sellers','/menu/hero-bike-snow.jpg','Mountain bike in the snow','/menu/cta-road.jpg','Road bike wheel close up',3),
('top-deals','Top Deals','Shop By','Top Deals','/menu/hero-bike-snow.jpg','Mountain bike in the snow','/menu/cta-road.jpg','Road bike wheel close up',4),
('elements','Elements','Shop By','Top Rated','/menu/hero-bike-snow.jpg','Mountain bike in the snow','/menu/cta-road.jpg','Road bike wheel close up',5);

INSERT INTO public.mega_menu_categories (menu_key, label, image_url, href, sort_order)
SELECT m.key, c.label, c.image_url, '/shop', c.sort_order
FROM public.mega_menus m
CROSS JOIN (VALUES
  ('Helmets','/menu/p-helmet-red.jpg',1),
  ('Folding Bikes','/menu/p-suspension.jpg',2),
  ('Repair Stands','/menu/p-derailleur.jpg',3),
  ('Road Bikes','/menu/p-crank.jpg',4),
  ('Chain Lubricants','/menu/p-crank.jpg',5),
  ('Kickstands','/menu/p-stem.jpg',6),
  ('Monocycles','/menu/p-wheel.jpg',7),
  ('Mountain Bikes','/menu/p-helmet-black.jpg',8)
) AS c(label, image_url, sort_order);

INSERT INTO public.mega_menu_products (menu_key, name, price, old_price, badge, image_url, href, sort_order)
SELECT m.key, p.name, p.price, p.old_price, p.badge, p.image_url, '/shop', p.sort_order
FROM public.mega_menus m
CROSS JOIN (VALUES
  ('110mm Adjustable Adustable Stem Bicycle Handlebar',195::numeric,NULL::numeric,NULL::text,'/menu/p-stem.jpg',1),
  ('Shimano Alivio Crank Crankset Chainring 170mm',372,400,'-7%','/menu/p-crank.jpg',2),
  ('Schrodinger Adult Bicycle Cycle Road Helmet',340,NULL,NULL,'/menu/p-helmet-black.jpg',3),
  ('4pcs Mountain Bike Lock Bicycle Disc Rotor',333,370,'-10%','/menu/p-suspension.jpg',4),
  ('Moxic Aluminium Alloy Bicycle Stem Riser',299,NULL,NULL,'/menu/p-crank.jpg',5),
  ('Trending Fuji Silhouette 1.7 Disc Wheelset',650,NULL,'Pack','/menu/p-wheel.jpg',6)
) AS p(name, price, old_price, badge, image_url, sort_order);