import React from 'react';
import { TrendingUp, Target, DollarSign, BarChart3 } from 'lucide-react';
import { Test, Metrics } from '../types';
import { formatCurrency, formatPercentage } from '../utils/calculations';
import MetricCard from './MetricCard';
import ROIChart from './ROIChart';

interface DashboardProps {
  tests: Test[];
  metrics: Metrics;
}

const Dashboard: React.FC<DashboardProps> = ({ tests, metrics }) => {
  const chartData = tests.map(test => ({
    date: test.startDate,
    roi: test.roi,
    investment: test.investedAmount,
    revenue: test.returnValue
  })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="text-sm text-gray-500">
          Última atualização: {new Date().toLocaleString('pt-BR')}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Investimento Total"
          value={formatCurrency(metrics.totalInvestment)}
          icon={DollarSign}
          color="blue"
          subtitle="Valor total investido"
        />
        
        <MetricCard
          title="Total de Testes"
          value={metrics.totalTests.toString()}
          icon={Target}
          color="green"
          subtitle="Testes executados"
        />
        
        <MetricCard
          title="Taxa de Sucesso"
          value={formatPercentage(metrics.successRate)}
          icon={TrendingUp}
          color={metrics.successRate >= 50 ? 'green' : 'red'}
          subtitle="Testes lucrativos"
        />
        
        <MetricCard
          title="Resultado Líquido"
          value={formatCurrency(metrics.netResult)}
          icon={BarChart3}
          color={metrics.netResult >= 0 ? 'green' : 'red'}
          subtitle="Lucro/Prejuízo"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ROIChart data={chartData} />
        
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Métricas Adicionais</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">ROI Médio</span>
              <span className="font-semibold text-gray-900">{formatPercentage(metrics.avgROI)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">CPA Médio</span>
              <span className="font-semibold text-gray-900">{formatCurrency(metrics.avgCPA)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Receita Total</span>
              <span className="font-semibold text-gray-900">{formatCurrency(tests.reduce((sum, test) => sum + test.returnValue, 0))}</span>
            </div>
          </div>
        </div>
      </div>

      {tests.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Últimos Testes</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-4 font-medium text-gray-600">Produto</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-600">Data</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-600">Investimento</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-600">ROI</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {tests.slice(-5).reverse().map((test) => (
                  <tr key={test.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-4 font-medium text-gray-900">{test.productName}</td>
                    <td className="py-2 px-4 text-gray-600">{new Date(test.startDate).toLocaleDateString('pt-BR')}</td>
                    <td className="py-2 px-4 text-gray-600">{formatCurrency(test.investedAmount)}</td>
                    <td className="py-2 px-4">
                      <span className={`font-medium ${test.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercentage(test.roi)}
                      </span>
                    </td>
                    <td className="py-2 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        test.status === 'Escalar' ? 'bg-green-100 text-green-800' :
                        test.status === 'Pausar' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {test.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;