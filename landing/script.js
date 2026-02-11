/* landing/script.js */
tailwind.config = {
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "crimson": "#E81B1B",
                "crimson-dark": "#B62938",
                "obsidian": "#000000",
                "deep-blood": "#1A0404",
                "deep-maroon": "#0A0202",
                "charcoal": "#111111",
                "border-subtle": "#333333",
            },
            fontFamily: {
                "sans": ["Space Grotesk", "sans-serif"],
                "mono": ["JetBrains Mono", "monospace"],
                "display": ["Space Grotesk", "sans-serif"],
            },
            borderRadius: {
                "DEFAULT": "2px",
                "sm": "1px",
                "md": "4px",
                "lg": "0px"
            },
            animation: {
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'rain': 'rain 20s linear infinite',
                'scan': 'scan 4s ease-in-out infinite',
                'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
            },
            keyframes: {
                rain: {
                    '0%': { transform: 'translateY(-100%)' },
                    '100%': { transform: 'translateY(100%)' },
                },
                scan: {
                    '0%, 100%': { width: '0%', opacity: '0' },
                    '50%': { width: '100%', opacity: '1' },
                },
                fadeInUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                }
            }
        },
    },
};

// Import initialization logic
import { init } from '../doomsday earth/main.js';

// Initialize Earth Model
document.addEventListener('DOMContentLoaded', () => {
    // We need to wait for the module to load, but since this is a module script, it defers by default.
    // However, init is imported at top level, so it should be available.
    // The container for the earth model is #earth-container
    const container = document.getElementById('earth-container');
    if (container) {
        init(container);
    } else {
        console.error("Earth container not found");
    }
});
