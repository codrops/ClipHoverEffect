import { lettersAndSymbols } from './utils.js';

// Class representing a Card
export class Card {
    // Initialize DOM and style related properties
    DOM = {
        // main DOM element
        el: null,
        // .card__img element
        img: null,
        // .card__img-wrap element (dynamically created in the layout function)
        imgWrap: null,
        // .card__img-inner "slice" elements (dynamically created in the layout function)
        slices: null,
        // .card__date element
        date: null,
        // .card__title element
        title: null,
        // .card__link element
        link: null,
    };
    // Card image url
    imageURL;
    // Settings
    settings = {
        // vertical || horizontal alignment
        orientation: 'vertical', 
        // Total number of slices for the inner images (clip paths)
        slicesTotal: 5,
        // Animation values
        animation: {
            duration: 0.5,
            ease: 'power3.inOut'
        }
    };
    
    /**
     * Sets up the necessary elements, data, and event listeners for a Card instance.
     * @param {HTMLElement} DOM_el - The DOM element that represents the card.
     * @param {Object} options - The options for customizing the card. These options will override the default settings.
     */
    constructor(DOM_el, options) {
        // Merge settings and options.
        this.settings = Object.assign({}, this.settings, options);

        this.DOM.el = DOM_el;
        this.DOM.img = this.DOM.el.querySelector('.card__img');
        this.DOM.date = this.DOM.el.querySelector('.card__date');
        this.DOM.title = this.DOM.el.querySelector('.card__title');
        this.DOM.link = this.DOM.el.querySelector('.card__link');

        // Splitting chars for date, title and link
        this.chars = {
            date: [...this.DOM.date.querySelectorAll('.char')],
            title: [...this.DOM.title.querySelectorAll('.char')],
            link: [...this.DOM.link.querySelectorAll('.char')]
        };
        
        // Save those initial char values
        [...this.chars.date, ...this.chars.title, ...this.chars.link].forEach(char => {
            char.dataset.initial = char.innerHTML;
        });

        // Extracts the image URL from the style of the DOM image element
        this.imageURL = this.DOM.img.getAttribute('style').match(/url\((['"])?(.*?)\1\)/)[2];

        // Calls the `layout` function to create the necessary structure for the card
        this.layout();

        // Initialize the events
        this.initEvents();
    }

    /**
     * Modifies the layout of the card image, slicing it into multiple sections.
     *
     * This function creates a structure with multiple image slices within the .card__img element.
     * The number of slices is determined by the `slicesTotal` setting.
     * Each slice is an element with the class .card__img-inner and contains the same background image as the .card__img.
     * These slices are placed within a wrapper element .card__img-wrap, which is appended to the .card__img.
     *
     * After creating the slices, the function sets the appropriate CSS variable to match `slicesTotal` (either --columns or --rows).
     * Finally, it calls `setClipPath` to apply a clip-path to each slice.
     */
    layout() {
        /**
         * Create the following structure for the .card__img element with X slices (card__img-inner) 
         * 
         * <div class="card__img" style="background-image:url(img/img1.jpg)">
         *  <div class="card__img-wrap">
         *    <div class="card__img-inner" style="background-image:url(img/img1.jpg)"></div>
         *    <div class="card__img-inner" style="background-image:url(img/img1.jpg)"></div>
         *    <div class="card__img-inner" style="background-image:url(img/img1.jpg)"></div>
         *    <div class="card__img-inner" style="background-image:url(img/img1.jpg)"></div>
         *  </div>
         * </div>
         */

        this.DOM.imgWrap = document.createElement('div');
        this.DOM.imgWrap.classList = 'card__img-wrap';
        let slicesStr = '';
        for (let i = 0; i < this.settings.slicesTotal; ++i) {
            slicesStr += `<div class="card__img-inner" style="background-image:url(${this.imageURL})"></div>`;
        }
        this.DOM.imgWrap.innerHTML = slicesStr;
        this.DOM.slices = this.DOM.imgWrap.querySelectorAll('.card__img-inner');
        // append the new wrap element to the card img element
        this.DOM.img.appendChild(this.DOM.imgWrap);
        // Set the --columns or --rows CSS variable value to be the same as the settings.slicesTotal
        this.DOM.img.style.setProperty(this.settings.orientation === 'vertical' ? '--columns' : '--rows', this.settings.slicesTotal);

        // Set the clip paths of each slice
        this.setClipPath();
    }

    /**
     * Sets a clip-path CSS property for each slice in this object, creating a slicing effect.
     * 
     * The function divides each slice along either the vertical or horizontal axis depending on 
     * the `orientation` setting. The slicing is based on the `slicesTotal` setting.
     * It also offsets each slice slightly to solve gap issues.
     */
    setClipPath() {
        this.DOM.slices.forEach((slice, position) => {
            let a1 = position*100/this.settings.slicesTotal;
            let b1 = position*100/this.settings.slicesTotal + 100/this.settings.slicesTotal;

            gsap.set(slice, {
                clipPath: this.settings.orientation === 'vertical' ? 
                    `polygon(${a1}% 0%, ${b1}% 0%, ${b1}% 100%, ${a1}% 100%)` :
                    `polygon(0% ${a1}%, 100% ${a1}%, 100% ${b1}%, 0% ${b1}%)`
            });
            const isVertical = this.settings.orientation === 'vertical';
            gsap.set(slice, { [isVertical ? 'left' : 'top']: position*-1 });
        });
    }

    /**
     * Initializes event listeners for mouseenter and mouseleave events.
     */
    initEvents() {
        this.onMouseenterFn = () => this.mouseEnter();
        this.onMouseleaveFn = () => this.mouseLeave();
        
        this.DOM.el.addEventListener('mouseenter', this.onMouseenterFn);
        this.DOM.el.addEventListener('mouseleave', this.onMouseleaveFn);
    }
    
    /**
     * Triggers when the mouse enters the element.
     * 
     * This function shuffles the characters of the date, title, and link properties of this object, 
     * and then animates the image and image wrapper elements from an offset position into view.
     * The direction of the animation (vertical or horizontal) depends on the `orientation` setting.
     * The slices of the image also animate from a random offset position into view.
     */
    mouseEnter() {
        const isVertical = this.settings.orientation === 'vertical';

        this.shuffleChars(this.chars.date);
        this.shuffleChars(this.chars.title);
        this.shuffleChars(this.chars.link);

        gsap
        .timeline({
            defaults: {
                duration: this.settings.animation.duration,
                ease: this.settings.animation.ease
            }
        })
        .addLabel('start', 0)
        .fromTo(this.DOM.img, {
            [isVertical ? 'yPercent' : 'xPercent']: 100,
            opacity: 0
        }, {
            [isVertical ? 'yPercent' : 'xPercent']: 0,
            opacity: 1
        }, 'start')
        .fromTo(this.DOM.imgWrap, {
            [isVertical ? 'yPercent' : 'xPercent']: -100
        }, {
            [isVertical ? 'yPercent' : 'xPercent']: 0
        }, 'start')
        .fromTo(this.DOM.slices, {
            [isVertical ? 'yPercent' : 'xPercent']: pos => pos % 2 ? gsap.utils.random(-75, -25) : gsap.utils.random(25, 75)
        }, {
            [isVertical ? 'yPercent' : 'xPercent']: 0
        }, 'start');
    }
    
    /**
     * Triggers when the mouse leaves the element.
     * 
     * This function animates the image, the image wrapper, and the slices out of view.
     * The direction of the animation (vertical or horizontal) depends on the `orientation` setting.
     */
    mouseLeave() {
        const isVertical = this.settings.orientation === 'vertical';

        gsap
        .timeline({
            defaults: {
                duration: this.settings.animation.duration,
                ease: this.settings.animation.ease
            }
        })
        .addLabel('start', 0)
        .to(this.DOM.img, {
            [isVertical ? 'yPercent' : 'xPercent']: 100,
            opacity: 0
        }, 'start')
        .to(this.DOM.imgWrap, {
            [isVertical ? 'yPercent' : 'xPercent']: -100
        }, 'start')
        .to(this.DOM.slices, {
            [isVertical ? 'yPercent' : 'xPercent']: pos => pos % 2 ? gsap.utils.random(-75, 25) : gsap.utils.random(25, 75)
        }, 'start')
    }

    /**
     * Shuffles the inner HTML of each character in the array, randomizing it 3 times 
     * and eventually setting it back to its initial value.
     *
     * @param {Element[]} arr - An array of DOM elements representing individual characters.
     * Each element must have a 'data-initial' attribute that stores its initial value.
     */
    shuffleChars(arr) {
        arr.forEach((char, position) => {
            gsap.killTweensOf(char);
            gsap.fromTo(char, {
                opacity: 0
            }, {
                duration: 0.03,
                innerHTML: () => lettersAndSymbols[Math.floor(Math.random() * lettersAndSymbols.length)],
                repeat: 3,
                repeatRefresh: true,
                opacity: 1,
                repeatDelay: 0.05,
                onComplete: () => gsap.set(char, {innerHTML: char.dataset.initial, delay: 0.03}),
            })
        });
    }
}