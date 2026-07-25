/***********************************************************************
**  skin.js
**  Copyright 2016 Hans Bracker softflow.uk
**  
**  This file is part of PmWiki; you can redistribute it and/or modify
**  it under the terms of the GNU General Public License as published
**  by the Free Software Foundation; either version 2 of the License, or
**  (at your option) any later version.  See pmwiki.php for full details.
**  
**  this file adds some functionality to the mobile skin layout, like 
**  closing topsearch, topactions and rightmenu by tapping on content area, and
**  opening and closing the side menu with swipes to left and right
**  (if the smart phone allows this)
**
**  Version: 2023-03-15
***********************************************************************/

/* getting ontouch events */
function ontouch(el, callback){
	var touchsurface = el,
			dir,
			swipeType,
			startX,
			startY,
			distX,
			distY,
			threshold = 150,
			restraint = 100,
			allowedTime = 500,
			elapsedTime,
			startTime,
			mouseisdown = false,
			detecttouch = !!('ontouchstart' in window) || !!('ontouchstart' in document.documentElement) || !!window.ontouchstart || !!window.Touch || !!window.onmsgesturechange || (window.DocumentTouch && window.document instanceof window.DocumentTouch),
			handletouch = callback || function(evt, dir, phase, swipetype, distance){}

	touchsurface.addEventListener('touchstart', function(e){
		var touchobj = e.changedTouches[0]
		dir = 'none'
		swipeType = 'none'
		dist = 0
		startX = touchobj.pageX
		startY = touchobj.pageY
		startTime = new Date().getTime() // record time when finger first makes contact with surface
		handletouch(e, 'none', 'start', swipeType, 0) // fire callback function with params dir="none", phase="start", swipetype="none" etc
		//e.preventDefault()
	
	}, false)

	touchsurface.addEventListener('touchmove', function(e){
		var touchobj = e.changedTouches[0]
		distX = touchobj.pageX - startX // get horizontal dist traveled by finger while in contact with surface
		distY = touchobj.pageY - startY // get vertical dist traveled by finger while in contact with surface
		if (Math.abs(distX) > Math.abs(distY)){ // if distance traveled horizontally is greater than vertically, consider this a horizontal movement
			dir = (distX < 0)? 'left' : 'right'
			handletouch(e, dir, 'move', swipeType, distX) // fire callback function with params dir="left|right", phase="move", swipetype="none" etc
		}
		else{ // else consider this a vertical movement
			dir = (distY < 0)? 'up' : 'down'
			handletouch(e, dir, 'move', swipeType, distY) // fire callback function with params dir="up|down", phase="move", swipetype="none" etc
		}
		//e.preventDefault() // prevent scrolling when inside DIV
	}, false)

	touchsurface.addEventListener('touchend', function(e){
		var touchobj = e.changedTouches[0]
		elapsedTime = new Date().getTime() - startTime // get time elapsed
		if (elapsedTime <= allowedTime){ // first condition for awipe met
			if (Math.abs(distX) >= threshold && Math.abs(distY) <= restraint){ // 2nd condition for horizontal swipe met
				swipeType = dir // set swipeType to either "left" or "right"
			}
			else if (Math.abs(distY) >= threshold  && Math.abs(distX) <= restraint){ // 2nd condition for vertical swipe met
				swipeType = dir // set swipeType to either "top" or "down"
			}
		}
		// fire callback function with params dir="left|right|up|down", phase="end", swipetype=dir etc:
		handletouch(e, dir, 'end', swipeType, (dir =='left' || dir =='right')? distX : distY)
		//e.preventDefault()
	}, false)
}

/* listen for left and right swipe events to show or hide right menu */
if (!mopen) { var mopen = 'left'; var mclose = 'right'; }
window.addEventListener('load', function(){
	var cont = document.getElementById('content')
	ontouch(cont, function(evt, dir, phase, swipetype, distance){
		var ww = screen.width;
		var mtog = document.getElementById('menu-toggle');
		var sbar = document.getElementById('sidebar');
		if (sbar) {
			if (swipetype == mopen && phase == 'end' && ww<880) {
				if (mtog.checked==false) mtog.checked = true;
			}
			if (swipetype == mclose && phase == 'end' && ww<880) {
				if (mtog.checked==true) mtog.checked = false;
			}			
		}
  })
}, false)

