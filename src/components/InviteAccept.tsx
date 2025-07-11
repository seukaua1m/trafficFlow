import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Users } from 'lucide-react';
import { workspaceService } from '../services/supabaseService';
import { useAuth } from '../hooks/useAuth';

const InviteAccept: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; workspaceName?: string } | null>(null);

  useEffect(() => {
    if (!user) {
      // Redirect to login with return URL
      const returnUrl = encodeURIComponent(window.location.pathname);
      navigate(`/login?return=${returnUrl}`);
    }
  }, [user, navigate]);

  const handleAcceptInvite = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const response = await workspaceService.acceptInvitation(token);
      
      if (response.success) {
        setResult({
          success: true,
          message: 'Convite aceito com sucesso!',
          workspaceName: response.workspace_name
        });
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        setResult({
          success: false,
          message: response.error || 'Erro ao aceitar convite'
        });
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      setResult({
        success: false,
        message: 'Erro ao aceitar convite. Tente novamente.'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Redirecionando para login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Convite para Workspace</h1>
          <p className="text-gray-600">
            Você foi convidado para participar de um workspace no TrafficFlow Manager Pro.
          </p>
        </div>

        {!result && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Logado como: <strong>{user.email}</strong>
            </p>
            <button
              onClick={handleAcceptInvite}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Aceitando convite...
                </div>
              ) : (
                'Aceitar Convite'
              )}
            </button>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
              result.success ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {result.success ? (
                <CheckCircle className="w-8 h-8 text-green-600" />
              ) : (
                <XCircle className="w-8 h-8 text-red-600" />
              )}
            </div>
            
            <div>
              <h2 className={`text-xl font-bold mb-2 ${
                result.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {result.success ? 'Sucesso!' : 'Erro'}
              </h2>
              <p className="text-gray-600 mb-4">{result.message}</p>
              
              {result.success && result.workspaceName && (
                <p className="text-sm text-gray-500">
                  Você agora faz parte do workspace: <strong>{result.workspaceName}</strong>
                </p>
              )}
            </div>

            {result.success && (
              <p className="text-sm text-gray-500">
                Redirecionando para o dashboard...
              </p>
            )}
            
            {!result.success && (
              <button
                onClick={() => navigate('/')}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors"
              >
                Voltar ao Dashboard
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InviteAccept;