/*
variables that use continuous iterators:
ct
timechain.state.curr

A MARKED line of code uses a random constant that does not have a variable
*/

import { Editor, Node } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';

const postEditorContainer = dgei('postEditorContainer');
const tiptapContainer = dgei('tiptapContainer');
const postMetaContainer = dgei('postMetaContainer');
const postMeta = dgei('postMeta');

//sets the date to exactly 12:00 am (with precision up to 1 minute)
Date.prototype.setFTOD = function() {
    this.setHours(0);
    this.setMinutes(0);
    this.setSeconds(0);
    this.setMilliseconds(0);
    return this;
}

Date.prototype.addDays = function(days) {
    this.setDate(this.getDate() + days);
    return this;
}

//sets date to the first day of the week (sunday)
Date.prototype.setFDOW = function() {
    let day = this.getDay();
    return this.addDays(-day);
}

Date.prototype.addWeeks = function(weeks) {
    return this.addDays(weeks * 7);
}

//sets date to the first day of the month
Date.prototype.setFDOM = function(months) {
    let day = this.getDate();
    return this.addDays(-day + 1);
}

Date.prototype.addMonths = function(months) {
    let day = this.getDate();
    this.setMonth(this.getMonth() + months);
    if (this.getDate() != day) {
        this.setDate(0);
    }
    return this;
}

//sets date to the first day of the year
Date.prototype.setFDOY = function(months) {
    this.setFDOM();
    return this.addMonths(-this.getMonth());
}

Date.prototype.addYears = function(years) {
    this.setFullYear(this.getFullYear() + years);
    return this;
}

Date.prototype.formatted = function() {
    return ([this.getMonth()+1,this.getDate(),this.getFullYear()]).join('/');
}

Date.prototype.JSformatted = function() {
    return [this.getMonth()+1,this.getDate(),this.getFullYear()];
}

Date.prototype.setToDay = function(formattedstring) {
    let date = formattedstring.split('/').map(x => Number(x));
    this.setFullYear(date[2]);
    this.setMonth(date[0] - 1);
    this.setDate(date[1]);
}

Date.prototype.setToToday = function() {
    let o = new Date();
    this.setFullYear(o.getFullYear());
    this.setMonth(o.getMonth());
    this.setDate(o.getDate());
}

//makes a copy of the date object (with a precision up to one day)
Date.prototype.copy = function() {
    return new Date(this.getFullYear(), this.getMonth(), this.getDate());
}

Date.prototype.add = function(precision, amt) {
    if (precision == 0) {
        return this.addDays(amt);
    } else if (precision == 1) {
        return this.addWeeks(amt);
    } else if (precision == 2) {
        return this.addMonths(amt);
    } else if (precision == 3) {
        return this.addYears(amt);
    }
}

let dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
Date.prototype.getDayName = function() {
    return dayNames[this.getDay()];
}

//returns difference, in days, between two date objects (o - this)
//The function relies on the fact that both dates are approximately 12:00 am
//It also requires that the first date, this, is the first day of the specified precision
const MS_PER_DAY = 1000 * 60 * 60 * 24;
Date.prototype.difference = function(o, precision) {
    if (precision == 0) {
        return Math.round((o - this) / MS_PER_DAY);
    }
}

const baseDay = new Date(2023, 0, 1, 0, 0);
let dateComp = new Date();
dateComp.setFTOD();
//returns the index of a specific day, calculated by finding the difference of the date with 1/1/2023 (a Sunday, by luck!)
Date.prototype.getIndex = function() {
    return baseDay.difference(this, 0);
}

Date.prototype.setIndex = function(index) {
    this.setMonth(0);
    this.setDate(1);
    this.setFullYear(2023);
    this.addDays(index);
}

Date.prototype.setJS = function(JSformatted) {
    this.setMonth(JSformatted[0] - 1);
    this.setDate(JSformatted[1]);
    this.setFullYear(JSformatted[2]);
}

class Color {
    constructor(r,g,b,a = 1) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }
    pure() {
        return rgba(this.r, this.g, this.b, this.a);
    }
    alpha(alpha, dst) {
        let col = [this.r, this.g, this.b, this.a * alpha];
        if (dst) {
            return new Color(...col);
        } else {
            return rgba(...col);
        }
    }
    multiply(amt, dst) {
        let col = [this.r * amt, this.g * amt, this.b * amt, this.a];
        if (dst) {
            return new Color(...col);
        } else {
            return rgba(...col);
        }
    }
    blend(o, amt, dst) {
        let opp = 1 - amt;
        let col = [this.r * opp + o.r * amt, this.g * opp + o.g * amt, this.b * opp + o.b * amt, this.a * opp + o.a * amt];
        if (dst) {
            return new Color(...col);
        } else {
            return rgba(...col);
        }
    }
}
let colors = {
    theme : new Color(40, 247, 78),//new Color(240,240,240),//new Color(0,200,255),//new Color(170,255,0),//(255,255,0),
    //theme : new Color(80,120,300),
    //theme : new Color(270, 280, 100),
    //theme : new Color(255,255,255),
    gs : { //greyscale colors
        bright : greyscale(255),
        light : greyscale(235),
        dark : greyscale(27),
        tc : greyscale(100),
        deselect : greyscale(85),
    }
}
let root = document.querySelector(':root');
root.style.setProperty('--theme', colors.theme.multiply(.8, true).pure());
root.style.setProperty('--dark', colors.gs.dark.pure());
root.style.setProperty('--light', colors.gs.light.pure());
root.style.setProperty('--tc', colors.gs.tc.pure());

colors.atheme = colors.theme.multiply(.8, true).pure();


const canvas = dgei('c');
const ctx = canvas.getContext('2d');


let cbar = dgei('cbar'); //w x 30px
let barH = 30;
let epsilon = .05;
cbar.height = barH;
let btx = cbar.getContext('2d');

let mouse = {
    r : 0,
    t : 0,
    l : 0,
    b : 0,
    click : false, //set to false every frame
    release : false, //similar to click
    clear() {
        this.r = -1; this.t = -1;
    }
}

let screen = {
    //width and height of the canvas, in client pixels
    w : 64,
    h : 36,

    //width and height of the screen in canvas pixels
    cw : undefined,
    ch : undefined,

    scale: 192 / 156,
}

let ct = 0; //counter to set button ids
 
let advancedConfig = {
    buttonSaturationTime : 0.1, //time, in seconds, to saturate a button after hovering
}

let paths = {
    init() {
        let parallelogram = new Path2D(); //centered at the top right vertex: \--\
        parallelogram.moveTo(0,0);
        parallelogram.lineTo(barH,barH);
        parallelogram.lineTo(0, barH);
        parallelogram.lineTo(-barH, 0);
        parallelogram.closePath();
        this.parallelogram = parallelogram;
    }
}
paths.init();

let lookup = {}; //lookup table, provides pointer to objects given their id

let mainFont = 'Poppins';
let tcstretch = .4;
let szs = {
    timechain : {
        height : 200,
        circle : 12.5,
        spacing : 90,
        maxLineWidth : 7.5,
        minLineWidth : 5,
        shadeOsc : .05, //shading oscillations
        shadeOscFreq : 2,
        shadeOscOffset : .3,
        selectWidth : 5,
        tcstretch : tcstretch, //how much of a scaling factor to stretch when transitioning between layers

        dayView : {
            lineSpacingStretch : .2, //how much of a scaling factor to stretch line spacing when transitioning to dayview
            margins : {
                top : 45,
            }
        }
    },
    elb : {
        shadeOsc : .05, //shading oscillations
        shadeOscFreq : 2,
        frameWidth : 3,
        topIndent : 34,
        backArrow : 11.3,
        arrowVerticalHover : 4,
        titleFont : 19,
        titleMargin : 10,

        maxYDisp : .4, //the fraction of the screen height that the elb can be maximally displaced by
        margins : {
            top : 90,
            bottom : 60,
            side : 0,
        },

        maxXOffset : 60,

        header : 64, //height of the header
        headerFont : 27,
        plusBar : {
            w1 : 64,
            w2 : 128,
            h : 64,
            plusSign : {
                size : 30.2,
                lineWidth : 6.7,
            },
            lineWidth : 7,
            extend : 350, //amount to extend upon activating create
        },

        padding : {
            left : 19.5,
            top : 20,
        },

        posts : {
            marginTop0 : .5,
            marginTop1 : .8,
            margins : {
                vertical : 9.5,
                side : 6.5,
            },
            titleFont : 14,
            descFont : 11,
            descMarginTop : 5,
            borderWidth : 1,
            sideBarWidth : 5,
            scrollBottomAdjustment : .5,
            completeFade : .5,
            mark : 10,
            markMargin : 3,
        },

        editor : {
            margin : 3,
        },

        scroll : {
            knob : 5,
            thickness : 1.5,
            margin : 16
        }
    }
}

let tts = {
    timechain : {
        curr: 0.4,
        layer: 0.4,
        layersaturation: 0.3,
        textsaturation : 0.3,
        stretch : 0.5,
        dayView : 0.5,
    },
    elb : {
        edit : {
            total : .3,

            //fractions
            earlyFade : .4,
            lateFade : .5,

            loadedPost : .15,
        },


        loadUp : .8,
        shiftIn : .35,
        postIndex : .1,
        scrollTo : .1,
        dissolvePost : {
            total : .25,
            early : .3,
            late : .8
        },
        posts : {
            hasy : { //h asymptote
                i : .4,
                c : 5,
            },
            totalFadeInTime : .8,
        },

        overrideNeedSave : .5,
        deleteTimeout : .5,

        annotationSpeed : {
            marked : 10,
            completed : 10,
        },

        scrollAlphaReactiveness : 5,
    }
}

let transitions = {
    //r- prefix means reciprocal power
    //flip- prefix means flip across y = x
    sqrt(x) {
        return Math.pow(x,1/2);
    },
    cubert(x) {
        return Math.pow(x,1/3);
    },
    general(x) {//fix later, this function
        let b = .25;
        let a = Math.sqrt(1-b*b)+1;
        return 1/(1-b) * (-b + Math.sqrt(1 - Math.pow(x*(1-a) - 1 + a, 2)));
        //return Math.pow(1-(x-1)*(x-1), 1/2);
    },
    flipgeneral(x) {

    },
    linear(x) {
        return x;
    }
}

