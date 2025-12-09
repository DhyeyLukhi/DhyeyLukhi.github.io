const {
    gsap: { registerPlugin, set, to, timeline },
    MorphSVGPlugin,
    Draggable,
} = window;

registerPlugin(MorphSVGPlugin);

// Used to calculate distance of "tug"
let startX;
let startY;

const AUDIO = {
    CLICK: new Audio('https://assets.codepen.io/605876/click.mp3'),
};

// Initialize theme based on current time
function getInitialThemeState() {
    const now = new Date();
    const hours = now.getHours();

    // Between 7 AM (7) and 7 PM (19): Light mode (bulb OFF)
    // Between 7 PM (19) and 7 AM (7): Dark mode (bulb ON)
    if (hours >= 7 && hours < 19) {
        // Daytime: Light mode, bulb should be OFF
        return false;
    } else {
        // Nighttime: Dark mode, bulb should be ON
        return true;
    }
}

const STATE = {
    ON: getInitialThemeState(),
};

const CORD_DURATION = 0.1;

const CORDS = document.querySelectorAll('.toggle-scene__cord');
const HIT = document.querySelector('.toggle-scene__hit-spot');
const DUMMY = document.querySelector('.toggle-scene__dummy-cord');
const DUMMY_CORD = document.querySelector('.toggle-scene__dummy-cord line');
const PROXY = document.createElement('div');

// set init position
const ENDX = DUMMY_CORD.getAttribute('x2');
const ENDY = DUMMY_CORD.getAttribute('y2');

const RESET = () => {
    set(PROXY, {
        x: ENDX,
        y: ENDY,
    });
};

RESET();

// Helper: Map STATE.ON to CSS --on value
// If STATE.ON is true (bulb is on), CSS --on = 1 for dark mode
// If STATE.ON is false (bulb is off), CSS --on = 0 for light mode
function getCssOnValue() {
    return STATE.ON ? 1 : 0;
}

// Set initial theme based on time
set(document.documentElement, { '--on': getCssOnValue() });


const CORD_TL = timeline({
    paused: true,
    onStart: () => {
        STATE.ON = !STATE.ON;
        set(document.documentElement, { '--on': getCssOnValue() });
        set([DUMMY, HIT], { display: 'none' });
        set(CORDS[0], { display: 'block' });
        AUDIO.CLICK.play();
    },
    onComplete: () => {
        set([DUMMY, HIT], { display: 'block' });
        set(CORDS[0], { display: 'none' });
        RESET();
    },
});

for (let i = 1; i < CORDS.length; i++) {
    CORD_TL.add(
        to(CORDS[0], {
            morphSVG: CORDS[i],
            duration: CORD_DURATION,
            repeat: 1,
            yoyo: true,
        })
    );
}

Draggable.create(PROXY, {
    trigger: HIT,
    type: 'x,y',
    onPress: e => {
        startX = e.x;
        startY = e.y;
    },
    onDrag: function () {
        set(DUMMY_CORD, {
            attr: {
                x2: this.x,
                y2: this.y,
            },
        });
    },
    onRelease: function (e) {
        const DISTX = Math.abs(e.x - startX);
        const DISTY = Math.abs(e.y - startY);
        const TRAVELLED = Math.sqrt(DISTX * DISTX + DISTY * DISTY);
        to(DUMMY_CORD, {
            attr: { x2: ENDX, y2: ENDY },
            duration: CORD_DURATION,
            onComplete: () => {
                if (TRAVELLED > 50) {
                    CORD_TL.restart();
                } else {
                    RESET();
                }
            },
        });
    },
});
