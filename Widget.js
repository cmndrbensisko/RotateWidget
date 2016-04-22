///////////////////////////////////////////////////////////////////////////
// Copyright © 2014 Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////

define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'jimu/BaseWidget',
    "esri/dijit/HomeButton",
    "esri/geometry/Extent",
    'esri/SpatialReference',
    'dojo/_base/html',
    'dojo/dom-construct',
    'dojo/topic',
    'dojo/on',
	"dojo/dom-style",
	'./npknob'
  ],
  function(
    declare,
    lang,
    BaseWidget,
    HomeButton,
    Extent,
    SpatialReference,
    html,
    domConstruct,
    topic,
    on,
	domStyle) {
    var clazz = declare([BaseWidget], {

      name: 'Rotate',
      baseClass: 'jimu-widget-rotate',

      postCreate: function() {
        this.own(topic.subscribe("appConfigChanged", lang.hitch(this, this.onAppConfigChanged)));
      },

      startup: function() {
        var initalExtent = null;
        this.inherited(arguments);
        this.own(on(this.map, 'extent-change', lang.hitch(this, 'onExtentChange')));

        var configExtent = this.appConfig && this.appConfig.map &&
          this.appConfig.map.mapOptions && this.appConfig.map.mapOptions.extent;

        if (configExtent) {
          initalExtent = new Extent(
            configExtent.xmin,
            configExtent.ymin,
            configExtent.xmax,
            configExtent.ymax,
            new SpatialReference(configExtent.spatialReference)
          );
        } else {
          initalExtent = this.map._initialExtent || this.map.extent;
        }

        this.createHomeDijit({
          map: this.map,
          extent: initalExtent
        });
      },

      createHomeDijit: function(options) {
		//introduce settings for default rotation
		var knobUI = domConstruct.create("div",{id:"rotateDiv",class:"jimu-widget-rotatebutton"});
		html.place(knobUI, this.domNode);
		var knob1 = new NpKnob("rotateDiv",{min:0,max:359,value:0})
		knob1.obj.addEventListener('knob-rotate', function (evt) {
			domStyle.set(document.getElementById("map_root"),"transform","rotate(" + evt.detail.value + "deg)")
			domStyle.set(document.getElementById("map_root"),"-ms-transform","rotate(" + evt.detail.value + "deg)")
			domStyle.set(document.getElementById("map_root"),"-webkit-transform","rotate(" + evt.detail.value + "deg)")
		})
      },

      onAppConfigChanged: function(appConfig, reason, changedData) {
        if (reason === "mapOptionsChange" && changedData && appConfig &&
          changedData.extent) {
          var extent = new Extent(changedData.extent);
          this.homeDijit.set("extent", extent);
        }
      },

      onExtentChange: function() {
        html.removeClass(this.domNode, 'inHome');
      },

      onHome: function(evt) {
        if (!(evt && evt.error)) {
          html.addClass(this.domNode, 'inHome');
        }
      }
    });
    return clazz;
  });