let metaExpr = {
    exclude : {
        endDay : true,
        displaydesc : true,
        title : true,
        endTime : true
    },
    keywordToType : {
        ev : 'every',
        every : 'every',
        recur : 'recurrence',
        recurrence : 'recurrence',
        desc : 'description',
        description : 'description',
        'desc:' : 'description',
        'description:' : 'description',
        from : 'range',
        rg : 'range',
        range : 'range',
        ti : 'time',
        time : 'time',
        mk : 'mark',
        marked : 'marked',
        cp : 'completed',
        completed : 'completed',
        pr : 'priority',
        priority : 'priority',
    },
    helperToType : {
        '2' : 'to',
        t : 'to',
        to : 'to',
    },

    dayUnits : {
        day : 'day',
        days : 'day',
        week : 'week',
        weeks : 'week',
        month : 'month',
        months : 'month',
        year : 'year',
        years : 'year'
    },

    recurrenceFunctions : {
        //return true if day satisfies recurrence requirements
        recurrence(startIndex, endIndex, currDate, binString) {
            let cindex = currDate.getIndex();
            return binString[(cindex - startIndex) % binString.length] == '1';
        },
        every(startIndex, endIndex, currDate, amt, unit) {
            if (unit == 'day') {
                let cindex = currDate.getIndex();
                let dif = cindex - startIndex;
                return dif % amt == 0;
            } else if (unit == 'week') {
                let cindex = currDate.getIndex();
                let dif = cindex - startIndex;
                return dif % 7 == 0 && (Math.floor(dif / 7)) % amt == 0;
            } else if (unit == 'month') {
                dateComp.setIndex(startIndex);
                return dateComp.getDate() == currDate.getDate();
            } else if (unit == 'year') {
                dateComp.setIndex(startIndex);
                return dateComp.getDate() == currDate.getDate() && dateComp.getMonth() == currDate.getMonth();
            }
        },
    },

    relativeWordsToOffset : {
        today: 0,
        yest : -1,
        yesterday: -1,
        tomo: 1,
        tomorrow: 1,
    },

    dayNamesToOffset : {
        sun : 0,
        sunday : 0,
        mon : 1,
        monday : 1,
        tue : 2,
        tuesday : 2,
        wed : 3,
        wednesday : 3,
        thu : 4,
        thursday : 4,
        fri : 5,
        friday : 5,
        sat : 6,
        saturday : 6
    },

    priorityRange : 10,

    indexToDayName : [
        'sunday',
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday'
    ],

    timeSuffixToOffset : {
        am : 0,
        pm : 12
    },

    daysInMonth(month, year) {
        dateComp.setFullYear(year);
        dateComp.setMonth(month + 1);
        dateComp.setDate(0);
        return dateComp.getDate();
    },

    //using Date definition of month
    validDate(day, month, year) {
        return (0 <= month && month <= 11) && day <= this.daysInMonth(month, year);
    },

    //check if a string is a valid date and parse it to a dayIndex
    //bias = -1 if we want to parse a date that is before currDate, bias = 1 otherwise
        //TODO: implement bias = 0, which means no bias
        //if the bias is not satisfied, do not parse the date
    parseDate(currDate, string, bias) {
        //possible formats: m/d, m/d/y, 
        let r = string.split('/');
        if (r.length == 1) {
            let cindex = currDate.getIndex();
            //r[0] might represent a day name, offset, or relative day name (eg tomorrow, yesterday, etc)
            let x = parseInt(r[0]);
            if (isNaN(x)) {
                if (r[0] in metaExpr.relativeWordsToOffset) {
                    x = metaExpr.relativeWordsToOffset[r[0]];
                } else if (r[0] in metaExpr.dayNamesToOffset) {
                    //get the nearest day that satisfies the bias and has the same day name as requested
                    x = (((metaExpr.dayNamesToOffset[r[0]] - cindex) % 7) + 7) % 7;
                    if (bias == -1) x = (x - 7)%7;
                } else {
                    return NaN;
                }
            }
            return cindex + x;
        } else if (r.length == 2) {
            //get the nearest date that satisfies the month, day, and bias constraints 

            let m = parseInt(r[0]) - 1; //annoying conversion between human readable month and machine readable month
            let d = parseInt(r[1]);
            if (isNaN(m) || isNaN(d)) return NaN;
            let cm = currDate.getMonth();
            let cd = currDate.getDate();
            let y = currDate.getFullYear();

            if (bias * m < bias * cm || (m == cm && bias * d < bias * cd)) {
                y += bias;
            }

            if (!this.validDate(d, m, y)) return NaN;
            dateComp.setJS([m + 1, d, y]);
            return dateComp.getIndex();
        } else if (r.length == 3) {
            let m = parseInt(r[0]) - 1;
            let d = parseInt(r[1]);
            if (isNaN(m) || isNaN(d)) return NaN;
            let cm = currDate.getMonth();
            let cd = currDate.getDate();
            let cy = currDate.getFullYear();

            let centuries = Math.floor(cy / 100) * 100;
            let y = parseInt(r[2]);
            if (r[2].length == 2) {
                y += centuries;
            } else if (r[2].length != 4) {
                return NaN;
            }

            if (!this.validDate(d, m, y)) return NaN;
            dateComp.setJS([m + 1, d, y]);
            return dateComp.getIndex();
        }
    },

    parseTime(str) {
        let suffix = '';
        if (str.length > 2) {
            if (str.slice(str.length - 2) in metaExpr.timeSuffixToOffset) {
                suffix = str.slice(str.length - 2);
                str = str.slice(0, str.length - 2);
            } else {
                suffix = '';
            }
        }

        let r = str.split(':');
        let h, m = 0, s = 0;
        if (r.length == 1) {
            h = parseInt(r[0]);
        } else if (r.length == 2) {
            h = parseInt(r[0]);
            m = parseInt(r[1]);
        } else if (r.length == 3) {
            h = parseInt(r[0]);
            m = parseInt(r[1]);
            s = parseInt(r[2]);
        } else return NaN;
        if (isNaN(h) || isNaN(m) || isNaN(s)) return NaN;
        if (suffix != '') {
            if (h < 0 || h > 12) return NaN;
            h = h%12 + metaExpr.timeSuffixToOffset[suffix];
        }
        if (h < 0 || h > 23) return NaN;
        if (m < 0 || m > 59) return NaN;
        if (s < 0 || s > 59) return NaN;

        return h * 3600 + m * 60 + s;
    },

    stringifyDayIndex(dayIndex, currDate) {
        let cindex = currDate.getIndex();
        if (dayIndex == cindex) {
            return 'today';
        } else if (dayIndex == cindex - 1) {
            return 'yesterday';
        } else if (dayIndex == cindex + 1) {
            return 'tomorrow';
        }
        if (Math.abs(dayIndex - cindex) < 7) {
            return metaExpr.indexToDayName[dayIndex % 7];
        }
        dateComp.setIndex(dayIndex);
        let m = dateComp.getMonth() + 1;
        let d = dateComp.getDate();
        let y = dateComp.getFullYear();

        let cm = currDate.getMonth() + 1;
        let cd = currDate.getDate();
        let cy = currDate.getFullYear();

        if (y == cy) {
            return m + '/' + d;
        } else if (Math.floor(y / 100) == Math.floor(cy / 100)) {
            return m + '/' + d + '/' + (y%100);
        } else {
            return m + '/' + d + '/' + y;
        }
    },

    stringifyTime(time) {
        let h = Math.floor(time / 3600);
        time -= h * 3600;
        let m = Math.floor(time / 60);
        time -= m * 60;
        let s = time;
        let suffix = 'am';
        if (h >= 12) {
            h -= 12;
            suffix = 'pm';
        }
        if (h == 0) h = 12;
        if (m == 0 && s == 0) {
            return h + suffix;
        } else if (s == 0) {
            return h + ':' + m + suffix;
        } else {
            return h + ':' + m + ':' + s + suffix;
        }
    },

    parsers : {
        //all are of the form function(meta, args) where any empty strings in args have already been filtered out
        //return false if the line is invalid
        //currDate is a Date object

        recurrence(meta, args, currDate) {
            if (args.length != 2) return false;
            let binText = args[1];
            for (let i = 0; i < binText.length; i++) {
                if (binText[i] != '0' && binText[i] != '1') return false;
            }

            if (binText.length == 0 || binText[0] == '0') return false;

            if ('recurrence' in meta) return false;

            meta.recurrence = {
                type: 'recurrence',
                args : [ binText ]
            };

            return true;
        },

        every(meta, args, currDate) {
            if ('recurrence' in meta) return false;
            if (args.length == 3) {
                let amt = parseInt(args[1]);
                let dayUnit = args[2];
                if (isNaN(amt)) return false;
                if (amt < 1) return false;
                if (!(dayUnit in metaExpr.dayUnits)) return false;

                meta.recurrence = {
                    type : 'every',
                    args : [ amt, metaExpr.dayUnits[dayUnit] ]
                };

                return true;
            } else if (args.length == 2) {
                let dayUnit = args[1];
                if (!(dayUnit in metaExpr.dayUnits)) return false;

                meta.recurrence = {
                    type : 'every',
                    args : [ 1, metaExpr.dayUnits[dayUnit] ]
                };

                return true;
            }
        },

        description(meta, args, currDate) {
            if ('desc' in meta) return false;
            args.splice(0, 1);
            meta.desc = args.join(' ');
            return true;
        },

        
        //for now, im going to ban ranges that don't include the current date
        range(meta, args, currDate) {
            if ('startDay' in meta) return false;
            if (args.length != 4) return false;
            if (metaExpr.helperToType[args[2]] != 'to') return false;

            let d1 = metaExpr.parseDate(currDate, args[1], -1);
            let d2 = metaExpr.parseDate(currDate, args[3], 1);

            if (isNaN(d1) || isNaN(d2)) return false;
            if (d1 > d2) return false;
            if (d2 - d1 + 1 > 1e5) return false;
            
            meta.startDay = d1;
            meta.endDay = d2;
            return true;
        },

        //obviously there might be problems with daylight savings, so here's what i'll do:
            //define meta.time to be the number of seconds since 12:00 am of that day, if i need to incorporate daylight savings i'll just do so later :/
        time(meta, args, currDate) {
            if ('startTime' in meta) return false;

            //collapse spaces before AM and PM
            for (let i = args.length - 1; i >= 0; i--) {
                if (args[i] in metaExpr.timeSuffixToOffset) {
                    if (i <= 1) return false;
                    args[i - 1] += args[i]; 
                    args.splice(i, 1);
                    i--;
                }
            }

            if (args.length == 2) {
                let time = metaExpr.parseTime(args[1]);
                if (isNaN(time)) return false;
                meta.startTime = time;
                meta.endTime = meta.startTime;
            } else if (args.length == 4) {
                if (metaExpr.helperToType[args[2]] != 'to') return false;
                let t1 = metaExpr.parseTime(args[1]);
                let t2 = metaExpr.parseTime(args[3]);
                if (isNaN(t1) || isNaN(t2)) return false;
                meta.startTime = t1;
                meta.endTime = t2;
            } else {
                return false;
            }
            return true;
        },

        marked(meta, args, currDate) {
            if ('marked' in meta) return false;
            if (args.length != 1) return false;
            meta.marked = true;
            return true;
        },

        completed(meta, args, currDate) {
            if ('completed' in meta) return false;
            if (args.length != 1) return false;
            meta.completed = true;
            return true;
        },

        priority(meta, args, currDate) {
            if ('priority' in meta) return false;
            if (args.length != 2) return false;
            let p = parseInt(args[1]);
            if (isNaN(p)) return false;
            if (Math.abs(p) > metaExpr.priorityRange) return false;
            meta.priority = p;
            return true;
        }
    },

    stringifiers : {
        recurrence(meta, currDate) {
            let ret = meta.recurrence.type + ' ' + meta.recurrence.args.join(' ');
            if (meta.recurrence.type == 'every' && meta.recurrence.args[0] != 1) {
                ret += 's';
            }
            return ret;
        },
        desc(meta, currDate) {
            return 'description: ' + meta.desc;
        },
        startDay(meta, currDate) {
            return 'from ' + metaExpr.stringifyDayIndex(meta.startDay, currDate) + ' to ' + metaExpr.stringifyDayIndex(meta.endDay, currDate);
        },
        startTime(meta, currDate) {
            if (meta.startTime == meta.endTime) {
                return 'time ' + metaExpr.stringifyTime(meta.startTime);
            }
            return 'time ' + metaExpr.stringifyTime(meta.startTime) + ' to ' + metaExpr.stringifyTime(meta.endTime);
        },
        marked(meta, currDate) {
            return 'marked';
        },
        completed(meta, currDate) {
            return 'completed';
        },
        priority(meta, currDate) {
            return 'priority ' + meta.priority;
        }
    }
}

