(function (define) {
    define(['dom', 'on'], function (dom, on) {

        'use strict';
        // fx.js
        // component effect functions

        // TODO: transitions delay
        // TODO: return animation object that can be reversed

        var fx = {
            camelToDash: camelToDash,
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
                    styleTotal = 0,
                    styleCount = 0,
                    sizes,
                    transHandle,
                    cssText = node.style.cssText,
                    previousOverflow,
                    begStyle = {display:''},
                    endStyle = {display:''},
                    isAnimating = !!node.style.transition,
                    defaultSpeed = 500,
                    defaultEase = 'ease',
                    defaultDelay = 0,
                    hasSizes = false,
                    isAuto,
                    transitions = [];

                Object.keys(options).forEach(function (key) {
                    if(keys[key]){
                        keys[key] = options[key];
                    }else{
                        console.log('key', key, options[key]);
                        styleTotal++;
                        sizes = sizes || getSizes(node);
                        begStyle[key] = getStyle(node, key, options[key].beg, sizes);
                        endStyle[key] = getStyle(node, key, options[key].end, sizes);
                        transitions.push(camelToDash(key) + ' ' + getMilliseconds(options[key].speed, options.speed, defaultSpeed) + ' ' + (options[key].ease || options.ease || defaultEase) + ' ' + getMilliseconds(options[key].delay, options.delay, defaultDelay));
                        if(options[key].end === 'auto'){
                            isAuto = true;
                        }
                        if(key === 'height' || key === 'width'){
                            begStyle.overflow = endStyle.overflow = 'hidden';
                            hasSizes = true;
                            previousOverflow = node.style.overflow;
                            addPaddingStyle(begStyle, endStyle, sizes, key);
                        }

                        if(key === 'height' && options.height.end === 'auto' && sizes.boxSizing === 'content-box'){
                            endStyle.height = sizes.content.height;
                        }
                    }
                });

                function finish () {
                    console.log('finish');
                    transHandle.remove();
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

                    if(options.callback){
                        options.callback();
                    }
                }

                function exec () {
                    dom.style(node, begStyle);

                    // tick does not work here for some reason
                    setTimeout(function () {
                        node.style.transition = transitions.join(', ');
                        setTimeout(function () {
                            dom.style(node, endStyle);
                        }, 1);
                    }, 1);
                }

                transHandle = on(node, 'transitionend', function(e) {
                    styleCount++;
                    if(styleCount === styleTotal){
                        finish();
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

                if(options.delay){
                    setTimeout(exec, options.delay);
                }else{
                    exec();
                }

                // return animation object that can be reversed
            }
        };

        function camelToDash (str) {
            if(str.indexOf('-') > -1){ return str; }
            for(var i = str.length - 1; i >= 0; i--){
                if(str.charAt(i) !== '-' && str.charCodeAt(i) <= 90){
                    str = str.substring(0, i) + '-' + str.charAt(i).toLowerCase() + str.substring(i+1);
                }
            }
            return str;
        }

        function handleCallback(node, immediate, callback) {
            var cb = typeof immediate === 'function' ? immediate : typeof callback === 'function' ? callback : null;
            if (cb && immediate !== true) {
                on.once(node, 'transitionend', function() {
                    setTimeout(cb, 100);
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
            else if(key === 'width'){
                if(endStyle.width === 0){
                    endStyle.paddingLeft = 0;
                    endStyle.paddingRight = 0;
                    begStyle.paddingLeft = sizes.padLeft + 'px';
                    begStyle.paddingRight = sizes.padRight + 'px';
                }
                else if(begStyle.width === 0){
                    endStyle.paddingLeft = sizes.padLeft + 'px';
                    endStyle.paddingRight = sizes.padRight + 'px';
                    begStyle.paddingLeft = 0;
                    begStyle.paddingRight = 0;
                }
            }
        }

        function getMilliseconds (s1, s2, ds) {
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
                boxSizing = dom.style(node, 'box-sizing'),
                padTop,
                padBot,
                padLeft,
                padRight,
                cssText = node.style.cssText;

            dom.style(node, {
                width: '',
                height: '',
                display: '',
                paddingTop: '',
                paddingBottom: '',
                paddingLeft:'',
                paddingRight:''
            });

            box = dom.box(node);
            padTop = parseInt(dom.style(node, 'paddingTop'), 10);
            padBot = parseInt(dom.style(node, 'paddingBottom'), 10);
            padLeft = parseInt(dom.style(node, 'paddingLeft'), 10);
            padRight = parseInt(dom.style(node, 'paddingRight'), 10);

            // restore
            node.style.cssText = cssText;

            box.padTop = padTop;
            box.padBot = padBot;
            box.padLeft = padLeft;
            box.padRight = padRight;
            box.boxSizing = boxSizing;
            box.current = {
                width: normalize(node, 'width'),
                height: normalize(node, 'height')
            };
            box.content = {
                width: box.width - padLeft - padRight,
                height: box.height - padTop - padBot
            };

            return box;

        }

        if (typeof customLoader === 'function'){ customLoader(fx, 'fx'); }
        else if (typeof window !== 'undefined') { window.fx = fx; }
        else if (typeof module !== 'undefined') { module.exports = fx; }
        else { return fx; }
    });
}(
    typeof define == 'function' && define.amd ? define : function (ids, factory) {
        var deps = ids.map(function (id) { return typeof require == 'function' ? require(id) : window[id]; });
        typeof module !== 'undefined' ? module.exports = factory.apply(null, deps) : factory.apply(null, deps);
    }
));