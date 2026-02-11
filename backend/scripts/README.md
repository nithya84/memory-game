# S3 Orphan Management Scripts

Scripts to identify and clean up orphaned S3 objects that are no longer referenced in DynamoDB.

## Scripts Overview

### 1. Find Orphans
**Script:** `find-orphan-images.ts`
**Command:** `npm run orphan:find`

Scans DynamoDB themes and S3 bucket to identify orphaned objects.

**Output:**
- Console summary of orphan counts
- `orphan-images.json` - Full list of orphans with metadata

**Example:**
```bash
npm run orphan:find
```

### 2. Delete Orphans (Dry Run)
**Script:** `delete-orphans.ts` (DRY_RUN=true)
**Command:** `npm run orphan:delete:dry-run`

Simulates deletion without actually removing anything.

**Features:**
- Shows what would be deleted
- No actual S3 operations performed
- Safe to run anytime

**Example:**
```bash
npm run orphan:delete:dry-run
```

### 3. Delete Orphans (Live)
**Script:** `delete-orphans.ts` (DRY_RUN=false)
**Command:** `npm run orphan:delete`

**⚠️ WARNING: Permanently deletes objects from S3!**

**Safety Features:**
- Bucket name verification
- Confirmation prompt (must type "DELETE")
- Batch processing with error handling
- Detailed progress logging

**Example:**
```bash
npm run orphan:delete
```

## Workflow

### Step 1: Find Orphans
```bash
cd backend
npm run orphan:find
```

This creates `scripts/orphan-images.json` with the list of orphans.

### Step 2: Review (Optional)
```bash
cat scripts/orphan-images.json
```

Check the orphan list to verify what will be deleted.

### Step 3: Dry Run
```bash
npm run orphan:delete:dry-run
```

See what would be deleted without making changes.

### Step 4: Delete (If Confirmed)
```bash
npm run orphan:delete
```

When prompted:
1. Verify bucket name matches
2. Type `DELETE` to confirm
3. Wait for deletion to complete

## Output Example

```
============================================================
S3 ORPHAN DELETION SCRIPT
============================================================
Bucket: memory-game-images-dev
Mode: DRY RUN (no actual deletions)
============================================================

Orphan Summary:
  Orphan Images: 401
  Orphan Thumbnails: 683
  Total Orphans: 1084

Sample of objects to be deleted:
  images/Adorable-Cream-Calf-simple-17-xxx.webp
  ... and 396 more images
  thumbs/Adorable-Cream-Calf-simple-17-xxx.webp
  ... and 678 more thumbnails

Starting deletion...
  [DRY RUN] Would delete batch of 401 objects
  [DRY RUN] Would delete batch of 683 objects

✓ DRY RUN COMPLETE - No actual deletions were made
```

## Environment Variables

- `REGION` - AWS region (default: us-east-1)
- `S3_BUCKET` - S3 bucket name (default: memory-game-images-dev)
- `THEMES_TABLE` - DynamoDB table (default: memory-game-api-themes-dev)
- `DRY_RUN` - true/false (default: true for safety)

## Analysis Scripts

Additional diagnostic scripts:

- `check-missing-thumbnails.ts` - Check for DB entries missing thumbnailUrl
- `check-db-urls-not-in-s3.ts` - Find DB URLs that don't exist in S3
- `find-orphaned-full-images.ts` - Find images with missing thumbnails
- `analyze-broken-references.ts` - Analyze themes with broken references
- `count-all-s3-objects.ts` - Count total S3 objects with pagination

## Notes

- S3 DeleteObjects supports max 1000 objects per call (handled automatically)
- Script uses batch processing for efficiency
- All operations are logged with progress updates
- Failed deletions are tracked and reported
- Default mode is DRY_RUN for safety