class Position {
    constructor(x, y) {
        this.x = x; this.y = y;
    }
}

class Rect {
    constructor(x1, y1, w, h) {
        this.corner = new Position(x1, y1);
        this.w = w;
        this.h = h;
        this.center = new Position(x1 + w/2, y1 + h/2);
    }
}

class Post {
    static comparisonFunctions = {
        default : function(a, b) {
            return a.postID - b.postID;
        },
        time : function(a, b) {
            let st1, st2;
            st1 = st2 = 86400;
            if ('startTime' in a.metadata) st1 = a.metadata.startTime;
            if ('startTime' in b.metadata) st2 = b.metadata.startTime;
            let dif = st1 - st2;
            if (dif == 0) {
                return a.postID - b.postID;
            } else return dif;
        },
        priority : function(a, b) {
            let p1, p2;
            p1 = p2 = -metaExpr.priorityRange - 1;
            if ('priority' in a.metadata) p1 = a.metadata.priority;
            if ('priority' in b.metadata) p2 = b.metadata.priority;
            let dif = p2 - p1;
            if (dif == 0) {
                return a.postID - b.postID;
            } else return dif;
        },
        alpha : function(a, b) {
            let dif = a.metadata.title.localeCompare(b.metadata.title);
            if (dif == 0) {
                return a.postID - b.postID;
            } else return dif;
        }
    }
    static defaultSort = 'priority';

}


//NOTE - state cannot have objects as values, only primitives (because of the setTo function which is intended to basically copy an object)
class State {
    constructor() {
    }
    setTo(o) {
        for (let property in o) {
            this[property] = o[property];
        }
    }
}

class EndPts {
    constructor(type, options = {}) {
        this.p = {}; //progress
        this.tt = {}; //transition time
        this.start = new type();
        this.end = new type();
        this.usetransition = {};//what transitions to use for what property
        setOptions.call(this, options);
    }
    initTransition(property, tt, current, f = transitions.general) {
        this.p[property] = 0;
        this.tt[property] = tt;
        this.start[property] = current;
        this.usetransition[property] = f;
    }
    addTransition(property, tt, current, delta, f = transitions.general) {
        if (delta == 0) return;
        this.initTransition(property, tt, current, f);
        this.end[property] += delta;
    }
    addSetTransition(property, tt, current, value, f = transitions.general) {
        this.initTransition(property, tt, current, f);
        this.end[property] = value;
    }
}

//a basic window
class Block {
    /*
    title
    w
    h
    bgcolor
    */
    constructor(options) {
        setOptions.call(this, options);
        this.id = ct++;
        lookup[ct] = this;
    }
}

class ELBState extends State {
    constructor(options) {
        super(options);

        this.isLoad = 0;
        this.xOffset = 0;
        
        this.postIndex = 0;
        this.plusSign = 1;

        this.postsLoadState = 0;

        this.edit = 0;
        this.loadedPost = 0;
        
        this.scrollPos = 0;

        this.removePost = 0;
    }
}

class EventListBlock extends Block {
    constructor(options = {}) {
        super(options);

        this.endpts = new EndPts(ELBState);
        this.state = new ELBState();

        this.x = 0; this.y = 0;
        this.day;

        this.focused = true;

        this.postInfo = window.electronAPI.postInfo;
        this.postsByID = {};
        this.posts = [];
        this.prefixHeight = []; //prefix sum of post heights. used for scroll position computation. the first element is 0
        
        this.sortBy = Post.defaultSort; //default, sort by ID

        this.textFocused = false;

        this.maxPostID = Number(window.electronAPI.initialMaxPostID);

        //flag that determines whether or not a post is being created or simply being updated
        this.creating = false;
        this.needSave = false;
        this.overrideNeedSave = 0;

        this.bodyHeight = 0;

        this.removePostIndex = 0;
        this.targetPostIndex = 0;
        this.lockInput = false;
        this.deleteTimeout = 0;


        this.scrollAlpha = 0;

        this.editorContainer = postEditorContainer;
        this.titleEditor = dgei('postTitle');
        this.postEditor = new Editor({
            element: tiptapContainer,
            extensions: [
              StarterKit.configure({
                heading: {
                    levels: [1, 2, 3]
                }
              }),
              Placeholder.configure({
                placeholder: 'Description'
              }),
            ],
            editorProps: {
                handleDOMEvents: {
                    keydown: (view, event) => {                        
                        if (event.code == 'ArrowUp' && view.state.selection.empty && view.state.selection.from == view.state.selection.$head.depth) {
                            setCursorToEnd(this.titleEditor);
                            //this.titleEditor.focus();
                            
                            event.stopPropagation();
                            event.preventDefault();
                        }
                        else if (event.code == 'Backspace' && view.state.selection.empty && view.state.selection.from == 1 && view.state.selection.$head.doc.firstChild.type.name == 'paragraph') {
                            setCursorToEnd(this.titleEditor);
                            //this.titleEditor.focus();
                            
                            event.preventDefault();
                        } else if (event.code == 'ArrowDown' && view.state.selection.empty && view.state.selection.from == view.state.doc.content.size - view.state.selection.$head.depth) {
                            this.metaEditor.commands.focus('start');

                            event.preventDefault();
                        }
                    }
                },
            },
        });

        this.titleEditor.addEventListener('keydown', (e) => {
            if (e.code == 'Enter') {
                e.preventDefault();
            }
            if (window.getSelection().isCollapsed && (e.code == 'Enter' || e.code == 'ArrowDown')) {
                this.postEditor.commands.focus('start');
                e.preventDefault();
            }
        });

        postEditorContainer.addEventListener('input', (e) => {
            this.needSave = true;
        });

        const MetaDocument = Node.create({
            name: 'doc',
            topNode: true,
            content: 'block+',
        });

        const MetaLine = Node.create({
            name: 'metaLine',
            group: 'block',
            content: 'inline*',
            parseHTML() {
                return [
                    { tag: 'p' },
                ]
            },
            renderHTML({ HTMLAttributes }) {
                return ['p', HTMLAttributes, 0]
            },
        });

        const Text = Node.create({
            name: 'text',
            group: 'inline'
        });

        this.metaEditor = new Editor({
            element: postMeta,
            extensions: [
                MetaDocument,
                MetaLine,
                Text
            ],
            editorProps: {
                handleDOMEvents: {
                    keydown: (view, event) => {
                        if (event.code == 'ArrowUp' && view.state.selection.empty && view.state.selection.from == view.state.selection.$head.depth) {
                            setCursorToEnd(this.titleEditor);
                            this.postEditor.commands.focus('end');
                            
                            event.stopPropagation();
                            event.preventDefault();
                        }
                    },
                    focus: (view, event) => {
                        postMetaContainer.style.color = colors.gs.light.pure();
                        postMetaContainer.style.borderColor = colors.atheme;
                    },
                    blur: (view, event) => {
                        if (view.state.doc.textContent.length === 0) {
                            postMetaContainer.style.color = colors.gs.tc.pure();
                            postMetaContainer.style.borderColor = colors.gs.tc.pure();
                        }
                    }
                }
            }
        });
    }
    init(date) {
        //initialize with the day in question
        this.day = date;
        this.sortBy = Post.defaultSort;
        this.textFocused = false;
        this.deleteTimeout = 0;
        this.scrollAlpha = 0;
        this.endpts.addSetTransition('postsLoadState',  0, 0, 0);
        this.endpts.addSetTransition('scrollPos', 0, 0, 0);
        this.endpts.addSetTransition('plusSign', 0, 1, 1);
        this.endpts.addSetTransition('postIndex', 0, 0, 0);

        this.loadDay();
    }

    satisfiesFilters(post) {
        //TODO
        return true;
    }
    satisfiesRecurrence(post) {
        if ('recurrence' in post.metadata) {
            let rec = post.metadata.recurrence;
            return metaExpr.recurrenceFunctions[rec.type](post.startDay, post.endDay, this.day, ...rec.args);
        } else return true;
    }
    satisfiesRange(post) {
        let cindex = this.day.getIndex();
        return post.startDay <= cindex && cindex <= post.endDay && this.satisfiesRecurrence(post);
    }
    satisfiesAllRequirements(post) {
        return this.satisfiesRange(post) && this.satisfiesFilters(post);
    }

