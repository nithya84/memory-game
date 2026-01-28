# Cloudflare Setup Guide

Complete step-by-step guide to deploy enable.kids portfolio on Cloudflare Pages.

---

## Prerequisites

- ✅ GitHub account with access to repositories
- ✅ Gandi account with enable.kids domain
- ✅ Portfolio repo: https://github.com/nithya84/enable-kids

---

## Step 1: Create Cloudflare Account

1. Go to https://cloudflare.com
2. Click **"Sign Up"** (top right)
3. Enter your email and create a password
4. Verify your email address

**Cost:** Free tier is sufficient for this project.

---

## Step 2: Add enable.kids Site to Cloudflare

1. Log into Cloudflare dashboard
2. Click **"Add a Site"** (or **"+ Add site"**)
3. Enter domain: **enable.kids**
4. Click **"Add site"**
5. Select plan: **"Free"** (click **"Continue"**)

**Cloudflare will now scan your existing DNS records.**

---

## Step 3: Review DNS Records

Cloudflare shows existing DNS records from Gandi:

1. Review the list - keep all existing records
2. Note any important records (mail servers, etc.)
3. Click **"Continue"**

**Cloudflare will show you your nameservers on the next page.**

---

## Step 4: Get Your Cloudflare Nameservers

**IMPORTANT:** Copy these nameservers - you'll need them for Gandi.

Example:
```
nova.ns.cloudflare.com
rick.ns.cloudflare.com
```

Your actual nameservers will be different (e.g., `cara.ns.cloudflare.com`, `paul.ns.cloudflare.com`).

**Don't click "Done" yet** - keep this page open.

---

## Step 5: Update Nameservers at Gandi

### Option A: Full Nameserver Change (Recommended)

1. Open new tab: https://admin.gandi.net
2. Click on domain: **enable.kids**
3. Go to **"Nameservers"** section
4. Click **"Change"** or **"Modify"**
5. Select **"External nameservers"**
6. Replace Gandi nameservers with Cloudflare nameservers:
   - Remove: `ns1.gandi.net`, `ns2.gandi.net`, etc.
   - Add: Your two Cloudflare nameservers (from Step 4)
7. Click **"Save"** or **"Update"**
8. Confirm the change

### Option B: CNAME Setup (If you want to keep Gandi DNS)

This is more complex - recommend Option A for simplicity.

---

## Step 6: Verify Nameserver Change in Cloudflare

1. Go back to Cloudflare tab
2. Click **"Done, check nameservers"**
3. Cloudflare will check if nameservers are updated

**Status:**
- ⏳ **Pending:** Nameservers not updated yet (wait and check again)
- ✅ **Active:** Nameservers successfully changed

**Note:** This can take 5 minutes to 48 hours. Usually happens within 1-4 hours.

**You can continue to next steps while waiting.**

---

## Step 7: Create Cloudflare Pages Project

1. In Cloudflare dashboard, go to **"Workers & Pages"** (left sidebar)
2. Click **"Create application"**
3. Select **"Pages"** tab
4. Click **"Connect to Git"**

---

## Step 8: Connect GitHub Repository

1. Click **"Connect GitHub"**
2. Authorize Cloudflare to access GitHub
3. Select the portfolio repository: **enable-kids**
4. Click **"Begin setup"**

---

## Step 9: Configure Build Settings

**Project name:** `enable-kids` (or your choice)

**Production branch:** `main`

