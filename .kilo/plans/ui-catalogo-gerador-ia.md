# Catálogo de Componentes UI — Minha Cidade

Todos em `apps/web/src/shared/ui/`. Destinados a geradores de front-end com IA.

---

## Button

Variantes: `primary` | `secondary` | `danger`. Tamanhos: `sm` | `md`.

```tsx
<Button variant="primary" type="submit">Publicar</Button>
<Button variant="secondary" type="button">Limpar filtros</Button>
<Button variant="danger" type="submit">Remover</Button>
```

Regras: raio 8px, alvo de toque ≥ 44px, foco visível com anel 2px brand-600.

---

## TextField / Textarea

Campos de formulário com `<label>` associado e erro via `aria-describedby`.

```tsx
<TextField label="Nome" name="fullName" required defaultValue="" />
<Textarea id="bio" label="Bio" maxLength={2000} name="bio" rows={4} defaultValue="" />
```

---

## Select (cidade/bairro em cascata)

```tsx
<Select label="Cidade" name="cidade" onChange={handler} value={cityId ?? ""}>
  <option value="">Escolher cidade</option>
  <option value="3201308">Cariacica — ES</option>
</Select>
```

---

## Avatar

Fallback gerado do nome, círculo.

```tsx
<Avatar imageUrl={url} name="João Silva" size={36} />
```

---

## Card

Raio 8px, sombra `--shadow-stamp` (duro, carimbo), fundo `surface-raised`.

```tsx
<Card title="Título" description="Subtítulo">conteúdo</Card>
```

---

## EmptyState

Ícone + título + descrição + ação opcional.

```tsx
<EmptyState title="Nenhuma publicação ainda." description="..." icon={<Icon />} action={<Link href="/">...</Link>} />
```

---

## Badge

Tipo de publicação: `problem` | `idea` | `institutional` | `moderation`.

```tsx
<Badge tone="problem">Problema</Badge>
<Badge tone="idea">Ideia</Badge>
```

---

## ReactionBar (apoio/oposição com contador)

```tsx
<ReactionBar
  publicationId="uuid"
  counts={{ support: 12, oppose: 3 }}
  myReaction="support" | "oppose" | null
  canInteract={boolean}
/>
```

---

## CommentList / CommentForm

Comentários com anonimato opcional, edição até 15 min, soft-delete.

```tsx
<CommentForm publicationId="uuid" canInteract={boolean} />
<CommentList items={[]} publicationId="uuid" total={0} />
```

---

## FriendshipButton

Estados: pendente / aceito / removido.

```tsx
<FriendButton canInteract={boolean} relationship={rel} username="fulano" />
```

---

## ReportButton

Motivo fechado, confirmação via `ConfirmDialog`.

```tsx
<ReportButton targetId="uuid" targetType="publication" allowed={boolean} />
```

---

## SaveButton

Salvar/desmarcar publicação (privado).

```tsx
<SaveButton publicationId="uuid" canInteract={boolean} saved={boolean} />
```

---

## ConfirmDialog

Confirmação de ações destrutivas.

```tsx
<ConfirmDialog action={formAction} confirmLabel="Remover" description="..." open={boolean} title="Confirmar?">
  <TextField label="Confirme sua senha" name="password" type="password" required />
</ConfirmDialog>
```

---

## Skeleton

Estado de carregamento.

```tsx
<Skeleton className="h-20 w-20 rounded-full" />
```

---

## Ícones (SVG inline, `shared/ui/icon.tsx`)

`InboxIcon`, `ChatIcon`, `BellIcon`, `UsersIcon`, `SearchIcon`, `FlagIcon`, `ChartIcon`, `CheckIcon`, `Share2Icon`.

---

## Regras Gerais

- Todo campo tem `<label>` associado
- Erro anunciado com `role="alert"` e `aria-describedby`
- Sem `Toast` flutuante; retorno inline
- Sem emoji como ícone
- Navegação completa por teclado
- Alvo de toque mínimo 44×44px
