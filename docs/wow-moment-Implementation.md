# **The "Wow Moment" Interactive Component**

This component features a split-screen layout with a custom range slider on the left and a reactive phone mockup on the right.

## **1\. Prerequisites: Tailwind Configuration**

Add these colors to your tailwind.config.js to achieve the "Brutalist Luxury" look.

tailwind.config \= {  
  theme: {  
    extend: {  
      colors: {  
        obsidian: '\#0F1012',      // Deep background  
        tungsten: '\#1C1C1E',      // Card surface  
        tungstenLight: '\#2C2C2E', // Phone bezel/borders  
        copper: '\#C88D74',        // Primary accent  
        signal: '\#CFFF04',        // High-vis green for "Premium" state  
      }  
    }  
  }  
}

## **2\. The Implementation (HTML & CSS)**

\<\!-- Main Section Container \--\>  
\<section class="py-32 bg-tungsten relative border-y border-white/5"\>  
    \<div class="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center"\>  
          
        \<\!-- LEFT: Controls & Copy \--\>  
        \<div\>  
            \<h2 class="text-4xl md:text-5xl font-light mb-6 text-white"\>  
                Scope Fluidity. \<br/\>\<span class="text-copper"\>Price Certainty.\</span\>  
            \</h2\>  
            \<p class="text-gray-400 font-light mb-12 max-w-md text-lg"\>  
                Drag the slider. Watch the scope evolve. The price updates instantly.  
            \</p\>

            \<\!-- The Control Panel \--\>  
            \<div class="bg-obsidian p-8 rounded-2xl border border-white/10 shadow-2xl"\>  
                \<div class="flex justify-between items-center mb-6"\>  
                    \<span class="font-mono text-xs text-gray-500 tracking-widest"\>FINISH LEVEL\</span\>  
                    \<span id="finish-level-text" class="font-mono text-xs text-signal tracking-widest"\>PREMIUM\</span\>  
                \</div\>  
                  
                \<\!-- Custom Range Slider \--\>  
                \<input type="range" min="1" max="3" value="3" class="w-full mb-8 appearance-none bg-transparent cursor-pointer" id="scope-slider"\>  
                  
                \<\!-- Dynamic Spec Grid \--\>  
                \<div class="grid grid-cols-2 gap-4"\>  
                    \<div class="bg-tungsten p-4 rounded border border-white/5"\>  
                        \<div class="text-\[10px\] font-mono text-gray-500 uppercase mb-1"\>Flooring\</div\>  
                        \<div id="demo-flooring" class="text-sm text-white"\>European Oak\</div\>  
                    \</div\>  
                    \<div class="bg-tungsten p-4 rounded border border-white/5"\>  
                        \<div class="text-\[10px\] font-mono text-gray-500 uppercase mb-1"\>Cabinets\</div\>  
                        \<div id="demo-cabinets" class="text-sm text-white"\>Semi-Custom Matte\</div\>  
                    \</div\>  
                    \<div class="bg-tungsten p-4 rounded border border-white/5"\>  
                        \<div class="text-\[10px\] font-mono text-gray-500 uppercase mb-1"\>Countertops\</div\>  
                        \<div id="demo-counter" class="text-sm text-white"\>Quartz (Veined)\</div\>  
                    \</div\>  
                    \<div class="bg-tungsten p-4 rounded border border-white/5"\>  
                        \<div class="text-\[10px\] font-mono text-gray-500 uppercase mb-1"\>Timeline\</div\>  
                        \<div id="demo-timeline" class="text-sm text-white"\>4 Weeks\</div\>  
                    \</div\>  
                \</div\>  
            \</div\>  
        \</div\>

        \<\!-- RIGHT: The Phone Mockup \--\>  
        \<div class="relative flex justify-center lg:justify-end"\>  
            \<\!-- The Bezel (Border-8) \--\>  
            \<div class="w-\[320px\] h-\[640px\] bg-obsidian rounded-\[3rem\] border-8 border-tungstenLight shadow-2xl relative overflow-hidden transform transition-transform" id="phone-mockup"\>  
                  
                \<\!-- The Notch \--\>  
                \<div class="absolute top-0 left-1/2 \-translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-20"\>\</div\>  
                  
                \<\!-- Screen Content \--\>  
                \<div class="p-6 h-full flex flex-col pt-12"\>  
                    \<\!-- Header \--\>  
                    \<div class="flex justify-between items-center mb-6"\>  
                        \<i data-lucide="chevron-left" class="text-white w-5 h-5"\>\</i\>  
                        \<span class="font-mono text-\[10px\] tracking-widest text-gray-400"\>ESTIMATE \#2941\</span\>  
                        \<i data-lucide="share" class="text-white w-5 h-5"\>\</i\>  
                    \</div\>

                    \<\!-- Dynamic Room Image \--\>  
                    \<div class="h-48 bg-tungsten rounded-xl mb-6 relative overflow-hidden border border-white/5 group"\>  
                            \<div class="absolute inset-0 bg-\[url('\[https://images.unsplash.com/photo-1600607686527-6fb886090705?ixlib=rb-4.0.3\&auto=format\&fit=crop\&w=600\&q=80\](https://images.unsplash.com/photo-1600607686527-6fb886090705?ixlib=rb-4.0.3\&auto=format\&fit=crop\&w=600\&q=80)')\] bg-cover bg-center transition-transform duration-700 scale-100" id="room-image"\>\</div\>  
                            \<div class="absolute inset-0 bg-black/40"\>\</div\>  
                            \<div class="absolute bottom-3 left-3 flex gap-2"\>  
                            \<span class="bg-black/60 backdrop-blur text-white text-\[10px\] px-2 py-1 rounded font-mono"\>Kitchen\</span\>  
                            \<span class="bg-black/60 backdrop-blur text-copper text-\[10px\] px-2 py-1 rounded font-mono"\>245 sqft\</span\>  
                            \</div\>  
                    \</div\>

                    \<\!-- Animated Price Ticker \--\>  
                    \<div class="text-center mb-8"\>  
                        \<div class="text-gray-500 text-xs font-mono mb-1"\>TOTAL ESTIMATE\</div\>  
                        \<div class="text-4xl font-light text-white tracking-tight flex justify-center"\>  
                            $\<span id="price-ticker" class="font-mono font-medium tabular-nums"\>42,500\</span\>  
                        \</div\>  
                    \</div\>

                    \<\!-- Static Confidence Meter \--\>  
                    \<div class="bg-tungsten/50 rounded-lg p-3 flex items-center justify-between mb-4 border border-white/5"\>  
                        \<span class="text-xs text-gray-400"\>Confidence Score\</span\>  
                        \<span class="text-xs text-signal font-mono"\>98%\</span\>  
                    \</div\>

                    \<\!-- Bottom Action \--\>  
                    \<div class="mt-auto"\>  
                        \<button class="w-full bg-copper text-white py-4 rounded-xl font-medium tracking-wide shadow-lg shadow-copper/20 flex justify-between px-6 items-center group"\>  
                            \<span\>Lock & Sign\</span\>  
                            \<i data-lucide="arrow-right" class="w-4 h-4 group-hover:translate-x-1 transition-transform"\>\</i\>  
                        \</button\>  
                        \<p class="text-\[10px\] text-gray-600 text-center mt-3"\>Generates legal addendum instantly.\</p\>  
                    \</div\>  
                \</div\>  
            \</div\>  
        \</div\>

    \</div\>  