**Build settings:**
- Framework preset: **None** (select from dropdown)
- Build command: (leave empty)
- Build output directory: **/** (root directory)

**Environment variables:** (none needed)

Click **"Save and Deploy"**

---

## Step 10: Wait for Initial Deployment

Cloudflare Pages will:
1. Clone your repository
2. Build the site (instant, since it's static HTML)
3. Deploy to Cloudflare's edge network

**Time:** 1-2 minutes

**Result:** You'll see a deployment URL like:
```
https://enable-kids.pages.dev
```

---

## Step 11: Verify Deployment

1. Click on the deployment URL
2. You should see your portfolio landing page
3. Check if the page looks correct

**Troubleshooting:**
- If you see 404: Check that build directory is set to `/` (root)
- If CSS doesn't load: Check file paths in index.html

---

## Step 12: Add Custom Domain

1. In Cloudflare Pages project, go to **"Custom domains"** tab
2. Click **"Set up a custom domain"**
3. Enter: **enable.kids**
4. Click **"Continue"**

**Cloudflare will automatically configure DNS.**

**Status:**
- ⏳ Provisioning SSL certificate (1-5 minutes)
- ✅ Active (domain is live)

---

## Step 13: Test Custom Domain

1. Wait for SSL certificate to be provisioned (check status in Cloudflare)
2. Visit: **https://enable.kids**
3. You should see your portfolio page

**If you get an error:**
- Check nameserver status (Step 6)
- Wait for DNS propagation (can take up to 48 hours)
- Check browser cache (try incognito mode)

---

## Step 14: Test Memory Game Proxy

1. Visit: **https://enable.kids/memory-game**
2. The game should load via the reverse proxy

**If it doesn't work:**
- Check that `_redirects` file exists in the enable-kids repo root
- Check Cloudflare Pages deployment logs
- Verify CloudFront URL is still active

---

## Step 15: Enable HTTPS & Security Settings

1. In Cloudflare dashboard, go to **SSL/TLS** (left sidebar)
2. Set SSL/TLS encryption mode: **"Full"** or **"Full (strict)"**
3. Go to **SSL/TLS > Edge Certificates**
4. Enable:
   - ✅ Always Use HTTPS
   - ✅ Automatic HTTPS Rewrites
   - ✅ HTTP Strict Transport Security (HSTS) - Optional, but recommended

---

## Step 16: Configure Speed & Performance

1. Go to **Speed** > **Optimization**
2. Enable:
   - ✅ Auto Minify (HTML, CSS, JS)
   - ✅ Brotli compression
   - ✅ Early Hints

3. Go to **Caching** > **Configuration**
4. Set Caching Level: **"Standard"**

---

## Step 17: Set Up Automatic Deployments

**Already configured!** Cloudflare Pages automatically deploys when you:
- Push to `main` branch (production)
- Create pull requests (preview deployments)

**To deploy updates:**
```bash
git add .
git commit -m "Update portfolio"
git push origin main
```

Cloudflare will automatically rebuild and deploy in 1-2 minutes.

---

## Verification Checklist

After setup is complete, verify:

- [ ] **Portfolio loads:** https://enable.kids/
- [ ] **HTTPS works:** Green lock icon in browser
- [ ] **Memory game proxies:** https://enable.kids/memory-game
- [ ] **Mobile responsive:** Test on phone
- [ ] **No mixed content warnings:** Check browser console
- [ ] **DNS propagates:** Check at https://www.whatsmydns.net/?d=enable.kids

---

## DNS Propagation Timeline

| Time | Status |
|------|--------|
| 0-5 min | Cloudflare sees nameserver change |
| 5-60 min | Most DNS servers updated |
| 1-4 hours | Global propagation (90%+ coverage) |
| 4-48 hours | Full propagation worldwide |

**Check status:** https://www.whatsmydns.net/?d=enable.kids&t=NS

---

## Troubleshooting

### Portfolio doesn't load
- **Check:** Build directory is set to `/` (root) in Cloudflare Pages settings
- **Check:** Files exist in the enable-kids repo: https://github.com/nithya84/enable-kids
- **Fix:** Redeploy from Cloudflare dashboard

### Memory game doesn't load at /memory-game
- **Check:** `_redirects` file exists in the enable-kids repo root
- **Check:** CloudFront URL is still active: https://d19me0v65pp4hx.cloudfront.net/
- **Check:** Cloudflare Pages deployment logs for errors

### HTTPS certificate error
- **Wait:** SSL provisioning takes 1-5 minutes after domain is added
- **Check:** Domain status in Cloudflare shows "Active"
- **Try:** Clear browser cache, try incognito mode

### Nameserver change not detected
- **Wait:** Can take up to 48 hours (usually 1-4 hours)
- **Check:** Gandi settings to confirm nameservers were saved
- **Verify:** Use https://www.whatsmydns.net to check propagation

### 404 on memory game routes
- **Issue:** React Router needs basename set
- **Check:** `frontend/src/App.tsx` has `basename="/memory-game"`
- **Fix:** Redeploy game with `./deploy.sh dev`

---

## Post-Deployment Tasks

After successful deployment:

1. **Deploy Updated Game:**
   ```bash
   cd /Users/nithya/Documents/projects/memory_game
   ./deploy.sh dev
   ```
   This applies the base path changes to the game.

2. **Implement SEO improvements** (see `docs/SEO_IMPROVEMENTS_PLAN.md`)

3. **Set up Google Search Console** (see SEO plan)

4. **Test thoroughly:**
   - Test on multiple devices
   - Test all game functionality
   - Check browser console for errors

---

## Useful Cloudflare Dashboard Links

- **Pages Dashboard:** https://dash.cloudflare.com/?to=/:account/pages
- **DNS Settings:** https://dash.cloudflare.com/?to=/:account/:zone/dns
- **SSL Settings:** https://dash.cloudflare.com/?to=/:account/:zone/ssl-tls
- **Analytics:** https://dash.cloudflare.com/?to=/:account/:zone/analytics

---

## Support Resources

- **Cloudflare Docs:** https://developers.cloudflare.com/pages/
- **Community Forum:** https://community.cloudflare.com/
- **Status Page:** https://www.cloudflarestatus.com/

---

## Need Help?

If you encounter issues:
1. Check Cloudflare deployment logs (Pages dashboard > Deployments > View details)
2. Check browser console for errors (F12 > Console tab)
3. Verify files are in the correct location in GitHub
4. Test the CloudFront URL directly to ensure game works
5. Ask for help with specific error messages

---

**Ready to start? Begin with Step 1!**