    //get the nearest index that should be defaulted to after postIndex is deleted
    nearestPostIndex(postIndex, alreadyDel = 0) {
        if (postIndex < this.posts.length - 1 + alreadyDel) {
            return postIndex + 1;
        } else {
            return postIndex - 1;
        }
    }

    toggleAnnotation(postIndex, type) {
        let post = this.posts[postIndex];
        let startDay = post.startDay;
        let endDay = post.endDay;
        if (type in post.metadata) {
            delete post.metadata[type];
            post.animation[type].dir = -1;
            this.postInfo.savePost(post.postID, startDay, endDay, JSON.stringify(post.metadata));
        } else {
            post.metadata[type] = true;
            post.animation[type].dir = 1;
            this.postInfo.savePost(post.postID, startDay, endDay, JSON.stringify(post.metadata));
        }
        if (!this.satisfiesFilters(post)) {
            this.endpts.addSetTransition('removePost', tts.elb.dissolvePost.total, 0, 1);
            this.removePostIndex = postIndex;
            this.targetPostIndex = this.nearestPostIndex(postIndex);
            if (this.targetPostIndex == -1) {
                this.endpts.addSetTransition('plusSign', tts.elb.dissolvePost.total, 0, 1);
            }
            this.lockInput = true;
        }
    }

    nearestScroll(postIndex) {
        let bottom = this.postHeight[postIndex + 1] + 2*szs.elb.posts.scrollBottomAdjustment;
        let top = this.postHeight[postIndex];
        let sp = this.endpts.end.scrollPos;
        if (top < sp) return top;
        else if (bottom > sp + this.bodyHeight) return bottom - this.bodyHeight
        else return sp;
    }
    resetPosts() {
        this.postsByID = {};
        this.posts = [];
        this.buildPosts();
    }
    sortPosts() {
        this.posts.sort(Post.comparisonFunctions[this.sortBy]);
    }
    sortPostsWithRefresh() {
        this.posts.sort(Post.comparisonFunctions[this.sortBy]);
        this.buildPosts(false);
        this.endpts.addSetTransition('postsLoadState', tts.elb.posts.totalFadeInTime, 0, 1);
        this.endpts.addSetTransition('postIndex', 0, 0, 0);
        this.endpts.addSetTransition('scrollPos', 0, 0, 0);
        this.endpts.addSetTransition('plusSign', 0, 1, 1);
        this.endpts.addSetTransition('postIndex', 0, 0, 0);
    }
    //sorts this.posts and builds a prefix height sum for determining scroll position
    buildPosts(sort = true) {
        if (sort) this.sortPosts();
        this.postHeight = [0];
        let sum = 0;
        let sz = szs.elb;
        this.posts.forEach(p => {
            let h = sz.posts.margins.vertical * 2 + sz.posts.titleFont + sz.posts.descFont + sz.posts.descMarginTop + sz.posts.marginTop0;
            sum += h - (p.desc == '' ? sz.posts.descFont + sz.posts.descMarginTop + sz.posts.marginTop1 : 0);
            this.postHeight.push(sum);
        });
    }

    //does not save anything to sqlite
    insertPost(post) {
        this.postsByID[post.postID] = post;
        let index = lower_bound(this.posts, post, Post.comparisonFunctions[this.sortBy]);
        this.posts.splice(index, 0, post);
        return index;
    }
    //does not save anything to sqlite
    removePost(post) {
        delete this.postsByID[post.postID];
        this.posts.splice(lower_bound(this.posts, post, Post.comparisonFunctions[this.sortBy]), 1);
    }
    removePostByIndex(postIndex) {
        let post = this.posts[postIndex];
        delete this.postsByID[post.postID];
        this.posts.splice(postIndex, 1);
        this.buildPosts();
    }
    //TODO - possible issue if two loadDay() are called and the promises come out of order
    async loadDay() {
        //query for the data for the specific date
        let posts = await this.postInfo.queryDay(this.day.getIndex());

        this.resetPosts();
        
        for (let postID in posts) {
            let p = posts[postID];
            p.postID = parseInt(postID);
            p.metadata = JSON.parse(p.metadata);
            if (!this.satisfiesRecurrence(p)) continue;

            p.desc = p.metadata.displaydesc;
            p.animation = {
                marked : {
                    progress : 1 * ('marked' in p.metadata),
                    dir : 0,
                },
                completed : {
                    progress : 1 * ('completed' in p.metadata),
                    dir : 0,
                }
            }
            this.postsByID[postID] = p;
            this.posts.push(p);
        };

        this.buildPosts();
        this.endpts.addTransition('postsLoadState', tts.elb.posts.totalFadeInTime, 0, 1);
    }
    initPostCreation() {
        this.creating = true;
        this.endpts.addSetTransition('edit', tts.elb.edit.total, 0, 1);
        this.editorContainer.style.visibility = 'visible';
        this.titleEditor.innerHTML = '';
        this.titleEditor.focus();
        this.postEditor.commands.clearContent();
        this.metaEditor.commands.clearContent();

        postMetaContainer.style.color = colors.gs.tc.pure();
        postMetaContainer.style.borderColor = colors.gs.tc.pure();
    }
    initPostUpdating() {
        this.titleEditor.innerHTML = '';
        this.postEditor.commands.clearContent();
        this.metaEditor.commands.clearContent();

        this.creating = false;
        this.loadPost(this.posts[this.endpts.end.postIndex]);
        this.postEditor.commands.focus('start');
        this.endpts.addSetTransition('edit', tts.elb.edit.total, 0, 1);
        this.editorContainer.style.visibility = 'visible';
    }

    //helper function for parseEditorMeta
    parseMetaLine(meta, metaLine) {
        //return bool for whether line is actually parsed
        //remember to convert to lowercase
        metaLine = metaLine.toLowerCase();
        let words = metaLine.split(' ');
        if (words[0] in metaExpr.keywordToType) {
            metaExpr.parsers[metaExpr.keywordToType[words[0]]](meta, words, this.day);
        }
    }

    //given the output from metaEditor generate a js object
        //feed in editor.getJSON()
    parseEditorMeta(editorMeta) {
        let meta = {};
        let content = editorMeta.content;

        //iterate in reverse to give priority to last lines
        for (let i = content.length - 1; i >= 0; i--) {
            if ('content' in content[i]) {
                let line = content[i].content;
                let lineText = '';
                for (let j = 0; j < line.length; j++) {
                    lineText += line[j].text;
                }
                this.parseMetaLine(meta, lineText); //TODO: use the return value from parseMetaLine
            }
        }

        meta.title = this.titleEditor.innerHTML;
        return meta;
    }

    generateEditorMeta(metadata) {
        let expressions = [];
        for (let keyword in metadata) {
            if (keyword in metaExpr.exclude) continue;
            let expr = metaExpr.stringifiers[keyword](metadata, this.day);
            expressions.push({
                type : 'metaLine',
                content : [
                    {
                        type : 'text',
                        text : expr
                    }
                ]
            });
        }
        expressions.reverse();
        let content = {
            type : 'doc',
            content : expressions
        };
        return content;
    }

    pullDescFromEditor() {
        let ret = this.postEditor.getText();
        if (ret.length > 100) {
            return ret.slice(0, 100) + '...'; //MARKED
        } else {
            return ret;
        }
    }
    //on the renderer side, savePost() encompasses both creation of posts and saving of posts
    //right now, savePost is pretty inefficient (simply sends the entire post to be saved)
    savePost() {
        if (!this.needSave) return;
        this.needSave = false;

        if (this.creating) {
            let metadata = this.parseEditorMeta(this.metaEditor.getJSON());
            let internals = JSON.stringify(this.postEditor.getJSON());
            this.creating = false;
            let postID = ++this.maxPostID;

            let desc;
            if ('desc' in metadata) {
                desc = metadata.desc;
            } else {
                desc = this.pullDescFromEditor();
            }

            metadata.displaydesc = desc;

            let startDay, endDay;

            if ('startDay' in metadata) {
                startDay = metadata.startDay;
                endDay = metadata.endDay;
            } else {
                startDay = endDay = this.day.getIndex();
            }

            this.endpts.addSetTransition('loadedPost', 0, 1, 1);

            this.postInfo.createPost(postID, internals, startDay, endDay, JSON.stringify(metadata));

            let post = {
                postID,
                metadata,
                desc,
                startDay,
                endDay,
                animation : {
                    marked : {
                        progress : 1 * ('marked' in metadata),
                        dir : 0,
                    },
                    completed : {
                        progress : 1 * ('completed' in metadata),
                        dir : 0,
                    }
                }
            }

            if (this.satisfiesAllRequirements(post)) {
                let pos = this.insertPost(post);
                this.endpts.addSetTransition('plusSign', 0, 0, 0);
                this.endpts.addSetTransition('postIndex', 0, pos, pos);
                let newScrollPos = this.nearestScroll(pos);
                this.endpts.addSetTransition('scrollPos', 0, newScrollPos, newScrollPos);
            } else {
                if (this.satisfiesRange(post)) this.postsByID[post.postID] = post;
                let tPostIndex = this.nearestPostIndex(this.endpts.end.postIndex, 1);
                if (tPostIndex == -1) {
                    this.endpts.addSetTransition('plusSign', 0, 1, 1);
                } else if (tPostIndex < this.endpts.end.postIndex) {
                    this.endpts.addSetTransition('postIndex', 0, tPostIndex, tPostIndex);
                }
            }
            this.buildPosts(false);

            
        } else {
            let metadata = this.parseEditorMeta(this.metaEditor.getJSON());
            let internals = JSON.stringify(this.postEditor.getJSON());

            let post = this.posts[this.endpts.end.postIndex];

            let desc;
            if ('desc' in metadata) {
                desc = metadata.desc;
            } else {
                desc = this.pullDescFromEditor();
            }

            metadata.displaydesc = desc;

            let startDay, endDay;
            if ('startDay' in metadata) {
                startDay = metadata.startDay;
                endDay = metadata.endDay;
            } else {
                startDay = endDay = this.day.getIndex();
            }

            //MARKED - error because of post.postID not being a thing (post is undefined)
            this.postInfo.savePost(post.postID, startDay, endDay, JSON.stringify(metadata));
            this.postInfo.updateInternals(post.postID, internals);

            this.removePost(post);
            
            post = {
                postID : post.postID,
                metadata,
                desc,
                startDay : startDay,
                endDay : endDay,
                animation : {
                    marked : {
                        progress : 1 * ('marked' in metadata),
                        dir : 0,
                    },
                    completed : {
                        progress : 1 * ('completed' in metadata),
                        dir : 0,
                    }
                }
            }
            if (this.satisfiesAllRequirements(post)) {
                this.insertPost(post);
            } else {
                if (this.satisfiesRange(post)) this.postsByID[post.postID] = post;
                let tPostIndex = this.nearestPostIndex(this.endpts.end.postIndex, 1);
                if (tPostIndex == -1) {
                    this.endpts.addSetTransition('plusSign', 0, 1, 1);
                } else if (tPostIndex < this.endpts.end.postIndex) {
                    this.endpts.addSetTransition('postIndex', 0, tPostIndex, tPostIndex);
                }
            }
            this.buildPosts(false);
        }
    }

