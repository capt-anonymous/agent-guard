<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        "primary": "#e91c1c",
                        "primary-dark": "#b01010",
                        "background-light": "#f8f6f6",
                        "background-dark": "#050505", /* Pure Obsidian */
                        "surface-dark": "#110a0a",
                        "glass": "rgba(17, 10, 10, 0.7)",
                    },
                    fontFamily: {
                        "display": ["Space Grotesk", "sans-serif"],
                        "mono": ["Courier New", "monospace"]
                    },
                    borderRadius: {"DEFAULT": "0.25rem", "lg": "0.5rem", "xl": "0.75rem", "full": "9999px"},
                    animation: {
                        'pulse-fast': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                        'spin-slow': 'spin 8s linear infinite',
                        'radar-sweep': 'spin 4s linear infinite',
                        'scanline': 'scanline 8s linear infinite',
                        'glitch': 'glitch 1s linear infinite',
                    },
                    keyframes: {
                        scanline: {
                            '0%': { backgroundPosition: '0% 0%' },
                            '100%': { backgroundPosition: '0% 100%' },
                        },
                        glitch: {
                            '2%, 64%': { transform: 'translate(2px,0) skew(0deg)' },
                            '4%, 60%': { transform: 'translate(-2px,0) skew(0deg)' },
                            '62%': { transform: 'translate(0,0) skew(5deg)' },
                        }
                    }
                },
            },
        }
    </script>