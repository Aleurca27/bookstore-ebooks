-- Actualizar capítulos del ebook con los nuevos temas de marketing digital
-- Para el ebook con ID: 7ddb3a38-9697-466b-8980-f945d4026b3b

UPDATE public.ebooks
SET chapters = '[
  {
    "title": "El marco Anti-CPA Alto™",
    "content": "Árbol de decisiones para bajar costo por resultado en 24–72 h. Qué tocar primero: oferta → creativo → audiencia → puja. 5 acciones rápidas que no rompen el aprendizaje."
  },
  {
    "title": "Embudo 1-3-7-14-30: remarketing que cierra",
    "content": "Mensaje y formato exacto por ventana (qué decir y dónde). Secuencias listas para servicios y e-commerce."
  },
  {
    "title": "UGC que vende: 9 hooks probados",
    "content": "Guiones cortos (15–20 s) para Reels/Stories con CTA claro. Estructura PAS + \"prueba social express\" en 3 frases. Checklist visual para que cualquier persona grabe bien a la primera."
  },
  {
    "title": "Píxel + CAPI en 10 minutos (checklist express)",
    "content": "Eventos mínimos y pruebas rápidas en el Administrador de Eventos. Cómo detectar pérdida de señales y corregirla. Plantilla de naming para no confundir conversiones."
  },
  {
    "title": "Estructura ganadora: ¿ABO o CBO?",
    "content": "Cuándo usar cada una y errores típicos que suben el CPA. Presets de presupuesto y número de creativos por conjunto. Nomenclatura que ahorra horas y evita duplicidades."
  },
  {
    "title": "Escala sin quemar la cuenta",
    "content": "Reglas automatizadas simples (sube 15%, pausa por CPA). Duplicación inteligente (vertical vs horizontal) y cuándo parar. Indicadores de \"listo para escalar\" que no dependen del instinto."
  }
]'::jsonb,
updated_at = NOW()
WHERE id = '7ddb3a38-9697-466b-8980-f945d4026b3b';
