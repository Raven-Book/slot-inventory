(() => {
    'use strict';
    class Popup {
        static darkMode = true;
        static #instance = null;
        static #queue = [];
        static #isShowing = false;
        

        static info(title, content = '', duration = 3000) {
            this.#show(title, content, duration, 'info');
            return this;
        }

        static success(title, content = '', duration = 3000) {
            this.#show(title, content, duration, 'success');
            return this;
        }

        static warn(title, content = '', duration = 3000) {
            this.#show(title, content, duration, 'warn');
            return this;
        }

        static error(title, content = '', duration = 3000) {
            this.#show(title, content, duration, 'error');
            return this;
        }

        static debug(title, content = '', duration = 3000) {
            this.#show(title, content, duration, 'debug');
            return this;
        }

        static #show(title, content = '', duration = 3000, type = 'info') {
            title = title || '请输入标题';
            if (!this.#instance) {
                this.#instance = new Popup();
            }

            this.#queue.push({title, content, duration, type});
            
            if (!this.#isShowing) {
                this.#showNext();
            }
        }

        static #showNext() {
            if (this.#queue.length === 0) {
                this.#isShowing = false;
                return;
            }

            this.#isShowing = true;
            const {title, content, duration, type} = this.#queue.shift();
            
            const popup = $('<div>')
                .addClass(`custom-popup popup-${type}`)
                .toggleClass('dark-mode', this.darkMode)
                .append(
                    $('<div>').addClass('popup-progress'),
                    $('<div>').addClass('popup-close').text('×'),
                    $('<div>').addClass('popup-title').text(title),
                    content ? $('<div>').addClass('popup-content').html(content) : null
                )
                .appendTo(document.body);

            const progressBar = popup.find('.popup-progress');
            
            let animationFrameId = null;
            let isPaused = false;
            let remainingTime = duration;
            let wasPlayingBeforeHidden = false;
            let lastTimestamp = null;

            function updateProgress(timestamp) {
                if (!lastTimestamp) {
                    lastTimestamp = timestamp;
                    return requestAnimationFrame(updateProgress);
                }

                if (!isPaused) {
                    const deltaTime = timestamp - lastTimestamp;
                    remainingTime = Math.max(0, remainingTime - deltaTime);
                    
                    const progress = 1 - (remainingTime / duration);
                    const width = Math.max(0, (1 - progress) * 100);
                    
                    progressBar.css('transform', `translateX(-${100 - width}%)`);
                    
                    if (remainingTime > 0) {
                        lastTimestamp = timestamp;
                        animationFrameId = requestAnimationFrame(updateProgress);
                    } else {
                        hidePopup();
                    }
                }
            }

            function startTimer() {
                if (!isPaused) {
                    lastTimestamp = null;
                    animationFrameId = requestAnimationFrame(updateProgress);
                }
            }

            function pauseTimer() {
                if (animationFrameId) {
                    cancelAnimationFrame(animationFrameId);
                    animationFrameId = null;
                    lastTimestamp = null;
                }
            }

            function resumeTimer() {
                if (!isPaused) {
                    startTimer();
                }
            }

            function hidePopup() {
                if (animationFrameId) {
                    cancelAnimationFrame(animationFrameId);
                    animationFrameId = null;
                }
                
                popup.removeClass('show');
                
                setTimeout(() => {
                    popup.remove();
                    Popup.#showNext();
                }, 400);
            }


            requestAnimationFrame(() => {
                popup.addClass('show');
                startTimer();
            });


            popup.hover(
                () => {
                    isPaused = true;
                    pauseTimer();
                },
                () => {
                    isPaused = false;
                    resumeTimer();
                }
            );


            const handleVisibilityChange = () => {
                if (document.hidden) {
                    wasPlayingBeforeHidden = !isPaused;
                    if (!isPaused) {
                        isPaused = true;
                        pauseTimer();
                    }
                } else {
                    if (wasPlayingBeforeHidden) {
                        isPaused = false;
                        resumeTimer();
                    }
                }
            };

            $(document).on('visibilitychange', handleVisibilityChange);


            const cleanup = () => {
                $(document).off('visibilitychange', handleVisibilityChange);
            };

            popup.find('.popup-close').click(() => {
                cleanup();
                hidePopup();
            });


            const originalHidePopup = hidePopup;
            hidePopup = () => {
                cleanup();
                originalHidePopup();
            };
        }
    }

    setup.Popup = Popup;
    window.Popup = window.Popup || Popup;

})();