(function () {

    'use strict';
    // fx.js
    // component effect functions
    //
    // confirmed: need double requestAnimationFrame for height and edge cases

    function handleCallback(node, immediate, callback, type) {
        var cb = typeof immediate === 'function' ? immediate : typeof callback === 'function' ? callback : null;
        if (cb && immediate !== true) {
            alloy.on.once(node, 'transitionend', function() {
                cb();
            });
        }
    }

    var fx = {

        collapse: function(node, immediate, callback, targetHeight) {
            if (immediate === true) {
                node._collapsed = 1;
                if (targetHeight) {
                    node.style.display = '';
                    node.style.height  = targetHeight + 'px';
                } else {
                    node.style.display = 'none';
                    node.style.height  = '';
                }
                if (callback) {
                    callback();
                }
                return;
            }

            node.style.height  = '';

            var
                cls = 'transition-height',
                height = this.getContentHeight(node);

            node._collapsed = 1;
            node.style.height = height + 'px';
            node.classList.add(cls);

            alloy.on.once(node, 'transitionend', function() {
                node.classList.remove(cls);
                if (!targetHeight && node._collapsed === 1) {
                    node.style.display = 'none';
                    node.style.height  = '';
                }
            });
            handleCallback(node, immediate, callback, 'collapse');
            alloy.defer.nextTick(function() {
                node.style.height = targetHeight ? targetHeight + 'px' : '0';
            });
        },

        expand: function(node, immediate, callback, startHeight) {
            if (immediate === true) {
                node._collapsed = 0;
                node.style.display = '';
                node.style.height  = '';
                if (callback) {
                    callback();
                }
                return;
            }

            node.style.height  = '';

            var
                cls = 'transition-height',
                height = this.getContentHeight(node);

            node._collapsed = 0;
            node.style.height = startHeight ? startHeight + 'px': '0';
            node.classList.add(cls);
            node.style.display = '';

            alloy.on.once(node, 'transitionend', function() {
                if (node._collapsed == 0) {
                    node.classList.remove(cls);
                    node.style.height = '';
                }
            });
            handleCallback(node, immediate, callback, 'expand');
            alloy.defer.nextTick(function() {
                node.style.height = height ? height + 'px' : '0';
            });
        },

        fade: {
            out: function(node, options) {
                // TODO: allow for different animation duration

                options = options || {};
                var
                    immediate = options.immediate,
                    callback = options.callback,
                    cls = 'fadeable';

                if (immediate === true || dom.style(node, 'opacity') === 0) {
                    node.style.opacity = 0;
                    if (callback) {
                        alloy.defer.nextTick(function() {
                            callback();
                        });
                    }
                    return;
                }

                node.classList.add(cls);
                alloy.on.once(node, 'transitionend', function() {
                    node.classList.remove(cls);
                    node.style.display = 'none';
                });
                handleCallback(node, immediate, callback);
                alloy.defer.nextTick(function() {
                    node.style.opacity = 0;
                });
            },
            in: function(node, options) {

                options = options || {};
                var
                    opacity = options.opacity || 1,
                    immediate = options.immediate,
                    callback = options.callback,
                    cls = 'fadeable';
                if (immediate === true || dom.style(node, 'opacity') === opacity) {
                    node.style.opacity = opacity;
                    if (callback) {
                        alloy.defer.nextTick(function() {
                            callback();
                        });
                    }
                    return;
                }
                node.style.display = 'block';
                node.style.opacity = 0;
                node.classList.add(cls);
                alloy.on.once(node, 'transitionend', function() {
                    node.classList.remove(cls);
                });
                handleCallback(node, immediate, callback);
                setTimeout(function () {
                    node.style.opacity = opacity;
                }, 100);
            }
        },

        zoom: {
            in: function (node, options) {
                options = options || {};

                var
                    startopacity = options.startOpacity || 0,
                    startScale = options.startScale || .2,
                    endOpacity = options.endOpacity || 1,
                    endScale = options.endScale || 1,
                    speed = options.speed || 150,
                    startDelay = options.delay || 20,
                    display = options.display || 'block';

                dom.style(node, {
                    display: display,
                    opacity: startopacity,
                    transform: alloy.tmpl('scaleX(${scale}) scaleY(${scale})', {scale: startScale})
                });

                handleCallback(node, false, options.callback);

                setTimeout(function () {
                    dom.style(node, {
                        transition: alloy.tmpl('transform ${speed}ms ease-in, opacity ${speed}ms ease-in 50ms', {speed: speed})
                    });
                    alloy.defer.nextTick(function() {
                        dom.style(node, {
                            opacity: endOpacity,
                            transform: alloy.tmpl('scaleX(${scale}) scaleY(${scale})', {scale: endScale})
                        });
                    });
                }, startDelay);
            },

            out: function () {
                throw new Error('alloy.fx.zoom.out is not implemented');
            }
        },

        overlay: {
            show: function() {
                if (this.isOverlayShowing) {
                    return;
                }
                this.isOverlayShowing = true;
                this.overlayNode = this.overlayNode || dom('div', {
                        className: 'ay-overlay'
                    }, document.body);
                alloy.defer.nextTick(function() {
                    this.overlayNode.classList.add('show');
                }.bind(this));
                return this.overlayNode;
            },
            hide: function() {
                if (!this.isOverlayShowing) {
                    return;
                }
                this.isOverlayShowing = false;
                alloy.on.once(this.overlayNode, 'transitionend', function() {
                    if (!this.isOverlayShowing) {
                        dom.destroy(this.overlayNode);
                        this.overlayNode = null;
                    } else {
                        // it was reopened while we were closing
                        this.overlayNode.classList.add('show');
                    }
                }.bind(this));
                this.overlayNode.classList.remove('show');
            }
        },

        getContentHeight: function(node) {
            if (!node) {
                return 0;
            }

            var previousHeight = node.style.height,
                previousHeightInPx = parseInt(previousHeight, 10);

            if (previousHeightInPx > 0) {
                return previousHeightInPx;
            }

            var
                height,
                previousDisplay = node.style.display;

            node.style.height = '';
            node.style.display = '';

            height = node === window ? node.innerHeight : node.getBoundingClientRect().height;

            node.style.height = previousHeight;
            node.style.display = previousDisplay;

            return height;
        }
    };

    window.fx = fx;
}());