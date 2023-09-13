# This script is used to backup postgresql database to a file
# 1. Keep the backup file for 30 days
# 2. Intended to be run from cron
# 3. Read DB credentials from .env file next to the script
# 4. Restore the backup with the following command in psql
# PGPASSWORD=$DB_SECRET pg_restore -Fc --no-owner -h localhost -p 5432 -U $DB_USERNAME -d $DB_NAME < $BACKUP_FILE_NAME

# cd to the script directory
cd "$(dirname "$0")"

# read DB_USERNAME, DB_NAME, DB_SECRET from .env file in utils directory
DB_USERNAME=$(grep DB_USERNAME .env | cut -d '=' -f2)
DB_NAME=$(grep DB_NAME .env | cut -d '=' -f2)
DB_SECRET=$(grep DB_SECRET .env | cut -d '=' -f2)

# Set the date and time for the backup filename
NOW=$(date +"%Y-%m-%d_%H-%M")

# Set the filename for the backup
FILENAME="$DB_NAME-$NOW"

# Set the directory where the backup will be stored
BACKUP_DIR="/var/www/db_backups"

# Set the number of days to keep the backup files
DAYS_TO_KEEP=30

# Create the backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Dump the database into the backup file 
PGPASSWORD=$DB_SECRET pg_dump -Fc --no-owner -h localhost -p 5432 -U $DB_USERNAME -d $DB_NAME > $BACKUP_DIR/$FILENAME

# if files in backup_dir are more than 30, then delete files older than DAYS_TO_KEEP.
if [ $(find $BACKUP_DIR -type f | wc -l) -gt $DAYS_TO_KEEP ]; then # This check is to keep backups in case of server failure for 30 days
    find $BACKUP_DIR -type f -mtime +$DAYS_TO_KEEP -exec rm {} \;
fi