    deletePost(post) {
        this.postInfo.deletePost(post.postID);
    }

    async loadPost(post) {
        let internals = JSON.parse(await this.postInfo.getInternals(post.postID));

        if (post.postID == this.posts[this.endpts.end.postIndex].postID) {
            this.postEditor.commands.setContent(internals);
            
            this.metaEditor.commands.setContent(this.generateEditorMeta(post.metadata));
            this.titleEditor.innerHTML = post.metadata.title;

            this.endpts.addSetTransition('loadedPost', tts.elb.edit.loadedPost, this.state.loadedPost, 1);

            if (this.metaEditor.getText().length == 0) {
                postMetaContainer.style.color = colors.gs.tc.pure();
                postMetaContainer.style.borderColor = colors.gs.tc.pure();
            } else {
                postMetaContainer.style.color = colors.gs.light.pure();
                postMetaContainer.style.borderColor = colors.atheme;
            }
        }
    }
    focus() {
        eventsHandler.focusedObj = this;
    }
    unfocus() {
        timechain.dayView(-1);
        eventsHandler.focusedObj = timechain;
    }
    highlightPlusSign(toggle) {
        this.endpts.addSetTransition('plusSign', tts.elb.postIndex, this.state.plusSign, toggle);
    }
    updatePostIndex(delta) {
        this.endpts.addTransition('postIndex', tts.elb.postIndex, this.state.postIndex, delta);
    }
    onInput() {
        let controlDown = eventsHandler.keysDown['ControlLeft'] || eventsHandler.keysDown['ControlRight'];
        let shiftDown = eventsHandler.keysDown['ShiftLeft'] || eventsHandler.keysDown['ShiftRight'];
        let end = this.endpts.end;

        let right = eventsHandler.keysPressed['ArrowRight'];
        let left = eventsHandler.keysPressed['ArrowLeft'];
        let up = eventsHandler.keysPressed['ArrowUp'];
        let down = eventsHandler.keysPressed['ArrowDown'];
        let del = eventsHandler.keysPressed['Backspace'] || eventsHandler.keysPressed['Delete'];
        if (!this.textFocused) {
            if (!this.lockInput) {
                if (del && this.endpts.end.plusSign == 0) {
                    if (this.deleteTimeout == 0) this.deleteTimeout = tts.elb.deleteTimeout;
                    else {
                        this.deleteTimeout = 0;
                        this.removePostIndex = this.endpts.end.postIndex;
                        this.targetPostIndex = this.nearestPostIndex(this.removePostIndex);
                        this.lockInput = true;
                        this.deletePost(this.posts[this.removePostIndex]);
                        if (this.targetPostIndex == -1) {
                            this.endpts.addSetTransition('plusSign', tts.elb.dissolvePost.total, 0, 1);
                        }
                        this.endpts.addSetTransition('removePost', tts.elb.dissolvePost.total, 0, 1);
                        return;
                    }
                }
                let clearDelTimeout = false;
                if (eventsHandler.keysPressed['Enter']) {
                    this.needSave = false;
                    this.textFocused = true;
                    this.overrideNeedSave = 0;
                    if (end.plusSign) {
                        this.initPostCreation();
                        clearDelTimeout = true;
                    } else {
                        this.initPostUpdating();
                        clearDelTimeout = true;
                    }
                    return;
                }
                if (right) {
                    timechain.updateCurr(1);
                }
                if (left) {
                    timechain.updateCurr(-1);
                }
                if (up) {
                    if (end.plusSign) {
                        this.unfocus();
                    } else if (end.postIndex == 0) {
                        this.highlightPlusSign(1);
                        clearDelTimeout = true;
                    } else if (end.postIndex > 0) {
                        this.updatePostIndex(-1);
                        clearDelTimeout = true;
                    }
                }
                if (down) {
                    if (end.plusSign) {
                        this.endpts.addSetTransition('postIndex', 0, 0, 0);
                        if (end.postIndex < this.posts.length) {
                            this.highlightPlusSign(0);
                            clearDelTimeout = true;
                        }
                    } else if (end.postIndex < this.posts.length - 1) {
                        this.updatePostIndex(1);
                        clearDelTimeout = true;
                    }
                }
                if (eventsHandler.keysPressed['Escape']) {
                    this.unfocus();
                }
                
                if (controlDown && shiftDown) {
                    if (eventsHandler.keysPressed['KeyT']) {
                        this.sortBy = 'time';
                        this.sortPostsWithRefresh();
                    } else if (eventsHandler.keysPressed['KeyP']) {
                        this.sortBy = 'priority';
                        this.sortPostsWithRefresh();
                    } else if (eventsHandler.keysPressed['KeyA']) {
                        this.sortBy = 'alpha';
                        this.sortPostsWithRefresh();
                    } else if (eventsHandler.keysPressed['KeyD']) {
                        this.sortBy = 'default';
                        this.sortPostsWithRefresh();
                    }
                } else {
                    if (end.plusSign == 0) {
                        if (eventsHandler.keysPressed['KeyC']) {
                            this.toggleAnnotation(end.postIndex, 'completed');
                            clearDelTimeout = true;
                        }
                        if (eventsHandler.keysPressed['KeyM']) {
                            this.toggleAnnotation(end.postIndex, 'marked');
                            clearDelTimeout = true;
                        }
                    }
                }

                if (clearDelTimeout) {
                    this.deleteTimeout = 0;
                }
            }
        } else {
            if (eventsHandler.keysPressed['Escape']) {
                if (this.overrideNeedSave == 0 && this.needSave) this.overrideNeedSave = tts.elb.overrideNeedSave;
                else {
                    this.postEditor.commands.blur();
                    this.titleEditor.blur();
                    this.metaEditor.commands.blur();
                    if (this.creating) {
                        this.textFocused = false;
                        this.endpts.addSetTransition('edit', tts.elb.edit.total, 1, 0);
                    } else {
                        this.textFocused = false;
                        this.endpts.addSetTransition('edit', tts.elb.edit.total, 1, 0);
                    }
                }
            }
            if (controlDown && eventsHandler.keysPressed['KeyS']) {
                this.savePost();
            }
        }
    }
    render() {
        let state = this.state;
        let end = this.endpts.end;
        let sz = szs.elb;
        let tt = tts.elb;
        let dayView = timechain.state.dayView;
        
        let y0 = -screen.ch / 2;
        let width = (screen.cw - 2 * szs.elb.margins.side);
        let height = (screen.ch - (szs.elb.margins.top + szs.elb.margins.bottom));
        let top = y0 + barH / screen.scale + szs.elb.margins.top + (1 - dayView) * screen.ch * sz.maxYDisp;
        let left = this.x + this.state.xOffset - width/2;
        let right = left + width;
        let bottom = top + height;

        let alpha = dayView;
        alpha *= 1 - state.isLoad;

        let color1 = colors.theme.multiply(oscillate(.8, sz.shadeOsc, sz.shadeOscFreq, now), true); //MARKED
        let color2 = colors.gs.tc.multiply(oscillate(.6, sz.shadeOsc, sz.shadeOscFreq, now), true);//MARKED

        let highlight = color2.blend(color1, dayView, true).blend(colors.gs.dark, 1 - alpha);
        let plusBarActive = state.plusSign;
        let plusColor = colors.gs.dark.pure();
        let plusBarColor1 = colors.gs.deselect;
        let plusBarGrad = color1.blend(plusBarColor1, 1 - plusBarActive, true).blend(colors.gs.dark, 1 - (1-state.edit) * alpha);

        ctx.textBaseline = 'top';
        ctx.textAlign = 'left';

        let plusThick = 1;
        let createEditing = 0;
        let updateEditing = 0;
        let earlyEditFade = Math.max(tt.edit.earlyFade - state.edit, 0) / tt.edit.earlyFade;
        let lateEditFade = Math.min(1 - state.edit, tt.edit.lateFade) / tt.edit.lateFade; 

        this.editorContainer.style.opacity = 0;
        if (state.edit > 0) {
            if (this.creating) {
                plusThick = 1 - state.edit;
                createEditing = state.edit;
                this.editorContainer.style.opacity = 1 - lateEditFade;
            } else {
                updateEditing = state.edit;
                this.editorContainer.style.opacity = state.loadedPost * (1 - lateEditFade);
            }
            this.editorContainer.style.transform = 'translate(' + (left * screen.scale + window.innerWidth/2) + 'px,' + (top * screen.scale + window.innerHeight/2) + 'px)';
            this.editorContainer.style.height = (height * screen.scale) + 'px';
        }
        
        let fadePosts = 1 - state.edit;
        let textColor = colors.gs.light.blend(colors.gs.dark, 1 - alpha * earlyEditFade);
        
        this.deleteTimeout = Math.max(this.deleteTimeout - delta, 0);

        this.bodyHeight = bottom - (top + sz.header + sz.plusBar.lineWidth * .5);
        
        if (state.postsLoadState > 0 && fadePosts > 0 && this.posts.length > 0) {
            let pls = state.postsLoadState;
            let postTop = top + sz.header;

            if (state.removePost == 1 && this.lockInput) {
                this.lockInput = false;
                this.endpts.addSetTransition('removePost', 0, 0, 0);
                state.removePost = 0;
                this.removePostByIndex(this.removePostIndex);
                if (this.targetPostIndex == this.removePostIndex - 1) {
                    if (this.targetPostIndex > -1) {
                        this.endpts.addSetTransition('postIndex', 0, this.targetPostIndex, this.targetPostIndex);
                        state.postIndex = this.targetPostIndex;
                    }
                }
            }

            ctx.save();
            ctx.beginPath();
            ctx.rect(left, postTop, width, height - sz.header);
            ctx.clip();
            
            postTop += sz.plusBar.lineWidth * .5;

            if (end.postIndex < this.posts.length) {
                let nscroll = this.nearestScroll(end.postIndex);
                if (nscroll != end.scrollPos) {
                    this.endpts.addSetTransition('scrollPos', tts.elb.scrollTo, state.scrollPos, nscroll);
                }
            }

            let earlyRemovePost = 1 - Math.max(tt.dissolvePost.early - state.removePost, 0) / tt.dissolvePost.early;
            let lateRemovePost = 1 - Math.min(1 - state.removePost, tt.dissolvePost.late) / tt.dissolvePost.late;
            
            let startPos = clamp(lower_bound(this.postHeight, state.scrollPos, (a, b) => { return a - b; }) - 1, 0, this.posts.length);
            postTop += this.postHeight[startPos] - state.scrollPos;
            if (state.removePost > 0 && startPos > this.removePostIndex) {
                let h = this.postHeight[this.removePostIndex + 1] - this.postHeight[this.removePostIndex];
                postTop -= h * (1 - lateRemovePost);
            }

            for (let i = startPos; i < this.posts.length; i++) {
                let post = this.posts[i];
                let anim = post.animation;
                for (let annotation in anim) {
                    anim[annotation].progress = clamp(anim[annotation].progress + anim[annotation].dir * tt.annotationSpeed[annotation] * delta, 0, 1);
                }

                let selectAmt = (1 - Math.min(Math.abs(i - state.postIndex), 1)) * (1 - state.plusSign)
                
                let endFade = hasymptote(i, tt.posts.hasy.i, tt.posts.hasy.c);
                let beginFade = endFade - tt.posts.hasy.i;
                let fadeAmt = clamp(pls - beginFade, 0, tt.posts.hasy.i) / tt.posts.hasy.i;

                let postAlpha = alpha * fadeAmt * Math.pow(fadePosts, 1 - .6 * selectAmt);

                let textAlpha = 1 - sz.posts.completeFade * anim.completed.progress;
                let markAmt = anim.marked.progress;

                let postHeight = this.postHeight[i + 1] - this.postHeight[i];
                let sideBarWidth = sz.posts.sideBarWidth * selectAmt;
                if (state.removePost > 0) {
                    if (i == this.removePostIndex) {
                        postHeight *= (1 - lateRemovePost);
                        textAlpha *= (1 - earlyRemovePost);
                        sideBarWidth = lerp(sideBarWidth, width, earlyRemovePost);
                        markAmt *= (1 - earlyRemovePost);
                    } else if (i == this.targetPostIndex) {
                        selectAmt = Math.max(selectAmt, state.removePost);
                        sideBarWidth = sz.posts.sideBarWidth * selectAmt;
                    }
                }

                let baseColor = colors.gs.deselect.blend(colors.gs.dark, 1 - postAlpha);
                let highlightColor = color1.blend(colors.gs.dark, 1 - selectAmt * alpha);
                

                let marginVert = sz.posts.margins.vertical + sz.posts.marginTop0;

                if (post.desc == '') marginVert -= sz.posts.marginTop1;

                let descMarginTop = sz.posts.descMarginTop;

                if (this.deleteTimeout > 0 && i == end.postIndex) {
                    ctx.fillStyle = color1.blend(colors.gs.dark, 1 - postAlpha * textAlpha);
                } else {
                    ctx.fillStyle = colors.gs.light.blend(colors.gs.dark, 1 - postAlpha * textAlpha);
                }
                ctx.font = "Bold " + sz.posts.titleFont + "px " + mainFont;
                ctx.fillText(post.metadata.title, left + sz.posts.margins.side + sz.posts.sideBarWidth + sz.posts.sideBarWidth * selectAmt, postTop + marginVert);

                if (post.desc != '') {
                    ctx.font = sz.posts.descFont + "px " + mainFont;
                    ctx.fillText(post.desc, left + sz.posts.margins.side + sz.posts.sideBarWidth + sz.posts.sideBarWidth * selectAmt, postTop + descMarginTop + marginVert + sz.posts.titleFont);
                }
                
                ctx.fillStyle = highlightColor;
                ctx.fillRect(left, postTop + postHeight * (1 - lateEditFade) / 2, sideBarWidth, postHeight * (lateEditFade));

                if (markAmt > 0) {
                    ctx.fillStyle = color1.blend(colors.gs.dark, 1 - postAlpha);
                    ctx.translate(-sz.posts.markMargin - sz.frameWidth/2, sz.posts.markMargin);
                    ctx.beginPath();
                    ctx.moveTo(right - sz.posts.mark, postTop);
                    ctx.lineTo(right - sz.posts.mark * (1 - markAmt), postTop);
                    ctx.lineTo(right, postTop + sz.posts.mark * (1 - markAmt));
                    ctx.lineTo(right, postTop + sz.posts.mark);
                    ctx.closePath();
                    ctx.fill();
                    ctx.translate(sz.posts.markMargin + sz.frameWidth/2, -sz.posts.markMargin);
                }

                //ctx.lineWidth = sz.posts.borderWidth;
                //ctx.strokeRect(left, postTop, width, postHeight);                
                
                postTop += postHeight;
                ctx.strokeStyle = baseColor;
                hline(left, right, postTop, sz.posts.borderWidth);

                if (postTop > state.scrollPos + this.bodyHeight) break;
            }
            
            ctx.restore();
        }

        if (state.edit > 0) {
            this.overrideNeedSave = Math.max(this.overrideNeedSave - delta, 0);
            ctx.fillStyle = (this.needSave && this.overrideNeedSave == 0) ? colors.gs.light.pure() : highlight;
            let triangleWidth = state.edit * sz.backArrow;
            let spacing = sz.backArrow;
            let leftPos = left - sz.frameWidth / 2;
            let topPos = top - sz.arrowVerticalHover;
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.lineTo(leftPos, topPos);
                ctx.lineTo(leftPos + triangleWidth, topPos);
                ctx.lineTo(leftPos + triangleWidth, topPos - triangleWidth);
                ctx.closePath();
                ctx.fill();
                leftPos += spacing;
            }
        }

