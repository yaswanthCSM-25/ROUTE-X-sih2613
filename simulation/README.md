# Q-ROUTE 🚦

**Simulation Control Center & Traffic Optimization Engine**

> **Smart India Hackathon (SIH) 26137**  
> *Quantum-Inspired Intelligent Traffic Route Optimization in Transportation Systems Using Metaheuristic Optimization*

Q-ROUTE is an advanced, high-performance web application designed to simulate and optimize complex transportation networks. By leveraging quantum-inspired metaheuristic algorithms (such as QPSO and Classic PSO), Q-ROUTE aims to find the most efficient routes for multiple vehicles traveling across a dynamic road network, minimizing travel time and resolving bottlenecks.

---

## 🎯 Phase 1: Simulation Configuration Dashboard

Currently, the application is in Phase 1, which features a robust, fully validated **Simulation Control Center**. This dashboard allows operators to precisely configure all parameters of the traffic simulation before initializing the map and algorithms.

### Key Configuration Modules:

1. **Vehicles**
   - Configure the total number of vehicles (1–20) and vehicle types (Mixed, Cars, Trucks, Emergency).
2. **Road Network**
   - Network Size (20–100 km²), Road Density, and Junction Frequency.
   - Dynamic One-Way Routes validation based on network size.
   - Auto-balancing Lane Distribution (1, 2, and 4 lanes proportional percentages).
3. **Traffic**
   - Set Traffic Levels, Time of Day, and flow patterns (Random, Commute, Highway).
4. **Conditions**
   - Weather settings.
   - Road Condition distribution (Good ≤ 60%, Bad ≤ 20%, Average auto-calculated).
5. **Events**
   - Inject dynamic obstacles like Accidents, Road Closures, and Construction Zones.
6. **Optimization**
   - Set priority objectives (Focusing primarily on Travel Time).

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- npm or yarn

### Installation & Running Locally

1. Clone the repository and navigate to the project root.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:5173/` to view the Simulation Control Center.

---

## 🎨 UI/UX Design

The application features a custom **Clean Minimalist Light Mode** aesthetic tailored for complex data entry:
- **Frosted Glassmorphism**: High-readability translucent white modules over a high-resolution 4k data-visualization background.
- **High Contrast Inputs**: Data entry fields use a sleek, dark slate design for maximum legibility and focus.
- **Masonry Layout**: A zero-vertical-gap masonry grid ensures optimal screen real estate utilization, grouping configurations into logical, flush columns.

---

## 🚧 Upcoming Features (Phase 2 & Beyond)

- **Map Generation**: Visual generation of the transportation graph based on Phase 1 configurations.
- **Algorithm Execution**: Implementation of Classic PSO and Quantum-behaved PSO (QPSO).
- **Live Simulation**: Real-time animated vehicle pathfinding and traffic flow.
- **Data Analytics**: Comparative dashboard analyzing algorithm efficiency and travel times.
