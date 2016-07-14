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
                styledHeight = dom.style(node, 'height'),
                speed = options.speed || 200,
                transition = 'all '+speed+'ms ease';

            console.log('styledHeight', styledHeight, 'begHeight', begHeight, 'endHeight', endHeight, 'actualHeight', actualHeight);
            //console.log('sizes', sizes);

            if(immediate || styledHeight === endHeight){
                dom.style(node, {
                    transition: '',
                    height: endHeight === 'auto' ? '' : endHeight + 'px',
                    display: !!endHeight ? '' : 'none',
                    paddingTop: endHeight ? sizes.padTop + 'px' : 0,
                    paddingBottom: endHeight ? sizes.padBot + 'px' : 0
                });
                if(callback){
                    tick(callback);
                }
                return;
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
                dom.style(node, {
                    transition: '',
                    height: endHeight === 'auto' ? '' : endHeight + 'px',
                    display: !!endHeight ? '' : 'none'
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
            // TODO: make opacity:0 + display:none optional with options.display

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

        scale: function (node, options) {

            var
                startOpacity = options.startOpacity === undefined ? 1 : options.startOpacity,
                endOpacity = options.opacity === undefined ? 1 : options.opacity,
                startScale = getScale(options, node),
                endScale = options.scale === undefined ? 1 : options.scale,
                speed = options.speed || 150,
                delay = options.delay || 1,
                orgPosition = node.style.position;

            dom.style(node, {
                position: 'absolute',
                opacity: startOpacity,
                transform: 'scaleX('+startScale+') scaleY('+startScale+')'
            });

            handleCallback(node, false, options.callback);

            on.once(node, 'transitionend', function() {
                dom.style(node, {
                    position: orgPosition,
                    transition: ''
                });
            });

            setTimeout(function () {
                dom.style(node, {
                    transition: 'transform '+speed+'ms ease-in, opacity '+speed+'ms ease-in 50ms'
                });
                tick(function() {
                    dom.style(node, {
                        opacity: endOpacity,
                        transform: 'scaleX('+endScale+') scaleY('+endScale+')'
                    });
                });
            }, delay);
        },

        zoom: {
            in: function (node, options) {
                var defaults = {
                    opacity: 0,
                    startScale: 0.2,
                    scale: 1,
                    speed: options.speed || 200,
                    delay: options.startDelay || 1
                };
                fx.scale(node, defaults);
            },

            out: function () {
                throw new Error('fx.zoom.out is not implemented');
            }
        }
    };

    function getScale (options, node) {
        if(options.startScale !== undefined){
            return options.startScale;
        }
        var num, r, trans = node.style.transform;
        if(!trans){ return 1; }
        r = /\d*\d\.*\d*/.exec(trans);
        if(!r){ return null; }
        num = parseInt(r[0], 0);
        if(isNaN(num)){ return 1; }
        return num;
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

        box.height = box.height - padTop - padBot;
        box.padTop = padTop;
        box.padBot = padBot;
        box.boxSizing = boxSizing;

        return box;

    }

    window.fx = fx;
}());