        if (state.edit < 1) {
            ctx.fillStyle = textColor;
            ctx.font = "Bold " + sz.headerFont + "px " + mainFont;
            ctx.fillText(this.day.getDayName(), left + sz.padding.left, top + sz.padding.top);
            
            ctx.strokeStyle = plusBarGrad; //TODO, change color
            let plusBarBase = top + sz.header;
            hline(left, left + width, plusBarBase, sz.plusBar.lineWidth + state.edit);
            ctx.fillStyle = plusBarGrad;
            ctx.beginPath();
            ctx.moveTo(right - sz.plusBar.w2 - createEditing * sz.plusBar.extend, plusBarBase);
            ctx.lineTo(right, plusBarBase);
            ctx.lineTo(right, plusBarBase - sz.plusBar.h);
            ctx.lineTo(right - sz.plusBar.w1 - createEditing * sz.plusBar.extend, plusBarBase - sz.plusBar.h);
            ctx.closePath();
            ctx.fill();
            
            let plusCenter = [right - sz.plusBar.h/2, top + sz.plusBar.h/2];

            ctx.beginPath();        
            ctx.strokeStyle = plusColor;
            hline(plusCenter[0] - sz.plusBar.plusSign.size/2, plusCenter[0] + sz.plusBar.plusSign.size/2, plusCenter[1], sz.plusBar.plusSign.lineWidth * plusThick);
            vline(plusCenter[1] - sz.plusBar.plusSign.size/2, plusCenter[1] + sz.plusBar.plusSign.size/2, plusCenter[0], sz.plusBar.plusSign.lineWidth * plusThick);
            
            ctx.font = "Bold " + sz.titleFont + "px " + mainFont;
            ctx.fillStyle = textColor;
            ctx.textBaseline = 'middle';
            ctx.fillText(timechain.selected.formatted(), left + sz.topIndent + sz.titleMargin, top);
        }


        let scrollBarTop = bottom - this.bodyHeight;
        let scrollBarHeight = this.bodyHeight + sz.frameWidth / 2;
        let scrollKnobTop = 0;
        let scrollKnobHeight = 0;
        let scrollBarX = right + sz.scroll.margin;
        if (this.posts.length > 1) {
            scrollKnobTop = state.postIndex / (this.posts.length - 1);
        }
        let scrollKnobModulator = 1;
        if (state.edit > 0) {
            if (this.editorContainer.scrollHeight != this.editorContainer.clientHeight) {
                scrollBarTop = lerp(scrollBarTop, top, state.edit);
                scrollBarHeight = lerp(scrollBarHeight, bottom - top + sz.frameWidth / 2, state.edit);
                scrollKnobTop = lerp(scrollKnobTop, this.editorContainer.scrollTop / this.editorContainer.scrollHeight, state.edit);
                scrollKnobHeight = lerp(scrollKnobHeight, this.editorContainer.clientHeight / this.editorContainer.scrollHeight, state.edit);
            } else {
                if (end.edit == 1) {
                    scrollKnobModulator = 0;
                }
            }
            if (state.edit == 1) {
                scrollBarTop = lerp(scrollBarTop, top, state.edit);
                scrollBarHeight = lerp(scrollBarHeight, bottom - top + sz.frameWidth / 2, state.edit);
            }
            if (end.edit == 0) {
                if (this.posts.length > 1 && this.postHeight[this.postHeight.length - 1] > this.bodyHeight) {
                    this.scrollAlpha = Math.min(this.scrollAlpha + tt.scrollAlphaReactiveness * delta, 1);
                }
            } else {
                if (this.editorContainer.scrollHeight != this.editorContainer.clientHeight) {
                    this.scrollAlpha = Math.min(this.scrollAlpha + tt.scrollAlphaReactiveness * delta, 1);
                } else {
                    this.scrollAlpha = Math.max(this.scrollAlpha - tt.scrollAlphaReactiveness * delta, 0);
                }
            }
        } else if (this.posts.length > 1 && this.postHeight[this.postHeight.length - 1] > this.bodyHeight) {
            this.scrollAlpha = Math.min(this.scrollAlpha + tt.scrollAlphaReactiveness * delta, 1);
        } else {
            this.scrollAlpha = Math.max(this.scrollAlpha - tt.scrollAlphaReactiveness * delta, 0);
        }
        let scrollKnobSize = this.scrollAlpha * sz.scroll.knob * scrollKnobModulator;
        this.scrollAlpha *= state.postsLoadState;
        ctx.strokeStyle = ctx.fillStyle = color1.blend(colors.gs.dark, 1 - alpha * this.scrollAlpha);
        vline(scrollBarTop, scrollBarTop + scrollBarHeight, scrollBarX, sz.scroll.thickness);
        let scrollKnobBottom = scrollKnobTop + scrollKnobHeight;
        let knob1 = scrollBarTop + scrollKnobTop * scrollBarHeight;
        let knob2 = scrollBarTop + scrollKnobBottom * scrollBarHeight;
        
