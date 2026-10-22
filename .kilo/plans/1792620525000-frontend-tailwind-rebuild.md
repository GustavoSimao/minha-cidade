# Push do Minha Cidade para o GitHub (GustavoSimao/minha-cidade)

## Objetivo
Enviar o repositório local (branch `main`) para `https://github.com/GustavoSimao/minha-cidade.git`.
Como o usuário e o nome do repositório são iguais, a URL continua a mesma — o link do currículo não quebra.

## Pré-condição
- Repositório GitHub já recriado e vazio (sem commits).
- Branch local: `main`.
- Há mudanças não commitadas no working tree (arquivos modificados + não rastreados).
- `.env.local`, `.next`, `test-results` estão gitignored (não sobem).

## Passos (executar no terminal, pasta raiz do repo)

1. Conferir o remote atual (somente leitura):
   ```
   git remote -v
   ```
   - Se não houver `origin`:
     ```
     git remote add origin https://github.com/GustavoSimao/minha-cidade.git
     ```
   - Se já houver `origin` com URL errada:
     ```
     git remote set-url origin https://github.com/GustavoSimao/minha-cidade.git
     ```

2. Garantir a branch `main`:
   ```
   git branch -M main
   ```

3. Commitar as mudanças locais (obrigatório antes de poder fazer push):
   ```
   git add -A
   git commit -m "feat: backend local finalizado, specs e front prontos"
   ```

4. Enviar para o GitHub:
   ```
   git push -u origin main
   ```
   Se for rejeitado por "histórico não relacionado" (remoto vazio vs local com commits), o remoto foi recriado vazio e não tem conteúdo valioso, então forçar é seguro:
   ```
   git push -u origin main --force
   ```

5. Confirmar o envio:
   ```
   git log --oneline -3
   ```
   Depois acessar `https://github.com/GustavoSimao/minha-cidade` e verificar se os arquivos aparecem.

## Cuidados
- Não commitar/pushar segredos (`.env.local`, `.env.*`, `.pem`, `.key`) — já estão gitignored.
- O push sobe TODO o histórico local (commits + mudanças pendentes). Para subir só parte, ajustar o `git add` antes do commit.
- Após o push, o link `https://github.com/GustavoSimao/minha-cidade` é o mesmo de antes.
