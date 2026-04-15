// ── Game Hub Controller — 3D carousel switching ─────────────────────
(() => {
    const hub = document.getElementById('game-hub');
    const cards = [
        document.getElementById('gcard-catch'),
        document.getElementById('gcard-snake'),
        document.getElementById('gcard-reflex')
    ];

    const GAME_META = {
        catch:  { title: 'Monster Catch', sub: 'Catch every drop. Miss one and it\'s over.' },
        snake:  { title: 'Snake Frenzy',  sub: 'Grow your beast. Don\'t bite yourself.' },
        reflex: { title: 'Reflex Rush',   sub: 'Smash the cans. Prove your reflexes.' },
    };

    const sectionTitle = document.getElementById('game-section-title');
    const sectionSub   = document.getElementById('game-section-sub');

    const modules = {
        catch:  window.MonsterCatch,
        snake:  window.SnakeFrenzy,
        reflex: window.ReflexRush,
    };

    let activeIndex = 0;
    let animating   = false;

    function renderCarousel(animate) {
        const isMobile = window.innerWidth <= 600;
        const xOff     = isMobile ? 55 : 70;
        const scale    = isMobile ? 0.7 : 0.75;
        const zOff     = isMobile ? -150 : -200;

        cards.forEach((card, i) => {
            if (!card) return;

            let diff = i - activeIndex;
            if (diff > 1)  diff -= 3;
            if (diff < -1) diff += 3;

            let props;

            if (diff === 0) {
                props = { xPercent: 0, z: 0, rotateY: 0, scale: 1, opacity: 1, zIndex: 10 };
                card.classList.add('game-card--active');
                card.classList.remove('game-card--preview');
            } else if (diff === 1) {
                props = { xPercent: xOff, z: zOff, rotateY: -20, scale, opacity: 0.5, zIndex: 5 };
                card.classList.remove('game-card--active');
                card.classList.add('game-card--preview');
            } else {
                props = { xPercent: -xOff, z: zOff, rotateY: 20, scale, opacity: 0.5, zIndex: 5 };
                card.classList.remove('game-card--active');
                card.classList.add('game-card--preview');
            }

            if (animate) {
                gsap.to(card, { ...props, duration: 0.65, ease: 'expo.out' });
            } else {
                gsap.set(card, props);
            }
        });
    }

    renderCarousel(false);

    function switchTo(i) {
        if (animating || i === activeIndex) return;
        animating = true;

        const prevId = cards[activeIndex].dataset.game;
        if (modules[prevId] && modules[prevId].stop) modules[prevId].stop();

        activeIndex = i;
        renderCarousel(true);

        const meta = GAME_META[cards[i].dataset.game];
        if (meta) {
            gsap.to([sectionTitle, sectionSub], {
                opacity: 0, y: -10, duration: 0.2, ease: 'power2.in',
                onComplete: () => {
                    sectionTitle.textContent = meta.title;
                    sectionSub.textContent   = meta.sub;
                    gsap.to([sectionTitle, sectionSub], { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' });
                }
            });
        }

        setTimeout(() => { animating = false; }, 550);
    }

    function switchNext() {
        switchTo((activeIndex + 1) % cards.length);
    }
    function switchPrev() {
        switchTo((activeIndex + cards.length - 1) % cards.length);
    }

    // ── Click detection (desktop): bounding rect hit testing ──
    // useCapture fires before children. Guard: if click is inside the
    // active card's game-container, don't switch.
    hub.addEventListener('click', (e) => {
        if (animating) return;

        const clickX = e.clientX;
        const clickY = e.clientY;

        // If click is inside active card's game-container, let it through
        const activeContainer = cards[activeIndex].querySelector('.game-container');
        if (activeContainer) {
            const ar = activeContainer.getBoundingClientRect();
            if (clickX >= ar.left && clickX <= ar.right &&
                clickY >= ar.top  && clickY <= ar.bottom) {
                return;
            }
        }

        // Check preview card rects
        for (let i = 0; i < cards.length; i++) {
            if (i === activeIndex) continue;
            const rect = cards[i].getBoundingClientRect();
            if (clickX >= rect.left && clickX <= rect.right &&
                clickY >= rect.top  && clickY <= rect.bottom) {
                switchTo(i);
                return;
            }
        }
    }, true);

    // ── Swipe gesture (mobile): horizontal swipe on hub switches games ──
    let touchStartX = null;
    let touchStartY = null;

    hub.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }, { passive: true });

    hub.addEventListener('touchend', (e) => {
        if (touchStartX === null) return;

        const dx = e.changedTouches[0].clientX - touchStartX;
        const dy = e.changedTouches[0].clientY - touchStartY;
        touchStartX = null;
        touchStartY = null;

        // Only trigger if horizontal swipe dominates (not a scroll)
        const SWIPE_MIN = 50;
        if (Math.abs(dx) < SWIPE_MIN || Math.abs(dy) > Math.abs(dx)) return;

        // Make sure the touch was on/near the hub (not a page scroll that passed through)
        if (dx < 0) {
            switchNext(); // swipe left → go to next game
        } else {
            switchPrev(); // swipe right → go to previous game
        }
    }, { passive: true });

    // Keyboard navigation (← →) as a bonus
    document.addEventListener('keydown', (e) => {
        if (!animating) {
            if (e.key === 'ArrowRight') switchNext();
            if (e.key === 'ArrowLeft')  switchPrev();
        }
    });

    // Entrance animation
    ScrollTrigger.create({
        trigger: hub,
        start: 'top 85%',
        once: true,
        onEnter: () => {
            gsap.from(cards, {
                opacity: 0, y: 60, duration: 0.9, stagger: 0.12, ease: 'expo.out',
                onComplete: () => renderCarousel(false)
            });
        }
    });

    window.addEventListener('resize', () => renderCarousel(false));
})();
