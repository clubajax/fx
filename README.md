#fx

The fx library provides an easy way to programmatically create transitions.

fx uses UMD, so it will work with globals, AMD, or CommonJS module exports.

## Getting Started

To install using bower:

	bower install clubajax/fx --save

You may also use `npm` if you prefer. Or, you can clone the repository with your generic clone commands as a standalone 
repository or submodule.

	git clone git://github.com/clubajax/fx.git

It is recommended that you set the config.path of RequireJS to make `fx` accessible as an
absolute path.

fx has a dependency on clubajax/dom and clubajax/on.

## Description

The primary function is create transitions on DOM nodes with any animate-able style (some styles are not available, such
as backgroundImage).

Using the programmatic method for transitions allows for additional features, such as callbacks and hiding the node
when the transition is finished.

There are other subtle features, such as animating the padding along with width and height, and handling content-box and border-box models.

## Support

`fx` supports modern browsers, IE9 and up. 

## Quick Example

    fx.style(node, {
        opacity:{
            beg: 1,
            end: 0
        },
        height:{
            beg: 'auto',
            end: 0
        },
        backgroundColor:{
            beg:'rgb(255, 181, 183)',
            end:'rgb(0, 0, 255)'
        },
        speed: 500,
        callback: function () {
            console.log('done');
        }
    });

## Docs

fx.style accepts two arguments: a node, and an options object.

Options should have at least one object where the name corresponds to a style property. In each style object there can be
additional properties:

 * *beg*: The value of the transition at its beginning. `auto` will use the node's current style.
 * *end*: The value of the transition at its end. `auto` will use the node's unstyled value.
 
### Optional style properties:
 
 * *speed*: The speed, in milliseconds, of this individual style transition. Note, `speed` can be used outside of style objects and apply to all styles.
 * *delay*: The delay, in milliseconds, before this individual style transition starts. Note, `delay` can be used outside of style objects and apply to all styles.
 * *ease*: The ease function applied to this individual style transition. Note, `ease` can be used outside of style objects and apply to all styles.

### Other Options

These properties are used outside of the style objects (such as how `speed` is used in teh example above);

 * *speed*: The speed, in milliseconds, of all transitions.
 * *delay*: The delay, in milliseconds, before this all transitions start.
 * *hide*: When a key style (height, width, opacity) is set to zero, at the end of the transition, the node display will be set to none.
 * *ease*: The ease function applied to all transitions.
 * *immediate*: Will skip the transition and immediately apply the style.
 * *callback*: This function will be invoked when the transition completes.
  
## License

This uses the [MIT license](./LICENSE). Feel free to use, and redistribute at will.