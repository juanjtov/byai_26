# **Role**

You are an elite Frontend Engineer and UI/UX Designer known for "Brutalist Luxury" aesthetics (reminiscent of high-end Apple product pages or architectural firms). You prioritize cinematic interactions, precision typography, and dark-mode sophistication.

# **Goal**

Build a single-file, responsive HTML landing page for "Estimate.ai" — a construction tech app that converts LiDAR scans into signed contracts. The page must use Tailwind CSS for styling and GSAP for animations.

# **Design Language & System**

### **1\. Color Palette (Tailwind Config)**

Define these custom colors in the Tailwind configuration:

* **Background (Obsidian):** \#0F1012 (Deepest matte black)  
* **Surface (Tungsten):** \#1C1C1E (Dark grey for cards)  
* **Surface Light (Tungsten Light):** \#2C2C2E (Borders/Accents)  
* **Primary Accent (Raw Copper):** \#C88D74 (Metallic, premium feel)  
* **Secondary Accent (Sage):** \#768A86 (For technical data)  
* **Signal (Bio-Luminescent Green):** \#CFFF04 (High contrast, used sparingly for "Safe/Success" indicators)

### **2\. Typography**

* **Primary:** 'Inter' (Google Fonts) \- used for headings and UI.  
* **Data/Technical:** 'JetBrains Mono' (Google Fonts) \- used for pricing, specs, and decorative tags.  
* **Constraint:** Use wide tracking (tracking-widest) for uppercase labels to create an "architectural" feel.

### **3\. Visual Effects**

* **Glassmorphism:** Use backdrop-filter: blur(12px) with subtle white borders (border-white/5) for panels.  
* **LiDAR Scan:** Implement CSS keyframe animations to simulate a laser scanning line moving vertically.  
* **Glow:** Use text shadows and box shadows with the Signal or Copper colors to create depth.

# **Technical Requirements**

* **Structure:** Single HTML file.  
* **CSS Framework:** Tailwind CSS (via CDN https://cdn.tailwindcss.com).  
* **Animation Library:** GSAP \+ ScrollTrigger (via CDN https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js).  
* **Icons:** Lucide Icons (via CDN https://unpkg.com/lucide@latest).  
* **Interactivity:** Vanilla JavaScript (no external frameworks like React/Vue).

# **Section-by-Section Specification**

### **1\. Navigation**

* Sticky, glassmorphism header.  
* Logo: Simple geometric square icon \+ "ESTIMATE.AI" text.  
* Right side: "GET ACCESS" button with a thin border and hover glow effect.

### **2\. Hero Section (Cinematic)**

* **Background:** CSS radial gradients \+ a faint grid pattern overlay.  
* **Animation:** An absolute positioned horizontal line (Copper color) that scans up and down the viewport continuously (LiDAR effect).  
* **Content:**  
  * Badge: "Beta 2.0 Live" (Monospace, pill shape).  
  * Headline: "From Scan to Signature." (Large, tight leading).  
  * **CTA:** A "Swipe to Estimate" slider interaction (visual only) instead of a standard button. It should look like a physical slider track.

### **3\. The Ticker**

* A narrow horizontal bar with scrolling text: "// NO MORE WAITING • // LIDAR PRECISION • // CONTRACT READY".  
* Style: Tungsten background, monospace font, copper bullets.

### **4\. The Bento Grid (Features)**

* Layout: CSS Grid. 3 Cards.  
* **Card 1 (Large, Spans 2 cols):** "Spatial Computing". Background contains an SVG wireframe of a room.  
* **Card 2:** "Price Book". Simulates a list of construction items (Labor, Flooring, Markup) with prices.  
* **Card 3:** "Packages". Visualizes three vertical tiers (Good/Better/Best) growing in height.  
* **Interaction:** Cards should gently float up (y axis translate) and fade in as they scroll into view (use GSAP ScrollTrigger).

### **5\. The "Wow" Moment (Interactive Demo)**

* **Layout:** Split screen. Left side \= Controls. Right side \= Phone Mockup.  
* **The Control:** A functional HTML \<input type="range" min="1" max="3"\>.  
  * Steps: Economy, Standard, Premium.  
* **The Logic (Crucial):** When the slider moves:  
  1. Update a text label (e.g., "Standard" \-\> "Premium").  
  2. Update a "Total Estimate" price on the phone mockup.  
  3. **Animation:** The price must "roll" or count up to the new value using GSAP (do not just snap).  
  4. Update specific details in the UI (Flooring type, Countertop material).  
* **The Phone Mockup:** A CSS-styled rectangle with rounded corners (rounded-\[3rem\]) representing a mobile UI. It should shake slightly (x axis shake) when the slider changes to simulate haptic feedback.

### **6\. The Confidence Engine (Risk Meter)**

* Visual: A large circular icon or gauge in Signal Green.  
* Content: "98% Confidence Score".  
* Explanation: Text explaining that AI detects hidden plumbing/structural risks.

### **7\. The Closing**

* Headline: "The 10-Minute Close."  
* Visual: An abstract representation of a contract (white paper div) being "scanned" by a green light bar.

# **Implementation Details**

* **Clean Code:** Comment specific sections (Hero, Bento, etc.).  
* **Error Handling:** Ensure Lucide icons are initialized inside a DOMContentLoaded listener.  
* **Responsiveness:** Use Tailwind's md: and lg: prefixes to ensure the layout stacks on mobile and expands on desktop.