/* close some elements by tap on main div (exludes header, footer, sidebar divs) */
var sidebar = document.getElementById('sidebar');
if (sidebar) sidebar.addEventListener('click', closeMenuActionSearch, false );
document.getElementById('main').addEventListener('click', closeMenuActionSearch, false );
function closeMenuActionSearch(e){ 
	if (e.currentTarget.id !== 'sidebar') {
		var mtog = document.getElementById('menu-toggle');
		var atog = document.getElementById('actions-toggle');
		var stog = document.getElementById('search-toggle');
		if (mtog) mtog.checked = false;
		if (atog) atog.checked = false; 
		if (stog) stog.checked = false; 
	} else e.stopPropagation();
};

/* close sidemenu by clicking on close label (red cross) */
var menucloselabel = document.getElementById('menu-close-label');
if(menucloselabel) menucloselabel.addEventListener('click', 
function(){
		var mtog = document.getElementById('menu-toggle');
		if (mtog) mtog.checked = false;
});

/** hide initial totop arrow, display when scrolled down a bit **/
var totop = document.getElementById('totop');

var timedEvent; 
window.addEventListener('scroll', function() {
		clearTimeout(timedEvent);                   
		timedEvent = setTimeout(function() { 
			var scrlTop = window.pageYOffset || (document.documentElement || document.body.parentNode || document.body).scrollTop;
			if (scrlTop > 100) {
					totop.style.display = "block";
			} else {
					totop.style.display = "none";
			}
		}, 100);                                   
}, false);

/* resetting content and rightmenu div widths when window resize */
/* figures should agree with skin.css (55em min width,  #page max-width:75em)*/
var rightcol = document.getElementById('rightmenu');
var leftcol = document.getElementById('leftmenu');
var midcol = document.getElementById('content');
if (!pageMaxWidth) var pageMaxWidth = 1200;
window.onresize = function() {
		var pw = (innerWidth < pageMaxWidth) ? innerWidth : pageMaxWidth;
		if (rightcol) rightcol.style.width = (pw/5-16)+'px';
		if (leftcol) leftcol.style.width = (pw/5+10)+'px';
		midcol.style.width = '100%';
};

/* init */
window.onload = function (){ 
		/* hide top arrow initially */
		totop.style.display = "none";
		
		/* put click function to divs class=link */
		var lks = document.getElementsByClassName("link");
		for (var i = 0, len = lks.length; i < len; i++) {
			lks[i].addEventListener("click", function(){
					window.location.href = this.getElementsByTagName("A")[0].href;
			});	
			lks[i].addEventListener("mouseover", function(){
					this.style.cursor = "pointer";
			});							
		}


		/* add wrapper div with class 'scrollable' to all tables, 
		   add class 'has-scroll' to wrapper div for tables which are too wide (to show horizontal scroll bar via css) */
		var tables = document.getElementsByTagName("TABLE");
		if (tables.length > 0) {
			for (var i = 0, len = tables.length; i < len; i++) {
				var el = tables[i]; 
				var par = el.parentNode;
				var wrap = document.createElement('div');
				par.replaceChild(wrap, el);
				wrap.appendChild(el);
				if (el.offsetWidth > par.offsetWidth) {
					wrap.className = "scrollable has-scroll";
				} else {
					wrap.className = "scrollable";
				}
				// When the viewport size is changed, check again if the element needs to be scrollable
				// adds onresize function for each table
				window.addEventListener("resize", (function(el, par, wrap) {
					return function() {
						if (el.offsetWidth > par.offsetWidth) wrap.className = "scrollable has-scroll"; 
						else wrap.className = "scrollable";
					}
				})(el, par, wrap), false);
			};
		}
};
