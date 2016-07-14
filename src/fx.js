(function () {

    'use strict';
    // fx.js
    // component effect functions
    //
    // confirmed: need double requestAnimationFrame for height and edge cases

    function handleCallback(node, immediate, callback, type) {
        var cb = typeof immediate === 'function' ? immediate : typeof callback === 'function' ? callback : null;
        if (cb && immediate !== true) {
            on.once(node, 'transitionend', function() {
                setTimeout(cb, 500);
                //cb();
            });
        }
    }

    // TODO: a special function for handling multiple animations with a single transitionend

    function tick (callback) {
        window.requestAnimationFrame(callback);
    }

    var fx = {

        height: function (node, options) {
            var
                callback = options.callback,
                immediate = options.immediate || false,
                sizes = getSizes(node),
                actualHeight = sizes.height,
                begHeight = sizes.height,
                endHeight = options.height || 0,
                speed = options.speed || 200,
                transition = 'all '+speed+'ms ease';

            //console.log('begHeight', begHeight, 'endHeight', endHeight, 'actualHeight', actualHeight);
            //console.log('sizes', sizes);

            if(immediate){

            }

            if(endHeight === 'auto' && sizes.boxSizing === 'border-box'){
                endHeight = actualHeight + sizes.padBot + sizes.padTop;
            }

            dom.style(node, {
                overflow: 'hidden',
                transition: transition,
                height: begHeight,
                display: ''
            });

            on.once(node, 'transitionend', function() {
                var hProp = endHeight === 'auto' ? '' : endHeight + 'px',
                    dProp = !!endHeight ? '' : 'none';
                dom.style(node, {
                    transition: '',
                    height: hProp,
                    display: dProp
                });
            });
            handleCallback(node, immediate, callback, 'collapse');
            // tick does not work here for some reason
            setTimeout(function() {
                node.style.height = endHeight ? endHeight + 'px' : '0';
                node.style.paddingTop = endHeight ? sizes.padTop + 'px' : 0;
                node.style.paddingBottom = endHeight ? sizes.padBot + 'px' : 0;
            },1);
        },

        collapse: function(node, immediate, callback, height) {
            fx.height(node, {
                immediate: immediate,
                callback: callback,
                height: 0
            });
        },

        expand: function(node, immediate, callback) {
            fx.height(node, {
                immediate: immediate,
                callback: callback,
                height: 'auto'
            });
        },

        opacity: function (node, options) {
            options = options || {};
            var
                immediate = options.immediate,
                callback = options.callback,
                begOpacity = dom.style(node, 'opacity'),
                endOpacity = options.opacity === undefined ? begOpacity < 0.5 ? 1 : 0 : options.opacity,
                speed = options.speed || 400,
                style = 'all '+speed+'ms ease';

            if (immediate === true || dom.style(node, 'opacity') === endOpacity) {
                node.style.opacity = endOpacity;
                if(endOpacity === 0){
                    node.style.display = 'none';
                }
                if (callback) {
                    tick(function() {
                        callback();
                    });
                }
                return;
            }

            dom.style(node, {
                transition:style,
                opacity: begOpacity,
                display: ''
            });

            on.once(node, 'transitionend', function() {
                dom.style(node, {
                    transition:''
                });
                if(endOpacity === 0){
                    node.style.display = 'none';
                }
            });
            handleCallback(node, immediate, callback);
            tick(function() {
                node.style.opacity = endOpacity;
            });
        },

        fade: {
            out: function(node, options) {
                options = options || {};
                options.opacity = options.opacity || 0;
                fx.opacity(node, options);
            },
            in: function(node, options) {
                options = options || {};
                options.opacity = options.opacity || 1;
                fx.opacity(node, options);
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
                on.once(this.overlayNode, 'transitionend', function() {
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
        }
    };

    function getContentHeight (node) {
        if (!node) {
            return 0;
        }

        var
            height,
            previousDisplay,
            previousHeight = node.style.height,
            previousHeightInPx = parseInt(previousHeight, 10);

        if (previousHeightInPx > 0) {
            return previousHeightInPx;
        }

        previousDisplay = node.style.display;

        node.style.height = '';
        node.style.display = '';

        // are we ever animating window??
        height = node === window ? node.innerHeight : node.getBoundingClientRect().height;

        node.style.height = previousHeight;
        node.style.display = previousDisplay;

        return height;
    }

    function getSizes (node) {
        var
            box,
            height,
            padTop,
            padBot,
            boxSizing = dom.style(node, 'box-sizing'),
            prevPadTop = dom.style(node, 'paddingTop'),
            prevPadBot = dom.style(node, 'paddingBottom'),
            previousDisplay = node.style.display,
            previousHeight = dom.style(node, 'height');

        node.style.height = '';
        node.style.display = '';

        dom.style(node, {
            height: '',
            display: '',
            paddingTop: '',
            paddingBottom: ''
        });

        box = dom.box(node);
        padTop = parseInt(dom.style(node, 'paddingTop'), 10);
        padBot = parseInt(dom.style(node, 'paddingBottom'), 10);

        dom.style(node, {
            height: previousHeight,
            display: previousDisplay,
            paddingTop: prevPadTop,
            paddingBottom: prevPadBot
        });

        console.log('box.height padTop padBot', box.height, padTop, padBot);
        box.height = box.height - padTop - padBot;
        box.padTop = padTop;
        box.padBot = padBot;
        box.boxSizing = boxSizing;

        return box;

    }

    window.fx = fx;
}());