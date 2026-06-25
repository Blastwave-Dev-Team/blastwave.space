# Wiki.js first-run setup (after `infra/scripts/deploy.sh`)

1. Open `https://wiki.blastwave.space` and complete the setup wizard.
2. Set site URL to `https://wiki.blastwave.space`.
3. Enable public read access:
   - Administration → Groups → Guests → Permissions → Pages → Read = true
4. Create an API key:
   - Administration → API → Create new key
   - Copy the key into `infra/.env` as `WIKIJS_API_KEY`
   - Restart book-proxy: `docker compose -f infra/docker-compose.yml up -d book-proxy`
5. Optional Discord OAuth:
   - Administration → Authentication → Discord
6. Import baseline pages:
   ```bash
   cd scripts/import-mediawiki
   npm install
   WIKIJS_GRAPHQL_URL=https://wiki.blastwave.space/graphql WIKIJS_API_KEY=... npm run import
   ```