        ctx.beginPath();
        ctx.lineTo(scrollBarX - scrollKnobSize, knob1);
        ctx.lineTo(scrollBarX, knob1 - scrollKnobSize);
        ctx.lineTo(scrollBarX + scrollKnobSize, knob1);
        ctx.lineTo(scrollBarX + scrollKnobSize, knob2);
        ctx.lineTo(scrollBarX, knob2 + scrollKnobSize);
        ctx.lineTo(scrollBarX - scrollKnobSize, knob2);
        ctx.closePath();
        ctx.fill();
        
        ctx.font = "Bold " + sz.titleFont + "px " + mainFont;
        let titleLength = ctx.measureText(this.day.formatted()).width;

        //rendering the frame
        ctx.strokeStyle = highlight;
        
        ctx.lineWidth = sz.frameWidth;
        ctx.beginPath();
        let frameRadius = sz.frameWidth / 2;
        ctx.moveTo(left + sz.topIndent, top);
        ctx.lineTo(left, top);
        ctx.lineTo(left, bottom);
        ctx.lineTo(right, bottom);
        ctx.lineTo(right, top);
        ctx.lineTo(left + sz.topIndent + (titleLength + 2 * sz.titleMargin) * lateEditFade, top);
        ctx.stroke();
        
        ctx.globalAlpha = 1;
    }
}

class TextBlock extends Block {

}

class Event {
    constructor(options) {
        setOptions.call(this, options);
        this.id = ct++;
        lookup[ct] = this;
    }
}

/*

*/
class TCState extends State {
    constructor(options = {}) {
        super(options);
        
        //this.x = 0; //x-coord will probably never be used, just saying
        this.y = 0;
        this.curr0 = 0; //just decides displacement (you press the right key 3 times => displacement += 3)
        this.curr1 = 0;
        this.curr2 = 0;
        this.curr3 = 0;
        this.currDay = 0;
        this.layer = 0;
        this.spacing0 = 1;
        this.spacing1 = 1+tcstretch;
        this.spacing2 = 1+tcstretch;
        this.spacing3 = 1+tcstretch;
        this.dayView = 0;

        setOptions.call(this, options);
    }
}

let today = new Date();
today.setFTOD();
let lastTime = today.getTime();
let timechain = {
    state : new TCState(),
    endpts : new EndPts(TCState, {transitiontime: 1}),
    layers : [0,0,0,0],
    textAlpha : 0,
    selected : new Date(),
    datePos : new Position(0, 0),
    
    ELB : new EventListBlock(),
    ELBcache : { // caches data for a session so the user can easily go back to what they were doing in a certain day
        //format: 'some date format' : new ELBSave(),
    },
    updateCurr(delta) {
        let ci = 'curr'+this.endpts.end.layer;
        this.endpts.addTransition(ci, tts.timechain.curr, this.state[ci], -delta);
        this.selected.add(this.endpts.end.layer, delta);
        this.textAlpha = 0;

        if (this.endpts.end.dayView) this.ELB.init(this.selected);
        this.ELB.endpts.addSetTransition('isLoad', tts.elb.loadUp, 1, 0);
        this.ELB.endpts.addSetTransition('xOffset', tts.elb.shiftIn, delta * szs.elb.maxXOffset, 0);
    },
    updateLayer(delta) {
        delta = clamp(this.endpts.end.layer + delta, 0, 3) - this.endpts.end.layer;
        let before = this.endpts.end.layer;
        this.endpts.addTransition('layer', tts.timechain.layer, this.state.layer, delta);
        if (delta != 0) {
            this.textAlpha = 0;
            let after = this.endpts.end.layer;
            let sb = 'spacing' + before;
            let sa = 'spacing' + after;
            this.endpts.addSetTransition(sb, tts.timechain.stretch, this.state[sb], 1 - delta*szs.timechain.tcstretch);
            this.endpts.addSetTransition(sa, tts.timechain.stretch, this.state[sa], 1);
        }
    },
    //switch between specific dayview and timechain view
    dayView(delta) {
        this.endpts.addTransition('dayView', tts.timechain.dayView, this.state.dayView, delta);
        if (delta > 0) {
            this.endpts.addSetTransition('spacing0', tts.timechain.stretch, this.state['spacing0'], 1 + szs.timechain.tcstretch);
            this.ELB.focus();
            this.ELB.init(this.selected);
        } else {
            this.endpts.addSetTransition('spacing0', tts.timechain.stretch, this.state['spacing0'], 1);
        }
    },
    simulate() {
        this.selected.setFTOD();

        update(this.ELB, transitions.general);
        if (update(this, transitions.general)) {
            return;
        }
    },
    onInput() {
        if (true) {//some condition to be inserted later
            let right = eventsHandler.keysPressed['ArrowRight'];
            let left = eventsHandler.keysPressed['ArrowLeft'];
            let up = eventsHandler.keysPressed['ArrowUp'];
            let down = eventsHandler.keysPressed['ArrowDown'];

            if (right) {
                this.updateCurr(1);
            }
            if (left) {
                this.updateCurr(-1);
            }
            if (up) {
                if (this.endpts.end.dayView == 1) {
                    this.dayView(-1);
                } else {
                    this.updateLayer(1);
                }
            }
            if (down || eventsHandler.keysPressed['Enter']) {
                if (this.endpts.end.layer > 0) {
                    this.updateLayer(-1);
                } else if (this.endpts.end.dayView == 0) {
                    this.dayView(1);
                }
            }
            if ((eventsHandler.keysPressed['ShiftLeft'] || eventsHandler.keysPressed['ShiftRight']) && this.endpts.end.dayView == 0) {
                let layer = this.endpts.end.layer;
                for (; layer >= 0; layer--) {
                    this.updateLayer(-1);
                }
                if (this.selected.difference(today, 0) != 0) {
                    this.selected.setToToday();
                    this.textAlpha = 0;
                }
            }
        }
    },
    render() {
        let state = this.state;
        let end = this.endpts.end;
        let sz = szs.timechain;
        let tt = tts.timechain;
        let leftEndpt = -Math.ceil(screen.cw/2 + 1);
        let rightEndpt = -leftEndpt;

        let dtheta = Math.PI/8;
        let baseangle = Math.PI/2-state.layer*dtheta;

        this.textAlpha = clamp(this.textAlpha + delta, 0, tt.textsaturation);
        let datePos = this.datePos;
        datePos.x = 0;
        datePos.y = 0;
        let white = colors.gs.light.multiply(oscillate(1-sz.shadeOsc, sz.shadeOsc, sz.shadeOscFreq, now));

        let y0 = - screen.ch / 2;

        let y = state.dayView * (y0 + barH / screen.scale + sz.dayView.margins.top);
        let scaleY = (1 + state.dayView * sz.dayView.lineSpacingStretch);
        
        if (state.dayView > 0) {
            this.ELB.render();
        }
        
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "Bold 20px " + mainFont ; //MARKED

        for (let i = 0; i < 4; i++) {
            if (state.dayView == 1 && i > 0) break;
            if (i > 0) ctx.globalAlpha = 1 - state.dayView;

            let ci = 'curr' + i;
            let si = 'spacing' + i;
            let angle = baseangle + dtheta*i;
            let dy = scaleY * sz.height/2 * Math.cos(angle) + y;
            let thickness = sz.maxLineWidth - ((1-Math.sin(angle))/3); //MARKED

            let color1 = colors.theme.multiply(oscillate(.8, sz.shadeOsc, sz.shadeOscFreq, now + i * sz.shadeOscOffset), true); //MARKED
            let color2 = colors.gs.tc.multiply(oscillate(.6, sz.shadeOsc, sz.shadeOscFreq, now + i * sz.shadeOscOffset), true);//MARKED
            if (i != end.layer) {
                this.layers[i] = clamp(this.layers[i] - delta, 0, tt.layersaturation);
            } else {
                this.layers[i] = clamp(this.layers[i] + delta, 0, tt.layersaturation);
            }
            let highlight = color2.blend(color1, (1 - state.dayView) * this.layers[i]/tt.layersaturation);
            ctx.strokeStyle = highlight;
            hline(leftEndpt, rightEndpt, dy, thickness);
            
            ctx.fillStyle = highlight;
            ctx.globalAlpha = 1 - state.dayView;
            let prog = this.layers[i]/tt.layersaturation;
            let transparency = prog * ctx.globalAlpha;
            ctx.globalAlpha = transparency;
            
            if (prog > 0) {
                let spacing = sz.spacing * state[si];
                let offset = state[ci] - end[ci];
                ctx.fillStyle = highlight;
                let r = Math.ceil(rightEndpt/spacing)+1;
                for (let x = spacing * (-r + state[ci]%1); x < r*spacing; x += spacing) {
                    ctx.globalAlpha = prog * (1 - state.dayView * clamp(2 * Math.abs(x)/spacing, 0, 1));
                    circle(x, dy, sz.circle);
                }
                if (i == end.layer) {
                    datePos.x = spacing*offset;
                    datePos.y = -30 + dy; //MARKED
                }
                if (i == 0) {
                    let datedif = this.selected.difference(today, 0);
                    ctx.strokeStyle = colors.gs.bright.multiply(oscillate(1-sz.shadeOsc, sz.shadeOsc, sz.shadeOscFreq, now));
                    ctx.lineWidth = sz.selectWidth;
                    circle(spacing * (offset + datedif), dy, sz.circle, true);
                }
            }
            ctx.globalAlpha = 1;
        }
        ctx.globalAlpha = (1-state.dayView) * this.textAlpha / tt.textsaturation;
        ctx.fillStyle = white;
        ctx.fillText(this.selected.formatted(), datePos.x, datePos.y);
        ctx.globalAlpha = 1;
        /*ctx.fillStyle = colors.gs.light.pure();
        ctx.fillText(this.selected.formatted(), 0, -3);*/
    }
}

class UIstate {
    //dont know if will need this
}

let UI = {
    camera: new Position(0,0), //centered position of camera
    activeBlocks: [],
    render() {
        timechain.render();
    }
}

