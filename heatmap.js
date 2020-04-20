// data is an array of data objects
// domain is an array of values (eg hours, days, repos)
// range is an array of values (eg actors)
// valueFn
/*
  dom string
  title string
  data array of objects
  domain array of primitives... or anything
  range array of primitives... or anything
  dataDomainFn function to get domain value from an object in the data
  dataRangeFn function to get range value from an object in the data
  }
*/

var buildHeatmap = function(params) {

    console.log("build heatmap", params);

    // initialize data
    var myNewData = []; // items will be objects
    for (var i = 0; i < params.range.length; i++) {
        myNewData.push([]);
        for (var j = 0; j < params.domain.length; j++) {
            myNewData[i][j] = 0;
        }
    }

    // now we need to build the sums of domain/range hits
    var maxValue = 0;
    for (var i = 0; i < params.data.length; i++) {

        var rangeV = params.dataRangeFn(params.data[i]);
        var rangeIndex = params.range.indexOf(rangeV);
        if (rangeIndex < -1) {
            continue;
        }

        // // get index of event group (here, date)
        // var at = moment(data[i].created_at).hour();

        var domainV = params.dataDomainFn(params.data[i]);
        var domainIndex = params.domain.indexOf(domainV);
        if (domainIndex < -1) {
            continue;
        }

        // finally, increment the tallies
        myNewData[rangeIndex][domainIndex]++;

        // update the known max.
        // There is definitely a d3 way to do this.
        // Don't know it off the top of my head.
        if (myNewData[rangeIndex][domainIndex] > maxValue) {
            maxValue = myNewData[rangeIndex][domainIndex];
        }
    }

    var myData = [];
    for (var i = 0; i < params.range.length; i++) {
        for (var j = 0; j < params.domain.length; j++) {
            myData.push({
                range: params.range[i],
                domain: params.domain[j],
                value: myNewData[i][j]
            });
        }
    }

    console.log("range", params.range);
    console.log("domain", params.domain);
    console.log("mydata", myData);

    // set the dimensions and margins of the graph
    var margin = {
            top: 90,
            right: 90,
            bottom: 100,
            left: 200
        },
        width = window.innerWidth - margin.left - margin.right,
        height = 450 - margin.top - margin.bottom;

    // append the svg object to the body of the page
    var svg = d3.select(params.dom)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    // Build X scales and axis:
    var x = d3.scaleBand()
        .range([0, width])
        .domain(params.domain)
        .padding(0.01);
    var xaxis = svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));
    xaxis.selectAll("text")
        .attr("font-size", "1.2em")
        .attr("font-family", "monospace");

    if (/Event$/igm.test(params.domain[0])) {
        xaxis.selectAll("text").each(function(d, i) {
            var thisText = d3.select(this).text();
            var iconName = eventIconFromName(thisText);
            if (iconName !== "") {
                d3.select(this).text(iconName);
            }
        }).attr("font-size", 24);
    } else if (/[a-zA-Z]/igm.test(params.domain[0])) {
        xaxis.selectAll("text")
            .attr("text-anchor", "end")
            .attr("transform", function(d) {
                return "rotate(-45)";
            });
    }

    // Build X scales and axis:
    var y = d3.scaleBand()
        .range([height, 0])
        .domain(params.range)
        .padding(0.01);
    var yaxis = svg.append("g")
        .call(d3.axisLeft(y));
    yaxis.selectAll("text").attr("font-size", "1.6em").attr("font-family", "monospace");
    if (/Actors by/igm.test(params.title)) {
        yaxis.selectAll("text").each(function(d, i) {
            d3.select(this).text("@"+d3.select( this ).text());
        });
    }

    // // Build color scale

    // var myColor = d3.scaleLinear()
    //     .range(["white", "#60bc52"])
    //     .domain([0, maxValue]);

    var myColor = d3.scaleSequentialSqrt([0, maxValue], d3.interpolatePuRd)

    // Use one tooltip.
    var tooltipDiv = d3.select("body").append("div")
        .attr("class", "d3tooltip")
        .style("opacity", 0);

    //Read the data
    svg.selectAll()
        .data(myData, function(d) {
            return d.domain + ':' + d.range; // What does this do?
        })
        .enter()
        .append("rect")
        .attr("x", function(d) {
            return x(d.domain);
        })
        .attr("y", function(d) {
            return y(d.range);
        })
        .attr("width", x.bandwidth())
        .attr("height", y.bandwidth())
        .style("fill", function(d) {
            return myColor(d.value);
        })
        .on("mouseover", function(d) {
            if (d.value == 0) {
                return;
            }
            tooltipDiv.transition()
                .duration(200)
                .style("opacity", 0.9);
            tooltipDiv.html("<strong>" + d.value + "</strong>&nbsp;(" + d.range + " @ " + d.domain +")")
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mouseout", function(d) {
            if (d.value == 0) {
                return;
            }
            tooltipDiv.transition()
                .duration(500)
                .style("opacity", 0);
        });

    // title
    svg.append("text")
        .attr("x", 0)
        .attr("y", 0 - (margin.top / 2))
        .attr("text-anchor", "left")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .style("text-decoration", "none")
        .text(params.title);


};
