-- 🔧 Script para criar função calcular_status_alvara que está faltando
-- Execute este script no Supabase SQL Editor

-- Criar ou substituir a função calcular_status_alvara
CREATE OR REPLACE FUNCTION calcular_status_alvara(data_vencimento DATE)
RETURNS TEXT AS $$
DECLARE
    dias_para_vencer INTEGER;
    status_resultado TEXT;
BEGIN
    -- Calcular diferença em dias entre data de vencimento e hoje
    dias_para_vencer := data_vencimento - CURRENT_DATE;
    
    -- Determinar status baseado nos dias
    IF dias_para_vencer < 0 THEN
        status_resultado := 'vencido';
    ELSIF dias_para_vencer <= 30 THEN
        status_resultado := 'vencendo';
    ELSE
        status_resultado := 'em_dia';
    END IF;
    
    RETURN status_resultado;
END;
$$ LANGUAGE plpgsql;

-- Testar a função
SELECT 
    'Teste da função:' as info,
    calcular_status_alvara(CURRENT_DATE - 10) as vencido_teste,
    calcular_status_alvara(CURRENT_DATE + 15) as vencendo_teste,
    calcular_status_alvara(CURRENT_DATE + 60) as em_dia_teste;

-- Verificar se a função foi criada
SELECT 
    'Função criada com sucesso!' as resultado,
    proname as nome_funcao,
    proargtypes::regtype[] as tipos_argumentos
FROM pg_proc 
WHERE proname = 'calcular_status_alvara';

COMMENT ON FUNCTION calcular_status_alvara(DATE) IS 'Calcula o status de um alvará baseado na data de vencimento';

SELECT 'Script executado com sucesso!' as status;