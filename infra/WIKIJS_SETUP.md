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
6. Configure Player UGC permissions:

   ```bash
   cd scripts/import-mediawiki
   npm install
   WIKIJS_GRAPHQL_URL=https://wiki.blastwave.space/graphql WIKIJS_API_KEY=... npm run wiki:setup-player
   ```

   Creates the **Player** group with read access site-wide and write access only under `ugc/*`.
   Assign authenticated users to the Player group in Administration → Groups → Player.
7. Deploy wiki theme and login styling:

   ```bash
   cd scripts/import-mediawiki
   WIKIJS_GRAPHQL_URL=https://wiki.blastwave.space/graphql WIKIJS_API_KEY=... npm run wiki:deploy-theme
   ```

   Login page CSS lives in `wiki-theme/login.css`. Nginx serves it at `/_theme/login.css` on the wiki host and injects it on `/login` (Wiki.js skips `injectCSS` there). Tags (`/t/…`), admin (`/a/…`), and profile (`/p/…`) also skip `injectCSS`; nginx injects `/_theme/inject.css` on those routes. After changes:

   ```bash
   sudo infra/scripts/publish-site.sh
   sudo install -m 644 infra/nginx/blastwave.conf /etc/nginx/sites-available/blastwave && sudo nginx -t && sudo systemctl reload nginx
   ```

   If you use certbot-managed TLS blocks, merge the `/_theme/login.css`, `/_theme/inject.css`, auth, and `/t|/a|/p` `sub_filter` locations into the `wiki.blastwave.space` HTTPS server as well.
8. Import baseline pages:

   ```bash
   cd scripts/import-mediawiki
   npm install
   WIKIJS_GRAPHQL_URL=https://wiki.blastwave.space/graphql WIKIJS_API_KEY=... npm run wiki:import
   ```
