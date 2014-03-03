/*File Version <build_number> 
*/
 /*
  * Copyright (c) 2013 Infragistics Inc.
  *
  * http://www.infragistics.com/
  *
  */
"use strict";
/*jshint unused:vars */
define ("ide-ui", function (require, exports, module) {
	var toolboxMetadata = require("ide-toolbox");
	var autocomplete = require("ide-autocomplete");
	(function ($) {
		$.widget("ui.igStudio", {
			options: {
				packages: ["igniteui", "bootstrap"],
				defaultIconPath: "images/gear_icon.jpg", //TODO: sprites
				showResponsiveLayouts: true, // if enabled, will show the "LAYOUTS" area in the toolbox on the right
				codeToDesignRefreshInterval: 500, // how often the designer will be reloaded when something in the code editor changes
				toolboxSearchDelay: 300,
				editContentDelay: 500 // when we're editing conteneditables on the designer, we'll need to adjust the adorners/select boxes
			},
			events: {
				/*
				 * Fired when the end user starts dragging a component (icon)
				 * from the toolbox 
				 */
				componentDragging: "componentDragging",
				/*
				 * fired when dragging stops (due to inactivity) 
				 * componentDragging and componentDragged may be fired multiple times while
				 * the end user is dragging
				 * this could allow for more fine tuned UI (let's say when he stops dragging, but hasn't
				 * released the mouse button yet, the library provider may show a tooltip 
				 * or something else
				 */
				componentDragged: "componentDragged",
				/* 
				 * fired before a component is dropped on the design surface
				 * can be cancellable
				 */
				componentDropping: "componentDropping",
				/*
				 * fired after a component is dropped on the design surface
				 */
				componentDropped: "componentDropped",
				/*
				 * fired before a component is deleted through the design surface
				 * removes the code from the editor as well as the element's DOM 
				 * on the design surface
				 */
				componentRemoving: "componentRemoving",
				/*
				 * 
				 *
				 */
				componentRemoved: "componentRemoved",
				/*
				 * fired when a component is clicked on the design surface
				 * libraries may hook to this event in order to do things like set a custom border, etc.
				 */
				componentClick: "componentClick",
				/*
				 * fired when a component is double clicked on the design surface
				 * libraries may hook to this event in order to set things like contenteditable=true
				 */
				componentDblClick: "componentDblClick",
				/*
				 * fired before code is updated, when either :
				 * 1) the end user drags and drop a component on the design surface, or deletes it or reoders it
				 * 2) when some property value changes, or some other configuration
				 * 3) When code gets edited directly in the design surface
				 */
				codeUpdating: "codeUpdating",
				codeUpdated: "codeUpdated",
				designSurfaceUpdating: "designSurfaceUpdating",
				designSurfaceUpdated: "designSurfaceUpdated"
			},
			widget: function () {
				return this.element;
			},
			_createWidget: function (options, element) {
				$.Widget.prototype._createWidget.apply(this, arguments);
			},
			_setOption: function (key, value) {
				//NA
			},
			_create: function () {
				this.startms = new Date().getTime();
				this._packages = {};
				this._codeProviders = {};
				this._selectedPkgs = [];
				this.maxColLength = 1000;
				this.isDesign = true;
				this.splitMode = false;
				this.componentIds = [];
				this.rootNode = {};
				this.hoveredComponent = null;
				this.selectedComponent = null;
				this.firstload = true;
				this._lastq = [];
				this._cssDeps = [];
				this._snap = true;
				this._jsDeps = [];
				this._jsDepsSrc = [];
				this._lazyLoadedScripts = [];
				this.previewWindow = null;
				this._styleBlocks = [];
				this.editor = ace.edit("editor"); // initialize editor
				this.session = this.editor.getSession();
				this.editor.setTheme("ace/theme/monokai");
				//session.setMode("ace/mode/javascript");
				this.session.setMode("ace/mode/html");
				var i, packageNames = this.options.packages,
					$this = this, BasePackageProvider = require("ide-packageproviderbase");
				// initialize toolbox & packages
				toolboxMetadata.defaultToolboxIcon = this.options.defaultIconPath;
				autocomplete.init(this.editor, this);
				// load package toolbox info
				var loadedPackages = 0;
				var len = packageNames.length;
				$(".loading-designer-inner").text("Loading " + packageNames[0] + " package (1 of " + len + ")");
				var bar = $(".progress-bar");
				window.requestAnimationFrame(function () {
					bar.css("width", "20%");
				});
				for (i = 0; i < packageNames.length; i++) {
					(function (i) {
						// load package info and register it with the toolbox
						toolboxMetadata.registerPackage(packageNames[i])
						.then(function (packageInfo) {
							$(".loading-designer-inner").text("Loading " + packageNames[i] + " package (" + (i + 1) + " of " + len + ")");
							var progressVal = parseInt(20 + (80 * i / packageNames.length), 10);
							window.requestAnimationFrame(function () {
								bar.css("width", progressVal + "%");
							});
							return packageInfo;
						})
						.then(function (packageInfo) {
							/*
							if (!packageInfo) { // failed to load properly, so skip it
								packageNames.splice(i, 1); // failed package
								i--; // reset counter to account for this package removal
								continue; 
							}
							*/
							autocomplete.registerPackage(packageInfo);
							$this._packages[packageNames[i]] = packageInfo;
							// setup code provider for package
							var packageProvider = new BasePackageProvider({
								ide: $this,
								editor: $this.editor,
								packageInfo: packageInfo,
								defaultPlugin: packageInfo.defaultComponentPlugin
							});
							$this._codeProviders[packageNames[i]] = packageProvider;
							// load individual component providers, if specified
							var compList = packageInfo.components;
							for (var comp in compList) {
								if (compList.hasOwnProperty(comp) && compList[comp] && compList[comp].componentPlugin) {
									// load it via require
									(function (i, cmp, pkg, pkgProvider) {
										require(["../" + pkg.pluginsPath + "/" + cmp.componentPlugin], function (ComponentPlugin) {
											// register the class impl
											pkgProvider.registerComponent(cmp.id, ComponentPlugin);
										});
									} (i, compList[comp], packageInfo, packageProvider));
								}
							}
							loadedPackages++;
							if (loadedPackages === packageNames.length) {
								// ready to setup surface (UI - all dropdowns, etc. - they require packages to be loaded)
								// if a package doesn't load, do we still load the designer?
								$this._setupSurface();
							}
						});
					} (i));
				}
				this._setupConfirmDialog();
			},
			_hideLoading: function () {
				$(".loading-designer").css("display", "none");
				$(".loading-designer-inner").text("Loading Web Designer");
			},
			_showLoading: function (msg) {
				$(".loading-designer-inner").text(msg);
				$(".loading-designer").css("display", "block");
			},
			_setupSurface: function () {
				var $this = this, component, components, i,
					markup, html, itemElement, provider, packageNames = this.options.packages;
				$(".toolbox-content").css("overflow", "auto");
				$(window).on({
					"resize": function () {
						var minimizebtn = $(".minimize-toolbox");
						minimizebtn.css({
							top: 0,
							left: $(".right").position().left - minimizebtn.width()
						});
						//$this._syncSboxSize();
					}
				});
				$(".right-area,.footer").on("mousedown", function (event) {
					var target = $(event.target);
					if (!target.hasClass("code-button") && !target.hasClass("design-button")) {
						$this._deselectComponent();
					}
				});
				if (this.options.showResponsiveLayouts === true) {
					this._setupRWDLayoutArea();
				}
				// implement toolbox search functionality
				this._setupToolboxSearch();
				//minimize & maximize buttons for toolbox
				this._initToolboxShowHideBtns();
				$("<div></div>").prependTo("#designer").attr("id", "dfcontainer").addClass("frame-container");
				// construct initial code into editor
				html = this._buildInitialMarkup();
				$("<iframe></iframe>").attr("id", "designer-frame")
					.attr("src", "about:blank")
					.addClass("design-frame")
					.addClass("frame")
					.on("load", $.proxy(this._loadHandler, this))
					.prependTo("#dfcontainer")
					.contents().find("body").addClass("design-surface");//.on("scroll", function () {
						//$this._syncSboxSize();
					//});
				// init editor
				$("#editor_container").css({
					position: "absolute",
					left: "-10000px",
					top: "-10000px"
				});
				// initial code
				this.session.insert({row: 0, column: 0}, html);
				this._initRangeClass();
				this.session.setUseWrapMode(true);
				this.currentText = this.editor.getValue();
				this.parsedText = this.currentText;
				this.session.on("change", function (e) {
					if ($this.editor.isFocused()) {
						$this.wasDirty = true;
						clearInterval($this.updateTimer);
						$this.updateTimer = setInterval($.proxy($this._updateSurface, $this), $this.options.codeToDesignRefreshInterval);
						var text = $this.editor.getValue();
						text = text.substring(text.indexOf("<body>"), text.length - 1);
						text = text.replace("<body>", "");
						text = text.substring(0, text.indexOf("</body>"));
						text = text.replace("</body>", "");
						// the straightforward and simple way, which doesn't solve the following:
						//there is a problem with elements that have widgets associated with them
						// we need to eval the Text, then compare the DOM trees, to be 100% correct
						$("#designer-frame").contents().find("body")[0].innerHTML = text;
					}
				});
				$(".left").resizable({
					handles: "e",
					start: this._startFrameFix,
					stop: this._stopFrameFix
				});
				$(".right").resizable({
					handles: "w",
					resize: function (event, ui) {
						// keep "left" untouched, not sure why the jQuery UI resizable is touching it
						$(this).css("left", "auto");
						$(".surface-buttons").css("padding-right", ui.size.width);
						var minimizebtn = $(".minimize-toolbox");
						minimizebtn.css({
							top: 0,
							left: $(".right").position().left - minimizebtn.width()
						});
					},
					// Fix for jQuery UI resizable issue when resizing between elements where there is an iframe (the iframe captures the mouseover events).
					start: this._startFrameFix,
					stop: this._stopFrameFix
				});
				// setup toolbox areas
				var toolboxmap = [];
				$(".toolbox-area").each(function () {
					var $this = $(this), cat = $this.attr("data-category");
					var list = $("<ul></ul>").insertAfter($this).addClass("ig-layout").addClass("ig-layout-flow");
					toolboxmap[cat] = list;
					if (cat === "hidden") {
						list.css("display", "none");
					}
				});
				// initialize components for every provider that is registered in the list of packages
				for (i = 0; i < packageNames.length; i++) {
					provider = toolboxMetadata.getPackageInfo(packageNames[i]);
					components = provider.components;
					var spritePrefix = null;
					if (provider.iconSpriteCssFile) {
						spritePrefix = provider.iconSpriteCssPrefix;
						// load Sprites CSS file
						var linkSrc = provider.iconsPath + "/" + provider.iconSpriteCssFile;
						var linkRef = "<link rel=\"stylesheet\" href=\"" + linkSrc + "\" type=\"text/css\"></link>";
						$("head").prepend(linkRef);
					}
					for (component in components) {
						if (components.hasOwnProperty(component)) {
							if (components[component].toolboxVisible === false) {
								continue;
							}
							var icon = components[component].icon;
							var iconcss = icon.substring(0, icon.indexOf(".") !== -1 ? icon.indexOf(".") : icon.length);
							var imgMarkup = spritePrefix ?
								"<div class='iconspr " + spritePrefix + " " + iconcss + "'></div>" :
								"<img class='toolbox-icon' src='" + toolboxMetadata.resolveIcon(icon) + "'></img>";
							markup = "<li class='toolbox-item ig-layout-flow-item item-label label' data-type='" + components[component].id + "'" +
								" data-lib='" + provider.name + "'" +
								" data-cat='" + components[component].category + "'" +
								" title='" + "Drag and drop this to add a " + components[component].toolboxTitle + " to your page" + "'>" +
								//" data-height='" + components[component].height + "'" +
								//" data-dataSource='" + components[component].dataSource + "'>" +
								imgMarkup +
								"<h6 style='padding-top:5px;margin-top:0px;' class='toolbox-item-label'>" + components[component].toolboxTitle +
								"</h6></li>";
							// by default, place component in common area, unless it has a defined category (in the comp. metadata) which 
							// matches a defined area (html container element) in the toolbox ! 
							//var itemContainer = toolboxmap.common;
							// items that don't have a category set, will be hidden.
							var itemContainer = toolboxmap.hidden;
							var category = components[component].category;
							if (toolboxmap[category] !== null && typeof (toolboxmap[category]) !== "undefined") {
								itemContainer = toolboxmap[category];
							}
							itemElement = $(markup).appendTo(itemContainer);
							if (components[component].defaultOptions) {
								itemElement.data("defaultOptions", components[component].defaultOptions);
							} else {
								itemElement.data("defaultOptions", {});
							}
							if (components[component].dataSource) {
								itemElement.attr("data-dataSource", components[component].dataSource);
							}
							if (components[component].width) {
								itemElement.attr("data-width", components[component].width);
							}
							if (components[component].height) {
								itemElement.attr("data-height", components[component].height);
							}
							if (components[component].visual === false) {
								itemElement.attr("data-visual", false);
							}
						}
					}
					//Tooltips for toolbox item Leave that commented if we need custom toolbox template
					//$(".toolbox-item").on({
					//"mouseenter": function (event) {
					//	var target = $(event.target);
					//	var tooltip = $(".prop-tooltip");
					//	clearTimeout(tooltip.data("timeoutid"));
					//	var timeoutID = setTimeout(function () {
					//		var pos = target.offset();
					//		var component = $(target).data("toolboxitem");
					//			var tooltipText = "<b>" + component + "</b>";// <br /> <p>Drag and drop this to add a " + component + " to your page</p>";
					//			tooltip.find(".tooltip-content").html(tooltipText);
					//			tooltip.css({
					//				left: pos.left - tooltip.outerWidth() - 5,
					//				top: (pos.top + tooltip.outerHeight() <= $("#designer-frame").outerHeight())
					//					? pos.top
					//					: pos.top - tooltip.outerHeight(),
					//				display: "block"
					//			});
					//	}, 300);
					//	tooltip.data("timeoutid", timeoutID);
					//},
					//"mouseleave": function (event) {
					//	var tooltip = $(".prop-tooltip");
					//	clearTimeout(tooltip.data("timeoutid"));
					//	tooltip.css("display", "none");
					//}
				//	});
				}
				// hide toolbox labels which don't have item below them
				for (var toolboxItem in toolboxmap) {
					if (toolboxmap.hasOwnProperty(toolboxItem)) {
						var toolboxUl = toolboxmap[toolboxItem];
						if (toolboxUl.children().length === 0) {
							$(".toolbox-area[data-category=" + toolboxItem + "]").css("display", "none");
						}
					}
				}
				$(".toolbox-item, .toolbox-item-dragged").draggable({
					helper: function (event) {
						var $this = $(this), lib = $this.attr("data-lib"),
							id, comp, provider;
						provider = toolboxMetadata.getPackageInfo(lib);
						components = provider.components;
						id = $this.attr("data-type");
						comp = components[id];
						return $("<img></img>").attr("src", toolboxMetadata.resolveIcon(comp.dragDropIcon, comp.icon))
							.addClass("toolbox-item-dragged")
							//.attr("data-widget", comp.widgetId)
							.attr("data-lib", lib)
							.attr("data-type", comp.id)
							.attr("data-title", comp.toolboxTitle)
							.attr("data-width", comp.width)
							.attr("data-height", comp.height)
							.attr("data-visual", comp.visual)
							.attr("data-dataSource", comp.dataSource)
							.css("opacity", 0.5);
					},
					start: function (event, args) {
						// if we are dragging a non-visual component and the non-vis area is hidden
						// then show it
						var target = $(event.target), nonvisual = $(".nonvisual-area");
						if (target.attr("data-visual") === "false" && nonvisual.is(":hidden")
								&& nonvisual.find("li.ig-layout-flow-item").length === 0) {
							//$(".nonvisual-area").css("display", "");
							$(".nonvisual-area-droplabel").css("display", "");
							$("#designer-frame").addClass("frame-nonvisual");
							//https://forum.jquery.com/topic/droppable-hoverclass-issue-with-animation
							nonvisual.show("slide", {direction: "down"}, 500);
							//nonvisual.show("fade", 500);
							/*
							var initHeight = parseInt(nonvisual.css("height"), 10);
							var duration = 500;
							nonvisual.css({
								"height": 0,
								"display": "block",
								"margin-top": initHeight
							});
							var st = null;
							var slideupFn = function () {
								if (!st) {
									st = new Date().getTime();
								}
								var t = new Date().getTime();
								var curr = (t - st) / duration * initHeight;
								if (curr > initHeight) {
									curr = initHeight;
								}
								nonvisual.css("height", curr);
								nonvisual.css("marginTop", initHeight - curr);
								if (curr < initHeight) {
									requestAnimationFrame(slideupFn);
								}
							};
							slideupFn();
							*/
						}
					},
					stop: function (event, args) {
						// hide the non-visual area if we haven't dropped anything there
						if ($(".nonvisual-area").find("li.ig-layout-flow-item").length === 0) {
							//$(".nonvisual-area").css("display", "none");
							$this._hideNonVisualArea();
						} else {
							$(".nonvisual-area-droplabel").css("display", "none");
						}
					},
					containment: ".ide",
					appendTo: "body",
					revert: "invalid",
					cursor: "move",
					//Indigo places the cursor in the middle of the dragged image (helper)
					cursorAt: {top: 0, left: 0},
					iframeFix: true,
					scroll: false
				});
				$(document).keyup(function (event) {
					// actually 8 is backspace on Windows but DELETE on MAC 
					//if (event.keyCode === 46 || event.keyCode === 8) { //DEL
					if (event.keyCode === 46) {
						// retrieve component from event
						var element = $("#designer-frame").contents().find("body .selected-iframe");
						if (element.length === 0) {
							//maybe we're trying to delete a non-visual control
							element = $(".nonvisual-list").children(".selected-iframe");
						}
						$this._removeComponent(element[0]);
					}
				});
				$("body").mousedown(function (event) {
					$(".contextmenu").css("display", "none");
				});
				$(".center").droppable({
					accept: ".toolbox-item[data-visual!=false]",
					drop: function (event, ui) {
						// handle dropping a component on the design surface
						// first append the placeholder element
						// then initialize the widget on top of the placeholder element
						var body = $("#designer-frame").contents().find("body"), i, arr, r,
							t, codeProvider, markers,
							placeholder, totalComponentCount, id, height, extraIndent = 1, title,
							width, data, options, lib, inside = false, insideOffset = null,
							defaultOptions, code, descriptor, droppable, insideOffsetCount = 0,
							codeRange, htmlRange, htmlCode, codeMarker, htmlMarker, droppables, pkg, cmp;
						// there are several scenarios:
						// 1. we drop on an empty form, we append to the body
						// 2. we drop "after" an existing element, hence we append to its parent
						// 3. we drop "before" an existing element, hence we prepend to its parent
						// 4. if there are multiple children to a parent, we need to find the previous/next sibling of the element on which we are dropping
						var dropDefault = function (container, element) {
							if (container && $(container).is("div")) {
								element.insertAfter(container);
							} else {
								element.appendTo(body);
							}
						};
						var el = $("#designer-frame").contents()[0].elementFromPoint(ui.position.left, ui.position.top);
						var $compElement = $(el);
						var comp = null, hostCodeProvider;
						// only drill down if the element is actually a designer recognizable target 
						if (!$compElement.hasClass("ig-component")) {
							if ($compElement.attr("data-droppablechild") !== "true") {
								$compElement = $compElement.closest(".ig-component");
								el = $compElement[0];
							} else {
								el = $compElement.closest(".ig-component")[0];
							}
						}
						if ($compElement.is("body") && $this.componentIds.length > 0) {
							comp = $this.componentIds[$this.componentIds.length -1];
						} else {
							if (el) {
								comp = $this.componentById(el.id);
								hostCodeProvider = $this._codeProviders[comp.lib];
							}
							if (comp === null) {
								comp = $this.componentIds[$this.componentIds.length - 1];
							}
						}
						t = ui.helper.attr("data-type");
						lib = ui.helper.attr("data-lib");
						codeProvider = $this._codeProviders[lib];
						// we need to determine where to append - we may be dropping over rows and columns
						//totalComponentCount = body.find(".ig-component").length;
						totalComponentCount = $this._getComponentCount(t);
						totalComponentCount++;
						while ($("#designer-frame").contents()[0].getElementById(t + totalComponentCount)) {
							totalComponentCount++;
						}
						id = t + totalComponentCount;
						height = ui.helper.attr("data-height");
						title = ui.helper.attr("data-title");
						width = ui.helper.attr("data-width");
						data = ui.helper.attr("data-dataSource");
						descriptor = {
							type: t,
							id: id,
							data: data,
							ide: $this,
							attrs: {
								
							}
						};
						// load up the component's details prior to callling providers, in case they need those details
						pkg = $this._packages[lib];
						if (pkg) {
							cmp = pkg.components[t];
							if (cmp) {
								//Note: this WILL return a promise if the metadata isn't already loaded
								$this._promiseCmp = cmp.loadInfo();
							}
						}
						$this._addDesignerDependency(codeProvider.getHeadMarkupFor(descriptor));
						placeholder = $(codeProvider.getMarkupFor(descriptor));
						// we need to determine if the element on which we "are", is a target for dropping
						// also check if it has children which are droppable 
						// tricky. we actually need to get the code provider of $compElement
						if (hostCodeProvider && hostCodeProvider.isDroppableChild($compElement[0])) {
							droppable = $compElement;
							inside = true;
							insideOffset = $compElement.index();
						} else if (hostCodeProvider && hostCodeProvider.hasDroppableChildren($compElement[0])) {
							// list droppable children & find the correct one
							droppables = hostCodeProvider.getDroppableChildren($compElement[0]);
							// find which droppable we want to use (the intersection)
							//ui.position.left, ui.position.top
							$.each(droppables, function () {
								var $this = $(this), pos = $this.position(),
									left = pos.left, top = pos.top,
									// mouse left and top
									mleft = ui.position.left, mtop = ui.position.top,
									width = $this.width(), height = $this.height();
								// if the mouse is "inside" the droppable
								if ((mleft > left && mleft < left + width) && (mtop > top && mtop < top + height)) {
									droppable = $this;
									inside = true;
									// increase indentation, because we are going one level down
									//TODO: this needs to be resolved in a more general sense, if we have even greater nestings
									//extraIndent++;
									insideOffset = insideOffsetCount;
									return false;
								}
								insideOffsetCount++;
							});
						}
						var lastElem = null;
						var elemsList = body.children();
						for (i = elemsList.length - 1; i >=0; i--) {
							if ($(elemsList[i]).data("marker")) {
								lastElem = $(elemsList[i]);
								break;
							}
						}
						if (droppable) {
							//TODO: scenario where the actual droppable has other content ?
							// what if we have nested droppables, how is this handled? Which one do we find
							// find the most nested one, recursively ? 
							placeholder.appendTo(droppable);
						} else {
							dropDefault(el, placeholder);
						}
						placeholder.attr({
							"id": id,
							"data-lib": lib,
							"data-type": t,
							"data-title": title
						});
						placeholder.addClass("ig-component");
						// wrap the placeholder with a transparent div
						options = {
							height: height,
							width: width,
							id: id,
							type: t,
							lib: lib
						};
						if (data && window[data]) {
							options.dataSource = window[data];
						}
						// merge with default design-time options
						defaultOptions = $("li[data-type=" + t + "]").data("defaultOptions");
						for(var key in defaultOptions) {
							if (defaultOptions.hasOwnProperty(key) && defaultOptions[key] instanceof Array) {
								for (var p = 0; p < defaultOptions[key].length; p ++) {
									if(defaultOptions[key][p].hasOwnProperty("dataSource") && window[defaultOptions[key][p].dataSource]){
										defaultOptions[key][p].dataSourceVal = defaultOptions[key][p].dataSource;
										defaultOptions[key][p].dataSource = window[defaultOptions[key][p].dataSource];
									}
								}
							}
						}
						options = $.extend({
							width: options.width,
							height: options.height,
							dataSource: options.dataSource
						}, defaultOptions);
						descriptor.placeholder = placeholder;
						descriptor.options = options;
						var needsLazyLoad = $this._needsLazyLoad(codeProvider, t);
						if (needsLazyLoad) {
							// show loading message
							$this._showLoading("Loading " + t + " dependencies");
						}
						var initDelayed = function () {
							if (codeProvider.requiresInitialization()) {
								$this._ensureDependenciesLoaded(codeProvider, t, function () {
									codeProvider.initComponent(descriptor);
									if (needsLazyLoad) {
										// select it if it hasn't been already selected
										if (placeholder) {
											$this._selectComponent(placeholder[0]);
										}
										// hide loading message & restore contents
										$this._hideLoading();
									}
								});
								//codeProvider.initComponent(descriptor);
								code = codeProvider.getCodeEditorScriptFor(descriptor);
								if (code && code.codeString) {
									if (!code.lineCount) {
										code.lineCount = code.codeString.split("\n"); // default count based on newlines in the string
									}
									// append to <script type="text/javascript" id="code">
									// we want to insert it after the last component's javascript
									var offset = 0;
									if ($this.componentIds.length > 0 && comp && comp.codeMarker && !inside) {
										codeRange = comp.codeMarker.range;
										offset = codeRange.end.row;
									} else {
										//A.T. 5 Dec - TODO - it's best to rework this a bit so that it takes into account both row/column when it 
										// comes to tracking markers
										codeRange = $this.editor.find("<script id=\"code\">\n");
										offset = codeRange.end.row + 1;
									}
									//TODO:what happens if the developer edits the body tag? and removes the code ID ,etc. ?
									//TODO: "2" is a magic number below. usually we'd like to insert right into the script block, but after the $(document).ready( statement
									// K.D. February 17th, 2014 Bug #164358 When inserting a marker the end column has to be taken into account.
									$this.session.insert({row: offset, column: codeRange.end.column + 1}, code.codeString);
									r = $this.createAndAddMarker(offset, 0, offset + code.lineCount, 0);
									//var rInner = $this.createAndAddMarker(r.start.row + 1, 0, r.start.row + code.lineCount - 1, 0);
									codeMarker = {
										range: r,
										//rangeInner: rInner, // actual contents
										extraMarkers: {
											//e.g. start of options/features marker
										},
										baseIndent: 4
									};
									codeProvider.addExtraMarkers({
										marker: codeMarker,
										codeObj: code,
										type: t,
										rclass: $this.RangeClass
									});
									//codeMarker.id = $this.session.addMarker(r, "customMarker", "text", true);
									codeMarker.id = r.id;
								}
							}
							// now add the placeholder as well
							var hasVisualComponents = false;
							for (i = 0; i < $this.componentIds.length; i++) {
								if ($this.componentIds[i].visual) {
									hasVisualComponents = true;
									break;
								}
							}
							if (!hasVisualComponents) {
								htmlRange = $this.editor.find("<body>");
								htmlRange.end.row++;
								// K.D. February 17th, 2014 Bug #164358 On initial insert the end column is the end column
								// of the <body> element and we are inserting on the next line. The correct end column for 
								// the new marker is 0.
								htmlRange.end.column = 0;
							} else if (comp.visual) {
								// if there are droppables, and we are placing the code at a specific place in the droppable
								// i.e. comp is a bootstrap row, and we are placing the grid in the second column of the row
								// something like that
								// then find the offset (the htmlMarker) for that respective column
								// so we need to check extraMarkers
								htmlRange = comp.htmlMarker.range;
								if (inside) {
									extraIndent += comp.level > 0 ? comp.level : 0;
									if (insideOffset !== null) {
										htmlRange = comp.htmlMarker.extraMarkers.children[insideOffset];
										extraIndent++;
										//htmlRange = new htmlRange.constructor(htmlRange.end.row - 2, 0, htmlRange.end.row - 2, 0);
										htmlRange = new htmlRange.constructor(htmlRange.end.row - 1, 0, htmlRange.end.row - 1, 0);
									} else {
										// place it as a direct child of the component
										htmlRange = new htmlRange.constructor(htmlRange.end.row - 1, 0, htmlRange.end.row - 1, 0);
									}
								} else {
									//ATT: there's the special case where the last added element may have been actually dropped inside
									// of another element (which is its parent). in that case we can't just put this one after the other! 
									// because they aren't on the same level (that is - the body's children)
									// what we need to do is find the last element which has the body as its parent
									// get last body element which is an ig-component, & get its marker
									if (lastElem.length > 0) {
										var lastMarker = lastElem.data("marker");
										htmlRange = new htmlRange.constructor(lastMarker.end.row + 1, 0, lastMarker.end.row + 1, 0);
									} else {
										htmlRange = new htmlRange.constructor(htmlRange.end.row, 0, htmlRange.end.row, 0);
									}
								}
							}
							descriptor.extraIndent = extraIndent;
							htmlCode = codeProvider.getCodeEditorMarkupFor(descriptor);
							if (htmlCode) {
								// K.D. February 17th, 2014 Bug #164358 When inserting a marker the end column has to be taken into account.
								$this.session.insert({row: htmlRange.end.row, column: htmlRange.end.column + 1}, htmlCode.codeString);
								r = new $this.RangeClass(htmlRange.end.row, 0, htmlRange.end.row + htmlCode.lineCount, 0);
								r.start = $this.session.doc.createAnchor(r.start);
								r.end = $this.session.doc.createAnchor(r.end);
								// create id and class markers
								var classResult, idResult;
								if (htmlCode.codeString.indexOf("class=") !== -1) {
									classResult = $this.editor.find({
										needle: /class="(.*)?"/,
										start: r.start
									});
								}
								if (htmlCode.codeString.indexOf("id=") !== -1) {
									idResult = $this.editor.find({
										needle: /id="(.*)?"/,
										start: r.start
									});
								}
								if (classResult) {
									classResult = new $this.RangeClass(classResult.start.row, classResult.start.column, classResult.end.row, classResult.end.column - 1);
									$this.addMarker(classResult);
								}
								if (idResult) {
									idResult = new $this.RangeClass(idResult.start.row, idResult.start.column, idResult.end.row, idResult.end.column - 1);
									$this.addMarker(idResult);
								}
								htmlMarker = {
									range: r,
									extraMarkers: {
										classMarker: classResult,
										idMarker: idResult
									}
								};
								if (htmlCode.extraMarkers && Array.isArray(htmlCode.extraMarkers)) {
									// process extra markers
									arr = htmlCode.extraMarkers;
									markers = [];
									for (i = 0; i < arr.length; i++) {
										var marker = new $this.RangeClass(
											r.start.row + arr[i].rowOffset,
											r.start.column + arr[i].colOffset,
											r.start.row + arr[i].rowOffset + arr[i].rowCount,
											r.start.column + arr[i].colOffset + arr[i].colCount
										);
										marker.start = $this.session.doc.createAnchor(marker.start);
										marker.end = $this.session.doc.createAnchor(marker.end);
										markers.push(marker);
									}
									htmlMarker.extraMarkers.children = markers;
								}
								htmlMarker.id = $this.session.addMarker(r, "customMarker", "text", true);
							}
							// add extra stuff in the head, if required
							// TODO: check if HEAD lines aren't already registered for that component + library
							var headCode = codeProvider.getCodeEditorHeadMarkupFor(descriptor);
							var headMarker = null;
							if (headCode) {
								var headRange = $this.editor.find("</head>");
								$this.session.insert({row: headRange.end.row, column: 0}, headCode.codeString);
								headMarker = new $this.RangeClass(headRange.end.row, 0, headRange.end.row + headCode.lineCount, 0);
								headMarker.start = $this.session.doc.createAnchor(headMarker.start);
								headMarker.end = $this.session.doc.createAnchor(headMarker.end);
								headMarker.id = $this.session.addMarker(headMarker, "customMarker", "text", true);
							}
							// store the markers for the respective component
							//TODO:think about storing an array of htmlMarkers, or just markers, because when a component is dropped
							// it may have multiple code in multiple places, not just code and html, or only html
							$this.componentIds.push({
								id: id,
								lib: lib,
								title: title,
								type: t,
								visual: true,
								providerType: codeProvider.getProviderType(t),
								codeMarker: codeMarker,
								htmlMarker: htmlMarker,
								headMarker: headMarker,
								level: extraIndent > 0 ? extraIndent : 0
							});
							if (descriptor.options) {
								$this.componentIds[$this.componentIds.length - 1].options = descriptor.options;
							}
							$this._syncDesigner();
							// pass a promise so that we know when all properties (component metadata) is loaded
							// this is necessary to build the property explorer, or any custom renderer for the component
							// component shouldn't be immediately selected once dropped (by request)
							if (!needsLazyLoad && placeholder) {
								$this._selectComponent(placeholder[0]);
							}
							// now make sure we also re-attach event handlers to listen to "drag & drop to reorder" events
							$this._initddreoder();
							//google analytics
							ga('send', 'event', 'dragdrop', 'dragging and droppping from the toolbox', lib + ":" + t, $this._getComponentCount(t));
						};
						if ($this._promiseCmp) {
							$this._promiseCmp.then(function () {
								initDelayed();
							});
						} else {
							initDelayed();
						}
					}
				});
				$(".code-button").click(function () {
					var button = $(this);
					if ($this.splitMode) {
						return;
					}
					if (button.hasClass("selected")) {
						return;
					} else {
						//if ($(event.target).is("button")) {
						//	$this._deselectComponent();
						//} else {
							// just hide the adorners
							$this._adorners.css("display", "none");
						//}
						button.addClass("selected");
						$(".design-button").removeClass("selected");
						$(".view-button").removeClass("selected");
						$this.isDesign = false;
						$(".prop-tooltip").css("display", "none");
						$(".designer").hide();
						$("#editor_container").css({position:"static", left:"", top:""});
						$this.editor.focus();
					}
				});
				$(".design-button").click(function () {
					var button = $(this);
					if (button.hasClass("selected")) {
						return;
					} else {
						if ($this._adorners.css("display") === "none") {
							$this._adorners.css("display", "block");
						}
						button.addClass("selected");
						$(".code-button").removeClass("selected");
						$(".view-button").removeClass("selected");
						// show
						$this.editor.blur();
						if (!$this.splitMode) {
							$("#editor_container").css({position: "absolute", left: "-10000px", top: "-10000px"});
						}
						// we need to know what the previously selected mode has been. if it was "View" we need to ensure that we restore the div overlays. 
						// depending on how time consuming this was, we need to think about cloning instead of keeping contents the same in Design and View
						// then we have the problem of syncing in yet another place
						$this._findChanges();
						$this.wasDirty = false;
						$(".designer").show();
						$this.isDesign = true;
						$("#designer-frame").addClass("design-frame");
					}
				});
				$(".preview-button").click(function () {
					// open a separate window and load the contents of the Designer iframe there 
					if (! $this.previewWindow || $this.previewWindow.closed) {
						var width = parseInt(window.innerWidth * 0.8, 10);
						var height = parseInt(window.innerHeight * 0.8, 10);
						$this.previewWindow = window.open("", "_blank", "width=" + width + ",height=" + height);
						$this.previewWindow.document.open();
						$this._previewCode = $this.editor.getValue();
						$this.previewWindow.document.write($this.editor.getValue());
						$this.previewWindow.document.close();
						$this.previewWindow.document.title = "Web Designer Preview";
						// set auto-reload timer
						if (!$this._refreshPreviewTimerID) {
							$this._refreshPreviewTimerID = setInterval($.proxy($this._refreshPreview, $this), 2000);
						}
					} else {
						// reload it if there are differences
						$this._refreshPreview();
						$this.previewWindow.focus();
					}
				});
				/*
				$(".split-button").click(function () {
					var button = $(this);
					if (button.hasClass("selected")) {
						// restore
						$(".code-button").removeClass("disabled-button");
						button.removeClass("selected");
						$(".designer").height("100%");
						$("#editor_container").css({
							height: "100%",
							position: "absolute",
							left: "-10000px",
							top: "-10000px"
						});
						$this.splitMode = false;
						return;
					} else {
						$this.splitMode = true;
						// disable the Code button
						$(".code-button").addClass("disabled-button");
						button.addClass("selected");
						$(".code-button").removeClass("selected");
						$(".view-button").removeClass("selected");
						$(".design-button").removeClass("selected");
						// show both iframe and editor and make their height 50%
						$(".designer").height("50%");
						if (!$(".designer").is(":visible")) {
							$(".designer").show();
						}
						$("#editor_container").css({
							position:"static",
							left:"",
							top:"",
							height: "50%"
						});
						$this.splitMode = true;
					}
				});
				*/
				// we want to listen to editor changes and update the currentText variable, only when we are in designMode
				// so that we don't cause refresh in the designer when we update something while in design mode, then just 
				// switch to code mode and then back to design mode
				this.session.on("change", function (e) {
					if ($this.isDesign && !$this.splitMode) {
						$this.currentText = $this.editor.getValue();
					} else if (e.data.action === "removeText") {
						// e.data.range gives the removed text. need to go through markers and mark them as deleted
						//perf? will invoke on every keystroke?

					}
				});
				// in order to achieve live updating we will use a combination of two approaches
				// 1. innerHTML as soon as someone types in the code editor
				// 2. a setInterval calling an update function every 2 min, which will ensure that if there are components registered,
				// which require javascript initialization, the whole page will be reloaded so all of this js gets executed and components
				// get reloade
				$this.updateTimer = setInterval($.proxy($this._updateSurface, $this), $this.options.codeToDesignRefreshInterval);
				// add default hover and selection markup
				var designLayer = $("<div></div>").appendTo("#dfcontainer").css("overflow", "hidden");
				$("<div></div>").appendTo(designLayer).addClass("hovered-component").css("display", "none");
				var selectedComponent = $("<div></div>").appendTo(designLayer).addClass("selected-component").css("display", "none");
				// add non visual area
				var nonvisArea = $("<div></div>").appendTo("#dfcontainer").addClass("nonvisual-area").css("display", "none");
				$("<label>Drop Here</label>").appendTo(nonvisArea).addClass("nonvisual-area-droplabel");
				// for non-visual components such as data sources
				$(".nonvisual-area").droppable({
					accept: ".toolbox-item[data-visual=false]",
					hoverClass: "nonvisual-area-hover",
					activeClass: "nonvisual-area-active",
					drop: function (event, ui) {
						var t, lib, codeProvider, totalComponentCount, id, code, descriptor, pkg, cmp, codeRange, r,
							codeMarker, title;
						// add a new entry
						var area = $(".nonvisual-area"), list = area.find("ul");
						if (list.length === 0) {
							list = $("<ul></ul>").appendTo(area).addClass("nonvisual-list ig-layout ig-layout-flow");
							list.on("click", ".nonvisual-item", function (event) {
								$this._selectFrameworkComponent($(event.target));
							});
							list.on("contextmenu", function (event) {
								$this._contextComponent = event.target;
								$(".context-menu").css({
									display: "block",
									left: event.pageX + 2,
									top: event.pageY + 2
								});
								event.preventDefault();
								event.stopPropagation();
							});
						}
						var item = $("<li></li>").appendTo(list).addClass("ig-layout-flow-item btn nonvisual-item ig-component");
						var defaultOptions = $("li[data-type=" + t + "]").data("defaultOptions");
						var options = $.extend({
							id: id,
							type: t,
							lib: lib
						}, defaultOptions);
						t = ui.helper.attr("data-type");
						lib = ui.helper.attr("data-lib");
						codeProvider = $this._codeProviders[lib];
						// we need to determine where to append - we may be dropping over rows and columns
						//totalComponentCount = body.find(".ig-component").length;
						totalComponentCount = $this._getComponentCount(t);
						totalComponentCount++;
						while ($("#designer-frame").contents()[0].getElementById(t + totalComponentCount)) {
							totalComponentCount++;
						}
						id = t + totalComponentCount;
						// set Non-visual component title
						item.text(id).attr("data-title", id);
						title = id;
						descriptor = {
							type: t,
							id: id
						};
						pkg = $this._packages[lib];
						if (pkg) {
							cmp = pkg.components[t];
							if (cmp) {
								$this._promiseCmp = cmp.loadInfo();
							}
						}
						var needsLazyLoad = $this._needsLazyLoad(codeProvider, t);
						if (needsLazyLoad) {
							// show loading message
							$this._showLoading("Loading " + t + " dependencies");
						}
						descriptor.options = options;
						var initDelayed = function () {
							$this._ensureDependenciesLoaded(codeProvider, t, function () {
								codeProvider.initComponent(descriptor);
								if (needsLazyLoad) {
									// select it if it hasn't been already selected
									if (placeholder) {
										$this._selectFrameworkComponent(item);
									}
									// hide loading message & restore contents
									$this._hideLoading();
								}
							});
							code = codeProvider.getCodeEditorScriptFor(descriptor);
							if (code && code.codeString) {
								if (!code.lineCount) {
									code.lineCount = code.codeString.split("\n"); // default count based on newlines in the string
								}
								// append to <script type="text/javascript" id="code">
								// we want to insert it after the last component's javascript
								var offset = 0;
								if ($this.componentIds.length > 0) {
									for (var i = 0; i < $this.componentIds.length; i++) {
										if ($this.componentIds[i].codeMarker) {
											codeRange = $this.componentIds[i].codeMarker.range;
											offset = codeRange.end.row;
											break;
										}
									}
								}
								if (!codeRange) {
									codeRange = $this.editor.find("<script id=\"code\">\n");
									offset = codeRange.end.row + 1;
								}
								$this.session.insert({row: offset, column: 0}, code.codeString);
								r = $this.createAndAddMarker(offset, 0, offset + code.lineCount, 0);
								codeMarker = {
									range: r,
									extraMarkers: {
									},
									baseIndent: 4
								};
								codeProvider.addExtraMarkers({
									marker: codeMarker,
									codeObj: code,
									type: t,
									rclass: $this.RangeClass
								});
								//codeMarker.id = $this.session.addMarker(r, "customMarker", "text", true);
								codeMarker.id = r.id;
							}
							item.attr({
								"id": id,
								"data-lib": lib,
								"data-type": t,
								"data-title": title
							});
							$this.componentIds.push({
								id: id,
								lib: lib,
								title: title,
								type: t,
								visual: false,
								providerType: codeProvider.getProviderType(t),
								codeMarker: codeMarker
							});
							if (descriptor.options) {
								$this.componentIds[$this.componentIds.length - 1].options = descriptor.options;
							}
							$this._syncDesigner();
							if (!needsLazyLoad) {
								$this._selectFrameworkComponent(item);
							}
						};
						if ($this._promiseCmp) {
							$this._promiseCmp.then(function () {
								initDelayed();
							});
						} else {
							initDelayed();
						}
					}
				});
				// add the adorners
				$("<div></div>").appendTo(selectedComponent).css({
					position: "relative",
					width: "100%",
					height: "100%"
				});
				$("<div></div>").appendTo("#dfcontainer").addClass("tag-placeholder");
				var adorners = $("<div></div>").appendTo("body").addClass("adorners");
				adorners.css({
					position: "absolute",
					top: -10000,
					left: -10000
				});
				this._addDefaultAdorners(adorners);
				$(".right-area > .nano").nanoScroller();
				this._setupInspector();
				this._setupMenu();
				// adjust toolbox area heights
				var elemsTree = $(".elements");
				var toolboxContainer = $(".toolbox-container");
				var container = $(".elements-container");
				var searchAndElementsHeight = parseInt($(".toolbox-search").height(), 10);
				searchAndElementsHeight += parseInt(elemsTree.height(), 10);
				toolboxContainer.css("height", "calc('100%-" + searchAndElementsHeight + "px')");
				this._initialToolboxHeight = toolboxContainer.height();
				var rightArea = $(".right-area");
				var newPadding = parseInt(rightArea.css("padding-bottom"), 10) +
					parseInt(rightArea.css("border-bottom-width"), 10) + parseInt(elemsTree.outerHeight(), 10) +
					parseInt(elemsTree.css("border-top-width"), 10) * 2;
				rightArea.css("padding-bottom", newPadding);
				this._initialPadding = newPadding;
				elemsTree.find(".elements-label").click(function (event) {
					if (container.is(":visible")) {
						$this._hideElementsTree();
					} else {
						$this._showElementsTree();
					}
				});
				$(".context-menu li").on("click", function (e) {
					if (!$this._contextComponent) {
						return;
					}
					if ($(this).attr("data-action") === "remove") {
						$this._removeComponent($this._contextComponent);
					}
					// close
					$(".context-menu").css("display", "none");
					e.preventDefault();
					e.stopPropagation();
				});
				//ga("send", "timing", "WebDesigner", "Web Designer Initial Load", new Date().getTime() - this.startms, "WD Initial Load");
			},
			_clearDragFn: function () {
				if (this._isDragging) {
					this._isDragging = false;
					this._dragClone = null;
					if ($(".drag-clone").length > 0) {
						$(".drag-clone").remove();
					}
					this._draggedElement = null;
				}
			},
			_endDragFn: function (el) {
				this._isMouseDown = false;
				if (this._isDragging) {
					this._isDragging = false;
					this._dragClone = null;
					if (this._adornersHidden === true) {
						this._restoreAdorners();
					}
					// determine drop target, & drop (reorder iframe DOM), & remove cloned DOM (drag markup)
					// then reorder code via markers, parse It (parseCode), then rebuild tree.
					// remove dragging helper (cloned DOM)
					// consider perf
					if ($(".drag-clone").length > 0) {
						$(".drag-clone").remove();
					}
					// now perform drop:
					var $el, comp;
					el = this._resolveElement(el);
					$el = $(el);
					if (el && this._draggedElement) {
						//determine where to "drop"
						//TODO: there are several cases : insert in between, append, prepend, etc. We need something like the tree's drag and drop func
						// to determine this based on exact mouse position & offsets
						// now replace code contents
						var draggedEl = $(this._draggedElement);
						var draggedMarker = draggedEl.data("marker");
						if (draggedEl.hasClass("ig-component")) {
							comp = this._findComponent(draggedEl);
							draggedMarker = comp.htmlMarker.range;
						}
						var targetMarker = $(el).data("marker");
						draggedEl.insertAfter(el);
						// reselect the new element
						this._selectComponent(this._draggedElement);
						//that._draggedElement = null;
						// replace targetMarker with draggedMarker
						// the following ACE API is helpful
						// moveText(Range fromRange, Object toPosition) 
						// replace(Range range, String text)  Object
						// remove(Range range)  Object
						// insert(Object position, String text)  Object
						var rows = draggedMarker.end.row - draggedMarker.start.row;
						this.session.moveText(draggedMarker, {row: targetMarker.end.row + 1, column: 0});
						var endCol = targetMarker.end.row + 1;
						var newMarker = new this.RangeClass(endCol, 0, endCol + rows, 0);
						this.addMarker(newMarker);
						if (comp) {
							this.session.removeMarker(comp.htmlMarker.id);
							comp.htmlMarker.range = newMarker;
							comp.htmlMarker.id = newMarker.id;
						} else {
							draggedEl.data("marker", newMarker);
						}
						// need to fix indents as well 
						// if we actually want to insert the dragged marker into the target marker, it becomes a lot tricker because we need to calc
						// the actual end tag position. So we need two end markers one where the actual markup ends, and one where the closing tag starts
						// refresh designer
						this._refreshAll();
					}
				}
			},
			_hideNonVisualArea: function () {
				$(".nonvisual-area").hide("slide", {direction: "down"}, 500, function () {
					$("#designer-frame").removeClass("frame-nonvisual");
					$(".nonvisual-area-droplabel").css("display", "none");
				});
			},
			_processFileDependencies: function (provider, deps, fileType) {
				if (!provider) {
					return [];
				}
				if (!Array.isArray(deps)) {
					return [];
				}
				var processedDeps = new Array(deps.length);
				for (var i = 0; i < deps.length; i++) {
					var dep = typeof (deps[i]) === "string" ? deps[i] : deps[i].url;
					if (dep && typeof dep === "string") {
						if (dep.indexOf("<script") !== -1 || dep.indexOf("<link") !== -1) {
							// this is for existing impls that provide full tags; may be able to remove after refactoring
							// but could keep it in case someone does provide full tags
							processedDeps[i] = deps[i];
							continue;
						}
						switch (fileType.toLowerCase()) {
						case "stylesheet":
							if (dep !== deps[i]) {
								processedDeps[i] = {
									url: "<link rel=\"stylesheet\" href=\"" + dep + "\">",
									lazyLoad: deps[i].lazyLoad,
									id: deps[i].id
								};
							} else {
								processedDeps[i] = "<link rel=\"stylesheet\" href=\"" + deps[i] + "\">";
							}
							break;
						case "script":
							if (dep !== deps[i]) {
								processedDeps[i] = {
									url:  "<script src=\"" + dep + "\"><\/script>",
									lazyLoad: deps[i].lazyLoad,
									id: deps[i].id
								};
							} else {
								processedDeps[i] = "<script src=\"" + deps[i] + "\"><\/script>";
							}
							break;
						default:
							console.error("Uknown fileType '" + fileType + "' in processFileDependencies for '" +
							provider + "'. Expected types are 'style' for CSS or 'script' for JS.");
						}
					}
				}
				return processedDeps;
			},
			_addDesignerDependency: function (dep) { // dependency as file reference tag(s)
				if (dep) {
					var frameHead = $("#designer-frame").contents().find("head");
					if (!frameHead.length) {
						console.error("Could not find designer frame head element.");
						return;
					}
					//dep = $(dep);
					dep.each(function() {
						var alreadyExists = false, current = $(this);
						switch (current.prop("tagName")) {
							case "LINK":
								alreadyExists = frameHead.find("link[href=\"" + current.attr("href") + "\"]").length;
								// if (this.impl) { // for some reason it seems to do something weird with link tags; I think it may be polymer 
								// 	// current = this.impl.outerHTML;
								// 	alreadyExists = true;
								// }
								break;
							case "SCRIPT":
								alreadyExists = frameHead.find("script[src=\"" + current.attr("href") + "\"]").length;
								break;
						}
						if (!alreadyExists) {
							current.attr("async", "");
							frameHead.append(current);
						}
					});
				}
			},
			_needsLazyLoad: function (codeProvider, componentType) {
				var pkgScriptDeps = codeProvider.settings.packageInfo.scripts;
				var component = codeProvider.settings.packageInfo.components[componentType];
				var deps = component.dependsOn;
				var i, j;
				for (i = 0; i < pkgScriptDeps.length; i++) {
					if (pkgScriptDeps[i].lazyLoad === true && !this._lazyLoadedScripts[pkgScriptDeps[i].id]) {
						// make sure that this is also listed in the component dependencies
						for (j = 0; deps && j < deps.length; j++) {
							if (deps[j] === pkgScriptDeps[i].id) {
								return true;
							}
						}
					}
				}
				return false;
			},
			_ensureDependenciesLoaded: function (codeProvider, componentType, callback) {
				// find the dependencies of componenType from codeProvider.settings.packageInfo.components.dependsOn
				// and lazy-load those scripts in the designer iframe if they aren't already loaded 
				// maybe also accept the initComponent callback?
				// once there are any scripts that are lazy-loaded, record somewhere that the respective script has been loaded already
				var component = codeProvider.settings.packageInfo.components[componentType];
				var pkgScriptDeps = codeProvider.settings.packageInfo.scripts;
				var i, j, allLoaded = true;
				var deps = component.dependsOn;
				var that = this;
				// if all lazy loaded scripts have been loaded, exit and fire the callback immediatelly
				allLoaded = !this._needsLazyLoad(codeProvider, componentType);
				if (allLoaded) {
					callback();
					return;
				}
				var combinedCallback = function (data) {
					// check if all deps have been lazy-loaded for the component in question,
					// and if so, call the callback
					//data.currentTarget.src
					var allLoaded = true;
					for (var i = 0; i < deps.length; i++) {
						if (!that._lazyLoadedScripts[deps[i]] || !that._lazyLoadedScripts[deps[i]] === deps[i].url) {
							allLoaded = false; // wait for the other lazyLoad component dependencies to get loaded and fire their onLoad events
						}
					}
					// all lazily loaded component scripts dependencies have been loaded and their onLoad events have fired
					// therefore proceed to invoking the component callback
					if (allLoaded) {
						callback();
					}
				};
				var meta = null, loaded = false;
				if (deps && deps.length) {
					loaded = false;
					for (i = 0; i < deps.length; i++) {
						if (!this._lazyLoadedScripts[deps[i]]) {
							for (j = 0; j < pkgScriptDeps.length; j++) {
								if (pkgScriptDeps[j].id && pkgScriptDeps[j].id === deps[i]) {
									if (!pkgScriptDeps[j].lazyLoad) {
										loaded = true;
									} else {
										meta = pkgScriptDeps[j];
									}
									break;
								}
							}
							if (!loaded && meta) {
								this._loadScript(meta.url, meta, combinedCallback);
								// add the script to the designer
								this._addDesignerScriptRef(meta.url);
							}
						}
					}
				}
			},
			_addDesignerScriptRef: function (url) {
				var codeRange = this.editor.find("<script id=\"code\">\n");
				var urlRef = "\t\t<script src=\"" + url + "\"></script>\n";
				this.session.insert({row: codeRange.start.row - 1, column: 0}, urlRef);
			},
			_loadScript: function (url, meta, callback) {
				var frame = document.getElementById("designer-frame");
				var script = frame.contentWindow.document.createElement("script");
				script.type = "text/javascript";
				script.src = url;
				script.async = "";
				if (callback) {
					script.onload = callback;
				}
				frame.contentWindow.document.head.appendChild(script);
				if (meta) {
					this._lazyLoadedScripts[meta.id] = url;
				}
			},
			_buildInitialMarkup: function () {
				var cssString = "";
				var jsString = "";
				var cssDep = [];
				var jsDep = [];
				var jsDepSrc = [];
				var i, html;
				//TODO: merge dependencies that are the same - example: if two libraries declare the same JS or CSS dependency
				for (var provider in this._codeProviders) {
					if (this._codeProviders.hasOwnProperty(provider)) {
						$.merge(cssDep, this._processFileDependencies(this._codeProviders[provider], this._codeProviders[provider].getStyleDependencies(), "stylesheet"));
						$.merge(jsDep, this._processFileDependencies(this._codeProviders[provider], this._codeProviders[provider].getScriptDependencies(), "script"));
						$.merge(jsDepSrc, this._codeProviders[provider].getScriptDependencies());
					}
				}
				// for each dependency, create its markup for the editor
				// this can be moved to the code provider, but i think it's better to keep it as part
				// of editor's functionality
				//this._cssDeps.push("<link href=\"css/bootstrap.min.css\" rel=\"stylesheet\">");
				for (i = 0; i < cssDep.length; i++) {
				//	this._addDesignerDependency(cssDep[i]);
					this._cssDeps.push(cssDep[i]);
					cssString += "\t\t" + cssDep[i] + "\n";
				}
			//	var jQueryDep = "<script type=\"text\/javascript\" src=\"http://code.jquery.com/jquery-1.10.2.min.js\"><\/script>";
				var dsDep = "<script src=\"js\/datasources.js\"><\/script>";
			//this._jsDepsSrc.push("http://code.jquery.com/jquery-1.10.2.min.js");
				this._jsDepsSrc.push("js/datasources.js");
				//this._jsDeps.push(jQueryDep);
				//this._jsDeps.push(dsDep);
				for (i = 0; i < jsDep.length; i++) {
				//	this._addDesignerDependency(jsDep[i]);
					this._jsDeps.push(jsDep[i]);
					this._jsDepsSrc.push(jsDepSrc[i]);
					if (typeof (jsDep[i]) === "string") {
						jsString += "\t\t" + jsDep[i] + "\n";
					} else if (typeof (jsDep[i]) === "object" && !jsDep[i].lazyLoad) {
						jsString += "\t\t" + jsDep[i].url + "\n";
					}
				}
				html = "<!DOCTYPE html>\n" +
						"<html>\n" +
						"\t<head>\n" +
						"\t\t<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n" +
						//"\t\t<link href=\"css/bootstrap.min.css\" rel=\"stylesheet\">\n" +
						cssString +
					//	"\t\t" + jQueryDep + "\n" +
						jsString +
						"\t\t" + dsDep + "\n" +
						"\t\t<script id=\"code\">\n" +
						"\t\t\t$(document).ready(function () {\n\n" +
						"\t\t\t});\n" +
						"\t\t<\/script>\n" +
						"\t</head>\n" +
						"\t<body>\n\n" +
						"\t</body>\n" +
						"</html>";
				this._initialCode = html;
				return html;
			},
			_refreshPreview: function () {
				var currentCode = this.editor.getValue();
				var previewCode = this._previewCode;
				if (this.previewWindow && !this.previewWindow.closed && previewCode !== currentCode) {
					//reload
					this._previewCode = currentCode;
					this.previewWindow.document.open();
					this.previewWindow.document.write(currentCode);
					this.previewWindow.document.close();
				}
			},
			_resolveElement: function (e) {
				// the rules:
				// find closest .ig-component
				// 1) if such exists:
				// - check for isContainer (by calling the code provider API)
				// if its a container, return the element itself, otherwise return the closest ig-component 
				// 2) if such doesn't exist:
				// - directly return the element
				if (!e) {
					throw new Error("element is not defined - cannot resolve.");
				}
				if (e && ((e.tagName && (e.tagName.toLowerCase() === "document" || e.tagName.toLowerCase() === "body")) || typeof (e.tagName) === "undefined")) {
					return null;
				}
				var $e = $(e), knownComponent = $e.closest(".ig-component"), provider, desc;
				if (knownComponent.length === 0) {
					return e;
				} else {
					provider = this._codeProviders[knownComponent.attr("data-lib")];
					desc = {
						type: knownComponent.attr("data-type"),
						element: $e
					};
					if (provider.isContainer(desc)) {
						return e;
					} else {
						return knownComponent[0];
					}
				}
			},
			_hoverComponent: function (event, element) {
				var hbox = $(".hovered-component"), $element = $(element), tag = $(".tag-placeholder"), offset;
				var frame = $("#designer-frame");
				var mleft = parseInt(frame.css("margin-left"), 10);
				var pad;
				if (frame.hasClass("design-frame")) {
					if (this.hoveredComponent === null || element !== this.hoveredComponent) {
						offset = $element.offset();
						pad = parseInt(frame.css("padding-left"), 10);
						var owidth = $element.outerWidth();
						var oheight = $element.outerHeight();
						hbox.css({
							width: owidth,
							height: oheight,
							left: offset.left + mleft + pad,
							top: offset.top,
							display: "block"
						});
						tag.css({
							left: offset.left + mleft + pad,
							top: offset.top - tag.outerHeight(),
							display: "block"
						});
						if ($element.attr("data-type")) {
							tag.text($element.attr("data-type"));
						} else if (element && element.nodeName) {
							tag.text(element.nodeName);
						}
						this.hoveredComponent = element;
						if (event) {
							event.stopPropagation();
						}
					}
				}
			},
			// _syncSboxSize: function () {
				// if (!this.selectedComponent) {
					// return;
				// }
				// var sbox = $(".selected-component");
				// var adorners = $(".adorners");
				// var frame = $("#designer-frame");
				// var selected = $(this.selectedComponent);
				// var eHeight = selected.outerHeight(), eWidth = selected.outerWidth();
				// var sHeight = sbox.height(), sWidth = selected.width();
				// var pos = selected.offset();
				// var pad = parseInt(frame.css("padding-left"), 10);
				// var mleft = parseInt(frame.css("margin-left"), 10);
				// var eLeft = pos.left, eTop = pos.top;
				// var spos = sbox.offset();
				// var sLeft = spos.left, sTop = spos.top;
				// if (eHeight !== sHeight) {
					// sbox.height(eHeight);
				// }
				// if (eWidth !== sWidth) {
					// sbox.width(eWidth);
				// }
				// if (eLeft !== sLeft + mleft + pad) {
					// sbox.css("left", eLeft + mleft + pad);
				// }
				// if (eTop !== sTop) {
					// sbox.css("top", eTop);
				// }
				// if (eHeight !== sHeight || eTop !== sTop) {
					// adorners.css("top", sTop);
				// }
				// if (eWidth !== sWidth || eLeft !== sLeft) {
					// adorners.css("left", sLeft + mleft + pad + eWidth);
				// }
			// },
			_syncDesigner: function () {
				this.currentText = this.editor.getValue();
				this.parsedText = this.currentText;
				this._parseCode(this.currentText);
				if (this.rootNode.children) {
					this._linkTrees(this.rootNode, $("#designer-frame").contents().children().get(0));
					this._rebuildDesignerNavTree();
				}
			},
			_getComponentCount: function (t) {
				var count = 0;
				for (var i = 0; i < this.componentIds.length; i++) {
					if (this.componentIds[i].type === t) {
						count++;
					}
				}
				return count;
			},
			_selectFrameworkComponent: function (element) {
				this._selectComponent(element, true, false);
			},
			_selectComponent: function (element, nonvisual, buildBreadcrumb) {
				var sbox = $(".selected-component"), $element = $(element), offset,
					frame = $("#designer-frame"),
					lib = $element.attr("data-lib"),
					type = $element.attr("data-type"),
					that = this,
					pkg,
					component,
					found = false,
					cmp,
					htmlMarker;
				if (!lib && !type) {
					lib = "html";
					type = element.tagName.toLowerCase();
					pkg = this._packages[lib];
					if (pkg) {
						for (component in pkg.components) {
							if (pkg.components.hasOwnProperty(component)) {
								for (var i = 0; i < pkg.components[component].tags.length; i++) {
									if (type === pkg.components[component].tags[i]) {
										found = true;
										break;
									}
								}
								if (found) {
									type = component;
									break;
								}
							}
						}
						if (!element.id) {
							$element.attr("data-title", pkg.components[component].toolboxTitle);
							$element.attr("data-lib", lib);
							$element.attr("data-type", type);
							element.id = type + (this._getComponentCount(type) + 1);
							htmlMarker = {
								range: $element.data("marker"),
								extraMarkers: {
								}
							};
							this.componentIds.push({
								id: element.id,
								lib: lib,
								title: pkg.components[component].toolboxTitle,
								type: type,
								visual: true,
								providerType: this._codeProviders[lib].getProviderType(type),
								codeMarker: null,
								htmlMarker: htmlMarker,
								headMarker: null
							});
						} else {
							found = !undef(this.componentById(element.id));
							if (!found) {
								$element.attr("data-title", pkg.components[component].toolboxTitle);
								$element.attr("data-lib", lib);
								$element.attr("data-type", type);
								htmlMarker = {
									range: $element.data("marker"),
									extraMarkers: {
									}
								};
								this.componentIds.push({
									id: element.id,
									lib: lib,
									title: pkg.components[component].toolboxTitle,
									type: type,
									visual: true,
									providerType: this._codeProviders[lib].getProviderType(type),
									codeMarker: null,
									htmlMarker: htmlMarker,
									headMarker: null
								});
							}
						}
						cmp = pkg.components[type];
						if (cmp) {
							//Note: this WILL return a promise if the metadata isn't already loaded
							this._promiseCmp = cmp.loadInfo();
						}
					}
				}
				if (frame.hasClass("design-frame")) {
					//A.T. commenting the line below because we may have the scenario where i want to drag & drop
					// an already selected element (i.e. take it & drop it in some container @ different place on the page)
					//if (this.selectedComponent === null || element !== this.selectedComponent) {
					this.selectedComponent = element;
					this._updateSelectionBox(true);
					$(".adorner-hlabel:first").text($element.attr("data-title"));
					// element is the hovered component
					// we shouldn't stop propagation here, but directly in the event handler
					// because since we are detecting single vs. double clicks, the selectComponent fires with a delay
					// so it's already late to stop propagation
					//event.stopPropagation();
					// rebuild breadcrumb
					if (typeof (buildBreadcrumb) === "undefined" || buildBreadcrumb === true) {
						$(".dom-nav").empty();
						this._breadcrumbs(element);
					}
					//}
					// navigate to node
					this.internalSelect = true;
					if (!nonvisual) {
						$(".dom-tree").igTree("expandToNode", $(".dom-tree").igTree("nodesByValue", $element.data("id")), true);
					}
					// ensure that the "Elements" area is visible when a component is explicitly selected
					//if ($(".toolbox-container").is(":hidden")) {
					//	this._showElementsTree();
					//}
					$(".search-filterlist").css("display", "none");
				}
				$element.addClass("selected-iframe");
				//TODO: Ensure we aren't recreating everything is we are selecting AGAIN the same component that was selected BEFORE, 
				// and for which adorners & props & dropdowns have already been created.
				$(".adorner-prop-menu").remove();
				// update property explorer
				if (!$element.is("head, script, link")) {
					if (this._promiseCmp) {
						this._promiseCmp.then(function () {
							that._updatePropertyExplorer(
								$element,
								type,
								lib,
								nonvisual
							);
						});
					} else {
						this._updatePropertyExplorer(
							$element,
							type,
							lib,
							nonvisual
						);
					}
				}
			},
			_updateSelectionBox: function (init) {
				if (!this.selectedComponent || $(this.selectedComponent).is("head, script, link")) {
					return;
				}
				var $element = $(this.selectedComponent),
					offset = $element.offset(),
					frame = $("#designer-frame"),
					sbox = $(".selected-component"),
					hbox,
					tag,
					mleft = parseInt(frame.css("margin-left"), 10),
					pad = parseInt(frame.css("padding-left"), 10),
					owidth = $element.outerWidth(),
					oheight = $element.outerHeight(),
					pos = sbox.position();
				if (mleft === 0 && window.mozInnerScreenX !== null) { // Firefox
					mleft = frame.position().left; // firefox gives mleft as 0, when margin is 0 auto (bug in Firefox... )
				}
				if ($element.hasClass("nonvisual-item")) {
					pad = 0;
				}
				if (sbox.outerWidth() !== owidth || sbox.outerHeight() !== oheight || pos.left !== offset.left + mleft + pad || pos.top !== offset.top) {
					sbox.css({
						width: owidth,
						height: oheight,
						left: offset.left + mleft + pad,
						top: offset.top,
						display: "block"
					});
				}
				if (this._snap || init) {
					this._adornersTop = offset.top;
					this._adornersLeft = offset.left + mleft + owidth + pad;
					this._ensureAdornersVisible();
					this._adorners.css({
						top: this._adornersTop,
						left: this._adornersLeft
					});
				}
				if (this.hoveredComponent) {
					hbox = $(".hovered-component");
					tag = $(".tag-placeholder");
					$element = $(this.hoveredComponent);
					offset = $element.offset();
					pad = parseInt(frame.css("padding-left"), 10);
					owidth = $element.outerWidth();
					oheight = $element.outerHeight();
					hbox.css({
						width: owidth,
						height: oheight,
						left: offset.left + mleft + pad,
						top: offset.top,
						display: "block"
					});
					tag.css({
						left: offset.left + mleft + pad,
						top: offset.top - tag.outerHeight(),
						display: "block"
					});
				}
				this._selectionTimeout = setTimeout($.proxy(this._updateSelectionBox, this), 500);
			},
			_setupRWDLayoutArea: function () {
				var that = this;
				var Mustache = require("mustache");
				var ddtmpl = $("#dropdownTemplate").html();
				var layoutArea = $("<div></div>").prependTo(".toolbox-content").addClass("layout-container");
				$("<div></div>").text("LAYOUT").addClass("ide-label").appendTo(layoutArea).css({
					cursor: "pointer"
				});
				// add contents
				var breakpoints = $("<div></div>").appendTo(layoutArea).addClass("layout-breakpoints");
				var layoutfw = $("<div></div>").appendTo(layoutArea).addClass("layout-frameworks");
				$("<span></span>").appendTo(breakpoints)
					.text("Designing Layout & Styles for:")
					.addClass("layout-breakpoints-label layout-label");
				// add breakpoints dropdown
				var breakpointsData = {
					//titleText: "Select breakpoint to view and edit styles for that breakpoint",
					titleText: "Select CSS breakpoint to view and edit its styles",
					dropdownId: "breakpoints",
					defaultVal: "All/Default (No Breakpoint)",
					defaultKey: "default",
					defaultItemText: "ALL / DEFAULT (NO BREAKPOINT)",
					closeOnClick: false
				};
				var breakpointsHtml = Mustache.to_html(ddtmpl, breakpointsData);
				breakpoints.append(breakpointsHtml);
				// init layout edit form - as described here: http://indigo.infragistics.com/prototype/FHOGEANP
				$(".layout-edit-descr-val>input,.layout-edit-min-val>input,.layout-edit-max-val>input")
					.focus(function (event) {
						that._internalFormEditing = true;
					})
					.blur(function (event) {
						that._internalFormEditing = false;
					});
				// add edit button (which will be shown on hover)
				var editButton = $("<button></button>")
					.appendTo("body")
					.addClass("brk-edit-button ig-hidden")
					.attr("title", "Edit This Breakpoint")
					.on("mouseup", function (event) {
						// toggle the edit form, re-set input field values and adjust location
						var form = $(".layout-edit-form");
						if (form.is(":visible") && !form.hasClass("ig-hidden")) {
							form.css("display", "none");
							return;
						}
						var button = $(this);
						var currentItem = button.data("item");
						var pos = currentItem.offset();
						var li = button.data("item");
						form.css({
							display: "block",
							left: pos.left,
							top: pos.top,
							width: currentItem.innerWidth() - 40
						}).data("item", li);
						$(".layout-edit-remove").data("item", li);
						$(".layout-edit-save").data("item", li);
						// fill form
						$(".layout-edit-descr-val > input").val(li.attr("data-text"));
						$(".layout-edit-min-val > input").val(li.attr("data-min"));
						$(".layout-edit-max-val > input").val(li.attr("data-max"));
						if (form.hasClass("ig-hidden")) {
							form.removeClass("ig-hidden");
						}
						that._internalFormFocus = true;
					})
					.on("mousedown click", function (event) {
						event.preventDefault();
						event.stopPropagation();
					});
				$("<span></span>").appendTo("body")
					.addClass("brk-hover-label")
					.css("display", "none");
				$(".layout-edit-save").on("mouseup", function (event) {
					//Save changes to the layout item
					var li = $(this).data("item");
					var text = $(".layout-edit-descr-val > input").val();
					var minText = $(".layout-edit-min-val > input").val();
					var maxText = $(".layout-edit-max-val > input").val();
					li.attr("data-text", text);
					li.attr("data-min", minText);
					li.attr("data-max", maxText);
					var newLeft = parseInt((parseInt(minText, 10) * li.width()) / 2600, 10);
					var newWidth = parseInt((parseInt(maxText, 10) * li.width()) / 2600, 10);
					li.find(".brk-item-slider").css("left", newLeft);
					li.find(".brk-slider-inner").css("width", newWidth);
					li.find(".brk-slider-min div:nth-child(2)").text(minText);
					li.find(".brk-slider-max div:nth-child(2)").text(maxText);
					if (li.attr("data-custom") !== true) {
						li.attr("data-custom", true);
					}
					// now update Media query & frame
					that._changeBreakpoint(li, true);
					$(".layout-edit-form").css("display", "none");
				});
				$(".layout-edit-remove").on("mouseup", function (event) {
					var item = $(this).data("item");
					var deviceItem = $(".device-menu li[data-key=" + item.attr("data-key") + "]");
					var prevLayoutItem = $(".layout-menu li[data-key=" + item.attr("data-key") + "]").prev();
					// remove media queries associated with this item
					if (that._mediamkr) {
						var mkr = that._mediamkr.mqueries[item.attr("data-key")];
						if (mkr) {
							// remove via marker
							var codeToRemove = that.session.getTextRange(mkr);
							var offset = codeToRemove.substring(0, codeToRemove.indexOf("{")).split("\n").length;
							var queryContents = that.session.getTextRange( new that.RangeClass(mkr.start.row + offset, 0, mkr.end.row + 1, 0));
							queryContents = queryContents.substring(0, queryContents.lastIndexOf("}"));
							// place the contents of the media query in the style section, so that it's not lost
							//that.session.insert({row: mkr.end.row + 1, column: 0}, queryContents + "\n");
							that.session.insert({row: that._mediamkr.marker.end.row - 3, column: 0}, queryContents + "\n");
							that.session.remove(mkr);
							// also remove marker
							mkr.end.detach();
							mkr.start.detach();
							that.session.removeMarker(mkr.id);
							that._mediamkr.mqueries[item.attr("data-key")] = null;
							that._lastq.pop();
						}
					}
					// remove list item
					deviceItem.removeClass("disabled device-layout-disabled");
					$(this).css("top", -10000);
					item.remove();
					if (prevLayoutItem.length === 0) {
						// select ALL / DEFAULT
						var newSel = $(".device-menu li[data-key=default]");
						that._changeBreakpoint(newSel);

					} else {
						// select previous layout item after this one is removed
						that._changeBreakpoint(prevLayoutItem);
					}
					$(".layout-edit-form").css("display", "none");
				}).on("mousedown click", function (event) {
					event.preventDefault();
				});
				//$("<span></span>").appendTo(removeButton).addClass("glyphicon glyphicon-minus");
				$("<span></span>").appendTo(editButton).addClass("glyphicon glyphicon-edit");
				// fill items
				var brkmenu = breakpoints.find(".dropdown-menu");
				var breakpointsTitle = $("<li><a style='display:inline;'>" + breakpointsData.titleText + "</a></li>").appendTo(brkmenu)
					.addClass("breakpoints-title brk-item");
				$("<li><a>" + breakpointsData.defaultItemText + "</a></li>").appendTo(brkmenu)
					.addClass("breakpoints-default brk-item")
					.attr("data-key", breakpointsData.defaultKey)
					.attr("data-text", breakpointsData.defaultVal);
				$(".breakpoints-title").on("mousedown mouseup click", function (event) {
					that._ddopenpersist = true;
				});
				$(".breakpoints-default").on("mouseup", function (event) {
					// change selected breakpoint
					that._changeBreakpoint($(event.target));
				}).on("mousedown click", function (event) {
					event.preventDefault();
					event.stopPropagation();
				});
				// add device size selector button
				var deviceButton = $("<button></button>").appendTo(breakpointsTitle).addClass("device-button ig-dropdown");
				$("<span></span>").appendTo(deviceButton).addClass("glyphicon glyphicon-plus device-icon");
				// build devices dropdown
				var devicesData = {
					dropdownId: "devices",
					devices: [
						{key: "phone", text: "Phone", min: "0px", max: "320px"},
						{key: "phone_landscape", text: "Phone Landscape", min: "321px", max: ""},
						{key: "tablet", text: "Tablet", min: "321px", max: "767px"},
						{key: "tablet_landscape", text: "Tablet Landscape", min: "768px", max: "1024px"},
						{key: "desktop", text: "Desktop", min: "1224px", max: ""},
						{key: "huge_desktop", text: "Huge Desktop", min: "1824px", max: ""},
						{key: "custom", text: "Other", min: "0", max: ""}
					]
				};
				this._bkeys = devicesData.devices;
				this._bkeys.push({key: "default"});
				var devicetmpl = $("#deviceTemplate").html();
				var devicesHtml = Mustache.to_html(devicetmpl, devicesData);
				deviceButton.attr("data-id", devicesData.dropdownId).attr("title", "Add New Breakpoint");
				var devicesContainer = $(devicesHtml).appendTo("body").addClass("device-container");
				deviceButton.on("mouseup", function (event) {
					that._toggleDropDown(deviceButton, devicesContainer);
					event.preventDefault();
					event.stopPropagation();
				}).on("mousedown click", function (event) {
					event.stopPropagation();
					event.preventDefault();
				});
				$(".device-menu > li").on("mouseup", function (event) {
					var $this = $(this), target = $(event.target);
					if (target.hasClass("disabled") || target.closest("li").hasClass("disabled")) {
						return;
					}
					var ddlist = target.closest("ul");
					var dd = $("body").find(".ig-dropdown[data-id=" + ddlist.attr("data-id") + "]");
					that._addDeviceLayoutItem({
						currentlist: brkmenu,
						devicelist: ddlist,
						key: $this.attr("data-key"),
						text: $this.attr("data-text"),
						min: $this.attr("data-min"),
						max: $this.attr("data-max")
					});
					//that._toggleDropDown(dd, ddlist.parent());
					that._toggleDropDown(dd, ddlist);
					event.preventDefault();
					event.stopPropagation();
				}).on("mousedown click", function (event) {
					event.preventDefault();
					event.stopPropagation();
				});
				$("<span></span>").appendTo(layoutfw)
					.text("Grid/Framework")
					.addClass("layout-fw-label layout-label");
				// add frameworks dropdown
				var texts = [];
				var pkgs = this.options.packages;
				texts.push({key: "none", text: "None/Vanilla CSS"});
				// only add if there are layout items
				for (var i = 0; i < pkgs.length; i++) {
					var provider = toolboxMetadata.getPackageInfo(pkgs[i]);
					var hasLayoutItems = false;
					if (provider.components) {
						for (var cname in provider.components) {
							if (provider.components.hasOwnProperty(cname)) {
								if (provider.components[cname].category === "layout") {
									hasLayoutItems = true;
									break;
								}
							}
						}
					}
					if (hasLayoutItems) {
						texts.push({
							text: provider.toolboxTitle,
							key: pkgs[i]
						});
					}
				}
				var frameworksData = {
					defaultVal: "None/Vanilla CSS",
					defaultKey: "none",
					dropdownId: "frameworks",
					closeOnClick: true,
					itemTexts: texts
						/*[
						{text: "Bootstrap Grid", key: "bootstrap"},
						{text: "Foundation Grid", key: "foundation"},
						{text: "Ignite UI Layout Manager", key: "igniteuilayoutmgr"},
						{text: "None/Vanilla CSS", key: "none"}
					]
					*/
				};
				var frameworksHtml = Mustache.to_html(ddtmpl, frameworksData);
				layoutfw.append(frameworksHtml);
				layoutfw.find(".dropdown-menu").css("width", layoutfw.find(".ig-dropdown:visible").width());
				//layoutfw.find("li").on("mousedown", function (event) {
				$(".layout-menu[data-id=frameworks] > li").on("mouseup", function (event) {
					var $this = $(this), ddlist = $(event.target).closest("ul");
					var dd = $("body").find(".ig-dropdown[data-id=" + ddlist.attr("data-id") + "]");
					// set input item, as well as selected layout framework
					//that._layoutfw = $this.attr("data-key");
					$(".layout-frameworks .ig-dropdown-label").text($this.attr("data-text")).attr("data-key", $this.attr("data-key"));
					that._changeLayoutFramework($this.attr("data-key"));
					if (dd.attr("data-closeonitemclick") === "false") {
						that._ddopenpersist = true;
					} else {
						that._toggleDropDown(dd, ddlist);
					}
					that._dditemclick = true;
				//TODO - refactor handling mousedown & mouseclick to a common place, because the code is basically the same
				}).on("mousedown click", function (event) {
					event.preventDefault();
					event.stopPropagation();
				});
				$(".ig-dropdown-label,.ig-dropdown-button").on("mousedown", function (event) {
					var target = $(event.target), dd = target.closest(".ig-dropdown");
					var ddlist = dd.find("ul");
					if (ddlist.length === 0) {
						ddlist = $("body").find("ul[data-id=" + dd.attr("data-id") + "]");
					}
					that._ddopenpersist = false;
					that._dditemclick = false;
					that._toggleDropDown(dd, ddlist);
					if (ddlist.is(":visible")) {
						$("input.ig-hidden").attr("data-id", dd.attr("data-id")).focus();
					}
					//after toggling
					//that._dditemclick = true;
					event.stopPropagation();
					event.preventDefault();
				}).on("mouseup click", function (event) {
					event.preventDefault();
					event.stopPropagation();
				});
				var closeFn = function () {
					if (that._internalFormEditing) {
						// hide all forms and set it to false
						that._internalFormEditing = false;
						$(".abs-edit-form").css("display", "none");
						return;
					}
					if (that._ddopenpersist) {
						return;
					}
					var id = $(this).attr("data-id");
					var dd = $(".ig-dropdown[data-id=" + id + "]");
					var ddlist = $(".dropdown-menu[data-id=" + id + "]");
					if (!that._dditemclick) {
						// need this if we are editing forms in UIs that are *inside* the dropdown we want to close
						// we need some timeout otherwise the blur here will fire sooner than the focus of the form inputs
						// so they will have no way of notifying the IDE that it should not close the parent dropdown 
						setTimeout(function () {
							that._toggleDropDown(dd, ddlist, false);
						}, 20);
					} else {
						that._dditemclick = false;
					}
				};
				$("input.ig-hidden")
					.blur(function () {
						if (that._internalFormFocus) {
							return;
						}
						var fn = $.proxy(closeFn, this);
						fn();
					})
					.keyup(function (event) {
						if (event.keyCode === 27) {
							if (that._internalFormFocus) {
								$(".abs-edit-form").css("display", "none");
								that._internalFormFocus = true;
								return;
							}
							var fn = $.proxy(closeFn, this);
							fn();
						}
					});
				// detach dropdowns because bootstrap's dropdown doesn't work for more complex scenarios
				layoutArea.find("ul").appendTo("body").css("display", "none");
			},
			_hideLayoutHoverUI: function () {
				$(".brk-edit-button:not(:hover),.brk-hover-label:not(:hover)").css({
					left: -10000,
					top: -10000
				});
			},
			_closeDropDowns: function () {
				var that = this;
				this._internalFormEditing = false;
				$(".dropdown-menu").each(function () {
					that._toggleDropDown(null, $(this), false);
				});
			},
			_toggleDropDown: function (target, list, open) {
				if (this._internalFormEditing) {
					return;
				}
				var visible = list.is(":visible");
				if (visible || open === false) {
					// close all child dropdowns that are opened, otherwise they will appear hanging
					// the condition is that the list is marked as greedy, that is, it needs to be the only one
					// on the screen, from all that are marked with dropdown-menu
					//if (list.attr("data-greedy") === "true") {
					list.find(".ig-dropdown").each(function () {
						$(".dropdown-menu[data-id=" + $(this).attr("data-id") + "]:visible").css("display", "none");
					});
					list.css("display", "none");
					$(".abs-edit-form").css("display", "none");
					this._hideLayoutHoverUI();
					//}
				} else if (open === true || (typeof (open) === "undefined" && !visible)) {
					var pos = target.offset();
					// close all open dropdowns
					$(".dropdown-menu:visible").each(function () {
						if (!$.contains(this, target[0])) {
							$(this).css("display", "none");
						}
					});
					list.css({
						display: "block",
						left: pos.left - (list.width() - target.outerWidth()),
						top: pos.top + target.outerHeight()
					});
				}
			},
			_addDeviceLayoutItem: function (descriptor) {
				var ul = descriptor.currentlist,
					min = descriptor.min,
					max = descriptor.max,
					key = descriptor.key,
					text = descriptor.text,
					that = this;
				// once we add an item, it should be marked as disabled in the device selector list
				var devicelist = descriptor.devicelist;
				devicelist.find("li[data-key=" + key + "]").addClass("disabled device-layout-disabled");
				//add new entry. classes are prefixed with key, in order to visualize the layout in the dropdown correctly
				// we can "afford" to bind to every item, because they are going to be just a few of them
				var item = $("<li></li>").addClass("item-" + key).addClass("brk-item-added")
					.attr({
						"data-text": text,
						"data-key": key,
						"data-min": min,
						"data-max": max
					}).appendTo(ul).on("mouseover", function (event) {
						var li = $(this), pos = li.offset(),
						button = $(".brk-edit-button"), hoverLabel = $(".brk-hover-label");
						// show
						button.css({
							left: pos.left + li.outerWidth() - button.outerWidth(),
							top: pos.top
						}).data("item", li);
						if (!that._isBrkResizing) {
							hoverLabel.text(li.attr("data-text")).css({
								display: "",
								left: pos.left + parseInt(li.outerWidth() / 2 - hoverLabel.width() / 2, 10),
								top: pos.top
							});
						}
					}).on("mouseout", function (event) {
						that._hideLayoutHoverUI();
					}).on("mouseup", function (event) {
						if (!that._isresizing) {
							that._changeBreakpoint($(event.target));
						}
					}).on("mousedown click", function (event) {
						event.preventDefault();
						event.stopPropagation();
					});
				var slider = $("<div></div>")
					.addClass("brk-item-slider")
					.appendTo(item);
				var minMarker = $("<div></div>").addClass("brk-slider-min").appendTo(slider);
				$("<div></div>").appendTo(minMarker).text("MIN");
				$("<div></div>").appendTo(minMarker).text(min);
				var contentMarker = $("<div></div>")
					.addClass("brk-slider-inner")
					.appendTo(slider);
				var maxMarker = $("<div></div>").addClass("brk-slider-max").appendTo(slider);
				$("<div></div>").appendTo(maxMarker).text("MAX");
				$("<div></div>").appendTo(maxMarker).text(max);
				var iw = item.innerWidth();
				var mw = maxMarker.width();
				//if (key === "custom") {
				contentMarker.resizable({
					handles: "e, w",
					maxWidth: iw - mw * 3 - 16,
					resize: function (e, ui) {
						var li = ui.element.closest(".brk-item-added");
						// change min & max
						var min = slider.find(".brk-slider-min div:nth-child(2)");
						var max = slider.find(".brk-slider-max div:nth-child(2)");
						var origLeft = slider.data("origLeft");
						if (typeof (origLeft) === "undefined") {
							origLeft = 0;
						}
						var minChanged = false, maxChanged = false;
						// first we need to determine the direction of scrolling
						// are we dragging the right side of the slider or the left one
						// need to fit from 0 to sth like 2600px (min) ;
						var left = parseInt(ui.element.css("left"), 10);
						var oldLeft = parseInt(slider.css("left"), 10);
						if (!$.isNumeric(oldLeft)) {
							oldLeft = 0;
						}
						if (!$.isNumeric(left)) {
							//orig = true;
							left = 0;
						}
						if (oldLeft !== left && left !== 0) {
							// decreasing or increasing min
							if (left > 0) {
								left = left + origLeft;
								slider.css("left", left);
							} else {
								left = origLeft - Math.abs(left);
								if (left < 0) {
									left = 0;
									// preserve width
									ui.element.width(slider.data("prevWidth"));
								}
								slider.css("left", left);
							}
							minChanged = true;
						} else if (left === 0 && oldLeft !== 0 && $("body").css("cursor") === "w-resize") {
							slider.css("left", 0);
							minChanged = true;
						} else {
							// decreasing or increasing max
							maxChanged = true;
						}
						/*
						if ($("body").css("cursor") === "w-resize") {
							// we are decreasing the min value or decreasing the max value
							// set left on the brk-item-slider
						} else {

						}
						*/
						slider.data("prevWidth", ui.element.width());
						if (minChanged) {
							ui.element.css("left", 0);
							var newMin = parseInt(left / li.width() * 2600, 10);
							if (newMin < 0) {
								newMin = 0;
							}
							min.text(newMin + "px");
							li.attr({
								"data-min": min.text(),
								"data-custom": true
							});
						}
						//TODO: what value should be chosen & should it be part of options so that 
						// it's not hardcoded
						if (maxChanged) {
							var newMax = parseInt(ui.size.width / li.width() * 2600 + parseInt(min.text(), 10), 10);
							max.text(newMax + "px");
							li.attr({
								"data-max": max.text(),
								"data-custom": true
							});
						}
					},
					start: function (e, ui) {
						var orig = parseInt(slider.css("left"), 10);
						if (!$.isNumeric(orig)) {
							orig = 0;
						}
						slider.data("origLeft", orig);
						that._isresizing = true;
						ui.element.closest(".brk-item-added").css({
							cursor: "default"
						});
						$(".brk-hover-label").css("display", "none");
						that._isBrkResizing = true;
					},
					stop: function (e, ui) {
						var orig = parseInt(slider.css("left"), 10);
						if (!$.isNumeric(orig)) {
							orig = 0;
						}
						slider.data("origLeft", orig);
						that._isresizing = false;
						var li = ui.element.closest(".brk-item-added");
						that._changeBreakpoint(li, true);
						// record changes in the code editor and reflect this in the iframe's CSS as well
						li.css({
							cursor: "pointer"
						});
						$(".brk-hover-label").css("display", "");
						that._isBrkResizing = false;
					}
				});
				//}
				// select the newly breakpoint item, if there is no active one
				// https://github.com/IgniteUI/web-designer/issues/26#issuecomment-30335801
				this._changeBreakpoint(item, true);
			},
			_changeLayoutFramework: function (fw) {
				// filter toolbox items that are below the Layout framework dropdown
				var container = $(".layout-frameworks");
				var items = container.find(".ig-layout-flow");
				if (items.length === 0) {
					items = $("<ul></ul>").appendTo(container)
						.addClass("ig-layout ig-layout-flow");
				}
				//need to clear items and move them to their respective category (which is Common)
				//items.children().appendTo($(".common-area").next());
				items.children().appendTo($(".hidden-area").next());
				// filter items based on chosen framework and category="layout"
				$(".toolbox-item").filter("[data-lib=" + fw + "][data-cat=layout]").appendTo(items);
			},
			// the "update" parameter specifies if we'd like to update an existing brk, or add a new one given key/min/max
			// the term "breakpoint" is basically a CSS media query
			_changeBreakpoint: function (item, update) {
				var ddlist = item.closest(".dropdown-menu");
				if (!item.is("li")) {
					item = item.closest("li");
				}
				var dd = $("body").find(".ig-dropdown[data-id=" + ddlist.attr("data-id") + "]");
				if (!update) {
					this._toggleDropDown(dd, ddlist, false);
				}
				$(".layout-breakpoints .ig-dropdown-label").text(item.attr("data-text")).attr("data-key", item.attr("data-key"));
				var key = item.attr("data-key");
				var min = parseInt(item.attr("data-min"), 10);
				var max = parseInt(item.attr("data-max"), 10);
				// need to ensure that there is  <meta name="viewport" content="width=device-width, initial-scale=1.0">
				// construct media query CSS and change design-time width to reflect the size
				var frame = $("#designer-frame");
				var keys = this._bkeys;
				var title = key;
				for (var i = 0; i < keys.length; i++) {
					if (frame.hasClass(keys[i].key)) {
						frame.removeClass(keys[i].key);
					}
					if (keys[i].key === key) {
						title = keys[i].text;
					}
				}
				// set the new class
				frame.addClass(key);
				if (item.attr("data-custom")) {
					if (min) {
						frame.css("min-width", min);
					}
					if (max) {
						frame.css({
							"width": max,
							"max-width": max
						});
					}
				}
				/* examples:
				 * <style type="text/css">
				 *		@media screen and (min-width: 769px) {
				 *			
				 *		}
				 *		@media screen and (max-device-width: 769px) {
				 *	
				 *		}
				 *		@media screen and (min-device-width: 481px) and (max-device-width: 768px) {
				 *
				 *		}
				 * </style>
				*/
				// THERE IS DIFFERENCE BETWEEN min-device-width/max-device-width and min-width/max-width
				// generate media query, if none exists => check in markers first! 
				// retrieve marker for media queries
				if (key !== "default") {
					if (this._mediamkr === null || typeof (this._mediamkr) === "undefined") {
						var mkr;
						if (this._styleBlockMarker) {
							mkr = this._styleBlockMarker;
						} else {
							// initialize CSS
							var mediablock = "\t\t<style>\n\t\t<\/style>\n";
							// locate where to insert the mediablock
							var pos = this.editor.find("</head>");
							this.session.insert({row: pos.end.row, column: 0}, mediablock);
							mkr = new this.RangeClass(pos.end.row, 0, pos.end.row + 4, 0);
							this.addMarker(mkr);
						}
						this._mediamkr = {
							marker: mkr,
							mqueries: {}
						};
					}
					var queries = this._mediamkr.mqueries;
					// locate query in markers.mqueries, if it already exists, if not, add it. 
					// if it exists, don't do anything, just mark that it's the active one (via marker).
					var mquery = "\n\t\t\t/***\t" + title + "\t***/";
					mquery += "\n\t\t\t@media screen ";
					if (min && min >= 0) {
						mquery += "and (min-width: " + min + "px) ";
					}
					if (max && max > 0) {
						mquery += "and (max-width: " + max + "px) ";
					}
					//TODO: We need a very clean way of interacting with the text editor
					// on many occassions need to create anchors, markers, remove them, etc.
					// CREATE a small API layer or util functions to tackle this instead of 
					// duplicating code ! 
					mquery += " {\n\n\t\t\t}";
					var brkMkr;
					if (!queries[key]) {
						// the media query doesn't exist
						// add it to the bottom of the list
						//enter query and record marker
						var mparent = this._mediamkr.marker;
						var pRow, pCol;
						if (this._lastq.length > 0) {
							var tmpq = this._lastq[this._lastq.length - 1];
							pRow = tmpq.end.row;
							pCol = tmpq.end.column + 1;
						} else {
							pRow = mparent.start.row;
							pCol = this.session.getLine(pRow).length;
						}
						this.session.insert({row: pRow, column: pCol}, mquery);
						var mqueryMkr = new this.RangeClass(pRow, pCol, pRow + 4, 4);
						this._lastq.push(mqueryMkr);
						this.addMarker(mqueryMkr);
						this._mediamkr.mqueries[key] = mqueryMkr;
						brkMkr = mqueryMkr;
					} else if (update) {
						var qmkr = queries[key];
						// it exists & we want to update
						// replace the min/max values only because we may have content
						var textRange = this.session.getTextRange(qmkr);
						// update comment label, TODO: consider adding a submarker for that, to be 100% precise
						if (item.attr("data-text") && item.attr("data-text") !== title) {
							textRange = textRange.replace(/\/\*\*\*\t(.+)\t\*\*\*\//, "/***\t" + item.attr("data-text") + "\t***/");
						}
						if (min) {
							// the "min", may not be initially defined
							if (textRange.indexOf("min-width") === -1) {
								textRange = textRange.replace("@media screen", "@media screen and (min-width: " + min + "px)");
							} else {
								textRange = textRange.replace(/min-width: ([0-9]+)px/, "min-width: " + min + "px");
							}
						}
						if (max) {
							if (textRange.indexOf("max-width") === -1) {
								textRange = textRange.replace("{", "and (max-width: " + max + "px) {");
							} else {
								textRange = textRange.replace(/max-width: ([0-9]+)px/, "max-width: " + max + "px");
							}
						}
						var newMkr = new this.RangeClass(qmkr.start.row, qmkr.start.column, qmkr.end.row, qmkr.end.column);
						// now replace the text in the editor
						this.session.replace(qmkr, textRange);
						// associate new markers
						this.session.removeMarker(qmkr.id);
						this.addMarker(newMkr);
						queries[key] = newMkr;
						brkMkr = newMkr;
						if (this._lastq.length > 0) {
							this._lastq[this._lastq.length - 1] = newMkr;
						}
					}
					$(".frame-container").css("background-color", "#787878");
					this._selectedBreakpoint = brkMkr;
					this._selectedBreakpointName = key;
				} else {
					this._selectedBreakpoint = null;
					this._selectedBreakpointName = null;
					$(".frame-container").css("background-color", "white");
					$("#designer-frame").css({
						"min-width": "",
						"max-width": "",
						"width": ""
					});
				}
				//last, we want to hide the selection and hover boxes so that they don't 
				// stay in hanging state
				this._deselectComponent();
			},
			_initToolboxShowHideBtns: function () {
				var minimizebtn = $(".minimize-toolbox"), maximizebtn = $(".maximize-toolbox"), that = this;
				var width = minimizebtn.width();
				var rightArea = $(".right");
				minimizebtn.css({
					top: 0,
					left: rightArea.position().left - width
				}).click(function () {
					// minimize toolbox and show maximize btn
					//var initialLeft = $(this).position().left;
					rightArea.css("padding-bottom", 0).hide("slide", {direction: "right"}, 500, function () {
							maximizebtn.css({
								top: 0,
								left: $("body").width() - width
							}).css("display", "");
						});
					$(this).css("display", "none");
				});
				maximizebtn.click(function () {
					var $this = $(this);
					$this.css("display", "none");
					rightArea.show("slide", {direction: "right"}, 500, function () {
						minimizebtn.css("display", "").css({
							top: 0,
							left: rightArea.position().left - width
						});
						rightArea.css("padding-bottom", that._initialPadding);
					});
				});
				minimizebtn.css({display: ""});
			},
			_showClearBtn: function (sbox) {
				var pos = sbox.offset();
				var button = $(".clear-button");
				button.css({
					display: "block",
					left: pos.left + sbox.innerWidth() - button.outerWidth(),
					top: pos.top + parseInt(sbox.height() / 2) - parseInt(button.innerHeight() / 4)
				});
			},
			_setupClearBtn: function (input, filterFn) {
				var that = this;
				$(".clear-button").on("mousedown", function (event) {
					that._isClearing = true;
				}).on("mouseup", function (event) {
					that._isClearing = false;
					$(".clear-button").css("display", "none");
					input.val("");
					filterFn();
					//input.focus();
				});
			},
			_setupSearch: function (input, filterFn) {
				var that = this;
				input.keyup(function (event) {
					if (typeof (that._searchId) !== "undefined") {
						clearTimeout(that._searchId);
					}
					if (event.keyCode === 27) { //ESC
						// clear input
						input.val("");
						//reset search
						filterFn();
						$(".clear-button").css("display", "none");
					} else {
						if ($(".clear-button").is(":hidden") && input.val() !== "") {
							that._showClearBtn(input);
						} else if (input.val() === "" && $(".clear-button").is(":visible")) {
							$(".clear-button").css("display", "none");
						}
					}
					that._searchId = setTimeout(filterFn, that.options.toolboxSearchDelay);
				}).focus(function (event) {
					// show clear button
					if (input.val() !== "") {
						that._showClearBtn(input);
						// select all text
						setTimeout(function () {
							input.select();
						}, 10);
					}
					$(".search-filterlist").css("display", "none");
				}).blur(function (event) {
					//hide clear button
					if (!that._isClearing) {
						$(".clear-button").css("display", "none");
						$(".search-filterlist").css("display", "none");
					} else {
						event.preventDefault();
						event.stopPropagation();
					}
				});
				this._setupClearBtn(input, filterFn);
			},
			_setupToolboxSearch: function () {
				var input = $(".toolbox-search-input"), that = this, pkgs = this._selectedPkgs;
				var filterFn = function () {
					var val = input.val().toLowerCase();
					//filter items for selected packages only
					var filterStr = "";
					for (var i = 0; i < pkgs.length; i++) {
						if (i > 0) {
							filterStr += ",";
						}
						filterStr += "[data-lib=" + pkgs[i] + "]";
					}
					var items = $(".toolbox-item").filter(filterStr);
					if (val === "" || val === null || typeof (val) === "undefined") {
						items.css("display", "");
						return;
					}
					// filter by val
					items.each(function () {
						var $this = $(this);
						var type = $this.attr("data-type").toLowerCase();
						var lib = $this.attr("data-lib").toLowerCase();
						var displayName = $this.find(".toolbox-item-label").text().toLowerCase();
						// search all three with startsWith & contains
						if (type.startsWith(val) || lib.startsWith(val) || displayName.startsWith(val)
								|| type === val || lib === val || displayName === val
								|| type.indexOf(val) !== -1 || lib.indexOf(val) !== -1 || displayName.indexOf(val) !== -1) {
							//$this.css("display", "none");
							if ($this.css("display") === "none") {
								$this.css("display", "");
							}
						} else if ($this.css("display") !== "none") {
							$this.css("display", "none");
						}
					});
				};
				that._setupSearch(input, filterFn);
				// setup filters by package
				var filterList = $(".toolbox-search-filterlist");
				if (filterList.length === 0) {
					filterList = $("<ul></ul>").appendTo("body").addClass("list-group toolbox-search-filterlist").css("display", "none");
				}
				var packageNames = this.options.packages;
				for (var i = 0; i < packageNames.length; i++) {
					var provider = toolboxMetadata.getPackageInfo(packageNames[i]);
					var item = $("<li></li>").appendTo(filterList).addClass("list-group-item").addClass("toolbox-filter-item");
					that._selectedPkgs.push(packageNames[i]);
					$("<input></input>").attr("type", "checkbox").prependTo(item).attr("checked", "checked").click(function () {
						var $this = $(this), item = $this.closest("li"), pkgs = that._selectedPkgs, pkg;
						input.val("");
						pkg = item.attr("data-package");
						if ($(this).is(":checked")) {
							// add to array
							pkgs.push(pkg);
							// show those items
							$(".toolbox-item").filter("[data-lib=" + pkg + "]").css("display", "");
						} else {
							// remove from array
							for (var j = 0; j < pkgs.length; j++) {
								if (pkgs[j] === pkg) {
									pkgs.splice(j, 1);
									// hide the respective items
									$(".toolbox-item").filter("[data-lib=" + pkg + "]").css("display", "none");
									break;
								}
							}
						}
					});
					$("<a></a>").appendTo(item).text(provider.toolboxTitle).addClass("toolbox-filter-label");
					item.attr("data-package", packageNames[i]);
				}
				$(".toolbox-search-filter").click(function () {
					var $this = $(this);
					var toolboxFilter = $(".toolbox-search");
					if (filterList.is(":visible")) {
						// hide it
						filterList.css("display", "none");
						$this.removeClass("filter-open");
					} else {
						// show filterList
						filterList.css({
							display: "",
							left: toolboxFilter.offset().left,
							top: toolboxFilter.offset().top + toolboxFilter.height(),
							width: toolboxFilter.width()
						});
						$this.addClass("filter-open");
					}
				});
			},
			_setupInspector: function () {
				var inspector = $(".inspector-button"), that = this, body;
				body = $("#designer-frame").contents().find("body");
				inspector.click(function () {
					if (inspector.hasClass("inspector-enabled")) {
						// disable it
						inspector.removeClass("inspector-enabled");
						body.off("mouseenter", that._hoverSelector, that._hoverFn);
						that._unhoverFn();
					} else {
						inspector.addClass("inspector-enabled");
						body.on("mouseenter", that._hoverSelector, that._hoverFn);
					}
				}).addClass("inspector-enabled");
			},
			_setupMenu: function () {
				var Mustache = require("mustache");
				var that = this;
				$(".menu-button").click(function (event) {
					// open dd list
					var offset = $(this).offset();
					var menu = $(".start-menu");
					if (menu.is(":visible")) {
						menu.css("display", "none");
					} else {
						menu.css({
							left: offset.left,
							top: offset.top - menu.outerHeight(),
							display: "inline-block"
						});
					}
				});
				var menuItems = {
					items: [
						{key: "save", text: "Save Screen"},
						{key: "load", text: "Load Screen"}
					]
				};
				var menuTmpl = $("#menuTemplate").html();
				var devicesHtml = Mustache.to_html(menuTmpl, menuItems);
				$(devicesHtml).appendTo("body").css("display", "none");
				$(".start-menu").on("click", "li", function (event) {
					var $this = $(this);
					var item = $this.is("li") ? $this : $this.closest("li");
					if (item.attr("data-key") === "save") {
						if (typeof(Storage) !== "undefined") {
							localStorage.indexHtml = that.editor.getValue();
							console.log("screen successfully saved.");
						} else {
							console.log("No support for Web Storage");
						}
					} else if (item.attr("data-key") === "load") {
						// load from file
						if (typeof(Storage) !== "undefined") {
							that.editor.setValue(localStorage.indexHtml);
							that.currentText = "";
							that._findChanges();
						}
					}
					$(".start-menu").css("display", "none");
					event.preventDefault();
					event.stopPropagation();
				});
			},
			_showElementsTree: function () {
				var container = $(".elements-container"), toolboxContainer = $(".toolbox-container");
				//container.slideToggle({direction: "up"}, 500);
				container.css("display", "block");
				// recalc height of toolbox container
				var totalHeight = parseInt($(".right-area").height(), 10);
				var searchHeight = parseInt($(".toolbox-search").height(), 10);
				var containerHeight = parseInt(container.height(), 10);
				toolboxContainer.animate({height: totalHeight - searchHeight - containerHeight}, 500, function () {
					// need to reinitialize the nano scrollbar when animation ends
					toolboxContainer.nanoScroller();
				});
			},
			_hideElementsTree: function () {
				var toolboxContainer = $(".toolbox-container");
				var fullHeight = parseInt(this._initialToolboxHeight, 10);
				var container = $(".elements-container");
				toolboxContainer.animate({height: fullHeight}, 500, function () {
					container.css("display", "none");
					toolboxContainer.css("height", "100%");
					// need to reinitialize the nano scrollbar when animation ends
					toolboxContainer.nanoScroller();
				});
			},
			_breadcrumbs: function (elem) {
				var list = $("<div></div>").addClass("breadcrumbs-list flat"), $elem = $(elem), listData = [], i, that = this;
				var totalWidth = 0;
				var domNav = $(".dom-nav");
				//var container = $("<div></div>").appendTo(".dom-nav").addClass("breadcrumbs");
				var container = $(".dom-nav .breadcrumbs");
				if (container.length === 0) {
					container = $("<div></div>").appendTo(domNav).addClass("breadcrumbs");
				}
				list.appendTo(container);
				// until we reach the body ... 
				while ($elem.length) {
					var css = ($elem.attr("class") && $elem.attr("class") !== "") ? $elem.attr("class") : "", toBreak = false;
					css = css.replace("ig-component", "").replace("selected-iframe", "").replace("design-surface", "");
					css = css.trim().replace(/ /g, ".");
					if (css !== "") {
						css  = "." + css;
					}
					if ($elem.is('body')) {
						$elem.attr({
							"data-lib": "html",
							"data-type": "container",
							"data-title": "body"
						});
					}
					if ($elem.is("html")) {
						$elem.attr({
							"data-lib": "html",
							"data-type": "container",
							"data-title": "html"
						});
						toBreak = true;
					}
					listData.push({
						text: $elem[0].nodeName + css,
						elem: $elem[0]
					});
					if (toBreak) {
						break;
					}
					$elem = $elem.parent();
				}
				// listData.push({
					// text: "body",
					// elem: $("body").attr({
						// "data-lib": "html",
						// "data-type": "container",
						// "data-title": "body"
					// })[0]
				// });
				// listData.push({
					// text: "html",
					// elem: $("html").attr({
						// "data-lib": "html",
						// "data-type": "container",
						// "data-title": "html"
					// })[0]
				// });
				// reverse listData
				listData.reverse();
				for (i = 0; i < listData.length; i++) {
					//var item = $("<li></li>").appendTo(list);
					var item = $("<a></a>").appendTo(list).attr("href", "#");
					item.data("elemRef", listData[i].elem).text(listData[i].text).attr("title", listData[i].text);
					totalWidth += item.outerWidth();
					/*
					if (i < listData.length - 1) {
						$("<span>></span>").addClass("divider").appendTo(item);
					}
					*/
				}
				var _removearrows = function () {
					if ($(".left-arrow").length > 0) {
						$(".left-arrow").remove();
					}
					if ($(".right-arrow").length > 0) {
						$(".right-arrow").remove();
					}
				};
				var _addScroll = function () {
					var continuousScrollId = null;
					var scrollLeftStep = function () {
						var scrollLeft = container.scrollLeft();
						if (scrollLeft - 20 >= 0) {
							container.scrollLeft(scrollLeft - 20);
						}
					};
					var scrollRightStep = function () {
						var scrollLeft = container.scrollLeft();
						if (scrollLeft + container.width() < list.outerWidth()) {
							container.scrollLeft(scrollLeft + 20);
						}
					};
					var _doscroll = function (event) {
						var target = $(event.target);
						if (!target.hasClass("arrow")) {
							target = target.closest(".arrow");
						}
						target.hasClass("left-arrow") ? scrollLeftStep() : scrollRightStep();
					};
					// remove borde
					list.addClass("scrolling");
					domNav.css("margin-left", 0);
					_removearrows();
					var leftArrow = $("<div><div class='left-arrow-inner'></div></div>").insertBefore(domNav).addClass("arrow left-arrow");
					leftArrow.css("margin-left", 10);
					$("<div><div class='right-arrow-inner'></div></div>").insertAfter(domNav).addClass("arrow right-arrow");
					$(".arrow").on({
						"mousedown": function (event) {
							continuousScrollId = setInterval(function () {
								_doscroll(event);
							}, 50);
						},
						"mouseup": function (event) {
							clearInterval(continuousScrollId);
						}
					});
				};
				// if the breadcrumbs contents overflows the parent of the breadcrumbs, also render scroll arrows
				$(".dom-nav .breadcrumbs a").click(function (event) {
					// mark the item as selected
					var $this = $(this);
					$(".crumb-selected").removeClass("crumb-selected").removeClass("active");
					$this.addClass("crumb-selected").addClass("active");
					// clear existing selection
					that._hoverComponent(null, $this.data("elemRef"));
					that._selectComponent($this.data("elemRef"), false, false);
					event.stopPropagation();
					return false;
				});
				//make sure widths are configured correctly so that we get the scrolling effect (scroll buttons)
				list.width(totalWidth);
				_removearrows();
				// handle window resizing
				$(window).resize(function () {
					if (list.outerWidth() > container.width()) {
						_addScroll();
					} else {
						_removearrows();
						domNav.css("margin-left", 10);
						list.removeClass("scrolling");
					}
				});
				// setup scroll buttons if necessary
				if (totalWidth > container.width()) {
					_addScroll();
				} else {
					domNav.css("margin-left", 10);
				}
			},
			_addDefaultAdorners: function (parent) {
				var $this = this;
				// add remove button
				/*
				$("<div></div>").appendTo(".adorners").addClass("btn remove-btn").text("Remove").on("click", function (e) {
					$this._removeComponent($this.selectedComponent);
					$(".selected-component").css("display", "none");
					e.stopPropagation();
				});
				*/
				var header = $("<div></div>").appendTo(parent).addClass("adorner-header");
				this._adorners = parent; // cache
				// add remove button
				$("<div></div>").appendTo(header).addClass("adorner-hmin glyphicon glyphicon-remove").click(function (event) {
					// minimize adorner panel
					var adorner = $(this).closest(".adorners");
					$this._snap = true;
					adorner.children(".adorner-header").css("display", "none");
					//adorner.children(".adorner-content").css("display", "none");
					adorner.children(".adorner-wrapper").css("display", "none");
					adorner.addClass("adorners-minimized");
					adorner.children(".adorner-min-button").css("display", "");
					// restore adorners position to the currently selected component
					if ($this.selectedComponent) {
						var $selected = $($this.selectedComponent);
						var offset = $selected.offset();
						var frame = $("#designer-frame");
						var pad = parseInt(frame.css("padding-left"), 10);
						var mleft = parseInt(frame.css("margin-left"), 10);
						var owidth = $selected.outerWidth();
						$this._adornersTop = offset.top;
						$this._adornersLeft = offset.left + mleft + owidth + pad;
						adorner.css({
							left: $this._adornersLeft,
							top: $this._adornersTop
						});
					}
				});
				var left = $("<div></div>").prependTo(header).addClass("adorner-hleft");
				//var back = $('<div class="adorner-hleft-custom"><span class="glyphicon glyphicon-arrow-left adorner-back-button"></span></div>').appendTo(header).hide();
				//back.children().click($.proxy(this.adornerMoveRight, this));
				var adornerMoveFn = function (event) {
					if (this._adornerMove) {
						// account for margins
						var mleft = parseInt($("#designer-frame").css("margin-left"), 10);
						// change position of the adorner
						var extraOffsets = this._adorners.data("extraOffset");
						if (typeof (extraOffsets) === "undefined") {
							extraOffsets = {"x": 0, "y": 0};
						}
						this._adorners.css({
							left: event.pageX + mleft - extraOffsets.x,
							top: event.pageY - extraOffsets.y
						});
					}
				};
				// handle moving the adorner panel to a new location
				//$("<div></div>").appendTo(left).addClass("adorner-hmove glyphicon glyphicon-th");
				//$("<span></span>").appendTo(left).addClass("adorner-hlabel");
				var wrapper = $('<div class="adorner-wrapper"></div>').appendTo(parent);
				$("<div></div>").appendTo(wrapper).addClass("adorner-content");
				$("<span></span>").appendTo(parent)
					.addClass("adorner-min-button glyphicon glyphicon-fullscreen")
					.css("display", "none").click(function (event) {
						// restore adorners
						//var adorner = $(this).closest(".adorners");
						$this._adorners.children(".adorner-header").css("display", "");
						//$this._adorners.children(".adorner-content").css("display", "");
						$this._adorners.children(".adorner-wrapper").css("display", "");
						$this._adorners.removeClass("adorners-minimized");
						$this._adorners.children(".adorner-min-button").css("display", "none");
						$this._ensureAdornersVisible(true);
					});
				header.on("mousedown", function (e) {
					if (!$(e.target).hasClass("adorner-hmin") && !$(e.target).is('a')) {
						var pos = $this._adorners.offset();
						$this._snap = false;
						$this._adorners.data("extraOffset", {"x": e.pageX - pos.left, "y": e.pageY - pos.top});
						if (!$this._adorners.hasClass("adorners-minimized")) {
							$this._adornerMove = true;
							$this._adorners.addClass("adorners-move");
							var func = $.proxy(adornerMoveFn, $this);
							$("#designer-frame").contents().find("body")
								.on("mousemove", func)
								.on("mouseup", function (event) {
									if ($this._adornerMove) {
										$this._adornerMove = false;
										// remove mousemove handler
										$("#designer-frame").contents().find("body").off("mousemove", func);
										$this._adorners.removeClass("adorners-move");
										// store vals
										$this._adornersLeft = $this._adorners.css("left");
										$this._adornersTop = $this._adorners.css("top");
									}
								});
						}
					}
				});
				// add search box and placeholders for Events and Properties
				/*
				<div class="input-group prop-search">
					<input type="text" class="form-control prop-search-input" placeholder="Search ..." />
					<span class="input-group-addon glyphicon glyphicon-filter prop-search-filter"></span>
				</div>
				*/
				//https://github.com/IgniteUI/web-designer/issues/24#issuecomment-31853210
				$("<div class=\"input-group prop-search\"><input type=\"text\"" +
					"class=\"form-control prop-search-input\" placeholder=\"Search ...\"/>" +
				//	"<span class=\"input-group-addon glyphicon glyphicon-filter prop-search-filter\"></span>" +
					"</div>").appendTo(".adorner-content");
				// add containers for events and props 
				var events = $("<div></div>").appendTo(".adorner-content").addClass("adorner-events-list");
				var props = $("<div></div>").appendTo(".adorner-content").addClass("adorner-props-list");
				$("<div>EVENTS</div>").prependTo(events).addClass("adorner-label adorner-events-label");
				$("<div>PROPERTIES/OPTIONS</div>").prependTo(props).addClass("adorner-label adorner-props-label");
				var input = $(".prop-search-input");
				var filterFn = function () {
					// filter properties and events
					var val = input.val().toLowerCase();
					var exprs = [
						{fieldName: "propName", expr: val, cond: "contains", logic: "OR"},
						{fieldName: "propValue", expr: val, cond: "contains", logic: "OR"}
					];
					//if ($(".adorner-events-filter").is(":checked")) {
						// filter events
					$("#eventGrid").igGridFiltering("filter", exprs, true);
					//} else {
					//	$("#eventGrid").igGridFiltering("filter", [], true);
					//}
					//if ($(".adorner-props-filter").is(":checked")) {
						// filter properties
					$("#propertyGrid").igGridFiltering("filter", exprs, true);
					//} else {
					//	$("#propertyGrid").igGridFiltering("filter", [], true);
					//}
				};
				$this._setupSearch(input, filterFn);
				// setup filters by package
				/*
				var filterList = $(".prop-search-filterlist");
				if (filterList.length === 0) {
					filterList = $("<ul></ul>").appendTo("body").addClass("list-group prop-search-filterlist search-filterlist").css("display", "none");
				}
				var eventsItem = $("<li></li>").appendTo(filterList).addClass("list-group-item").addClass("prop-filter-item");
				$("<input></input>").attr("type", "checkbox")
					.prependTo(eventsItem)
					.addClass("adorner-events-filter")
					.attr("checked", "checked").click(function () {
					input.data("eventsChecked", $(this).attr("checked"));
				});
				$("<a></a>").appendTo(eventsItem).text("Events").addClass("prop-filter-label");
				var propsItem = $("<li></li>").appendTo(filterList).addClass("list-group-item").addClass("prop-filter-item");
				$("<input></input>").attr("type", "checkbox")
					.prependTo(propsItem)
					.addClass("adorner-props-filter")
					.attr("checked", "checked").click(function () {
					input.data("propsChecked", $(this).attr("checked"));
				});
				$("<a></a>").appendTo(propsItem).text("Properties").addClass("prop-filter-label");
				$(".prop-search-filter").click(function () {
					var $this = $(this);
					var container = $(".prop-search");
					if (filterList.is(":visible")) {
						// hide it
						filterList.css("display", "none");
						$this.removeClass("filter-open");
					} else {
						// show filterList
						filterList.css({
							display: "",
							left: container.offset().left + 100,
							top: container.offset().top + container.height(),
							width: container.width() - 100
						});
						$this.addClass("filter-open");
					}
				});
				*/
				$("<div id=\"tooltip_container\"></div>")
					.appendTo("body")
					.addClass("prop-tooltip").css("display", "none")
					.append("<div class=\"tooltip-content\"></div>")
					.mouseenter(function(){
						$(".prop-tooltip").css("display", "block");
					}).mouseleave(function(){
						$(".prop-tooltip").css("display", "none");
					});
			},
			_updateSurface: function () {
				// update only if there are registered components that require js initialization
				var update = false, isSplit;
				// either split mode is used, or somehow both the designer surface, *and* the code editor are visible at the same time
				isSplit = this.splitMode || ($(".designer").is(":visible") && $("#editor-container").is(":visible"));
				if (this.componentIds && this.componentIds.length > 0) {
					for (var i = 0; i < this.componentIds.length; i++) {
						// we can safely assume that if a registered component (i.e. one which is described by metadata and is loaded in the toolbox)
						// has codeMarkers associated with it, then it requires some form of javascript initialization
						if (this.componentIds[i].codeMarker) {
							update = true;
						}
					}
				}
				if (this.currentText !== this.editor.getValue() && update && isSplit) {
					// reload
					console.log("Updating designer surface. Called from setInterval()");
					this._findChanges();
				} else if (this.parsedText !== this.editor.getValue()) {
					// only the code view is visible, so we want to re-parse
					this._parseCode(this.editor.getValue());
					this._linkTrees(this.rootNode, $("#designer-frame").contents().children(0));
					this._rebuildDesignerNavTree();
					this.parsedText = this.editor.getValue();
				}
			},
			_findComponent: function (element, remove) {
				var id = element.attr("id");
				var lib = element.attr("data-lib");
				for (var i = this.componentIds.length - 1; i >= 0; i--) {
					if (this.componentIds[i].id === id && this.componentIds[i].lib === lib) {
						if (remove) {
							return this.componentIds.splice(i, 1)[0];
						} else {
							return this.componentIds[i];
						}
					}
				}
				return null;
			},
			_removeComponent: function (element) {
				var $element = $(element), comp = $element.hasClass("ig-component"), compObj;
				//1. remove the component source code from the editor
				if (comp) {
					// unregister component ID
					compObj = this._findComponent($element, true);
					// remove code
					if (compObj) {
						if (compObj.codeMarker) {
							this.session.remove(compObj.codeMarker.range);
							// also remove marker
							compObj.codeMarker.range.end.detach();
							compObj.codeMarker.range.start.detach();
							this.session.removeMarker(compObj.codeMarker.id);
						}
						if (compObj.htmlMarker) {
							this.session.remove(compObj.htmlMarker.range);
							// also remove marker
							compObj.htmlMarker.range.end.detach();
							compObj.htmlMarker.range.start.detach();
							this.session.removeMarker(compObj.htmlMarker.id);
						}
						if (compObj.headMarker) {
							this.session.remove(compObj.headMarker);
							// also remove marker
							compObj.headMarker.end.detach();
							compObj.headMarker.start.detach();
							this.session.removeMarker(compObj.headMarker.id);
							// remove header deps
							$("head").find("[data-id=" + element.id + "]").remove();
						}
					} else {
						console.log("component not found/registered!");
					}
				} else {
					// we don't store all element markers (which aren't designer-recognizable components) in the session
					// so it's enough to detach and to remove it
					this.session.remove($element.data("marker"));
					$element.data("marker").start.detach();
					$element.data("marker").end.detach();

				}
				if ($element.hasClass("nonvisual-item") && $(".nonvisual-list").children().length === 1) {
					//that's the last item, so hide the nonvisual area
					this._hideNonVisualArea();
				}
 				//2. refresh the property explorer
				//3. remove the component from the designer DOM
				$element.remove();
				// hide the selected/hovered boxes
				this._deselectComponent();
				// finally, clear the property grid
				$(".property_area").remove();
				if ($("#propertyGrid").data("igGrid")) {
					$("#propertyGrid").igGrid("destroy");
				}
				//cleanup breadcrumbs
				$(".dom-nav").empty();
			},
			// ensures adorners are FULLY visible and readjusts their position
			// if they are cut from the screen (any direction)
			// in some rare cases, having them cut (partially hidden) will be inevitable
			// also account for padding & margin
			_ensureAdornersVisible: function (setNewPos) {
				var height = this._adorners.height();
				var width = this._adorners.width();
				// check bounds
				var comp = $(this.selectedComponent);
				var pos = comp.offset(); // component's left & top
				var container = $("#dfcontainer");
				var containerHeight = container.height();
				var containerWidth = container.width();
				if (height + this._adornersTop > containerHeight) {
					this._adornersTop -= height + this._adornersTop - containerHeight;
				}
				if (width + this._adornersLeft > containerWidth) {
					// try to show it to the left
					if (pos.left - width < 0) {
						// can't show it to the left, so we'll just adjust the left
						// and still show it to the right
						this._adornersLeft -= width + this._adornersLeft - containerWidth;
					} else {
						// show it to the left
						this._adornersLeft = pos.left - width;
					}
				}
				if (setNewPos) {
					this._adorners.css({
						top: this._adornersTop,
						left: this._adornersLeft
					});
				}
			},
			_restoreAdorners: function () {
				this._ensureAdornersVisible();
				this._adorners.css({
					left: this._adornersLeft,
					top: this._adornersTop
				});
				$(".tag-placeholder").css({
					left: this._tagHolderLeft,
					top: this._tagHolderTop
				});
				this._adornersHidden = false;
			},
			_hideAdorners: function () {
				var tagHolder = $(".tag-placeholder");
				this._adornersLeft = this._adorners.css("left");
				this._adornersTop = this._adorners.css("top");
				this._tagHolderLeft = tagHolder.css("left");
				this._tagHolderTop = tagHolder.css("top");
				this._adorners.css({
					left: -10000,
					top: -10000
				});
				tagHolder.css({
					left: -10000,
					top: -10000
				});
				this._adornersHidden = true;
				$(".search-filterlist").css("display", "none");
			},
			_deselectComponent: function () {
				clearTimeout(this._selectionTimeout);
				$(".selected-component,.hovered-component,.tag-placeholder,.adorners,.prop-tooltip").css({
					left: -10000,
					top: -10000
				});
				if (this.selectedComponent) {
					$(this.selectedComponent).removeClass("selected-iframe");
					this.selectedComponent = null;
				}
				$(".search-filterlist").css("display", "none");
			},
			_loadHandler: function () {
				var frameHead, body, that = this, fcontents, i;
				fcontents = $("#designer-frame").contents();
				frameHead = fcontents.find("head");
				body = fcontents.find("body");
				fcontents.find("html").css("height", "100%");
				if (frameHead.length === 0) {
					frameHead = $("<head></head>").appendTo(fcontents);
				}
				body.css({
					width: "100%",
					height: "100%",
					padding: "0px",
					margin: "0px"
				});
				if (this.firstload) {
					$("<link rel=\"stylesheet\" type=\"text/css\" id=\"idecss\" href=\"css/iframe-ide.css\">").appendTo(frameHead);
					// add dependencies in the HEAD section (cached list)
					for (i = 0; i < this._cssDeps.length; i++) {
						frameHead.append($(this._cssDeps[i]).attr("async", ""));
					}
					//for (i = 0; i < this._jsDeps.length; i++) {
					for (i = 0; i < this._jsDepsSrc.length; i++) {
						var lazyLoad = false, srcUrl = "", scriptMeta = null;
						if (typeof (this._jsDepsSrc[i]) === "object") {
							scriptMeta = this._jsDepsSrc[i];
							if (scriptMeta.lazyLoad) {
								lazyLoad = true;
							} else {
								srcUrl = scriptMeta.url;
							}
						} else {
							srcUrl = this._jsDepsSrc[i];
						}
						if (!lazyLoad) {
							//if ((typeof(jQuery) === "undefined" && this._jsDeps[i].indexOf("jquery" !== -1))
							//		|| this._jsDeps[i].indexOf("jquery") === -1) {
								// this shouldn't be done with jQuery because it would eval the script in the context of the IDE window
								// so it would be loaded twice
							this._loadScript(srcUrl, scriptMeta && scriptMeta.id ? scriptMeta : null);
							//}
						}
					}
				}
				fcontents.ready(function () {
					/*
						body.find(".ig-component").each(function () {
							// for each ig-component, apply its design-time width and height from the component info
							var $this = $(this);
							var lib = $this.attr("data-lib");
							var type = $this.attr("data-type");
							var comps = toolboxMetadata.getPackageInfo(lib).components;
							$this.css({
								width: comps[type].width,
								height: comps[type].height
							})
						});
					*/
					body.keyup(function (event) {
						//if (event.keyCode === 46 || event.keyCode === 8) { //DEL (value of 8 on Mac)
						if (event.keyCode === 46) {
							// retrieve component from event
							that._removeComponent(that.selectedComponent);
						}
					});
					var selector = ".ig-component,div,span,p,table,tr,td,video,audio,br,span,h1,h2,h3,h4,h5,h6,ul,li,ol,a,img";
					var editableSelector = "td,span,div,li,h1,h2,h3,h4,h5,h6,a,p,tr,table,ul,ol";
					// mouseover all elements which are dragged & dropped from the toolbox
					that._hoverSelector = selector;
					that._hoverFn = function (event) {
						// it can happen that there is an ig-component parent ? how do we recognize that
						// for example a grid, i hover a TD (cell), how do i hover the whole grid ? 
						var el = this;
						el = that._resolveElement(el);
						that._hoverComponent(event, el);
					};
					that._unhoverFn = function (event) {
						var boxes = $(".hovered-component,.tag-placeholder");
						boxes.css({
							top: -10000,
							left: -10000
						});
						that.hoveredComponent = null;
					};
					body.on("mouseenter", selector, that._hoverFn);
					body.on("mouseleave", selector, that._unhoverFn);
					// drag and drop support
					var mouseMoveFn = function (event) {
						that._inFrame = true;
						if (that._isMouseDown) {
							// put some threshold so that the dragged clone doesn't show up immediatelly 
							if ((that._oldMouseX && Math.abs(that._oldMouseX - event.pageX) < 5) && (that._oldMouseY && Math.abs(that._oldMouseY - event.pageY) < 5)) {
								return;
							}
							// shouldn't be able to drag and drop elements which aren't acceptable
							// i.e. need to resolve element
							that._isDragging = true;
							// create a clone of the element and attach it to the mouse
							// we also need to determine where we can drop the element, for that we can reuse
							// the logic in the "drop" handler
							// we need to refactor the "drop" handler functionality, because 
							// we won't need to use all of it. for example we aren't going to create new markers (because they already exist)
							// and we aren't going to add components to the componentsId array
							// but we do need the code to determine the exact droppable from a list of droppables (like bootstrap row)
							//question: on mousemove, can we "temporarily" drop the element with a delay? and then resume dragging? without 
							// actually "committing" the drop - similar to jetstrap
							//if (typeof (that._yoffset) === "undefined") {
							//	that._yoffset = $(".footer").outerHeight();
							//}
							// make sure adorners are hidden
							if (that._adornersHidden !== true) {
								that._hideAdorners();
							}
							//account for margin-left
							var mleft = parseInt($("#designer-frame").css("margin-left"), 10);
							if (that._dragClone === null || typeof (that._dragClone) === "undefined" || (that._dragClone && that._dragClone.length === 0)) {
								// create dragging clone
								var el = this;
								el = that._resolveElement(el);
								that._draggedElement = el;
								that._dragClone = $("<div></div>").addClass("drag-clone").appendTo("body").append($(el).clone()).css({
									position: "absolute",
									left: event.pageX + mleft,
									top: event.pageY
								//	top: event.pageY - that._yoffset
								});
							} else {
								that._dragClone.css({
									left: event.pageX + mleft,
									top: event.pageY
									//top: event.pageY - that._yoffset
								});
							}
						}
					};
					that._initddreoder();
					// we must also be able to click on hovered components : ) 
					// if we try to target the same elements as we do for hovering, it won't work
					//because the element we are trying to select is "covered" by the hover container, which has higher z-index
					// unless we use pointer-events: none in the CSS
					body.on("click", function (event) {
						if ($(event.target).not(selector))  {
							that._deselectComponent();
						}
						$(".context-menu").css("display", "none");
						// if there are dropdowns open, close them
						that._closeDropDowns();
					});
					body.on("mousedown", selector, function (e) {
						that._selectElemResolved = that._resolveElement(this);
						if (that._selectElemResolved !== that.selectedComponent) {
							e.preventDefault();
							e.stopPropagation();
						}
					});
					body.on("click", selector, function (event) {
					//$("#designer").on("click", ".hovered-component", function (event) {
						// start timeout so that we are also handling double clicks
						that._selectElem = this;
						that._selectEvt = event;
						event.stopPropagation();
						that._selectTimeoutID = setTimeout($.proxy(that._selectDelayed, that), 100);
					});
					body.on("dblclick", editableSelector, function (event) {
						var el = this;
						// cancel the selection when there is a double clicking
						clearTimeout(that._selectTimeoutID);
						el = that._resolveElement(el);
						// we'll probably need an extra check specifying whether the ig-component can be actually contenteditable or not
						// just checking for "needs js initialization" could suffice
						// there is no point to set contenteditable on elements that are initialized by JavaScript
						if (el && !$(el).hasClass("ig-component")) {
							that._trigger(that.events.componentDblClick, event, {ide: that, element: $(this)});
						}
					});
					body.on("blur keypress paste change cut", "[contenteditable]", function (event) {
						// check if text/markup is different and update the code view
						clearTimeout(that._editTimeoutID);
						that._contenteditable = $(event.target);
						that._editTimeoutID = setTimeout($.proxy(that._onEditContent, that), that.options.editContentDelay);
					});
					that.element.on("igstudiocomponentdblclick", function (e, args) {
						if (that._contenteditable) {
							that._contenteditable.removeAttr("contenteditable");
							// remove change handler
							that._contenteditable.off("blur");
						}
						that._contenteditable = args.element;
						args.element.attr("contenteditable", true);
						// stop the prop, otherwise we will be fired for parents
						// we want to hide any selections
						$(".selected-component,.hovered-component").css({
							left: -10000,
							top: -10000
						});
						args.element.focus();
						e.stopPropagation();
					});
					// refresh "tree" && associate with DOM
					// link trees
					// on first load it's empty
					if (that.rootNode.children) {
						that._linkTrees(that.rootNode, fcontents.children(0));
						that._rebuildDesignerNavTree();
					}
					// remove loading message
					if (!that.firstload) {
						$(".loading-designer").css("display", "none");
					} else {
						$(".loading-designer,.loading-body").css("display", "none");
						$(".loading-designer-inner").text("Refreshing Designer");
						$(".loading-progress").css("display", "none");
						$(".loading-designer").css("padding-top", 50);
						that.firstload = false;
					}
				});
			},
			_initddreoder: function () {
				//var targets = fcontents.find("[data-hasdroppables=true]").addBack();
				var selector = ".ig-component,div,span,p,table,tr,td,video,audio,br,span,h1,h2,h3,h4,h5,h6,ul,li,ol,a,img";
				var fcontents = $("#designer-frame").contents();
				var targets = fcontents.find(".ig-component").addBack();
				var that = this;
				// drag and drop support
				var mouseMoveFn = function (event) {
					that._inFrame = true;
					if (that._isMouseDown) {
						// put some threshold so that the dragged clone doesn't show up immediatelly 
						if ((that._oldMouseX && Math.abs(that._oldMouseX - event.pageX) < 5) && (that._oldMouseY && Math.abs(that._oldMouseY - event.pageY) < 5)) {
							return;
						}
						// shouldn't be able to drag and drop elements which aren't acceptable
						// i.e. need to resolve element
						that._isDragging = true;
						// create a clone of the element and attach it to the mouse
						// we also need to determine where we can drop the element, for that we can reuse
						// the logic in the "drop" handler
						// we need to refactor the "drop" handler functionality, because 
						// we won't need to use all of it. for example we aren't going to create new markers (because they already exist)
						// and we aren't going to add components to the componentsId array
						// but we do need the code to determine the exact droppable from a list of droppables (like bootstrap row)
						//question: on mousemove, can we "temporarily" drop the element with a delay? and then resume dragging? without 
						// actually "committing" the drop - similar to jetstrap
						//if (typeof (that._yoffset) === "undefined") {
						//	that._yoffset = $(".footer").outerHeight();
						//}
						// make sure adorners are hidden
						if (that._adornersHidden !== true) {
							that._hideAdorners();
						}
						//account for margin-left
						var mleft = parseInt($("#designer-frame").css("margin-left"), 10);
						if (that._dragClone === null || typeof (that._dragClone) === "undefined" || (that._dragClone && that._dragClone.length === 0)) {
							// create dragging clone
							var el = this;
							el = that._resolveElement(el);
							that._draggedElement = el;
							that._dragClone = $("<div></div>").addClass("drag-clone").appendTo("body").append($(el).clone()).css({
								position: "absolute",
								left: event.pageX + mleft,
								top: event.pageY
							//	top: event.pageY - that._yoffset
							});
						} else {
							that._dragClone.css({
								left: event.pageX + mleft,
								top: event.pageY
								//top: event.pageY - that._yoffset
							});
						}
					}
				};
				targets.off("mousemove");
				targets.on("mousemove", selector + ",body", mouseMoveFn);
				var mouseDownFn = function (event) {
					// right click shouldn't do anything
					if (event.which === 3) {
						return;
					}
					that._oldMouseX = event.pageX;
					that._oldMouseY = event.pageY;
					that._isMouseDown = true;
					//TODO:
					$(".context-menu").css("display", "none");
					$(".contextmenu").css("display", "none");
					// fire timer to detect if we're out
					var fn = function () {
						if (!this._inFrame) {
							this._isMouseDown = false;
							this._clearDragFn();
						} else {
							clearTimeout(this._dragReorderID);
							this._dragReorderID = setTimeout($.proxy(fn, this), 300);
						}
					};
					that._dragReorderID = setTimeout($.proxy(fn, that), 300);
				};
				targets.off("mousedown");
				targets.on("mousedown", selector, mouseDownFn);
				var mouseUpFn = function (event) {
					clearTimeout(that._dragReorderID);
					if (that._inFrame) {
						that._endDragFn(this);
					} else {
						that._clearDragFn();
					}
				};
				targets.off("mouseup");
				targets.on("mouseup", selector + ",body", mouseUpFn);
				targets.on("contextmenu", function (event) {
					// also check if mouse is over the selected component
					//var sbox = $(".selected-component");
					//var pos = sbox.offset(), h = sbox.height(), w = sbox.width();
					var mousex = event.pageX, mousey = event.pageY;
					//var inside = pos.left < mousex  && mousex < pos.left + w && pos.top < mousey && mousey < pos.top + h;
					var el = that._resolveElement(event.target), $el = $(el);
					if (!$el.hasClass("ig-component")) {
						$el = $el.closest(".ig-component");
						el = $el[0];
					}
					if ($el.length === 0 || !$el.hasClass("ig-component")) {
						return;
					}
					if (el !== that.selectedComponent) {
						// hover it
						that._hoverComponent(event, el);
					}
					that._contextComponent = el;
					// get component from point
					//if (that.selectedComponent && inside) {
						// show context menu
					$(".context-menu").css({
						display: "block",
						left: mousex + 2,
						top: mousey + 2
					});
					event.preventDefault();
					//}
				});
				var mouseOutFn = function (event) {
					//TODO: if we are scrolling and dragging at the same time we don't want to cancel
					that._inFrame = false;
				};
				targets.off("mouseleave");
				targets.on("mouseleave", mouseOutFn);
			},
			_onEditContent: function () {
				// sync the contents of a designer HTML fragment with the corresponding code editor fragment
				// check if the edited element's HTML is the same as the one in the code editor
				var editelem = this._contenteditable;
				if (editelem !== null && typeof (editelem) !== "undefined") {
					// handle as a special case
					if (editelem.is("input")) {
					//if (editelem.is(":input")) {
					// A.T. note that there is a huge difference between
					// :input and input. The first returns true for all form elements
						var m = editelem.data("marker");
						var inputVal = " value=\"" + editelem.val() + "\"";
						var range = this.editor.find(new RegExp(" value=\"(.*)?\""), {start: m});
						if (range === null || typeof (range) === "undefined") {
							// <input + SPACE => 7 chars
							this.session.insert({row: m.start.row, column: m.start.column + 6}, inputVal);
						} else {
							// now replace the range with the new stuff
							this.session.replace(range, inputVal);
						}
						this._refreshAll();
					} else {
						// we have two types of markers - "marker" (including tags) and "contentMarker" (without the tags)
						// DOM design time tags with attrs for the edited content may differ significantly from code editor tags
						var marker = editelem.data("contentMarker");
						var code = this.session.getTextRange(marker);
						if (code !== editelem.html()) {
							this.session.replace(marker, editelem.html());
							//if dynamic markers don't readjust, we need to call _refreshAll
							//so that they are re-calculated manually and trees are rebuilt
							this._refreshAll();
						}
					}
					// ensure we change the size of the selected item if width/height of the edited element changes
					//this._syncSboxSize();
				}
				// what about scenarios where we're editing input vals? (i.e. actual attributes)
				// unary nodes ?
			},
			_refreshAll: function () {
				this.currentText = this.editor.getValue();
				this._parseCode(this.currentText);
				if (this.rootNode.children) {
					this._linkTrees(this.rootNode, $("#designer-frame").contents().children(0));
					this._rebuildDesignerNavTree();
				}
			},
			_selectDelayed: function () {
				var el = this._selectElemResolved ? this._selectElemResolved : this._resolveElement(this._selectElem),
					sel = this.editor.getSelection(), $el = $(el);
				this._selectElemResolved = null;
				this._selectComponent(el);
				// also mark in the editor
				if ($el.data("marker")) {
					sel.setSelectionRange($el.data("marker"));
				}
			},
			_startFrameFix: function (event, ui) {
				var frame, div;
				if ($("#temp_div").length > 0) {
					return;
				}
				frame = $("#designer-frame");
				div = $("<div></div>");
				$("#designer").append(div);
				div.attr("id", "temp_div");
				div.css({
					position: "absolute",
					top: 0,
					left: 0
				});
				div.height("100%");
				div.width("100%");
			},
			_stopFrameFix: function (event, ui) {
				$("#temp_div").remove();
			},
			_findChanges: function () {
				// updates the UI with anything that has been updated in the editor. so if i enable a feature or change some markup, it is propagated in the UI
				// note that changes may not only be related to widgets, but can be anywhere in the HTML, javascript, etc.
				// so the end user may:
				// 1. add / change / delete markup
				// 2. add a script block
				// 3. remove a script block 
				// 4. change styling ? 
				// 5. so if the contents are dirty, it's best to reevaluate everything (smarter way to do it?)
				var val, doc, r;
				if (this.currentText !== this.editor.getValue() || this.wasDirty) {
					// K.D. February 17th, 2014 Bug #163597 Deselecting the component because it changes from the code view
					// and the property explorer is no longer valid for it.
					this._deselectComponent();
					// show loading message
					$(".loading-designer").css("display", "block");
					console.log("document <-> code editor dirty, reloading iframe.");
					var i, htmlRange, code;
					// different granularity:
					//1. compare HEAD contents (resource links)
					//2. compare HEAD contents (scripts and Style blocks)
					//3. compare BODY contents
					//var currentBodyText = body.html().trim();
					//var codeBodyText = editor.getValue().match(/(.*<\s*body[^>]*>)|(<\s*\/\s*body\s*\>.+)/gm)[0].trim();
					// just dump the contents into the new DOM
					val = this.editor.getValue();
					// create a new session, transfer the code there, in order to add the ig-component class (but we don't want it to appear directly in the code editor!)
					// it only needs to be attached to the running DOM
					var tempSession = new this.session.constructor(val);
					for (i = 0; i < this.componentIds.length; i++) {
						if (!this.componentIds[i].htmlMarker) {
							continue;
						}
						htmlRange = this.componentIds[i].htmlMarker.range;
						r = new this.RangeClass(htmlRange.start.row, 0, htmlRange.start.row, this.maxColLength);
						code = tempSession.getTextRange(r);
						//TODO: since we are using this functionality in a lot of places
						// we should refactor (finding stuff in lines and replacing them in the code editor)
						if (code.indexOf("class=") !== -1 && code.indexOf("ig-component") === -1) {
							code = code.replace(/class="(.*?)"/, "class=\"$1 ig-component\"");
						} else {
							code = code.replace(/<([\w-]+)/, "<$1 class=\"ig-component\"");
						}
						code = code.replace(/<([\w-]+)/, "<$1 data-lib=" + this.componentIds[i].lib + " data-type=" + this.componentIds[i].type + " data-title=" + this.componentIds[i].title + " ");
						tempSession.replace(r, code);
					}
					this.currentText = val;
					this._parseCode(val);
					// now copy the "designer-styles" and "gridlines"
					//strip jquery and jquery UI entries
					doc = $("#designer-frame").contents()[0];
					doc.open("text/html", "replace");
					//write the frame-ide.css here, so that it loads before all scripts!
					var framecss = "<link rel=\"stylesheet\" type=\"text/css\" id=\"idecss\" href=\"css/iframe-ide.css\">\n";
					var src = tempSession.getValue();
					src = src.replace("<head>\n", "<head>\n" + framecss);
					doc.write(src);
					doc.close();
				}
			},
			_parseCode: function (val) {
				// libs like slowparse aren't very convenient because we don't need yet another DOM to be built
				// also if there is javascript that's going to be executed on some of the markup,
				// slowparse won't build markers & dom for it. 
				// we need a way to associate the parsed contents with the actual rendered DOM and the 
				// javascript executed on it 
				// now we need to parse the document, and record all markers ; we need to recognize
				// any "known" markers
				var level = 0, maxLevel = 0, id = 0, currentNode, that = this, parser;
				that.extraChars = 0;
				parser = require("htmlparser");
				try {
					parser(val, {
						start: function (tag, attrs, unary, offset, contentOffset) {
							//that.unary = unary;
							// add a node at the current level, record this as the new current parent for any new nodes
							// if there is no existing parent, then that's going to be the root
							// unary will be true for "empty" elements which don't have an ending tag, like input, link, etc.
							if (typeof (currentNode) === "undefined") {
								that.rootNode = {
									tagName: tag,
									startOffset: offset,
									startContentOffset: contentOffset,
									children: [],
									id: id++,
									parent: null
								};
								currentNode = that.rootNode;
							} else {
								//start a new level, attach it to the parent 
								var node = {
									tagName: tag,
									attrs: attrs,
									startOffset: offset,
									startContentOffset: contentOffset,
									children: [],
									id: id++,
									parent: currentNode
								};
								// if previous was unary, then write the end tag, and don't change the level (depth)
								if (that.unary && currentNode.children.length > 0) {
									currentNode.children[currentNode.children.length - 1].endOffset = offset - that.extraChars;
									that.extraChars = 0;
								}
								currentNode.children.push(node);
								if (!unary) {
									currentNode = node;
									level++;
								}
								that.unary = unary;
							}
						},
						end: function (tag, offset, contentOffset) {
							// end the current level, go one level up to the previous parent
							// also record end offset
							if (that.unary && currentNode.children.length > 0
								&& typeof (currentNode.children[currentNode.children.length - 1].endOffset) === "undefined") {
								//TODO: at the same time, this doesn't account for extra new line /tab characters
								// make sure this is aligned with what's returned by the code provider
								// issues when deleting components
								currentNode.children[currentNode.children.length - 1].endOffset = contentOffset - that.extraChars;
								// endContentOffset not applicable for an unary node?
								that.extraChars = 0;
							}
							if (level > maxLevel) {
								maxLevel = level;
							}
							level--;
							currentNode.endOffset = offset;
							currentNode.endContentOffset = contentOffset;
							currentNode = currentNode.parent;
						},
						chars: function (text) {
							that.extraChars = text.length;
						},
						comment: function (text) {

						}
					});
				} catch (e) {
					console.log(e);
				}
				that.maxLevel = maxLevel;
			},
			_initRangeClass: function () {
				if (this.RangeClass) {
					return;
				}
				this.RangeClass = this.editor.find("<html").constructor;
			},
			_rebuildDesignerNavTree: function () {
				var tree = $(".dom-tree"), i, that = this, maxLevel = this.maxLevel;
				if (tree.length === 0) {
					tree = $("<div></div>").appendTo(".elements-container").addClass("dom-tree");
				}
				// we need to do this manually because the tree doesn't support binding to unlimited levels (like self-ref trees)
				var bindingsObj = {
					childDataProperty: "children",
					textKey: "tagNameDetail",
					//primaryKey: "id",
					//valueKey: "tagName"
					valueKey: "id"
				}; // root
				if (tree.data("igTree")) {
					tree.igTree("destroy");
				}
				tree.igTree({
					dataSource: [that.rootNode],
					bindings: bindingsObj,
					dragAndDrop: true,
					dragAndDropSettings: {
						customDropValidation: function () {
							// Restricting the drop location to the body element and below.
							if (!$(this).is('li[data-path=0_1]') && $(this).closest('li[data-role=node]').attr('data-path').indexOf('0_1') === 0) {
								return true;
							}
							return false;
						}
					},
					height: 300,
					selectionChanged: function (event, args) {
						// change selection in the ACE code editor
						var sel = that.editor.getSelection();
						//nodeDataFor doesn't work
						sel.setSelectionRange(args.selectedNodes[0].data.marker);
						// now if we are in the code view, focus the editor
						// otherwise select the respective element on the design surface
						if (!that.isDesign) {
							that.editor.focus();
						} else {
							if (!that.internalSelect) {
								// K.D. February 18th, 2014 Bug #164466 Removing the second parameter as the elements in the DOM tree are visual.
								that._selectComponent(args.selectedNodes[0].data.domRef);
							}
							that.internalSelect = false;
						}
					}
				});
				$(".dom-tree li[data-role=node] > a").on("contextmenu", function (event) {
					var $target = $(event.target), nodeElement = $target.closest("li");
					var node = tree.igTree("nodeDataFor", nodeElement.data("path"));
					// open the context menu
					var contextmenu = $(".contextmenu");
					if (contextmenu.length === 0) {
						contextmenu = $("<ul></ul>").addClass("contextmenu").css("display", "none").appendTo("body");
					} else {
						contextmenu.empty();
					}
					// check if the target has a domRef associated with it
					if ($(node.domRef).hasClass("ig-component")) {
						var removeItem = $("<li></li>").text("Remove component").appendTo(contextmenu).data("component", node.domRef);
						removeItem.addClass("contextmenu-item").mousedown(function (event) {
							that._removeComponent($(this).data("component"));
							// we need to delete that node from the tree
							tree.igTree("removeAt", nodeElement.data("path"));
							$(".contextmenu").css("display", "none");
						});
						// show it
						contextmenu.css({
							display: "",
							position: "absolute",
							left: event.clientX,
							top: event.clientY
						});
					}
					event.stopPropagation();
					event.preventDefault();
				});
			},
			_linkTrees: function (root, doc) {
				// links the parsed info with the DOM representation of the tree
				// also generates an ACE marker using binary search
				// by converting offset to row & column representation
				var offsets = this._calcEditorOffsets();
				this._linkSubTree(root, doc, offsets);
				// after this, the parsed tree data will have two new props - one pointing to the dom node
				// and another one containing the generated ACE editor marker
			},
			_linkSubTree: function (item, domNode, offsets) {
				// link current two nodes
				var $domNode = $(domNode), detail = "";
				item.domRef = domNode;
				if ($domNode.hasClass("ig-component")) {
					detail += ":" + $domNode.attr("data-type");
				}
				item.tagNameDetail = item.tagName + detail;
				item.marker = this._createMarker(item.startOffset, item.endOffset, offsets);
				//TODO: check perf if creating more than one marker 
				item.contentMarker = this._createMarker(item.startContentOffset, item.endContentOffset, offsets);
				// for each of the children, call _linkSubTree
				// two way
				$domNode.data("marker", item.marker);
				$domNode.data("contentMarker", item.contentMarker);
				$domNode.data("id", item.id);
				for (var i = 0; item.children && i < item.children.length; i++) {
					// Rule of them is that we EXPECT that what's in the code viewer will have a matching dom element, at least the parent nodes
					// we expect that any dom that is a widget/plugin container will have all of its contents written directly in the parent
					// this we will avoid cases where some plugin writes stuff to the body, let's say, like the grid loading indicator
					// and it messes all of our matching just because we expect a different element that place. 
					// while we can't avoid such misbehaving plugins, we can at least try to be a bit more creative when linking the dom
					// so we can check the tag name and any IDs / CSS classes applied
					// strategy -> if it has an ID defined, get it using the ID
					//also, if there is a single case where something is moved by script, all our elems which go after
					// need to be looked up by IDs. (limitation) - because we cannot rely on 1:1 correspondence
					//if (item.attrs && item.attrs.id) {
						//find by id
					//}
					if ($domNode.children('[data-design-visible-child=true]').length > 0) {
						this._linkSubTree(item.children[i], $domNode.children('[data-design-visible-child=true]').get(i), offsets);
					} else {
						this._linkSubTree(item.children[i], $domNode.children().get(i), offsets);
					}
				}
			},
			// given a start and an end offset, generates a starting row& col, and an ending row & col 
			_createMarker: function (startOffset, endOffset, offsets) {
				var startRow = this._findRow(offsets, 0, offsets.length, startOffset);
				var startCol = startOffset - offsets[startRow];
				// can be further optimized to start search from the startRow
				var endRow = this._findRow(offsets, 0, offsets.length, endOffset);
				var endCol = endOffset - offsets[endRow];
				var range = new this.RangeClass(startRow, startCol, endRow, endCol);
				// make the marker dynamic, so that the offsets change, when something gets edited 
				range.start = this.session.doc.createAnchor(range.start);
				range.end = this.session.doc.createAnchor(range.end);
				//A.T. add the marker so that it is tracked!
				//this.session.addMarker(range, "customMarker", "text", false);
				return range;
			},
			_findRow: function (offsets, startRow, endRow, offsetPos) {
				if (startRow > endRow) {
					return -1;
				}
				if (startRow + 1 === endRow) {
					return startRow;
				}
				var mid = Math.floor((startRow + endRow) / 2);
				if (offsetPos < offsets[mid]) {
					return this._findRow(offsets, startRow, mid, offsetPos);
				} else if (offsetPos > offsets[mid]) {
					return this._findRow(offsets, mid, endRow, offsetPos);
				} else {
					return mid;
				}
			},
			_calcEditorOffsets: function () {
				var offsets = [];
				var count = this.session.getLength();
				var currentOffset = 0, newLinesCount = this.session.getDocument().getNewLineCharacter().length;
				offsets.push(currentOffset);
				var text = this.session.getLines(0, count);
				for (var i = 0; i < count; i++) {
					currentOffset += text[i].length + newLinesCount;
					offsets.push(currentOffset);
				}
				return offsets;
			},
			_updatePropertyExplorer: function (element, type, lib, nonvisual) {
				// obtain all properties for the component and fill in the property grid
				//$.ui.igGrid.prototype.options contains all defaults
				var data = [], evtData = [], count = 0, evtCount = 0, props, events, evt, prop, $this = this, title,
					codeProvider, descriptor, pkg, comp, compObject, codeMarker, htmlMarker, customSheet, id, cssClass;
				codeProvider = this._codeProviders[lib];
				pkg = this._packages[lib];
				comp = pkg ? pkg.components[type] : null;
				id = element.attr("id");
				cssClass = $.trim(element.attr("class").replace("ig-component", "").replace("selected-iframe", ""));
				compObject = $this.componentById(id);
				title = compObject ? compObject.title : element.attr('data-title');
				if (comp) {
					// if (codeProvider.hasSummarySheet(comp)) {
						// summarySheet = $('.adorner-summary-sheet').show();
						// if (summarySheet.length === 0) {
							// summarySheet = $('<div class="adorner-summary-sheet"></div>');
							// $('<div class="adorner-wrapper"></div>').append(summarySheet).append($(".adorner-content")).appendTo($('.adorners'));
						// }
						// codeMarker = compObject.codeMarker;
						// htmlMarker = compObject.htmlMarker;
						// codeProvider.renderSummary(summarySheet, {
							// type: comp.id,
							// element: element,
							// codeMarker: codeMarker,
							// htmlMarker: htmlMarker,
							// editor: $this.editor,
							// editorSession: $this.session,
							// rangeClass: $this.RangeClass,
							// iframe: window.frames[0]
						// });
					// } else {
					//$('.adorner-summary-sheet').hide();
					$('.adorner-wrapper').css('left', 0);
					// }
					this._removeExtraAdorners();
					if (codeProvider.hasCustomRenderer(comp)) {
						customSheet = $('.adorner-summary-sheet').show();
						//$('.adorner-content').hide();
						if (customSheet.length === 0) {
							customSheet = $('<div class="adorner-summary-sheet"><div class="adorner-custom-container"></div><div class="adorner-custom-footer"><a href="#" class="adorner-all-properties">All Events & Properties</a></div></div>');
							$(".adorner-wrapper").prepend(customSheet);
							customSheet.on('click', 'a.adorner-all-properties', function (event) {
								$this.adornerMoveLeft();
								event.stopPropagation();
								return false;
							});
						}
						customSheet.attr('data-property', title);
						$('.adorner-content').attr('data-property', "all props");
						this.currentAdorner(customSheet);
						codeMarker = compObject.codeMarker;
						htmlMarker = compObject.htmlMarker;
						codeProvider.render(customSheet.children(".adorner-custom-container"), {
							type: comp.id,
							id: id,
							element: element,
							codeMarker: codeMarker,
							htmlMarker: htmlMarker,
							editor: $this.editor,
							editorSession: $this.session,
							rangeClass: $this.RangeClass,
							iframe: window.frames[0]
						});
						// We still need the property editor so don't return out of here
						//return;
					} else {
						$('.adorner-summary-sheet').hide().removeAttr('data-property');
						this.currentAdorner($('.adorner-content').attr('data-property', title));
						//$('.adorner-content').show();
					}
					if (!nonvisual) {
						// add id and class props
						data.push({
							id: count,
							propName: "id",
							defaultValue: id,
							propValue: id,
							propType: "string",
							description: "HTML id attribute. Used for setting unique identifier to referencing in scripts.",
							valueOptions: null
						});
						count++;
						data.push({
							id: count,
							propName: "class",
							defaultValue: "",
							propValue: cssClass,
							propType: "string",
							description: "CSS classes for this element. You can have more than one separated by spaces.",
							valueOptions: null
						});
						count++;
					}
					if (comp.properties) {
						props = comp.properties;
						for (prop in props) {
							if (props.hasOwnProperty(prop)) {
								// instead of the default value declared in the json property descriptor, we want to check if there isn't an explicit prop value
								// which was set when the component was initialized
								descriptor = {
									type: type,
									propName: prop,
									placeholder: element,
									defaultValue: props[prop].defaultValue,
									iframe: window.frames[0]
								};
								data.push({
									id: count,
									propName: prop,
									defaultValue: props[prop].defaultValue,
									propValue: codeProvider.getPropValue(descriptor),
									propType: props[prop].type,
									description: props[prop].description,
									valueOptions: props[prop].valueOptions,
									displayProp: props[prop].designerDisplayProperty,
									schema: props[prop].schema
								});
							}
							count++;
						}
					}
					if (comp.events) {
						events = comp.events;
						for (evt in events) {
							if (events.hasOwnProperty(evt)) {
								/*
								evtDescriptor = {
									type: type,
									propName: evt,
									placeholder: element,
									defaultValue: events[evt].defaultValue,
									iframe: window.frames[0]
								};
								*/
								evtData.push({
									id: evtCount,
									propName: evt,
									propValue: "",
									propType: "event",
									description: events[evt].description,
									args: events[evt].args
								});
							}
							evtCount++;
						}
					}
					// initialize
					var propertyExplorer = require("ide-propertyexplorer");
					var eventOptions = {
						element: element,
						updatingEnabled: false,
						id: "eventGrid",
						containerId: "events",
						parent: $(".adorner-events-list"),
						data: evtData,
						type: type,
						compObject: compObject,
						provider: codeProvider,
						ide: this
					};
					propertyExplorer(eventOptions);
					$('.adorner-props-list').height(500 - $(".adorner-events-list").height());
					var options = {
						element: element,
						id: "propertyGrid",
						containerId: "props",
						parent: $(".adorner-props-list"),
						data: data,
						type: type,
						compObject: compObject,
						provider: codeProvider,
						ide: this
					};
					propertyExplorer(options);
				} else {
					$(".adorner-props-list:nth-child(2)").empty();
					$(".adorner-events-list:nth-child(2)").empty();
				}
			},
			currentAdorner: function (adorner) {
				if (adorner) {
					this._currentAdorner = adorner;
					this._adornerBreadcrumbs();
					return;
				}
				return this._currentAdorner;
			},
			adornerMoveLeft: function () {
				var self = this;
				$('.adorner-wrapper').animate({left: '-=250'}, 250, function () {
					self.currentAdorner(self._currentAdorner.next());
				});
			},
			adornerMoveRight: function (element) {
				var wrapper = $('.adorner-wrapper'),
					left = parseInt(wrapper.css('left'), 10),
					header = $('.adorner-header'),
					distance = this._currentAdorner.index() - element.index(),
					self = this;
				
				wrapper.animate({left: "+=" + (distance * 250)}, 250, function () {
					element.nextAll().each(function (index, element) {
						var el = $(this);
						if (!el.hasClass('adorner-content')) {
							el.remove();
						}
					});
					self.currentAdorner(element);
				});
			},
			_adornerBreadcrumbs: function () {
				var list = $("<div></div>").addClass("breadcrumbs-list flat"), props = [], i, self = this, width = 0;
				$('.adorner-wrapper').children().each(function (index, element) {
					var prop = $(this).attr('data-property');
					if (prop) {
						props.push(prop);
					}
					if ($(this) === self._currentAdorner) {
						return;
					}
				});
				var container = $(".adorner-header .breadcrumbs");
				if (container.length === 0) {
					container = $("<div class='breadcrumbs'></div>").appendTo(".adorner-hleft");
				}
				container.empty().append(list);
				for (i = props.length - 1; i >= 0; i--) {
					width += $("<a href='#' data-property='" + props[i] + "'>" + props[i] + "</a>").prependTo(list).outerWidth();
					if (width > container.outerWidth()) {
						list.children().first().text("...").attr("title", props[i]);
						break;
					}
				}
				$(".adorner-header .breadcrumbs a").click(function (event) {
					// mark the item as selected
					var $this = $(this);
					if ($this.attr("data-property") === self._currentAdorner.attr("data-property")) {
						event.stopPropagation();
						return false;
					}
					self.adornerMoveRight($('.adorner-wrapper').children("[data-property='" + $this.attr("data-property") + "']"));
					event.stopPropagation();
					return false;
				});
			},
			_removeExtraAdorners: function () {
				$('.adorner-wrapper').children().not('.adorner-summary-sheet,.adorner-content').remove();
			},
			designerBody: function () {
				return $("#designer-frame").contents().find("body");
			},
			designerDocument: function () {
				return $("#designer-frame").contents();
			},
			addMarker: function (mkr) {
				mkr.start = this.session.doc.createAnchor(mkr.start);
				mkr.end = this.session.doc.createAnchor(mkr.end);
				mkr.id = this.session.addMarker(mkr, "customMarker", "text", true);
			},
			createAndAddMarker: function (startRow, startCol, endRow, endCol) {
				var range = new this.RangeClass(startRow, startCol, endRow, endCol);
				this.addMarker(range);
				return range;
			},
			_tabStr: function (n) {
				return (new Array(n + 1)).join("\t");
			},
			// returns a code-friendly (and correct) default value, based on the type and the default value defined in metadata
			// so for example if a prop has a default value of null in the JSON descriptor, its code-friendly default value
			// will be the string literal "" (empty string) instead of null 
			// also if the type is date, the code-friendly default value will be the string literal "new Date()"
			_propCodeDefaultVal: function (type, defaultValMeta) {
				if (type === "number") {
					var val = parseInt(defaultValMeta, 10); // what if it's float? todo => mark in meta
					return isNaN(val) ? 0 : val;
				} else if (type === "bool" || type === "boolean") {
					return Boolean(defaultValMeta);
				} else if (type === "literal") {
					return defaultValMeta;
				} else if (type === "date") {
					if (defaultValMeta && defaultValMeta.getTime) {
						return defaultValMeta;
					} else {
						return "new Date()";
					}
				} else if (defaultValMeta !== null && typeof (defaultValMeta) !== "undefined") {
					return "\"" + defaultValMeta + "\"";
				} else {
					return "\"\"";
				}
			},
			getObjectCodeString: function (obj, tabs) {
				var val = "{\n";
				for (var prop in obj) {
					if (obj.hasOwnProperty(prop)) {
						var subType = typeof obj[prop];
						if (subType === "string") {
							val += this._tabStr(tabs + 1) + prop + ": \"" + obj[prop] + "\",\n"
						} else if (subType === "boolean" || subType === "number") {
							val += this._tabStr(tabs + 1) + prop + ": " + obj[prop] + ",\n"
						} else if (subType === "object" && obj[prop] && obj[prop].length) {
							val += this._tabStr(tabs + 1) + prop + ": " + this.getArrayCodeString(obj[prop], tabs + 1) + ",\n";
						} else if (subType === "object" && obj[prop]) {
							val += this._tabStr(tabs + 1) + prop + ": " + this.getObjectCodeString(obj[prop], tabs + 1) + ",\n";
						}
					}
				}
				val = val.substring(0, val.length - 2);
				val += "\n" + this._tabStr(tabs) + "}";
				return val;
			},
			getArrayCodeString: function (obj, tabs) {
				var val = "[\n" + this._tabStr(tabs + 1);
				for (var i = 0; i < obj.length; i++) {
					val += this.getObjectCodeString(obj[i], tabs + 1);
					if (i < obj.length - 1) {
						val += ",\n" + this._tabStr(tabs + 1);
					} else {
						val += "\n";
					}
				}
				val += this._tabStr(tabs) + "]";
				return val;
			},
			// if someone navigates away from the page, and they have changed something in the designer,
			// prompt them before navigating away
			_setupConfirmDialog: function () {
				var that = this;
				$(window).bind("beforeunload", function () {
					if(that._initialCode !== that.editor.getValue()) {
						return "If you leave this page now, you will lose any changes you’ve made in the designer.";
					}
				});
			},
			componentById: function (id) {
				var comp = null;
				for (var i = 0; i < this.componentIds.length; i++) {
					if (this.componentIds[i].id === id) {
						comp = this.componentIds[i];
						break;
					}
				}
				return comp;
			},
			undef: function (val) {
				return val === null || typeof (val) === "undefined";
			},
			destroy: function () {
				return this;
			}
		});
		$.extend($.ui.igStudio, {version: "<build_number>"});
	} (jQuery));
});