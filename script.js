// ===========================
// ORGANIZO - ENHANCED INTERACTIVE JAVASCRIPT
// Smooth interactions & calming animations
// ===========================

// Enhanced Scroll Animation Observer with stagger effect
const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -100px 0px'
};

const scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
            // Add stagger delay for multiple elements
            setTimeout(() => {
                entry.target.classList.add('visible');
            }, index * 100);
        }
    });
}, observerOptions);

// Observe all scroll-fade elements
document.addEventListener('DOMContentLoaded', () => {
    const scrollElements = document.querySelectorAll('.scroll-fade');
    scrollElements.forEach(el => scrollObserver.observe(el));

    // Add smooth reveal to sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
    });

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    sections.forEach(section => sectionObserver.observe(section));
});

// Smooth scroll to section
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Open waitlist modal (placeholder function)
function openWaitlist() {
    // Create a simple modal overlay
    const modal = document.createElement('div');
    modal.className = 'waitlist-modal';
    modal.innerHTML = `
        <div class="modal-overlay" onclick="closeWaitlist()"></div>
        <div class="modal-content">
            <button class="modal-close" onclick="closeWaitlist()" aria-label="Close modal">&times;</button>
            <h2 class="modal-title">Join the Waitlist</h2>
            <p class="modal-description">Be the first to know when Organizo launches. We'll send you gentle updates.</p>
            <form class="waitlist-form" onsubmit="handleWaitlistSubmit(event)">
                <input 
                    type="email" 
                    class="waitlist-input" 
                    placeholder="Enter your email" 
                    required 
                    aria-label="Email address"
                />
                <button type="submit" class="btn-primary">Join Waitlist</button>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    // Add styles for modal
    const style = document.createElement('style');
    style.textContent = `
        .waitlist-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s ease-out;
        }
        
        .modal-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(58, 66, 56, 0.7);
            backdrop-filter: blur(8px);
        }
        
        .modal-content {
            position: relative;
            background: var(--color-warm-white);
            padding: 3rem 2.5rem;
            border-radius: var(--radius-lg);
            max-width: 500px;
            width: 90%;
            box-shadow: var(--shadow-lg);
            animation: slideUp 0.4s ease-out;
        }
        
        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .modal-close {
            position: absolute;
            top: 1rem;
            right: 1rem;
            background: none;
            border: none;
            font-size: 2rem;
            color: var(--color-text-light);
            cursor: pointer;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: var(--transition-smooth);
        }
        
        .modal-close:hover {
            background: var(--color-sage-light);
            color: white;
        }
        
        .modal-title {
            font-family: var(--font-heading);
            font-size: 2rem;
            margin-bottom: 1rem;
            color: var(--color-text-primary);
            text-align: center;
        }
        
        .modal-description {
            text-align: center;
            color: var(--color-text-secondary);
            margin-bottom: 2rem;
            line-height: 1.7;
        }
        
        .waitlist-form {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }
        
        .waitlist-input {
            padding: 1rem 1.5rem;
            border: 2px solid var(--color-sage-light);
            border-radius: var(--radius-full);
            font-family: var(--font-body);
            font-size: 1rem;
            transition: var(--transition-smooth);
            background: white;
        }
        
        .waitlist-input:focus {
            outline: none;
            border-color: var(--color-sage);
            box-shadow: 0 0 0 4px rgba(168, 181, 160, 0.1);
        }
        
        .waitlist-form .btn-primary {
            width: 100%;
            margin-top: 0.5rem;
        }
        
        .success-message {
            text-align: center;
            padding: 2rem;
        }
        
        .success-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
        }
        
        .success-title {
            font-family: var(--font-heading);
            font-size: 1.75rem;
            color: var(--color-text-primary);
            margin-bottom: 0.5rem;
        }
        
        .success-text {
            color: var(--color-text-secondary);
            line-height: 1.7;
        }
        
        @media (max-width: 768px) {
            .modal-content {
                padding: 2rem 1.5rem;
            }
            
            .modal-title {
                font-size: 1.5rem;
            }
        }
    `;

    if (!document.getElementById('modal-styles')) {
        style.id = 'modal-styles';
        document.head.appendChild(style);
    }

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    // Focus on input
    setTimeout(() => {
        const input = modal.querySelector('.waitlist-input');
        if (input) input.focus();
    }, 100);
}

// Close waitlist modal
function closeWaitlist() {
    const modal = document.querySelector('.waitlist-modal');
    if (modal) {
        modal.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
            modal.remove();
            document.body.style.overflow = '';
        }, 300);
    }
}

// Handle waitlist form submission
function handleWaitlistSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const email = form.querySelector('.waitlist-input').value;

    // Simulate submission (replace with actual API call)
    console.log('Waitlist signup:', email);

    // Show success message
    const modalContent = document.querySelector('.modal-content');
    if (modalContent) {
        modalContent.innerHTML = `
            <button class="modal-close" onclick="closeWaitlist()" aria-label="Close modal">&times;</button>
            <div class="success-message">
                <div class="success-icon">🌿</div>
                <h3 class="success-title">Welcome to Organizo!</h3>
                <p class="success-text">
                    Thank you for joining our waitlist. We'll send you gentle updates as we prepare to launch.
                </p>
            </div>
        `;
    }

    // Auto-close after 3 seconds
    setTimeout(() => {
        closeWaitlist();
    }, 3000);
}

// Add fadeOut animation
const fadeOutStyle = document.createElement('style');
fadeOutStyle.textContent = `
    @keyframes fadeOut {
        from {
            opacity: 1;
        }
        to {
            opacity: 0;
        }
    }
`;
document.head.appendChild(fadeOutStyle);

// Keyboard navigation for modal
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeWaitlist();
    }
});

// Add smooth parallax effect to hero shapes (optional enhancement)
let lastScrollY = window.scrollY;

window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    const shapes = document.querySelectorAll('.shape');

    shapes.forEach((shape, index) => {
        const speed = 0.5 + (index * 0.2);
        const yPos = -(scrollY * speed);
        shape.style.transform = `translateY(${yPos}px)`;
    });

    lastScrollY = scrollY;
}, { passive: true });

// Add gentle hover effect to feature cards
document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.feature-card, .benefit-card');

    cards.forEach(card => {
        card.addEventListener('mouseenter', function () {
            this.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        });
    });
});

// Performance optimization: Debounce scroll events
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Log page load for analytics (placeholder)
console.log('%c🌿 Organizo - Structure your life, gently.',
    'color: #A8B5A0; font-size: 16px; font-weight: bold; font-family: Poppins, sans-serif;');
console.log('%cWelcome to a calmer way of staying productive.',
    'color: #7A8A72; font-size: 12px; font-family: Inter, sans-serif;');
