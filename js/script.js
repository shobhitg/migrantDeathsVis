var container = L.DomUtil.get('map');
var map = L.map('map').setView([45, 10], 3);

L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
    maxZoom: 18,
    id: 'shobhitg.na7jk2f5',
    accessToken: 'pk.eyJ1Ijoic2hvYmhpdGciLCJhIjoiNmI1Nzg0ZmIzMWY4OGU4MGEzYzI3ZGIxMzBhZmQ4NmUifQ.z5e8zocByNWRqW6VPfxpwg'
}).addTo(map);

var d3Overlay = L.d3SvgOverlay(function(selection, projection) {
    d3.json(container.dataset.source, function(migrantData) {


        var updateMap = function(chart, filter) {
            //chart.filter();

            var data = monthDimension.top(Infinity);
            if (data.length === migrantData.length) return;

            console.log(data.length);
            data = data.filter(function(d) {
                return !((d.latitude === "") || (d.longitude === ""));
            });


            var feature = selection.selectAll("circle")
                .data(data);

            tip = d3.tip()
                .offset([-10, 0])
                .attr('class', 'd3-tip').html(function(d) {
                    return '<div class="tip"><b>Dead or missing</b>: ' + d.dead_and_missing + '<BR><i>' + d.description + '</i></div>';
                    //return '<div class="tip">Dead or missing:' + d.dead_and_missing + '</div>';
                });

            /* Invoke the tip in the context of your visualization */
            selection.call(tip)

            feature.enter().append("circle")
                .style("stroke", "black")
                .attr('stroke-width', 1 / projection.layer._scale)
                .style("opacity", .2)
                .style("fill", "red")
                .attr("r", function(d) {
                    return Math.log(d.dead_and_missing) * 2 * 1 / Math.min(projection.layer._scale, 15);
                })
                .attr('cx', function(d) {
                    return projection.latLngToLayerPoint([parseFloat(d.latitude), parseFloat(d.longitude)]).x
                })
                .attr('cy', function(d) {
                    return projection.latLngToLayerPoint([parseFloat(d.latitude), parseFloat(d.longitude)]).y
                })
                .on('mouseover', tip.show)
                .on('mouseout', tip.hide);

            feature.exit().remove();

            feature.attr("r", function(d) {
                return Math.log(d.dead_and_missing) * 2 * 1 / Math.min(projection.layer._scale, 15);
            })
                .attr('stroke-width', 1 / projection.layer._scale);

        };


        window.cfData = crossfilter(migrantData);


        var timeChart = dc.barChart('#time-chart');

        var dateDimension = cfData.dimension(function(d) {
            return new Date(d.date)
        });

        window.monthDimension = cfData.dimension(function(d) {
            return new Date(d.date);
        });

        var openGroup = monthDimension.group().reduceSum(function(d) {
            return parseInt(d.dead_and_missing);
        });
        closeGroup = monthDimension.group().reduce(
            function(p, v) {
                p.push(v.close);
                return p;
            },
            function(p, v) {
                p.splice(p.indexOf(v.close), 1);
                return p;
            },
            function() {
                return [];
            }
        );

        timeChart
            .width(800)
            .height(120)
        //.margins({top: 10, right: 50, bottom: 30, left: 50})
        .dimension(monthDimension)
            .group(openGroup)
            .x(d3.time.scale().domain([new Date("1999-01-01T00:00:00Z"), new Date("2016-09-30T00:00:00Z")]))
            .round(d3.time.days.round)
            .xUnits(d3.time.days)
            .elasticY(true)
            .on("filtered", updateMap);

        dc.renderAll();


    });
});

d3Overlay.addTo(map);