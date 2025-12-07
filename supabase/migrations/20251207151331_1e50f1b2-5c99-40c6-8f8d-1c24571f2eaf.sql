-- Add webhook_logs table for tracking Power Automate calls
CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type VARCHAR(50) NOT NULL DEFAULT 'excel',
  excel_row_id VARCHAR(255),
  payload JSONB NOT NULL,
  response JSONB,
  status VARCHAR(50) NOT NULL DEFAULT 'received',
  error_message TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view webhook logs
CREATE POLICY "Admins podem ver webhook logs"
ON public.webhook_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR is_admin_med(auth.uid()));

-- Add forms_config table for webhook configuration
CREATE TABLE IF NOT EXISTS public.forms_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  webhook_secret VARCHAR(255),
  onedrive_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.forms_config ENABLE ROW LEVEL SECURITY;

-- Only admins can manage forms config
CREATE POLICY "Admins podem gerenciar forms config"
ON public.forms_config
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add source tracking columns to agendamentos_obst if not exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agendamentos_obst' AND column_name = 'source_type') THEN
    ALTER TABLE public.agendamentos_obst ADD COLUMN source_type VARCHAR(50) DEFAULT 'manual';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agendamentos_obst' AND column_name = 'excel_row_id') THEN
    ALTER TABLE public.agendamentos_obst ADD COLUMN excel_row_id VARCHAR(255);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agendamentos_obst' AND column_name = 'forms_row_id') THEN
    ALTER TABLE public.agendamentos_obst ADD COLUMN forms_row_id VARCHAR(255);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agendamentos_obst' AND column_name = 'dpp_calculado') THEN
    ALTER TABLE public.agendamentos_obst ADD COLUMN dpp_calculado DATE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agendamentos_obst' AND column_name = 'metodo_calculo') THEN
    ALTER TABLE public.agendamentos_obst ADD COLUMN metodo_calculo VARCHAR(50);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agendamentos_obst' AND column_name = 'categoria_diagnostico') THEN
    ALTER TABLE public.agendamentos_obst ADD COLUMN categoria_diagnostico VARCHAR(100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agendamentos_obst' AND column_name = 'diagnostico_encontrado') THEN
    ALTER TABLE public.agendamentos_obst ADD COLUMN diagnostico_encontrado TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agendamentos_obst' AND column_name = 'dias_adiados') THEN
    ALTER TABLE public.agendamentos_obst ADD COLUMN dias_adiados INTEGER DEFAULT 0;
  END IF;
END $$;

-- Insert default forms config
INSERT INTO public.forms_config (name, webhook_secret, is_active)
VALUES ('power_automate_excel', 'hapvida_forms_2025', true)
ON CONFLICT (name) DO NOTHING;