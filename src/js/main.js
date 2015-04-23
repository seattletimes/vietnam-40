require("component-responsive-frame/child");

var dot = require("dot");
var util = require("./util");
var detailTemplate = require("./_details.html");
// var keyTemplate = require("./_key.html");

dot.templateSettings.varname = "data";
dot.templateSettings.evaluate = /<%([\s\S]+?)%>/g;
dot.templateSettings.interpolate = /<%=([\s\S]+?)%>/g;

var details = dot.template(detailTemplate);
// var key = dot.template(keyTemplate);

var app = window.refugees;
app.mode = "absolute";
var animationLength = 1000;
var startYear = 1979;

var yearly = []; //resorted by year for tooltips

for (var i = 0; i < app.applications[0].data.length; i++) {
  var countries = {};
  for (var c = 0; c < app.applications.length; c++) {
    var country = app.applications[c]; //get each country
    var data = country.data[i]; //grab the specific year for that country
    countries[country.country] = data;
  }
  yearly[i] = countries; //add that year to the collection
}

var plot = document.querySelector(".plot-area");
var title = document.querySelector(".title");
var yMax = document.querySelector(".y-max");

var isMobile = function() { return window.matchMedia && window.matchMedia("(max-width: 480px)").matches };

app.render = function() {
  if (app.animating) return;
  app.animating = true;
  var isAbsolute = app.mode == "absolute";
  
  var stack = [];
  for (var i = 0; i < app.applications[0].data.length; i++) { stack[i] = 0 }; //zero the baseline
  var plotBounds = plot.getBoundingClientRect();
  
  yMax.innerHTML = isAbsolute ? app.max.toLocaleString().replace(/\.0+$/, "") : "100%";

  //layout stages
  var freeze = [];
  var addClass = function() { plot.className += " animate" };
  var animate = [];
  var finish = [];
  
  app.applications.forEach(function(row) {
    row.data.forEach(function(item, i) {
      var element = item.element;
      var height = isAbsolute ? item.absolute / app.max * 100 : item.relative;
      var base = stack[i];
      stack[i] += height;
      var bounds = element.getBoundingClientRect();
      
      var pxHeight = height / 100 * plotBounds.height;
      var pxBase = base / 100 * plotBounds.height;
      var bottom = plotBounds.height - pxBase;
      var duration = (row.data.length - i) * (animationLength / row.data.length) / 1000;
        
      freeze.push(function() {
        util.freeze(bounds, plotBounds, element);
      });
      
      animate.push(function() {
        util.transform(element, bottom, pxHeight);
        util.transitionDuration(element, duration);
      });
      
      finish.push(function() {
        plot.className = plot.className.replace(/\banimate\b/g, "");
        util.removeTransform(element);
        util.transitionDuration(element, 0);
        element.style.height = height + .1 + "%";
        element.style.bottom = base + "%";
      });
      
    });
  });

  if (app.animate) {
    util.syncLayout([freeze, addClass, animate]);
    setTimeout(function() {
      util.syncLayout([finish]);
      app.animating = false;
    }, animationLength);
  } else {
    util.syncLayout([finish]);
    app.animating = false;
  }
}

app.switch = function() {
  if (app.animating) return;
  plot.className = plot.className.replace(/\bselecting\b/g, "");
  app.mode = app.mode == "absolute" ? "relative" : "absolute";
  title.setAttribute("data-mode", app.mode);
  app.render();
};

app.setup = function() {
  var len = app.applications[0].data.length;
  var xAxis = document.querySelector(".plot .x-axis");

  for (var i = 0; i < len; i++) {
    //create a label for the year
    var label = document.createElement("label");
    var year = i + startYear;
    label.className = "year";
    label.innerHTML = i ? "'" + ((i + startYear) + "").slice(-2) : i + startYear;
    if (year % 5 == 0) {
      label.className += " major";
    }
    label.style.left = i * (100 / len) + "%";
    xAxis.appendChild(label);
  }

  app.applications.forEach(function(row, i, apps) {
    var country = row.country;
    row.color = "hsl(" + (i * 48 + 180) + ", 30%, " + (i > (len / 2) ? "30%" : "50%") + ")";

    //add graph elements
    row.data.forEach(function(item, i, arr) {
      var el = document.createElement("div");
      el.className = "item " + country.replace(/\s/g, "");
      el.setAttribute("connect", country + "-" + i);
      el.setAttribute("data-index", i);
      // el.style.width = 100 / arr.length + "%";
      el.style.left = i * (100 / arr.length) + "%";
      // el.style.backgroundColor = row.color;
      el.title = country;
      
      item.element = el;
      plot.appendChild(el);
    });
  });

};

app.setup();
app.render();
app.animate = true;

var switchButton = document.querySelector(".switch");
switchButton.addEventListener("click", app.switch);

var detailSection = document.querySelector(".details");

//on touch of a column
plot.addEventListener("click", function(e) {
  var bounds = plot.getBoundingClientRect();
  var x = e.clientX - bounds.left;
  var index = Math.floor(x / (bounds.width / yearly.length));

  var sorted = {};
  var countries = Object.keys(yearly[index]).filter(function(c) { return c !== "Other" });
  countries.sort(function(a, b) {
    return yearly[index][b].absolute - yearly[index][a].absolute;
  }).forEach(function(c) {
    sorted[c] = yearly[index][c];
  });
  sorted.Other = yearly[index].Other;
  
  detailSection.innerHTML = details({
    year: index + startYear,
    countries: sorted
  });

  util.qsa(".item.active").forEach(function(el) {
    el.className = el.className.replace(/\bactive\b/g, "");
  });

  util.qsa("[data-index='" + index + "']").forEach(function(el) {
    el.className += " active";
  });

  plot.className += " selecting ";

});