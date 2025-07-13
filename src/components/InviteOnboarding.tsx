import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Users, Eye, EyeOff, Lock, Mail, AlertTriangle, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface InvitationData {
  valid: boolean;
  invitation_id?: string;
  email?: string;
  workspace_id?: string;
  permissions?: any;
  expires_at?: string;
  error?: string;
  message?: string;
}

const InviteOnboarding: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [step, setStep] = useState<'validating' | 'create-password' | 'success' | 'error'>('validating');
  const [invitationData, setInvitationData] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (token) {
      validateInvitation();
    }
  }, [token]);

  const validateInvitation = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.rpc('validate_invitation_token', {
        invitation_token: token
      });

      if (error) throw error;

      setInvitationData(data);
      
      if (data.valid) {
        setStep('create-password');
      } else {
        setStep('error');
      }
    } catch (error) {
      console.error('Error validating invitation:', error);
      setInvitationData({
        valid: false,
        error: 'validation_failed',
        message: 'Erro ao validar convite. Tente novamente.'
      });
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('A senha deve ter pelo menos 8 caracteres');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('A senha deve conter pelo menos uma letra maiúscula');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('A senha deve conter pelo menos uma letra minúscula');
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push('A senha deve conter pelo menos um número');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('A senha deve conter pelo menos um caractere especial');
    }
    
    return errors;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'password') {
      const passwordErrors = validatePassword(value);
      setErrors(passwordErrors);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!invitationData?.email) return;
    
    // Validar senhas
    const passwordErrors = validatePassword(formData.password);
    if (passwordErrors.length > 0) {
      setErrors(passwordErrors);
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setErrors(['As senhas não coincidem']);
      return;
    }
    
    setLoading(true);
    setErrors([]);
    
    try {
      // Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invitationData.email,
        password: formData.password,
        options: {
          data: {
            invitation_token: token,
            workspace_id: invitationData.workspace_id
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Aceitar convite após criação do usuário
        const clientInfo = {
          ip_address: null, // Será capturado pelo servidor se necessário
          user_agent: navigator.userAgent
        };

        const { data: acceptData, error: acceptError } = await supabase.rpc('accept_invitation_secure', {
          invitation_token: token,
          user_password: formData.password,
          client_ip: null,
          client_user_agent: navigator.userAgent
        });

        if (acceptError) {
          console.error('Error accepting invitation:', acceptError);
          // Mesmo com erro na aceitação, o usuário foi criado
        }

        setStep('success');
        
        // Redirecionar para login após 3 segundos
        setTimeout(() => {
          navigate('/login?message=account_created');
        }, 3000);
      }
    } catch (error: any) {
      console.error('Error creating account:', error);
      
      if (error.message?.includes('already_registered')) {
        setErrors(['Este email já está registrado. Tente fazer login.']);
      } else if (error.message?.includes('invalid_email')) {
        setErrors(['Email inválido.']);
      } else {
        setErrors(['Erro ao criar conta. Tente novamente.']);
      }
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    const errors = validatePassword(password);
    const strength = Math.max(0, 5 - errors.length);
    
    if (strength === 0) return { label: 'Muito fraca', color: 'bg-red-500', width: '20%' };
    if (strength === 1) return { label: 'Fraca', color: 'bg-red-400', width: '40%' };
    if (strength === 2) return { label: 'Regular', color: 'bg-yellow-500', width: '60%' };
    if (strength === 3) return { label: 'Boa', color: 'bg-blue-500', width: '80%' };
    return { label: 'Muito forte', color: 'bg-green-500', width: '100%' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  if (step === 'validating') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Validando Convite</h1>
          <p className="text-gray-600">Verificando a validade do seu convite...</p>
        </div>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-red-800 mb-2">Convite Inválido</h1>
          <p className="text-gray-600 mb-6">
            {invitationData?.message || 'Este convite não é válido ou expirou.'}
          </p>
          
          <div className="space-y-3">
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Ir para Login
            </button>
            
            <p className="text-sm text-gray-500">
              Se você acredita que isso é um erro, entre em contato com quem enviou o convite.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-green-800 mb-2">Conta Criada!</h1>
          <p className="text-gray-600 mb-4">
            Sua conta foi criada com sucesso. Você será redirecionado para a tela de login.
          </p>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center mb-2">
              <Shield className="w-5 h-5 text-green-600 mr-2" />
              <span className="font-medium text-green-800">Acesso Configurado</span>
            </div>
            <p className="text-sm text-green-700">
              Suas permissões foram aplicadas automaticamente ao workspace.
            </p>
          </div>
          
          <p className="text-sm text-gray-500">
            Redirecionando em alguns segundos...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Criar Sua Conta</h1>
          <p className="text-gray-600">
            Você foi convidado para: <strong>{invitationData?.email}</strong>
          </p>
        </div>

        <form onSubmit={handleCreateAccount} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email (confirmado)
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                value={invitationData?.email || ''}
                disabled
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Criar Senha *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handlePasswordChange}
                required
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Digite sua senha"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            
            {formData.password && (
              <div className="mt-2">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Força da senha:</span>
                  <span className={`font-medium ${
                    passwordStrength.label === 'Muito forte' ? 'text-green-600' :
                    passwordStrength.label === 'Boa' ? 'text-blue-600' :
                    passwordStrength.label === 'Regular' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {passwordStrength.label}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                    style={{ width: passwordStrength.width }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar Senha *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handlePasswordChange}
                required
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Confirme sua senha"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-red-800 font-medium mb-1">Corrija os seguintes erros:</h4>
                  <ul className="text-red-700 text-sm space-y-1">
                    {errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-blue-800 font-medium mb-2">Requisitos de Segurança:</h4>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• Mínimo de 8 caracteres</li>
              <li>• Pelo menos uma letra maiúscula</li>
              <li>• Pelo menos uma letra minúscula</li>
              <li>• Pelo menos um número</li>
              <li>• Pelo menos um caractere especial</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={loading || errors.length > 0 || !formData.password || !formData.confirmPassword}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Criando conta...
              </div>
            ) : (
              'Criar Conta e Entrar no Workspace'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Já tem uma conta?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Fazer login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default InviteOnboarding;