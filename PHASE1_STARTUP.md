# Phase 1: Test Everything Works - Startup Guide

## ✅ Verification Complete

- ✅ Backend dependencies installed
- ✅ Frontend dependencies installed
- ✅ Backend builds successfully
- ✅ Frontend builds successfully

---

## 🚀 How to Start the Servers

### Terminal 1: Start Backend (Port 3001)

```bash
cd C:\Users\KHK89\nftsol\apps\backend
npm run dev
```

**Expected Output:**
```
> nftsol-backend@1.0.0 dev
> set NODE_ENV=development&& tsx watch src/index.ts
[Server listening on port 3001]
```

**Status:** Backend ready when you see "listening on port 3001"

---

### Terminal 2: Start Frontend (Port 5173)

```bash
cd C:\Users\KHK89\nftsol\client
npm run dev
```

**Expected Output:**
```
> nftsol-client@1.0.0 dev
> vite

VITE v7.1.0  ready in 234 ms

➜  Local:   http://localhost:5173/
```

**Status:** Frontend ready when you see the local URL

---

## 🌐 Access the Application

Once both are running, open your browser:

```
http://localhost:5173
```

---

## 🧪 Test Phase 1: Basic Search

### Steps:
1. Open http://localhost:5173 in your browser
2. Look for "Search Archive" or "Archive" section
3. In the search box, type: **`documentary`**
4. Click "Search" or press Enter
5. Wait for results to load

### Expected Results:
- You should see real results from Internet Archive
- Results will show items like:
  - Documentary titles
  - Creation dates
  - File types (video, audio, etc.)
  - Download counts
  - Creator information

### Verification ✅
If you see results from archive.org, you've successfully:
- ✅ Connected to Internet Archive API
- ✅ Built real Solr queries
- ✅ Received and displayed real data

---

## 🔍 Test Phase 1: Advanced Search with Filters

### Steps:
1. Find the "Advanced Search" or filter options
2. Try these filters:
   - **Media Type:** Select "Video"
   - **License:** Select "Public Domain"
   - **Year From:** Enter 2000

3. Click "Search"

### Expected Results:
- Results filtered to show only:
  - Videos (not audio or documents)
  - Public domain items
  - From year 2000 or later

### Verification ✅
If filters work, you've verified:
- ✅ Filter UI components working
- ✅ Filters building correct API queries
- ✅ API correctly parsing and applying filters

---

## 🔗 Test Phase 1: Individual Item Details

### Steps:
1. Click on any search result item
2. Should see a modal/detail view with:
   - Full title
   - Description
   - Creator/Author
   - Date created
   - Format/Type
   - Available files
   - Download links

### Expected Results:
- Full metadata displayed
- Real information from archive.org

### Verification ✅
If item details work, you've verified:
- ✅ Individual item API calls working
- ✅ Metadata service pulling real data
- ✅ Detail view displaying correctly

---

## 📊 API Verification (Optional - Using curl)

You can also test the backend API directly:

### Basic Search
```bash
curl "http://localhost:3001/api/archive/search?query=documentary"
```

### Advanced Search with Filters
```bash
curl -X POST http://localhost:3001/api/archive/advanced-search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "nature",
    "mediaTypes": ["video"],
    "yearFrom": 2000,
    "licenses": ["public-domain"],
    "limit": 10
  }'
```

### Get Filter Options
```bash
curl "http://localhost:3001/api/archive/filter-options"
```

### Get Trending Searches
```bash
curl "http://localhost:3001/api/archive/trending"
```

### Get Autocomplete Suggestions
```bash
curl "http://localhost:3001/api/archive/suggestions?q=documentary"
```

### Get Item Metadata
```bash
curl "http://localhost:3001/api/archive/documentaryname123"
```

### Get Item Media Files
```bash
curl "http://localhost:3001/api/archive/documentaryname123/media"
```

---

## ✅ Phase 1 Success Checklist

Once both servers are running, verify:

- [ ] Backend running on http://localhost:3001
- [ ] Frontend running on http://localhost:5173
- [ ] Can access frontend in browser
- [ ] Can search archive with "documentary"
- [ ] See real results from Internet Archive
- [ ] Can click on item to see details
- [ ] Can try filters and results update
- [ ] Trending searches display
- [ ] Autocomplete suggestions work

---

## 🆘 Troubleshooting

### Backend Won't Start

**Error:** `Port 3001 already in use`
```bash
# Kill the process using port 3001
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

**Error:** `Cannot find module`
```bash
cd apps/backend
npm install
```

**Error:** `TypeScript compilation error`
```bash
cd apps/backend
npm run type-check
```

---

### Frontend Won't Start

**Error:** `Port 5173 already in use`
```bash
# Use different port
npm run dev -- --port 5174
```

**Error:** `Cannot find module`
```bash
cd client
npm install
```

---

### API Not Responding

**Check:** Backend is actually running
```bash
curl http://localhost:3001/healthz
```

Should return: `{"status":"ok"}`

**Check:** Archive endpoint is accessible
```bash
curl http://localhost:3001/api/archive/filter-options
```

Should return JSON with filter data

---

## 📝 Next Steps After Phase 1

Once Phase 1 is working:

1. **Keep both servers running** in separate terminals
2. **Test a few searches** to verify real data is working
3. **Note any issues** you encounter
4. **Then proceed to Phase 2** (Replace hardcoded data)

---

## ⏱️ Expected Timeline

- Backend startup: 5-10 seconds
- Frontend startup: 10-20 seconds
- First search: 2-5 seconds (depends on Internet Archive API response)

**Total time to first results: 30-45 seconds**

---

**Status:** Ready to test!
**Next command:** Run the two commands above in separate terminals
**Report back:** Let me know when both are running!
