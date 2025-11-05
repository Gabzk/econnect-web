# Sistema de Autenticação - Econnect

## 📋 Visão Geral

Implementação completa de autenticação com tokens (access_token e refresh_token) incluindo:
- Verificação automática de autenticação
- Renovação automática de tokens
- Proteção de rotas
- Interface adaptativa baseada no estado de autenticação

## 🔐 Duração dos Tokens

- **Access Token**: 3600 segundos (1 hora)
- **Refresh Token**: 30 dias (2.592.000 segundos)

## 📁 Arquivos Criados/Modificados

### API Routes
1. **`/api/auth/refresh`** - Renova o access_token usando refresh_token
2. **`/api/auth/logout`** - Remove cookies e faz logout
3. **`/api/auth/status`** - Verifica status de autenticação
4. **`/api/auth/login`** - Atualizado com maxAge nos cookies

### Hooks
1. **`useAuth.ts`** - Hook para gerenciar autenticação no client-side
   - `isAuthenticated`: Verifica se tem access_token válido
   - `hasRefreshToken`: Verifica se tem refresh_token
   - `checkAuth()`: Verifica status de autenticação
   - `refreshToken()`: Renova o access_token
   - `logout()`: Faz logout do sistema

### Componentes
1. **`navBarComponentClient.tsx`** - Navbar com autenticação
   - Mostra botões de "Entrar/Cadastrar" quando não autenticado
   - Mostra avatar e botão "Sair" quando autenticado
   
2. **`protectedRoute.tsx`** - Wrapper para rotas protegidas
   - Redireciona para /login se não autenticado
   - Mostra loading enquanto verifica autenticação
   
3. **`homeComponent.tsx`** - Atualizado
   - Mostra banner para login quando não autenticado
   - Conteúdo completo para usuários autenticados
   
4. **`loginComponent.tsx`** - Atualizado
   - Verifica autenticação ao carregar
   - Redireciona para /feed se já autenticado
   - Tenta renovar token se tiver refresh_token

### Middleware
1. **`middleware.ts`** - Proteção de rotas no servidor
   - Redireciona de /login ou /register para /feed se autenticado
   - Redireciona de /feed para /login se não autenticado

## 🚀 Fluxo de Autenticação

### 1. Login Bem-Sucedido
```
Usuário faz login
  ↓
Backend retorna access_token e refresh_token
  ↓
Tokens salvos em cookies httpOnly
  ↓
Redirecionado para /feed
```

### 2. Verificação Automática (ao carregar página)
```
Página carrega
  ↓
useAuth hook verifica /api/auth/status
  ↓
Tem access_token? → Autenticado ✅
  ↓
Não tem access_token, mas tem refresh_token?
  ↓
Chama /api/auth/refresh
  ↓
Sucesso? → Novo access_token salvo → Autenticado ✅
  ↓
Falhou? → Não autenticado ❌ → Redireciona para login
```

### 3. Renovação de Token
```
Access token expira (após 1 hora)
  ↓
useAuth detecta (isAuthenticated = false, hasRefreshToken = true)
  ↓
Automaticamente chama refreshToken()
  ↓
POST /api/auth/refresh com refresh_token
  ↓
Backend valida e retorna novo access_token
  ↓
Cookie atualizado com novo token
  ↓
Usuário continua autenticado sem interrupção
```

### 4. Logout
```
Usuário clica em "Sair"
  ↓
useAuth.logout() é chamado
  ↓
POST /api/auth/logout
  ↓
Cookies deletados
  ↓
Estado atualizado (isAuthenticated = false)
  ↓
Redirecionado para home (/)
```

## 🛡️ Proteção de Rotas

### Server-Side (Middleware)
- `/login` e `/register`: Redireciona para /feed se autenticado
- `/feed`: Redireciona para /login se não autenticado

### Client-Side (ProtectedRoute)
```tsx
import ProtectedRoute from "@/components/protectedRoute";

export default function FeedPage() {
  return (
    <ProtectedRoute>
      <div>Conteúdo protegido</div>
    </ProtectedRoute>
  );
}
```

## 📱 Comportamento da UI

### Navbar
- **Não Autenticado**: Mostra "Entrar" e "Cadastrar"
- **Autenticado**: Mostra avatar do usuário e botão "Sair"

### Home
- **Não Autenticado**: Banner convidando para login/cadastro
- **Autenticado**: Acesso completo às notícias

### Login/Register
- **Já Autenticado**: Redireciona automaticamente para /feed
- **Com Refresh Token**: Tenta renovar antes de mostrar formulário

## 🔄 Renovação Automática

O sistema tenta automaticamente renovar o token nas seguintes situações:

1. **Ao carregar qualquer página** (via useAuth)
2. **Ao acessar /login ou /register** com refresh_token válido
3. **Quando detecta que access_token expirou** mas refresh_token ainda é válido

## 🎯 Como Usar

### Em Componentes Client
```tsx
import { useAuth } from "@/hooks/useAuth";

export default function MyComponent() {
  const { isAuthenticated, isLoading, logout } = useAuth();

  if (isLoading) return <div>Carregando...</div>;

  return (
    <div>
      {isAuthenticated ? (
        <button onClick={logout}>Sair</button>
      ) : (
        <Link href="/login">Entrar</Link>
      )}
    </div>
  );
}
```

### Proteger Rotas
```tsx
import ProtectedRoute from "@/components/protectedRoute";

export default function ProtectedPage() {
  return (
    <ProtectedRoute>
      <YourProtectedContent />
    </ProtectedRoute>
  );
}
```

## 🔧 Configuração Backend Necessária

O backend deve ter os seguintes endpoints:

1. **POST /auth/login**
   - Retorna: `{ access_token, refresh_token }`

2. **POST /auth/refresh**
   - Body: `{ refresh_token }`
   - Retorna: `{ access_token }`

3. **GET /user** (com Authorization header)
   - Retorna dados do usuário autenticado

## ✅ Checklist de Segurança

- ✅ Tokens armazenados em cookies httpOnly
- ✅ SameSite=strict para prevenir CSRF
- ✅ Secure=true em produção (HTTPS)
- ✅ Expiração definida nos cookies
- ✅ Renovação automática de tokens
- ✅ Limpeza de tokens no logout
- ✅ Validação no servidor (middleware)
- ✅ Proteção de rotas no client e server

## 🐛 Troubleshooting

### Token não está sendo renovado
- Verifique se o backend retorna o novo access_token corretamente
- Confirme que o refresh_token ainda é válido (não expirou 30 dias)
- Verifique os logs do console para erros

### Redirecionamento infinito
- Verifique se o middleware está configurado corretamente
- Confirme que as rotas no matcher do middleware estão corretas

### Cookies não estão sendo salvos
- Em desenvolvimento, use HTTP (não HTTPS) e secure=false
- Em produção, certifique-se de ter HTTPS configurado
