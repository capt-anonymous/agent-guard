/* login/script.js */
tailwind.config = {
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "primary": "#e91c1c",
                "background-light": "#f8f6f6",
                "background-dark": "#000000",
            },
            fontFamily: {
                "display": ["Space Grotesk", "sans-serif"]
            },
            borderRadius: {
                "DEFAULT": "0.25rem",
                "lg": "0.5rem",
                "xl": "0.75rem",
                "full": "9999px"
            },
        },
    },
};

// Login Logic
document.addEventListener('DOMContentLoaded', () => {
    const loginButton = document.querySelector('button[onclick]');
    if (loginButton) {
        // Remove inline onclick to separate concerns
        loginButton.removeAttribute('onclick');
        loginButton.addEventListener('click', () => {
            window.location.href = '../dashboard/dashboard.html';
        });
    } else {
        // Fallback if the button is identified differently in future
        const initiateBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Initiate Session'));
        if (initiateBtn) {
            initiateBtn.addEventListener('click', () => {
                window.location.href = '../dashboard/dashboard.html';
            });
        }
    }
});
