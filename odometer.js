/**
 * Odometer Animation System
 * Creates rolling number animations for 4-digit displays
 */

class Odometer {
    constructor(container, targetValue, duration = 1500) {
        this.container = container;
        this.targetValue = String(targetValue).padStart(4, '0');
        this.duration = duration;
        this.digits = [];
        this.init();
    }

    init() {
        // Create 4 digit elements
        for (let i = 0; i < 4; i++) {
            const digitWrapper = document.createElement('div');
            digitWrapper.className = 'odometer-digit';

            const digitInner = document.createElement('div');
            digitInner.className = 'odometer-digit-inner';

            // Create column of numbers 0-9 (plus extra for smooth rolling)
            for (let num = 0; num <= 9; num++) {
                const span = document.createElement('span');
                span.textContent = num;
                digitInner.appendChild(span);
            }

            digitWrapper.appendChild(digitInner);
            this.container.appendChild(digitWrapper);
            this.digits.push(digitInner);
        }
    }

    animate() {
        // Start animation after a small delay for better visual effect
        setTimeout(() => {
            this.digits.forEach((digitInner, index) => {
                const targetDigit = parseInt(this.targetValue[index]);

                // Calculate how far to scroll
                // Each digit is 32px tall (or 28px on mobile)
                const digitHeight = digitInner.querySelector('span').offsetHeight;
                const scrollDistance = targetDigit * digitHeight;

                // Apply transform to scroll to the target digit
                digitInner.style.transform = `translateY(-${scrollDistance}px)`;
            });
        }, 100);
    }

    setValue(newValue) {
        this.targetValue = String(newValue).padStart(4, '0');
        this.animate();
    }
}

/**
 * Initialize odometers for all time icons
 * Fetches real Chess.com ratings for the user
 */
async function fetchChessRatings(username) {
    try {
        const response = await fetch(`https://api.chess.com/pub/player/${username}/stats`);
        const data = await response.json();

        // Extract ratings from the API response
        const ratings = {
            'bullet': data.chess_bullet?.last?.rating || 0,
            'blitz': data.chess_blitz?.last?.rating || 0,
            'rapid': data.chess_rapid?.last?.rating || 0,
            'daily': data.chess_daily?.last?.rating || 0,
            // Chess960 - only rapid time format
<<<<<<< HEAD
            'live960': data.chess960_rapid?.last?.rating || 724
=======
            'live960': data.chess960_rapid?.last?.rating || 697
>>>>>>> 31974b7 (Minor updates)
        };

        return ratings;
    } catch (error) {
        console.error('Failed to fetch Chess.com ratings:', error);
        // Return default values if fetch fails
        return {
            'bullet': 0,
            'blitz': 0,
            'rapid': 0,
            'daily': 0,
            'live960': 0
        };
    }
}

async function initializeOdometers() {
    // Fetch ratings from Chess.com
    const username = 'dhyey_009';
    const odometerData = await fetchChessRatings(username);

    // Find all time icons and add odometers
    document.querySelectorAll('.time-icon').forEach(icon => {
        // Get the icon type from class list
        const iconType = Array.from(icon.classList).find(cls =>
            ['bullet', 'blitz', 'rapid', 'daily', 'live960'].includes(cls)
        );

        if (iconType && odometerData[iconType] !== undefined) {
            // Create wrapper if not already wrapped
            if (!icon.parentElement.classList.contains('time-icon-wrapper')) {
                const wrapper = document.createElement('div');
                wrapper.className = 'time-icon-wrapper';
                icon.parentNode.insertBefore(wrapper, icon);
                wrapper.appendChild(icon);

                // Create odometer container
                const odometerContainer = document.createElement('div');
                odometerContainer.className = 'odometer-container';
                odometerContainer.dataset.type = iconType;
                wrapper.appendChild(odometerContainer);

                // Initialize odometer
                const odometer = new Odometer(odometerContainer, odometerData[iconType]);

                // Start animation when page loads
                if (document.readyState === 'complete') {
                    odometer.animate();
                } else {
                    window.addEventListener('load', () => odometer.animate());
                }

                // Store reference for later updates if needed
                odometerContainer._odometerInstance = odometer;
            }
        }
    });
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeOdometers);
} else {
    initializeOdometers();
}

// Export for external use
window.Odometer = Odometer;
window.updateOdometer = function (iconType, newValue) {
    const container = document.querySelector(`.odometer-container[data-type="${iconType}"]`);
    if (container && container._odometerInstance) {
        container._odometerInstance.setValue(newValue);
    }
};
