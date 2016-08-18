(function () {

    'use strict';
    // fx.js
    // component effect functions
    //
    // confirmed: need double requestAnimationFrame for height and edge cases

    function handleCallback(node, immediate, callback) {
        var cb = typeof immediate === 'function' ? immediate : typeof callback === 'function' ? callback : null;
        if (cb && immediate !== true) {
            on.once(node, 'transitionend', function() {
                setTimeout(function () {
                    console.log('callback');
                    cb();
                }, 500);
            });
        }
    }

    function tick (callback) {
        window.requestAnimationFrame(callback);
    }

    function getStyle (node, key, value, sizes) {
        if(value !== undefined && value !== 'auto'){
            return value;
        }
        sizes = sizes || getSizes(node);
        //console.log('sizes', sizes);
        if(value !== 'auto' && sizes.current[key] !== undefined && sizes.current[key] !== ''){
            return sizes.current[key];
        }
        return sizes[key];

    }

    function addPaddingStyle (begStyle, endStyle, sizes, key) {
        if(key === 'height'){
            if(endStyle.height === 0){
                endStyle.paddingTop = 0;
                endStyle.paddingBottom = 0;
                begStyle.paddingTop = sizes.padTop + 'px';
                begStyle.paddingBottom = sizes.padBot + 'px';
            }
            else if(begStyle.height === 0){
                endStyle.paddingTop = sizes.padTop + 'px';
                endStyle.paddingBottom = sizes.padBot + 'px';
                begStyle.paddingTop = 0;
                begStyle.paddingBottom = 0;
            }
        }
    }


    var fx = {

        style: function (node, options) {
            // options:
            //  callback
            //  immediate
            //  speed

            var
                keys = {
                    callback:1,
                    immediate:1,
                    delay: 1,
                    speed:1,
                    ease:1,
                    hide:1
                },
                sizes,
                cssText = node.style.cssText,
                previousOverflow,
                begStyle = {display:''},
                endStyle = {display:''},
                isAnimating = !!node.style.transition,
                defaultSpeed = 500,
                defaultEase = 'ease',
                hasSizes = false,
                isAuto,
                transitions = [];

            Object.keys(options).forEach(function (key) {
                if(keys[key]){
                    keys[key] = options[key];
                }else{
                    console.log('key', key, options[key]);
                    sizes = sizes || getSizes(node);
                    begStyle[key] = getStyle(node, key, options[key].beg, sizes);
                    endStyle[key] = getStyle(node, key, options[key].end, sizes);
                    transitions.push(key + ' ' + getSpeed(options[key].speed, options.speed, defaultSpeed) + ' ' + (options[key].ease || options.ease || defaultEase));
                    if(options[key].end === 'auto'){
                        isAuto = true;
                    }
                    if(key === 'height' || key === 'width'){
                        begStyle.overflow = endStyle.overflow = 'hidden';
                        hasSizes = true;
                        previousOverflow = node.style.overflow;
                        addPaddingStyle(begStyle, endStyle, sizes, key);
                    }
                    console.log('', key, options.height.end,  sizes.boxSizing);
                    if(key === 'height' && options.height.end === 'auto' && sizes.boxSizing === 'content-box'){
                        console.log('ACTUAL');
                        endStyle.height = sizes.actual.height;//actualHeight + sizes.padBot + sizes.padTop;
                    }
                }
            });

            if(isAnimating){
                console.log('isAnimating ASSUME END');
                dom.style(node, endStyle);
                handleCallback(node, options.immediate, options.callback);
                return;
            }

            if(options.immediate){
                console.log('immediate ASSUME END');
                dom.style(node, endStyle);
                if(options.callback){
                    tick(options.callback);
                }
                return;
            }

            on.once(node, 'transitionend', function() {
                console.log('TRANSEND');
                node.style.transition = '';
                //if(previousOverflow && endStyle.height > 0 || endStyle.width > 0){
                //    // TODO: prev CSStext?
                //    console.log('cssText', cssText);
                //    node.style.overflow = previousOverflow;
                //}

                if(isAuto){
                    var resetObject = {};
                    Object.keys(endStyle).forEach(function (key) {
                        resetObject[key] = '';
                    });
                    dom.style(node, resetObject);
                }

                if(options.hide && (endStyle.height === 0 || endStyle.width === 0 || endStyle.opacity === 0)){
                    node.style.display = 'none';
                }
                console.log('trans:', node.style.transition);
            });

            handleCallback(node, options.immediate, options.callback);

            function exec () {
                dom.style(node, begStyle);
                console.log('beg', begStyle);

                // tick does not work here for some reason
                setTimeout(function () {
                    node.style.transition = transitions.join(', ');
                    setTimeout(function () {
                        console.log('end', endStyle);
                        dom.style(node, endStyle);
                    }, 1);
                }, 1);
            }

            if(options.delay){
                setTimeout(exec, options.delay);
            }else{
                exec();
            }

            // return animation object that can be reversed
        },

        height: function (node, options) {
            var
                isAnimating = !!node.style.transition,
                callback = options.callback,
                immediate = options.immediate || false,
                sizes = isAnimating ? {} : getSizes(node),
                actualHeight = isAnimating ? 0 : sizes.height,
                styledHeight = isAnimating ? 0 : dom.style(node, 'height'),
                begHeight = options.startHeight !== undefined ? options.startHeight : styledHeight,
                endHeight = options.height || 0,
                speed = options.speed || 200,
                transition = 'all '+speed+'ms ease',
                hasBeg = options.startHeight !== undefined,
                isAuto = endHeight === 'auto';

            if(endHeight === 'auto' && sizes.boxSizing === 'border-box'){
                endHeight = actualHeight + sizes.padBot + sizes.padTop;
            }
            else if(endHeight === 'auto'){
                endHeight = actualHeight;
            }

            //console.log('styledHeight', styledHeight, 'begHeight', begHeight, 'endHeight', endHeight, 'actualHeight', actualHeight);
            //console.log('is animating: ', node.style.transition);

            if(isAnimating){
                console.log('is animating', endHeight);
                // TODO: get end
                dom.style(node, {
                    height: endHeight,
                    paddingTop: endHeight ? sizes.padTop + 'px' : 0,
                    paddingBottom: endHeight ? sizes.padBot + 'px' : 0
                });
                handleCallback(node, immediate, callback);
                return;
            }

            if(immediate || (styledHeight === endHeight && !hasBeg) || begHeight === endHeight){
                dom.style(node, {
                    transition: '',
                    height: isAuto ? '' : endHeight + 'px',
                    display: !!endHeight ? '' : 'none',
                    paddingTop: endHeight ? sizes.padTop + 'px' : 0,
                    paddingBottom: endHeight ? sizes.padBot + 'px' : 0
                });
                if(callback){
                    tick(callback);
                }
                return;
            }

            dom.style(node, {
                overflow: 'hidden',
                height: begHeight,
                display: '',
                paddingTop: begHeight === 0 ? 0 : sizes.padTop + 'px',
                paddingBottom: begHeight === 0 ? 0 : sizes.padBot + 'px'
            });

            //if(hasBeg) debugger

            on.once(node, 'transitionend', function() {
                console.log('TRANSEND', endHeight);
                dom.style(node, {
                    transition: '',
                    //height: isAuto ? '' : endHeight + 'px',
                    display: !!endHeight ? '' : 'none'
                });
            });
            handleCallback(node, immediate, callback);

            // tick does not work here for some reason
            setTimeout(function() {
                node.style.transition = transition;
                setTimeout(function() {
                    node.style.height = endHeight ? endHeight + 'px' : '0';
                    node.style.paddingTop = endHeight ? sizes.padTop + 'px' : 0;
                    node.style.paddingBottom = endHeight ? sizes.padBot + 'px' : 0;
                },1);
            }, 1);

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
                begOpacity = options.startOpacity === undefined ? dom.style(node, 'opacity') : options.startOpacity,
                endOpacity = options.opacity === undefined ? begOpacity < 0.5 ? 1 : 0 : options.opacity,
                speed = options.speed || 400,
                style = 'all '+speed+'ms ease';

            if (immediate === true || begOpacity === endOpacity) {
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

    function getSpeed (s1, s2, ds) {
        var i, a = arguments;
        for(i = 0; i < a.length; i++){
            if(a[i] !== undefined){
                return typeof a[i] === 'number' ? a[i] + 'ms' : a[i];
            }
        }
        return 0;
    }

    function normalize (node, prop) {
        var value = node.style[prop];
        return value ? parseInt(value, 10) : value;
    }

    function getSizes (node) {
        var
            box,
            height,
            padTop,
            padBot,
            boxSizing = dom.style(node, 'box-sizing'),
            prevPadTop = normalize(node, 'paddingTop'),
            prevPadBot = normalize(node, 'paddingBottom'),
            previousDisplay = node.style.display,
            previousHeight = normalize(node, 'height'),
            previousWidth = normalize(node, 'width');

        dom.style(node, {
            width: '',
            height: '',
            display: '',
            paddingTop: '',
            paddingBottom: ''
        });

        box = dom.box(node);
        padTop = parseInt(dom.style(node, 'paddingTop'), 10);
        padBot = parseInt(dom.style(node, 'paddingBottom'), 10);

        dom.style(node, {
            width: previousWidth,
            height: previousHeight,
            display: previousDisplay,
            paddingTop: prevPadTop,
            paddingBottom: prevPadBot
        });

        //box.height = box.height - padTop - padBot;
        box.padTop = padTop;
        box.padBot = padBot;
        box.boxSizing = boxSizing;
        box.current = {
            width: previousWidth,
            height: previousHeight
        };
        box.actual = {
            width: box.width,
            height: box.height - padTop - padBot
        };

        return box;

    }

    window.fx = fx;
}());