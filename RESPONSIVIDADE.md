# 📱 Guia de Responsividade - PGS Hapvida

Este documento descreve a estrutura responsiva implementada no sistema PGS (Programa Gestação Segura).

## 📐 Breakpoints

O sistema usa os seguintes breakpoints do Tailwind CSS:

| Breakpoint | Largura | Dispositivo |
|------------|---------|-------------|
| `xs` | 475px | Smartphones pequenos |
| `sm` | 640px | Smartphones grandes |
| `md` | 768px | Tablets portrait |
| `lg` | 1024px | Tablets landscape / Desktop pequeno |
| `xl` | 1280px | Desktop médio |
| `2xl` | 1536px | Desktop grande |

## 🎨 Layout Responsivo

### Mobile (< 1024px)
- **Menu Lateral**: Drawer deslizante com overlay
- **Header**: Compacto com altura reduzida (56px)
- **Botões**: Touch-friendly (mínimo 44x44px)
- **Padding**: Reduzido (12px → 24px)
- **Tipografia**: Escalas menores
- **Footer**: Layout vertical empilhado

### Tablet (768px - 1024px)
- **Menu Lateral**: Drawer deslizante
- **Header**: Altura média (64px)
- **Grid**: 2 colunas quando apropriado
- **Footer**: Layout híbrido (2 colunas)

### Desktop (> 1024px)
- **Menu Lateral**: Sidebar fixo com toggle
- **Header**: Altura completa (64px)
- **Grid**: 3-4 colunas
- **Footer**: Layout horizontal completo

## 🔧 Componentes Responsivos

### AppLayout
- **Desktop**: Sidebar permanente colapsável (64px colapsado / 256px expandido)
- **Mobile/Tablet**: Sheet drawer com overlay escuro
- **Header**: Ajustes de altura e espaçamento por breakpoint
- **Footer**: Grid adaptativo com colunas responsivas

### Cards e Grids
Utilize as classes utilitárias:
```tsx
// Grid responsivo automático
<div className="grid-responsive">

// Card com padding adaptativo
<div className="card-responsive">

// Container com padding responsivo
<div className="container-responsive">
```

### Tipografia
```tsx
// Texto com tamanho responsivo
<p className="text-responsive">

// Heading com escala responsiva
<h1 className="heading-responsive">
```

## 🎯 Touch Targets

Todos os elementos interativos seguem o padrão de **mínimo 44x44px** para facilitar toque em dispositivos móveis:

```tsx
// Classe utilitária para alvos de toque
<button className="tap-target">
```

## 📊 Classes Utilitárias Customizadas

### `.container-responsive`
Container com padding adaptativo:
- Mobile: `px-3` (12px)
- Tablet: `px-4` (16px)
- Desktop: `px-6` (24px)
- Desktop grande: `px-8` (32px)

### `.grid-responsive`
Grid automático:
- Mobile: 1 coluna
- Tablet: 2 colunas
- Desktop: 3 colunas
- Desktop grande: 4 colunas

### `.card-responsive`
Padding adaptativo para cards:
- Mobile: `p-3` (12px)
- Tablet: `p-4` (16px)
- Desktop: `p-6` (24px)

## 🚀 Testando Responsividade

### No Navegador
1. Abra DevTools (F12)
2. Ative o modo de dispositivo (Ctrl+Shift+M)
3. Teste os seguintes dispositivos:
   - iPhone SE (375px)
   - iPhone 12 Pro (390px)
   - iPad (768px)
   - iPad Pro (1024px)
   - Desktop (1280px+)

### No Lovable
Clique no ícone de dispositivo acima da preview para alternar entre:
- 📱 Mobile
- 💻 Tablet
- 🖥️ Desktop

## ⚡ Performance

### Otimizações Implementadas
- **Lazy Loading**: Componentes carregam sob demanda
- **CSS Purging**: Tailwind remove classes não utilizadas
- **Reduced Motion**: Respeita preferência de animações reduzidas
- **Touch Optimization**: Eventos otimizados para toque

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## 🎨 Design System

Todas as cores, espaçamentos e tipografia estão definidos no design system:
- **Arquivo**: `src/index.css`
- **Configuração**: `tailwind.config.ts`
- **Tokens**: Variáveis CSS com escala consistente

### Espaçamento Responsivo
```tsx
// Aumenta gradualmente conforme o viewport
gap-2 sm:gap-3 md:gap-4 lg:gap-6

// Padding responsivo
p-3 sm:p-4 md:p-6 lg:p-8
```

## 📝 Boas Práticas

### ✅ Faça
- Use classes utilitárias responsivas do Tailwind
- Teste em múltiplos dispositivos reais
- Mantenha touch targets >= 44px
- Use unidades relativas (rem, %)
- Priorize mobile-first

### ❌ Evite
- Valores fixos em pixels para larguras
- Overlays sem scroll em mobile
- Textos muito pequenos (< 14px)
- Touch targets pequenos (< 44px)
- Layouts que quebram em diferentes resoluções

## 🔍 Debugging

Se algo não estiver responsivo:

1. **Verifique os breakpoints**:
   ```tsx
   // Correto
   <div className="text-sm md:text-base lg:text-lg">
   
   // Incorreto (sem mobile-first)
   <div className="text-lg md:text-base">
   ```

2. **Inspecione no DevTools**:
   - Ative "Toggle device toolbar"
   - Verifique CSS aplicado em cada breakpoint
   - Use "Responsive" para testar larguras customizadas

3. **Valide classes Tailwind**:
   - Todas as classes devem estar no `tailwind.config.ts`
   - Cores devem usar tokens HSL do design system

## 📚 Referências

- [Tailwind CSS Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [Web Content Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Touch Target Size Guidelines](https://web.dev/accessible-tap-targets/)
- [Mobile First Design](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Responsive/Mobile_first)

---

**Última atualização**: 2025-01-18
**Versão**: 1.0.0
