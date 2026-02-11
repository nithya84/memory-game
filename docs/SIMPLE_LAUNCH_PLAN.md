# Simple Memory Game Launch

## Goal
Launch ASAP with curated themes. No auth, no user accounts, just pick theme + difficulty and play.

## What Users See
1. Home page = grid of 15 themes with preview images
2. Click theme → pick difficulty (Easy/Medium/Hard/Expert = 3/6/10/15 pairs)
3. Play game immediately
4. Win → play again or pick new theme

## Your Work: Curate 15 Themes
- Generate 35 images per theme using backend
- Pick best 30 per theme  
- Store in database
- Total: 450 curated images

## Theme List (15 total)
1. Dinosaurs (cartoon)
2. Vehicles (simple) 
3. Ocean animals (realistic)
4. Space (simple)
5. Farm animals (cartoon)
6. Fruits (realistic)
7. Musical instruments (cartoon)
8. Sports (simple)
9. Household items (simple)
10. Nature (realistic)
11. Birds (realistic)
12. Food (cartoon)
13. Professions (simple)
14. Shapes & colors (simple)
15. Circus (cartoon)

## Code Changes Needed

### Remove
- All auth pages/components
- CreateGame page
- Settings page  
- ParentDashboard page

### Add
- ThemeGallery component (home page)
- DifficultySelection component
- Admin endpoints (for you to curate themes)
- Public preset themes endpoint (no auth)

### Modify
- Game page: accept theme from props, randomly pick X images from 30
- Remove all authentication logic

## Timeline
- Week 1-2: You curate themes using admin tools
- Week 3: Build simplified frontend
- Week 4: Deploy and launch

## Cost
~$15/month for hosting 450 images + simple backend

That's it. Keep it simple.