function resize() {
    let w = window.innerWidth, h = window.innerHeight;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    canvas.width = w;
    canvas.height = h;

    cbar.style.width = w + 'px';
    cbar.width = w;

    screen.w = w;
    screen.h = h;
    screen.cw = w / screen.scale;
    screen.ch = screen.cw * h / w;
    
    //MARKED
    szs.elb.margins.side = 1;
    let widthThreshold = 1200;
    let widthFraction = .20;
    let minSideMargin = 40 * 156 / 192;
    if (w >= widthThreshold) {
        szs.elb.margins.side *= widthFraction * w;
    } else {
        szs.elb.margins.side *= Math.max((w - widthThreshold * (1 - 2 * widthFraction)) / 2, minSideMargin * screen.scale);
    }
    
    postEditorContainer.style.width = (w - 2*szs.elb.margins.side - 2*szs.elb.editor.margin / screen.scale) + 'px';

    szs.elb.margins.side *= 1/screen.scale;

    //screen.scale = w/screen.cw;
    /*ctx.setTransform(1,0,0,1,0,0);
    let ratio = screen.cW / w;
    screen.cH = screen.cW * h / w;
    ctx.scale(ratio, ratio);*/
}

function createEventListeners() {
    window.addEventListener('resize', resize);
    window.addEventListener('keydown', function(e) {
        eventsHandler.keysDown[e.code] = true;
        eventsHandler.keysPressed[e.code] = true;
    });
    window.addEventListener('keyup', function(e) {
        eventsHandler.keysDown[e.code] = false;
    });
    window.addEventListener('mousemove', function(e) {
        mouse.r = e.pageX;
        mouse.t = e.pageY;
    });
    window.addEventListener('mousedown', function() {
        mouse.click = true;
    });
    window.addEventListener('mouseup', function(e) {
        mouse.release = true;
    });
    window.addEventListener('mouseout', function(e) {
        mouse.clear();
    });
    window.addEventListener('blur', function(e) {
        eventsHandler.keysDown = {};
    });
}

class WindowButton {
    constructor(config) {
        this.isHover = false;
        this.saturationTime = advancedConfig.buttonSaturationTime;
        this.progress = 0;
        for (let property in config) {
            this[property] = config[property];
        }
        this.onClick = config.onClick;
        this.id = ct++;
        this.mouseDown = false;
    }
    unhover() {
        this.isHover = false;
    }
    hover() {
        this.isHover = true;

        //some controversial code here, but theoretically it should work
        if (mouse.click) {
            this.click();
        } else if (this.mouseDown && mouse.release) {
            this.release();
        }
    }
    process() {
        this.progress = clamp(this.progress + (this.isHover ? 1 : -1) * delta / this.saturationTime, 0, 1);
        if (mouse.release) {
            this.mouseDown = false;
        }
    }
    click() {
        //insert some other code to run before the click event is triggered
        this.mouseDown = true;
        this.progress = 1;
        if (this.onClick) {
            this.onClick();
        }
    }
    release() {
        if (this.onRelease) {
            this.onRelease();
        }
    }
}
 
let windowBar = {
    buttons : {
        close : new WindowButton({
            color : colors.theme,
            onRelease : close,
        }),
        adjust : new WindowButton({
            color : colors.theme,
            onRelease : adjust,
        }),
        minimize : new WindowButton({
            color : colors.theme,
            onRelease : minimize,
        }),
    },
    order : ['close', 'adjust', 'minimize'],//in order from right to left
    unhoverAll() {
        for (let b in this.buttons) {
            this.buttons[b].unhover();
        }
    },
    processAll() {
        for (let b in this.buttons) {
            this.buttons[b].process();
        }
    },
    easing(progress) {//easing function for the transparency of a button given its progress
        return progress * 0.5 + 0.35;
    }
}

let eventsHandler = {
    keysPressed : {}, //cleared every frame
    keysDown : {},
    focusedObj : null, //points to the object that is currently "in focus"
    processMouseEvents() {
        windowBar.unhoverAll();
        let sum = mouse.t + mouse.l;
        if (mouse.t <= barH) { //for window buttons
            if (sum <= barH) {
                windowBar.buttons.close.hover();
            } else if (sum <= barH * 2) {
                windowBar.buttons.adjust.hover();
            } else if (sum <= barH * 3) {
                windowBar.buttons.minimize.hover();
            }
        }
        windowBar.processAll();
    }
}

//MAINLOOP
let now;
let past = now = performance.now() / 1000;
let delta;

function simulate() {
    eventsHandler.processMouseEvents();
    eventsHandler.focusedObj.onInput();
    timechain.simulate();
}

function renderBar() {
    for (let i = windowBar.order.length - 1; i >= 0; i--) {
        let button = windowBar.buttons[windowBar.order[i]];
        let x = screen.w - i * barH;
        btx.translate(x, 0);
        btx.fillStyle = button.color.multiply(windowBar.easing(button.progress));
        btx.fill(paths.parallelogram);
        btx.setTransform(1,0,0,1,0,0);
    }
}

function renderUI() {
    renderBar();
    ctx.setTransform(1,0,0,1,0,0);
    ctx.fillStyle = colors.gs.dark.pure();
    ctx.fillRect(0,0,screen.w, screen.h);
    ctx.fillStyle = colors.gs.light.pure();
    ctx.translate(UI.camera.x*screen.scale+screen.w/2, UI.camera.y*screen.scale+screen.h/2);
    ctx.scale(screen.scale, screen.scale);
    UI.render();
}

function mainLoop() {
    now = performance.now() / 1000;
    delta = Math.min(now - past, .05); //in seconds - allow for some frameskip but keep it minimal
    past = now;
    
    if (Date.now() - 8.64e7 > lastTime) {
        today = new Date();
        today.setFTOD();
        lastTime = today.getTime();
    }
    
    //process any mouse events here
    mouse.l = screen.w - mouse.r;
    mouse.b = screen.h - mouse.t;
    simulate();
    
    eventsHandler.keysPressed = {};
    
    //rendering
    btx.clearRect(0,0,screen.w,barH);
    ctx.clearRect(0,0,screen.w,screen.h);
    renderUI();
    
    mouse.click = false;
    mouse.release = false;
    window.requestAnimationFrame(mainLoop);
}

init();
function init() {
    resize();
    createEventListeners();
    eventsHandler.focusedObj = timechain;
    window.requestAnimationFrame(mainLoop);
}

//ELECTRON API

function minimize() {
    window.electronAPI.minimize();
    mouse.clear();
};
function adjust() {
    window.electronAPI.adjust();
};
function close() {
    window.electronAPI.close();
};

//SIMULATION FUNCTIONS

//update a state
//returns whether saturated or not
function update(obj, f = transitions.general) {
    let endpts = obj.endpts;
    for (let property in endpts.end) {
        if (!(property in endpts.p) || endpts.p[property] == endpts.tt[property]) {
            obj.state[property] = endpts.end[property];
            continue;
        }
        endpts.p[property] = Math.min(endpts.p[property] + delta, endpts.tt[property]);
        let x = endpts.p[property] / endpts.tt[property];
        let y = endpts.usetransition[property] ? endpts.usetransition[property](x) : f(x);
        obj.state[property] = lerp(endpts.start[property], endpts.end[property], y);
    }
    return false;
}

//RENDERING FUNCTIONS

function circle(x, y, radius, stroke = false, c = ctx) {
    c.beginPath();
    c.arc(x, y, radius, 0, 2*Math.PI);
    if (stroke) {
        c.stroke();
    } else {
        c.fill();
    }
}

//draw a horizontal line
function hline(x1, x2, y, lineWidth, c = ctx) {
    c.lineWidth = lineWidth;
    c.beginPath();
    c.moveTo(x1, y);
    c.lineTo(x2, y);
    c.stroke();
}

function vline(y1, y2, x, lineWidth, c = ctx) {
    c.lineWidth = lineWidth;
    c.beginPath();
    c.moveTo(x, y1);
    c.lineTo(x, y2);
    c.stroke();
}

function strokeRect(x, y, w, h, lineWidth, c = ctx) {
    c.lineWidth = lineWidth;
    c.strokeRect(x,y,w,h);
}


//UTILITY
function setCursorToEnd(element) {
    var range = document.createRange();
    var selection = window.getSelection();
  
    range.selectNodeContents(element);
    range.collapse(false); // Set the range to the end of the element
  
    selection.removeAllRanges();
    selection.addRange(range);

    element.focus();
}

function dgei(id) {
    return document.getElementById(id);
}

//clamps x in [a,b]
function clamp(x, a, b) {
    return Math.max(a, Math.min(x,b));
}

function hasymptote(x, i, c) {
    return i + (1-i) * x / (x + c);
}

function rgba(r, g, b, a = 1) {
    r = Math.round(clamp(r, 0, 255));
    g = Math.round(clamp(g, 0, 255));
    b = Math.round(clamp(b, 0, 255));
    a = clamp(a, 0, 1);
    return 'rgba(' + [r,g,b,a].join(',') + ')';
}

//precision is based off layers
//0 = days, 1 = weeks, 2 = months, 3 = years
//returns true if dates are equal
function compareDates(a, b, precision) {
    if (precision == 3) {
        return a.getFullYear() == b.getFullYear();
    } else if (precision == 2) {
        return a.getFullYear() == b.getFullYear() && a.getMonth() == b.getMonth();
    } else if (precision == 1) {
        a = a.copy();
        b = b.copy();
        a.setFDOW();
        b.setFDOW();
    }
    return a.getFullYear() == b.getFullYear() && a.getMonth() == b.getMonth() && a.getDate() == b.getDate();
}

function setOptions(options) {
    for (let x in options) {
        this[x] = options[x];
    }
}

function greyscale(t) {
    return new Color(t,t,t);
}

function lerp(a, b, x) {
    return a * (1-x) + b * x;
}

//oscillate from the value a by a certain amt
function oscillate(a, amt, freq, t) {
    return a + Math.sin(freq * t) * amt;
}

//get the index of the smallest element greater than or equal to the given element
    //if there is no such element, return array.length
function lower_bound(array, element, comparisonFunction) {
    let l = 0, r = array.length;
    if (array[array.length - 1] < element) return array.length;
    while (l < r) {
        let m = Math.floor((l + r) / 2);
        if (comparisonFunction(element, array[m]) <= 0) {
            r = m;
        } else {
            l = m + 1;
        }
    }
    return l;
}