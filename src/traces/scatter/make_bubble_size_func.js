/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var isNumeric = require('fast-isnumeric');

module.exports = function makeBubbleSizeFn(trace) {
    // if (!subTypes.hasMarkers(trace)) return;

    // Treat size like x or y arrays --- Run d2c
    // this needs to go before ppad computation
    var marker = trace.marker;
    
    // only size the marker if Not called from the legend sytle code or maker.size set
    // sizeforlegend is only ever set in src/components/legend/sytle.js, not part of json interface.
    var sizemarker = marker.sizeforlegend ? false : (Array.isArray(marker.size) && marker.size.filter(isNumeric).length > 0);
    // ideally the sizemin and sizemax should always be set, try to pick a reasonable value when not set.
    // I've set default values in attributes.js for sizemin of 8 and sizemax of 48
    var markersizemin = marker.sizemin || 8;    
    var markersizemax = marker.sizemax || markersizemin + 50; //(sizemarker ? marker.size.length : 50);
    var validateCalcSize = function (markersize) { 
        if (markersize < markersizemin) {
            markersize = markersizemin;
        }
        else if (markersize > markersizemax) {
            markersize = markersizemax;
        }
        return markersize;
    }
    
    var sizeByFunc = function (v) {
        var markersize;
        if (sizemarker) {            
            var plotrangemin = marker.sizedatamin || Math.min(...marker.size.filter(isNumeric));
            var plotrangemax = marker.sizedatamax || Math.max(...marker.size.filter(isNumeric));
            if (marker.sizedataislog) {
                // convert to log base 10 equivalents
                plotrangemin = Math.log10(plotrangemin);
                plotrangemax = Math.log10(plotrangemax);
            }
            var plotrange = plotrangemax - plotrangemin;
            plotrange = (plotrange === Number.POSITIVE_INFINITY || Number.isNaN(plotrange)) ? Number.MAX_VALUE : plotrange;
            var makersizerange = markersizemax - markersizemin;
            var s = marker.sizedataislog ? Math.log10(v) : v;
            markersize = Math.round((((s - plotrangemin) / plotrange) * makersizerange) + markersizemin);
            return markersize;
        }
        else {
            return v / 2; // no sizing array (old way)
        }
    }
    var markerTrans;

    if (trace.marker.sizemode === 'area') {
        markerTrans = function (v) {
            // don't display marker for non numeric size values (allow override to min?)
            if (!isNumeric(v)) return 0; 
            var s = sizeByFunc(v);
            var area = Math.sqrt(s);
            return validateCalcSize(area);
        };
    } else {
        markerTrans = function (v) {
            // don't display marker for non numeric size values (allow override to min?)
            if (!isNumeric(v)) return 0; 
            var s = sizeByFunc(v);
            // don't let the symbol size go outside of the allowed range
            return validateCalcSize(s);
        };
    }

    return markerTrans;
}

