UPDATE landing_sections
SET config = json_object('items', config)
WHERE type = 'services'
  AND json_valid(config)
  AND json_type(config) = 'array';

UPDATE landing_sections
SET config = (
  SELECT json_group_array(
    json_set(
      item.value,
      '$.description',
      COALESCE(
        NULLIF(json_extract(item.value, '$.description'), ''),
        CASE json_extract(item.value, '$.title')
          WHEN 'Part Replacement' THEN 'Quality components fitted and tuned by our mechanics.'
          WHEN 'Bike Maintenance' THEN 'A complete safety check, clean and tune for smoother miles.'
          WHEN 'Damage Repairing' THEN 'Frame, wheel and drivetrain repairs handled in our workshop.'
          WHEN 'E-Bike Test' THEN 'Battery, motor and brake diagnostics for confident e-bike riding.'
          ELSE ''
        END
      )
    )
  )
  FROM json_each(json_extract(landing_sections.config, '$.items')) AS item
)
WHERE type = 'services'
  AND json_valid(config)
  AND json_type(json_extract(config, '$.items')) = 'array';
