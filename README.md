# Spade365

## Prerequisites:
- Make sure you have [Postgres](https://www.enterprisedb.com/downloads/postgres-postgresql-downloads) installed and running, read API's README for more info.
- copy .env.sample to .env and update the values in all 3 folders (api, admin, frontend)

## Run Dev Server
To start dev server, run `npm install` then run `npm run dev` from root directory. This will start dev server for all 3 folders.

## Run Prod Server
- Postgres(database) setup required as mentioned in API's README
- Update .env file in all 3 folders (api, admin, frontend)
- Run `npm run build` from root directory to build all 3 folders.

## Host Live Domain using PM2 + Nginx (recommended)
- Install [pm2](https://pm2.keymetrics.io/docs/usage/quick-start/) globally `npm install pm2@latest -g`
- Run `pm2 startup` to generate startup script for pm2
- Run `pm2 start ecosystem.config.js --update-env` from root directory to start prod server
- Run `pm2 save` to save the current process list
- Make sure you have nginx installed and running. If not, run `sudo apt install nginx`
- Copy all files inside ./nginx/ to `/etc/nginx/conf.d/`. Make changes to `server_name` in all nginx/*.conf files as per your domain name.
- Run `sudo nginx -t` to check if nginx config is valid
- Run `sudo systemctl restart nginx` to restart nginx
- For SSL, install [certbot](https://certbot.eff.org/instructions?ws=nginx&os=debianbuster). type `cerbot -d yourdomain.com -d www.yourdomain.com` to generate ssl certificates. certbot will automatically update nginx config to use ssl certificates and redirect http to https.

# Post Installation
- Create admin: Signup on frontend. First user signup will be admin by default with username `admin` and password set during signup.
- Go to admin panel > games. Click on `Reset Games` button to add all default games.

## Restore postgres database
- Daily backups are stored in /var/www/db_backups
- type `sudo -u postgres psql` to login to postgres
- kill active sessions and drop database `DROP DATABASE spade WITH (FORCE);`
- then create new database `CREATE DATABASE spade WITH OWNER = spade_user ENCODING = 'UTF8' TABLESPACE = pg_default CONNECTION LIMIT = -1 IS_TEMPLATE = False;`
- press `ctrl + d` to exit postgres
- `cd /var/www/db_backups`
- To restore database, run `pg_restore -U spade_user -d spade -1 $backup_file_name` from /var/www/db_backups directory