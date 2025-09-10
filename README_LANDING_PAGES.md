# Econnect - Landing Pages

Este repositório contém duas versões da landing page do Econnect com diferentes temas visuais.

## 📁 Estrutura do Projeto

```
econnect-web/
├── src/                    # Versão Original (Verde/Claro)
├── landing-dark/          # Versão Dark (Verde Escuro/Suave)
└── assets/                # Recursos compartilhados
```

## 🎨 Versões Disponíveis

### 1. Versão Original (`/src/`)
- **Tema**: Verde claro/Natureza
- **Estilo**: Bootstrap padrão com customizações
- **Características**:
  - Cores verdes vibrantes inspiradas na natureza
  - Fundo claro (#fefae0)
  - Layout tradicional com seções bem definidas
  - FAQ com accordion do Bootstrap
  - Design familiar e acessível
  - Ideal para uso diurno

### 2. Versão Dark (`/landing-dark/`)
- **Tema**: Verde escuro/Suave
- **Estilo**: Mesma estrutura da original, mas adaptada para dark mode
- **Características**:
  - Paleta de cores escuras e suaves
  - Fundo escuro (#121212) que agride menos os olhos
  - Tons de verde mais suaves e menos saturados
  - Filtros aplicados nas imagens para reduzir brilho
  - Ideal para uso noturno ou ambientes com pouca luz
  - Mantém a mesma funcionalidade da versão original

## 🛠 Tecnologias Utilizadas

- **HTML5** - Estrutura semântica
- **CSS3** - Estilos customizados com foco em acessibilidade visual
- **Bootstrap 5.3.8** - Framework CSS base
- **Google Fonts** - Tipografia Montserrat

## 🚀 Como Visualizar

### Método 1: Servidor Local
```bash
# Navegue até a pasta da versão desejada
cd src          # para versão original
cd landing-dark # para versão dark

# Inicie um servidor local simples
python -m http.server 8000
# ou
npx serve .

# Acesse http://localhost:8000
```

### Método 2: Abrir Direto no Navegador
- Abra o arquivo `index.html` de cada pasta diretamente no navegador
- **Nota**: Algumas funcionalidades podem não funcionar devido às políticas CORS

## 📱 Responsividade

Ambas as versões são totalmente responsivas e otimizadas para:
- 📱 Mobile (320px+)
- 📱 Tablet (768px+)
- 💻 Desktop (1024px+)
- 🖥️ Wide Screen (1200px+)

## 🎯 Principais Diferenças

| Aspecto | Original | Dark |
|---------|----------|------|
| **Fundo** | Claro (#fefae0) | Escuro (#121212) |
| **Cores Primárias** | Verde vibrante (#198754) | Verde suave (#2d4a3e) |
| **Texto** | Escuro sobre claro | Claro sobre escuro |
| **Imagens** | Brilho normal | Filtros suaves aplicados |
| **Contraste** | Alto (para claridade) | Moderado (suave aos olhos) |
| **Uso Ideal** | Dia/Ambientes claros | Noite/Ambientes escuros |

## 🎨 Paletas de Cores

### Versão Original
```css
--success: #198754
--background: #fefae0
--text: #212529
```

### Versão Dark
```css
--primary-soft: #2d4a3e
--bg-dark: #121212
--text-light: #e8e8e8
--primary-dark: #1a1a1a
```

## ✨ Funcionalidades Especiais

### Versão Original
- Layout tradicional e familiar
- Cores vibrantes e naturais
- Alto contraste para boa legibilidade
- Ideal para apresentações e uso diurno

### Versão Dark
- **Anti-fadiga visual**: cores suaves que reduzem o cansaço ocular
- **Filtros nas imagens**: reduz brilho excessivo
- **Scrollbar personalizada**: integrada ao tema escuro
- **Font smoothing**: texto mais suave em telas
- **Gradientes sutis**: transições visuais agradáveis
- **Ideal para**: uso noturno, ambientes com pouca luz, pessoas sensíveis à luz

## 🔧 Customização

Cada versão possui seu próprio arquivo CSS com variáveis CSS customizáveis:

### Versão Original
```css
:root {
    --bs-success: #198754;
    --bs-body-bg: #fefae0;
    /* ... outras variáveis */
}
```

### Versão Dark
```css
:root {
    --primary-soft: #2d4a3e;
    --bg-dark: #121212;
    --text-light: #e8e8e8;
    /* ... outras variáveis */
}
```

## 👁️ Benefícios da Versão Dark

- **Redução da fadiga ocular** em ambientes com pouca luz
- **Economia de bateria** em dispositivos com telas OLED
- **Melhor experiência noturna** para leitura prolongada
- **Acessibilidade** para pessoas sensíveis à luz
- **Modernidade** visual seguindo tendências atuais de design

## 📝 Próximos Passos

- [ ] Adicionar toggle para alternar entre temas
- [ ] Implementar detecção automática de preferência do sistema
- [ ] Adicionar mais opções de personalização
- [ ] Otimizar performance
- [ ] Testes de acessibilidade

## 🤝 Contribuição

Para contribuir com melhorias:
1. Escolha a versão que deseja modificar
2. Faça suas alterações no CSS/HTML correspondente
3. Teste em diferentes dispositivos
4. Documente as mudanças

---

*Desenvolvido com 💜 para um futuro mais sustentável*