\</section\>

\<\!-- Custom Styles for the Slider Track \--\>  
\<style\>  
    /\* Webkit Slider Thumb \*/  
    input\[type=range\]::-webkit-slider-thumb {  
        \-webkit-appearance: none;  
        height: 24px;  
        width: 24px;  
        border-radius: 50%;  
        background: \#CFFF04; /\* Signal Green \*/  
        cursor: pointer;  
        margin-top: \-10px;   
        box-shadow: 0 0 15px rgba(207, 255, 4, 0.5);  
    }  
    /\* Webkit Slider Track \*/  
    input\[type=range\]::-webkit-slider-runnable-track {  
        width: 100%;  
        height: 4px;  
        cursor: pointer;  
        background: \#2C2C2E; /\* Tungsten Light \*/  
        border-radius: 2px;  
    }  
\</style\>

## **3\. The Logic (JavaScript \+ GSAP)**

This script handles the data mapping, the price rolling animation, and the "haptic" shake effect.

\<script\>  
    // 1\. Define Data States  
    const data \= {  
        1: {   
            price: "28,400",   
            finish: "ECONOMY",   
            flooring: "Laminate",   
            cabinets: "Stock Flat",   
            counter: "Laminate",   
            time: "2 Weeks"   
        },  
        2: {   
            price: "35,200",   
            finish: "STANDARD",   
            flooring: "LVP Premium",   
            cabinets: "Semi-Custom",   
            counter: "Granite",   
            time: "3 Weeks"   
        },  
        3: {   
            price: "42,500",   
            finish: "PREMIUM",   
            flooring: "European Oak",   
            cabinets: "Custom Matte",   
            counter: "Quartz (Veined)",   
            time: "4 Weeks"   
        }  
    };

    // 2\. Select Elements  
    const slider \= document.getElementById('scope-slider');  
    const priceTicker \= document.getElementById('price-ticker');  
    const finishLevelText \= document.getElementById('finish-level-text');  
    const elements \= {  
        flooring: document.getElementById('demo-flooring'),  
        cabinets: document.getElementById('demo-cabinets'),  
        counter: document.getElementById('demo-counter'),  
        time: document.getElementById('demo-timeline'),  
        img: document.getElementById('room-image')  
    };

    // 3\. Animation State  
    let priceState \= { value: 42500 }; // Start at premium price

    // 4\. Event Listener  
    slider.addEventListener('input', (e) \=\> {  
        const val \= e.target.value;  
        const currentData \= data\[val\];

        // A. Parse target price for math (remove comma)  
        const targetPrice \= parseInt(currentData.price.replace(/,/g, ''), 10);

        // B. Animate Price with GSAP (Rolling Numbers)  
        gsap.to(priceState, {  
            value: targetPrice,  
            duration: 0.5,  
            ease: "power2.out",  
            onUpdate: function() {  
                // Re-format with commas on every frame  
                priceTicker.innerText \= Math.round(priceState.value).toLocaleString('en-US');  
            }  
        });

        // C. Update Text Fields  
        finishLevelText.innerText \= currentData.finish;  
        elements.flooring.innerText \= currentData.flooring;  
        elements.cabinets.innerText \= currentData.cabinets;  
        elements.counter.innerText \= currentData.counter;  
        elements.time.innerText \= currentData.time;

        // D. Haptic Shake Effect on Phone  
        // Shakes the bezel border color or position slightly  
        gsap.fromTo("\#phone-mockup",   
            { x: \-2 },   
            { x: 0, duration: 0.1, repeat: 1, yoyo: true }  
        );  
          
        // E. Image Zoom Effect  
        if (val \== 3\) {  
                elements.img.style.transform \= "scale(1.05)";  
        } else if (val \== 1\) {  
                elements.img.style.transform \= "scale(1)";  
        }  
    });  
\</script\>  
