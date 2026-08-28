# Route Planner — Quantum-Inspired Intelligent Traffic Route Optimization (SIH26137)

**Problem Statement ID:** 26137  
**Problem Statement Title:** Quantum-Inspired Intelligent Traffic Route Optimization in Transportation Systems Using Metaheuristic Optimization  
**Organization:** Egreen Quanta  
**Department:** Egreen Quanta  
**Category:** Software | **Theme:** Transportation and Logistics  

---

## Delivery Table (Expected Deliverables)

| Deliverable ID | Component | Description | Status |
| :--- | :--- | :--- | :---: |
| **DEL-01** | **Graph-Based Network Model** | Weighted directed/bidirectional network model with spatial coordinates and physical properties. | ✅ Complete |
| **DEL-02** | **Traffic & Congestion Engine** | Stochastic road-specific congestion simulation and travel time adjustments ($t_{actual} = t_{free} \times (1 + c_{ij})$). | ✅ Complete |
| **DEL-03** | **Classical Dijkstra Baseline** | Exact shortest-path routing reference benchmark for travel time, distance, and congestion. | ✅ Complete |
| **DEL-04** | **QPSO Metaheuristic Engine** | Quantum delta-potential-well position update equations ($p_i, m_{best}, \alpha(t), \Delta x$), particle priority decoder, calibration bounds normalization, and constraint violation penalties. | ✅ Complete |
| **DEL-05** | **FastAPI REST API Services** | High-performance asynchronous backend services exposing simulation and optimization endpoints. | ✅ Complete |
| **DEL-06** | **Interactive Web Visualizer** | Modern dark UI, traffic heatmaps, road toggle controls, and vehicle route playback animations. | ✅ Complete |
| **DEL-07** | **Convergence & KPI Analytics** | Real-time comparative KPIs, delta badges, and SVG convergence decay charts. | ✅ Complete |
| **DEL-08** | **Smart-City Scaling Presets** | Pre-configured scenarios from 9-node demo to 16-node smart-city grid. | ✅ Complete |

---

## 🚀 Quick Start (Running Locally)

### 1. Start the Backend API
```powershell
cd backend
python -m uvicorn app.api:app --host 127.0.0.1 --port 8000
```
API Documentation (Swagger UI): [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### 2. Start the Frontend Visualizer
```powershell
cd frontend
npm install
npm run dev
```
Web Application: [http://127.0.0.1:5173/](http://127.0.0.1:5173/)

---

## 🌐 Deploying to GitHub & Automatic Cloud Deployment (CI/CD)

Whenever you push code changes to GitHub, your live website will **automatically rebuild and update** in the cloud.

### Step 1: Create a GitHub Repository
1. Go to [https://github.com/new](https://github.com/new)
2. Name your repository (e.g. `route-planner-sih26137`).
3. Leave it Public or Private, do NOT check "Initialize with README".
4. Click **Create repository**.

### Step 2: Push your Local Code to GitHub
Run the following in your terminal inside `route-planner`:

```powershell
cd "c:\Users\HP\Downloads\route-planner (1)\route-planner"

# Link your GitHub remote repository (replace with your actual GitHub repo URL):
git remote add origin https://github.com/YOUR_USERNAME/route-planner-sih26137.git

# Push the main branch:
git push -u origin main
```

---

### Step 3: Connect to Render for Free Automated Continuous Deployment

We have included `render.yaml` in the repository so Render will configure the entire full-stack deployment automatically.

1. Go to [https://render.com](https://render.com) and sign in with your GitHub account.
2. Click **New +** $\rightarrow$ **Blueprint**.
3. Select your `route-planner-sih26137` repository.
4. Render will detect `render.yaml` and configure:
   * **Build Command:** `cd frontend && npm install && npm run build && cd ../backend && pip install -r requirements.txt`
   * **Start Command:** `cd backend && uvicorn app.api:app --host 0.0.0.0 --port $PORT`
5. Click **Apply**.
6. In ~2 minutes, your live web application will be accessible at:
   `https://route-planner-sih26137.onrender.com`

---

## 🔄 How Version Updates Work (Continuous Deployment)

After your repository is linked, any change you make locally will update the live website automatically:

```powershell
# 1. Check changed files
git status

# 2. Stage your changes
git add .

# 3. Commit with a message
git commit -m "Update routing weights and map visualizer"

# 4. Push to GitHub
git push
```

Within 60–90 seconds of running `git push`:
1. **GitHub Actions** will run automated build checks (`.github/workflows/ci.yml`).
2. **Render** will automatically pull the latest code, build the frontend, and deploy the new version live with zero downtime!
