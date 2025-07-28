'use client'

import React, { forwardRef } from 'react'
import { Badge } from '@/components/ui/badge'

export interface ObrigacaoFiscal {
  id: string
  codigo: string
  nome: string
  nomeObrigacao?: string
  descricao?: string
  tipo: 'federal' | 'estadual' | 'municipal' | 'trabalhista' | 'previdenciaria'
  tipoObrigacao?: 'mensal' | 'bimestral' | 'trimestral' | 'semestral' | 'anual' | 'eventual'
  periodicidade: 'mensal' | 'bimestral' | 'trimestral' | 'semestral' | 'anual' | 'conforme_movimento'
  dataVencimento: Date
  proximoVencimento?: Date
  status: 'pendente' | 'cumprida' | 'atrasada' | 'em_andamento' | 'cumprido' | 'vencido' | 'isento'
  prioridade: 'baixa' | 'media' | 'alta' | 'critica'
  responsavel: string
  cliente?: string
  observacoes?: string
  categoria: 'declaracao' | 'pagamento' | 'informacao'
  orgaoDestino: string
  sistemaEnvio: string
  diasAlerta: number
  recorrente: boolean
  alertaEnviado?: number | boolean
  dataCumprimento?: Date
  usuarioCumprimento?: string
  valorMulta?: number
  diasAtraso?: number
  empresasCumpridas?: any[]
  documentos?: any[]
}

interface RelatorioObrigacoesPDFProps {
  obrigacoes: ObrigacaoFiscal[]
  filtros: {
    periodo: string
    status: string
    tipo: string
    prioridade: string
  }
}

