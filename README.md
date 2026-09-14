# Revellar

Declarações em polaroid. Monte um álbum instantâneo, escreva cartas em cada foto e compartilhe um link que abre como um envelope — com trilha, contador ao vivo e revelação ao estilo câmera instantânea.

## Stack

- **Next.js 16** (App Router)
- **Auth.js / NextAuth 5** (login por e-mail e senha)
- **Neon PostgreSQL** + Drizzle ORM
- **Tailwind CSS 4** + shadcn/ui
- **Framer Motion**

## Como abrir na IDE (seu computador)

Este projeto foi criado no Cloud Agent, então a pasta ainda não existe na sua máquina. Dois caminhos:

**1. Recomendado — criar o repositório e clonar**

1. Neste agente, clique em **Create repo** para publicar o código no seu GitHub/Origin.
2. No terminal do seu computador:

```bash
mkdir -p ~/Projetos
cd ~/Projetos
git clone <URL-DO-REPOSITORIO> revelar
cd revelar
```

3. No Cursor ou VS Code: **File → Open Folder** e escolha `~/Projetos/revelar`.

**2. Pacote ZIP**

Baixe `revelar.zip` (gerado neste ambiente), extraia para `~/Projetos/revelar` e abra essa pasta na IDE.

## Como rodar

1. Instale as dependências: `npm install`
2. Copie `.env.example` para `.env.local` e preencha:
   - `DATABASE_URL` — string do [Neon](https://neon.tech)
   - `AUTH_SECRET` — `openssl rand -base64 32`
3. Publique o schema: `npm run db:push`
4. Inicie o app: `npm run dev`

O servidor sobe em [http://127.0.0.1:3000](http://127.0.0.1:3000).

Na primeira visita, o app pode criar o álbum de exemplo **Gabriel & Amanda**.

O `DATABASE_URL` fica só em `.env.local` (não vai para o git). Depois de trocar a string do Neon, rode `npm run db:push` de novo.

## O que está pronto

- Landing com câmera instantânea e polaroids de exemplo
- Cadastro, login e sessão via Auth.js
- Wizard em 4 etapas: dados do casal, estúdio (até 12 fotos), revelação/tema, publicação
- Link único `/nos/[slug]`, QR com coração, copiar e WhatsApp
- Página do casal com envelope, corações, player com fade-in, contador vivo e 3 modos (mesa, álbum, slideshow)
- Senha opcional no envelope, respostas de volta e métricas de visualização
- Download das polaroids montadas em PNG

Fotos e MP3 ficam em `public/uploads` no computador. Na Vercel, o app guarda o arquivo no banco (ou no Blob, se você conectar um store) e serve por `/api/media`.

## Identidade

Creme `#FFFDF9`, rosa `#FDE8E8`, grafite `#2B2D42`. Títulos manuscritos em **Caveat** e interface em **Plus Jakarta Sans**.
