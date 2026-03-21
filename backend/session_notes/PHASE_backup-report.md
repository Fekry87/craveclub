# PHASE: Automated Daily Database Backup — Report

**Date:** 2026-03-22
**Status:** COMPLETE

## Summary

Implemented automated daily MySQL database backups with Backblaze B2 storage, 30-day retention, and Sentry failure alerting.

## Files Changed

| File | Change |
|------|--------|
| `app/Console/Commands/BackupDatabase.php` | **NEW** — backup command (mysqldump → gzip → B2 upload → prune → alert) |
| `config/filesystems.php` | Added `b2` disk (S3-compatible, falls back to AWS_* env vars) |
| `routes/console.php` | Added `backup:database` to scheduler — daily at 02:00 UTC |
| `Dockerfile` | Added `mysql-client` to Alpine apk install |
| `.env.example` | Added B2_* env vars (B2_ACCESS_KEY_ID, B2_SECRET_ACCESS_KEY, B2_REGION, B2_BUCKET, B2_ENDPOINT) |
| `CLAUDE.md` | Documented backup system in Architecture, Common Commands, Key Files, Gotchas |

## Implementation Details

### BackupDatabase Command (`php artisan backup:database`)

1. **Dump**: `mysqldump --single-transaction --quick --lock-tables=false` piped to `gzip`
2. **Upload**: Streams compressed file to B2 at `backups/daily/craveclubs_YYYY-MM-DD_HH-ii-ss.sql.gz`
3. **Prune**: Deletes backups older than 30 days (non-critical — logged warning on failure)
4. **Alert**: Logs `BACKUP_FAILED` to daily channel + captures Sentry error on any failure
5. **Dry run**: `--dry-run` flag prints command (with redacted password) without executing

### Schedule

- Runs daily at **02:00 UTC** (05:00 Riyadh time)
- `withoutOverlapping()` prevents concurrent runs
- `runInBackground()` doesn't block other scheduled commands

### B2 Disk Configuration

- S3-compatible driver with `use_path_style_endpoint: true`
- Dedicated `B2_*` env vars with fallback to `AWS_*` — allows separate B2 credentials without affecting existing S3 config
- `throw: true` — upload failures propagate to command error handling

### Dockerfile

- Added `mysql-client` to Alpine `apk add` — provides `mysqldump` binary in production container

## Verification

- [x] Command registered: `php artisan list | grep backup` shows `backup:database`
- [x] Dry run works: `--dry-run` outputs redacted command and upload path
- [x] Credentials validation: exits 1 with error if DB_* vars are missing
- [x] Scheduler registered: `routes/console.php` includes daily 02:00 UTC schedule

## Restore Procedure

```bash
# 1. Download from B2 dashboard or CLI
# 2. Decompress
gunzip craveclubs_2026-03-22_02-00-00.sql.gz
# 3. Restore
mysql -h $DB_HOST -u $DB_USER -p $DB_NAME < craveclubs_2026-03-22_02-00-00.sql
```

## Production Deployment Checklist

- [ ] Set B2 env vars on Railway: `B2_ACCESS_KEY_ID`, `B2_SECRET_ACCESS_KEY`, `B2_REGION`, `B2_BUCKET`, `B2_ENDPOINT`
- [ ] Deploy (Dockerfile rebuild adds `mysql-client`)
- [ ] Verify with: `railway run --service web -- php artisan backup:database --dry-run`
- [ ] Run first real backup: `railway run --service web -- php artisan backup:database`
- [ ] Confirm file in B2: `railway run --service web -- php artisan tinker --execute="dd(Storage::disk('b2')->files('backups/daily/'));"`