const RelatorioObrigacoesPDF = forwardRef<HTMLDivElement, RelatorioObrigacoesPDFProps>(
  ({ obrigacoes, filtros }, ref) => {
    const hoje = new Date()
    const obrigacoesPendentes = obrigacoes.filter(o => o.status === 'pendente')
    const obrigacoesCumpridas = obrigacoes.filter(o => o.status === 'cumprida')
    const obrigacoesAtrasadas = obrigacoes.filter(o => o.status === 'atrasada')
    
    const obrigacoesPorTipo = {
      federal: obrigacoes.filter(o => o.tipo === 'federal').length,
      estadual: obrigacoes.filter(o => o.tipo === 'estadual').length,
      municipal: obrigacoes.filter(o => o.tipo === 'municipal').length,
      trabalhista: obrigacoes.filter(o => o.tipo === 'trabalhista').length,
      previdenciaria: obrigacoes.filter(o => o.tipo === 'previdenciaria').length,
    }

    const obrigacoesPorPrioridade = {
      critica: obrigacoes.filter(o => o.prioridade === 'critica').length,
      alta: obrigacoes.filter(o => o.prioridade === 'alta').length,
      media: obrigacoes.filter(o => o.prioridade === 'media').length,
      baixa: obrigacoes.filter(o => o.prioridade === 'baixa').length,
    }

    return (
      <div ref={ref} className="bg-white p-8 text-black" style={{ fontSize: '12px', lineHeight: '1.4' }}>
        {/* Header */}
        <div className="border-b-2 border-emerald-600 pb-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center space-x-4 mb-3">
                <img 
                  src="https://assets.macaly-user-data.dev/vu6uteof0g2skav7mwkttz9h/mk2of4l6b3c7h8aflcpq3h6w/o-h2__8-krHhyceVQM4UJ/image.png" 
                  alt="AG Assessoria Logo" 
                  className="h-12 w-auto object-contain"
                  data-macaly="logo-relatorio"
                />
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">AG ASSESSORIA</h1>
                  <p className="text-sm text-gray-600">Contabilidade e Assessoria Empresarial</p>
                </div>
              </div>
              <h2 className="text-lg font-semibold text-emerald-600 mb-1">Relatório de Obrigações Fiscais</h2>
              <p className="text-gray-600">Controle e acompanhamento das obrigações fiscais</p>
            </div>
            <div className="text-right">
              <p className="text-gray-600">Data de emissão:</p>
              <p className="font-semibold">{hoje.toLocaleDateString('pt-BR', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
            </div>
          </div>
        </div>

        {/* Resumo Executivo */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4 border-l-4 border-emerald-500 pl-3">
            📊 Resumo Executivo
          </h3>
          
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{obrigacoes.length}</div>
                <div className="text-sm text-gray-600">Total de Obrigações</div>
              </div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{obrigacoesPendentes.length}</div>
                <div className="text-sm text-gray-600">Pendentes</div>
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{obrigacoesCumpridas.length}</div>
                <div className="text-sm text-gray-600">Cumpridas</div>
              </div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{obrigacoesAtrasadas.length}</div>
                <div className="text-sm text-gray-600">Atrasadas</div>
              </div>
            </div>
          </div>

          {/* Filtros Aplicados */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h4 className="font-semibold text-gray-800 mb-2">🔍 Filtros Aplicados:</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><strong>Período:</strong> {filtros.periodo}</div>
              <div><strong>Status:</strong> {filtros.status}</div>
              <div><strong>Tipo:</strong> {filtros.tipo}</div>
              <div><strong>Prioridade:</strong> {filtros.prioridade}</div>
            </div>
          </div>
        </div>

        {/* Análise por Tipo */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4 border-l-4 border-emerald-500 pl-3">
            🏛️ Distribuição por Tipo
          </h3>
          <div className="grid grid-cols-5 gap-3">
            {Object.entries(obrigacoesPorTipo).map(([tipo, quantidade]) => (
              <div key={tipo} className="bg-gray-50 p-3 rounded border text-center">
                <div className="font-bold text-lg text-gray-700">{quantidade}</div>
                <div className="text-xs text-gray-600 capitalize">{tipo}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Análise por Prioridade */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4 border-l-4 border-orange-500 pl-3">
            ⚠️ Distribuição por Prioridade
          </h3>
          <div className="grid grid-cols-4 gap-3">
            {Object.entries(obrigacoesPorPrioridade).map(([prioridade, quantidade]) => (
              <div key={prioridade} className={`p-3 rounded border text-center ${
                prioridade === 'critica' ? 'bg-red-50 border-red-200' :
                prioridade === 'alta' ? 'bg-orange-50 border-orange-200' :
                prioridade === 'media' ? 'bg-yellow-50 border-yellow-200' :
                'bg-green-50 border-green-200'
              }`}>
                <div className={`font-bold text-lg ${
                  prioridade === 'critica' ? 'text-red-600' :
                  prioridade === 'alta' ? 'text-orange-600' :
                  prioridade === 'media' ? 'text-yellow-600' :
                  'text-green-600'
                }`}>{quantidade}</div>
                <div className="text-xs text-gray-600 capitalize">{prioridade}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Lista Detalhada */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4 border-l-4 border-purple-500 pl-3">
            📋 Lista Detalhada de Obrigações
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-left font-semibold">Código</th>
                  <th className="border border-gray-300 p-2 text-left font-semibold">Nome</th>
                  <th className="border border-gray-300 p-2 text-left font-semibold">Tipo</th>
                  <th className="border border-gray-300 p-2 text-left font-semibold">Status</th>
                  <th className="border border-gray-300 p-2 text-left font-semibold">Prioridade</th>
                  <th className="border border-gray-300 p-2 text-left font-semibold">Vencimento</th>
                  <th className="border border-gray-300 p-2 text-left font-semibold">Responsável</th>
                </tr>
              </thead>
              <tbody>
                {obrigacoes.map((obrigacao, index) => (
                  <tr key={obrigacao.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-300 p-2">{obrigacao.codigo}</td>
                    <td className="border border-gray-300 p-2">{obrigacao.nome}</td>
                    <td className="border border-gray-300 p-2 capitalize">{obrigacao.tipo}</td>
                    <td className="border border-gray-300 p-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        obrigacao.status === 'cumprida' ? 'bg-green-100 text-green-800' :
                        obrigacao.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' :
                        obrigacao.status === 'atrasada' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {obrigacao.status}
                      </span>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        obrigacao.prioridade === 'critica' ? 'bg-red-100 text-red-800' :
                        obrigacao.prioridade === 'alta' ? 'bg-orange-100 text-orange-800' :
                        obrigacao.prioridade === 'media' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {obrigacao.prioridade}
                      </span>
                    </td>
                    <td className="border border-gray-300 p-2">
                      {obrigacao.dataVencimento.toLocaleDateString('pt-BR')}
                    </td>
                    <td className="border border-gray-300 p-2">{obrigacao.responsavel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Observações Importantes */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4 border-l-4 border-red-500 pl-3">
            ⚠️ Observações Importantes
          </h3>
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><strong>Obrigações Atrasadas:</strong> {obrigacoesAtrasadas.length} obrigação(ões) com vencimento em atraso.</li>
              <li><strong>Prioridade Crítica:</strong> {obrigacoesPorPrioridade.critica} obrigação(ões) requerem atenção imediata.</li>
              <li><strong>Vencimentos Próximos:</strong> Verificar obrigações com vencimento nos próximos 7 dias.</li>
              <li><strong>Responsabilidades:</strong> Confirmar responsáveis designados para cada obrigação.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-300 pt-4 mt-8">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <div>
              <p><strong>AG Assessoria</strong> - Contabilidade e Assessoria Empresarial</p>
              <p>Sistema de Gestão de Obrigações Fiscais - Relatório gerado automaticamente</p>
            </div>
            <div className="text-right">
              <p>Página 1 de 1</p>
              <p>Total de registros: {obrigacoes.length}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }
)

RelatorioObrigacoesPDF.displayName = 'RelatorioObrigacoesPDF'

export default RelatorioObrigacoesPDF