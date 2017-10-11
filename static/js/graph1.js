queue()
    .defer(d3.json, '/data')
    .await(makeGraphs);


function makeGraphs(error, countriesData) {
    if (error) {
        console.error("makeGraphs error on receiving dataset:", error.statusText);
        throw error;
    }

    var currentData = [];
    var currentCount = 0;

    //TODO descriptive "clean data"ish comment here ??
    countriesData.forEach(function(d) {
        if (currentCount < 150) {
            currentCount++;

            var malePop = getMalePop(d["population"], d["2015"], d["male"], d["female"]);
            var mRow = createRow(d, "male", malePop, currentCount);
            currentData.push(mRow);

            var femalePop = getFemalePop(d["population"], malePop);
            var fRow = createRow(d, "female", femalePop, currentCount);
            currentData.push(fRow);
        }
    });


    //Create a Crossfilter instance
    var ndx = crossfilter(currentData);


    //Define Dimensions
    var currentIdDim = ndx.dimension(function(d) {
        return d["current_id"];
    });
    var regionDim = ndx.dimension(function(d) {
        return d["region"];
    });
    var genderDim = ndx.dimension(function(d) {
        return d["gender"];
    });


    //Calculate metrics
    var currentRateByCountry = currentIdDim.group().reduce(avgAdd, avgRem, avgInit);
    var avgByRegion = regionDim.group().reduce(avgAdd, avgRem, avgInit);
    var averageRate = ndx.groupAll().reduce(avgAdd, avgRem, avgInit);
    var avgByGender = genderDim.group().reduce(avgAdd, avgRem, avgInit);


    //Charts
    var currentChart = dc.barChart("#current-chart");
    var regionChart = dc.rowChart("#region-row-chart");
    var averageND = dc.numberDisplay("#average-rate-nd");
    var genderChart = dc.pieChart("#gender-pie-chart");


    currentChart
        .colors(d3.scale.linear().domain([20,110]).range(["#DD0000", "#66EE00"]))
        .colorAccessor(function(d) {return d.value.avg;})
        .width(1200)  // make these dynamic?! change as the div size changes?? :( TODO google 'dc responsive'
        .height(250)
        .margins({top: 10, right: 50, bottom: 20, left: 50})
        .dimension(currentIdDim)
        .group(currentRateByCountry)
        .valueAccessor(function(d) {return d.value.avg;})
        .transitionDuration(1000)
        .centerBar(true)
        .brushOn(false)
        .x(d3.scale.linear().domain([0, currentCount+1]))
        .y(d3.scale.linear().domain([0,100]))
        .title(function(d) {})
        .on('renderlet', function(chart) {
            chart.selectAll('rect.bar')
                .on('mouseover.showtext', function(d) {
                    chart.select('.current-text')
                         .text(d.data.value.country + ': ' + d3.format(".1%")(d.data.value.avg/100));
                })
                .on('mouseout.showtext', function(d) {
                    chart.select('.current-text').text('');
                });
            });
    currentChart.xAxis().tickValues([]);
    currentChart.yAxis().tickFormat(function(v) {return v + '%';});


    regionChart
        .colors(d3.scale.linear().domain([40,110]).range(["#BB0000","#44CC00"]))
        .colorAccessor(function(d) {return d.value.avg;})
        .width(300)
        .height(250)
        .dimension(regionDim)
        .group(avgByRegion)
        .valueAccessor(function(d) {return d.value.avg;})
        .title(function(d) {return d.key + ': ' + d3.format(".1%")(d.value.avg/100);})
        .xAxis().tickValues([0, 20, 40, 60, 80, 100]).tickFormat(function(v) {return v + '%';});


    averageND
        .formatNumber(d3.format("d"))
        .group(averageRate)
        .valueAccessor(function(d) {return d.avg/100;})
        .transitionDuration(750)
        .formatNumber(d3.format(".1%"));


    genderChart
        .ordinalColors(["#B64765", "#4778B6"])
        .height(250)
        .radius(110)
        .innerRadius(10)
        .transitionDuration(1500)
        .dimension(genderDim)
        .valueAccessor(function(d) {return d.value.avg;})
        .group(avgByGender)
        .label(function(d) {return d.key + ': ' + d3.format(".0%")(d.value.avg/100);})
        .title(function(d) {});


    dc.renderAll();
}