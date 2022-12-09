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

var sumAll = function (arr) {
    var out = 0;
    for (var i = 0; i < arr.length; i++) {
        out += arr[i];
    }
    return out;
};

var buildHeatmap = function (params) {

    console.log("build heatmap", params);

    // initialize cross sectional data
    var range_domain_Data = []; // items will be objects
    for (var i = 0; i < params.range.length; i++) {
        range_domain_Data.push([]);
        for (var j = 0; j < params.domain.length; j++) {
            range_domain_Data[i][j] = 0;
        }
    }
    var domain_range_Data = []; // items will be objects
    for (var i = 0; i < params.domain.length; i++) {
        domain_range_Data.push([]);
        for (var j = 0; j < params.range.length; j++) {
            domain_range_Data[i][j] = 0;
        }
    }

    // now we need to build the sums of domain/range hits
    var maxRangeDomainValue = 0;
    var maxDomainRangeValue = 0;
    for (var i = 0; i < params.data.length; i++) {

        var rangeV = params.dataRangeFn(params.data[i]);
        var rangeIndex = params.range.indexOf(rangeV);
        if (rangeIndex < 0) {
            continue;
        }

        // // get index of event group (here, date)
        // var at = moment(data[i].created_at).hour();

        var domainV = params.dataDomainFn(params.data[i]);
        var domainIndex = params.domain.indexOf(domainV);
        if (domainIndex < 0) {
            continue;
        }

        // finally, increment the tallies
        range_domain_Data[rangeIndex][domainIndex]++;
        domain_range_Data[domainIndex][rangeIndex]++;

        // update the known max.
        // There is definitely a d3 way to do this.
        // Don't know it off the top of my head.
        if (range_domain_Data[rangeIndex][domainIndex] > maxRangeDomainValue) {
            maxRangeDomainValue = range_domain_Data[rangeIndex][domainIndex];
        }
        if (domain_range_Data[domainIndex][rangeIndex] > maxDomainRangeValue) {
            maxDomainRangeValue = domain_range_Data[domainIndex][rangeIndex];
        }
    }

    // Initialize aggregate flattened list data.
    // Use range_domain valuation.
    var myData = [];
    for (var i = 0; i < params.range.length; i++) {
        for (var j = 0; j < params.domain.length; j++) {
            myData.push({
                range: params.range[i],
                domain: params.domain[j],
                value: range_domain_Data[i][j]
            });
        }
    }

    // set the dimensions and margins of the graph
    var rect = $("#" + params.dom).get(0).getBoundingClientRect();
    var margin = {};
    margin.top = function () {
        if (params.margin && params.margin.top) {
            return params.margin.top;
        } else {
            return 150;
        }
    }()
    margin.right = function () {
        if (params.margin && params.margin.right) {
            return params.margin.right;
        } else {
            return rect.width / 4;
        }
    }()
    margin.bottom = function () {
        if (params.margin && params.margin.bottom) {
            return params.margin.bottom;
        } else {
            return 100;
        }
    }()
    margin.left = function () {
        if (params.margin && params.margin.left) {
            return params.margin.left;
        } else {
            return 20;
        }
    }()

    // HACK
    // If max is greater than margin top,
    // and xaxis will be alpa (words, eg names), then
    // extend the top margin so labels on their
    // bar-chart style ticks don't get cut off.
    var biggestLabelHeight = 250;
    var guessTopMarginNeeds = maxRangeDomainValue + biggestLabelHeight + 10;
    if (/[a-zA-Z]+/igm.test(params.domain[0]) && guessTopMarginNeeds > margin.top ) {
        margin.top = guessTopMarginNeeds;
    }

    var width = rect.right - rect.left - margin.left - margin.right;

    // width = window.innerWidth - margin.left - margin.right,
    var height = 20 * params.range.length;

    // append the svg object to the body of the page
    var svg = d3.select("#" + params.dom)
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


    // Build Y scales and axis:
    var y = d3.scaleBand()
        .range([height, 0])
        .domain(params.range)
        .padding(0.01);

    // // Build color scale
    // var myColor = d3.scaleLinear()
    //     .range(["white", "#60bc52"])
    //     .domain([0, maxRangeDomainValue]);
    var myColor = d3.scaleSequentialSqrt([0, maxRangeDomainValue], d3.interpolatePuRd)

    var rangeFinder = function (d) {
        //d for the tick line is the value
        //of that tick
        //(a number between 0 and 1, in this case)

        // get range index (d is tick value)

        var rangeIndex = params.range.indexOf(d);
        if (rangeIndex < 0) {
            console.log("out of range", d, rangeIndex, params.range, range_domain_Data); // should never happen
            return 0;
        }
        var sum = sumAll(range_domain_Data[rangeIndex]);
        // console.log("->", d, sum, rangeIndex, range_domain_Data[rangeIndex], range_domain_Data);
        return sum;
    };

    var domainFinder = function (d) {
        //d for the tick line is the value
        //of that tick
        //(a number between 0 and 1, in this case)

        // get domain index (d is tick value)

        var domainIndex = params.domain.indexOf(d);
        if (domainIndex < 0) {
            console.log("out of domain", d, domainIndex, params.domain, domain_range_Data); // should never happen
            return 0;
        }
        var sum = sumAll(domain_range_Data[domainIndex]);
        // console.log("->", d, sum, domainIndex, domain_domain_Data[domainIndex], domain_domain_Data);
        return sum;
    };


    // Use one tooltip.
    var tooltipDiv = d3.select("body").append("div")
        .attr("class", "d3tooltip")
        .style("opacity", 0);

    //Read the data
    svg.selectAll()
        .data(myData, function (d) {
            return d.domain + ':' + d.range; // What does this do?
        })
        .enter()
        .append("rect")
        .attr("x", function (d) {
            return x(d.domain);
        })
        .attr("y", function (d) {
            return y(d.range);
        })
        .attr("width", x.bandwidth())
        .attr("height", y.bandwidth())
        .style("fill", function (d) {
            return myColor(d.value);
        })
        .on("mouseover", function (d) {
            if (d.value == 0) {
                return;
            }
            tooltipDiv.transition()
                .duration(200)
                .style("opacity", 1);
            tooltipDiv.html("<strong>" + d.value + "</strong>&nbsp;(" + d.domain + " @ " + d.range + ")")
                .style("left", (d3.event.pageX + 10) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mouseout", function (d) {
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
        .attr("y", 0 - margin.top + 16) // - (margin.top / 2))
        // .attr("y", height + (margin.bottom / 2))
        // .attr("y", 0-height+margin.top+margin.bottom - (margin.bottom / 2))
        .attr("text-anchor", "left")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .style("text-decoration", "none")
        .text(params.title);


    if (!params.xAxisDisable) {

        // only use every 4th tick for numerical values
        var xgen = d3.axisTop(x).tickSize(0);
        if (/^\d+$/igm.test(params.domain[0])) {
            xgen.tickValues(params.domain.map(function (d, i) {

                // Noop, just return the value.
                return d;

                // // Only show ticks at interval=4.
                // if (i % 4 === 0) {
                //     return d;
                // }
                // return "";
            }));
        }

        var xaxis = svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + -1 + ")")
            .call(xgen);

        xaxis.select("path").style("color", "transparent");

        xaxis.selectAll("text")
            .attr("class", "x axis label")
            .attr("font-size", "1.2em")
            .attr("font-family", "monospace")
            .attr("text-anchor", "start")
            .attr("transform", function (d) {
                var shouldRotate = "" + d.length >= 2 && !/^\d+$/igm.test(d)
                if (shouldRotate) {
                    return "translate(0, -" + domainFinder(d) + "), rotate(-90), translate(8, 8)";
                }
                return "translate(-6, -" + domainFinder(d) + ")";
            })

        xaxis.selectAll("g.x.axis g.tick line")
            .style("color", "black")
            .attr("y2", domainFinder)
            .attr("transform", function (d) {
                return "translate(0,-" + domainFinder(d) + ")";
            });

        // order matters here
        // warning: brittle logic
        // Replace raw _Event names with their icons.
        if (/Event$/igm.test(params.domain[0])) {
            xaxis.selectAll("text")
                .each(function (d, i) {
                    var thisText = d3.select(this).text();
                    var thisTextTrimEvent = thisText.slice(0, thisText.indexOf("Event"));
                    var iconName = eventIconFromName(thisText);
                    if (iconName !== "") {
                        d3.select(this).text(iconName + " " + thisTextTrimEvent);
                    }
                });
        }
        // if (/[a-zA-Z]/igm.test(params.domain[0])) {
        //     xaxis.selectAll("text")
        //         .attr("text-anchor", "start")
        //         .attr("transform", function (d) {
        //             return "rotate(-45)";
        //         });
        // }

        xaxis.selectAll("text")
            .style("color", "#b3afaf")

    }

    if (!params.yAxisDisable) {
        var yaxis = svg.append("g")
            .attr("class", "y axis")
            .attr("transform", "translate(" + width + ", 0)")
            .call(d3.axisRight(y).tickSize(0));

        yaxis.select("path")
            .style("color", "transparent");

        var labelColor = "#b3afaf";

        function dlabelColor(d, i) {
            // If the label is today's data, turn it green.
            // This SUPER HACKILY uses the hardcode date format from 'fmt' variable in
            // the controller.
            if (moment().format("dddd, MMM D") === d) {
                return "rgb(40, 168, 36)";
            }
            if (/(saturday|sunday)\,/igm.test(d)) {
                return "#fff";
                // return "#D8D4D4";
            }
            return labelColor
        }

        yaxis.selectAll("text")
            .attr("class", "y axis label")
            .attr("font-size", "1em")
            .style("color", dlabelColor)
            .attr("transform", function (d) {
                // want offset on x axis
                return "translate(4, 0), translate(" + rangeFinder(d) + ", 0)";
            });

        // Replace raw Event names with their icons.
        if (/Event$/igm.test(params.range[0])) {
            yaxis.selectAll("text")
                .each(function (d, i) {
                    var thisText = d3.select(this).text();
                    var thisTextTrimEvent = thisText.slice(0, thisText.indexOf("Event"));
                    var iconName = eventIconFromName(thisText);
                    if (iconName !== "") {
                        d3.select(this).text(iconName + " " + thisTextTrimEvent);
                    }
                });
        }

        // Add links to repositories.
        svg.selectAll("text")
            .each(function (d, i) {

                // If it does not have slash in the name, don't add a link..
                if (!/.+\//igm.test(d)) {
                    return;
                }
                d3.select(this)
                    .attr("xlink:href", "https://github.com/" + d3.select(this).text())
                    .on("mouseover", function (d, i) {
                        d3.select(this).style("color", "dodgerblue");
                        tooltipDiv.transition()
                            .duration(200)
                            .style("opacity", 1);
                        tooltipDiv.html("<strong>" + "github.com/" + d + "</strong>")
                            .style("left", (d3.event.pageX + 10) + "px")
                            .style("top", (d3.event.pageY - 28) + "px");
                    })
                    .on("mouseout", function (d, i) {
                        d3.select(this).style("color", dlabelColor());
                        tooltipDiv.transition()
                            .duration(500)
                            .style("opacity", 0);
                    })
                    .on("click", function (d, i) {
                        window.open("https://github.com/" + d3.select(this).text(), "_blank")
                    })
                ;

                /*
                        .on("mouseover", function (d) {
            if (d.value == 0) {
                return;
            }
            tooltipDiv.transition()
                .duration(200)
                .style("opacity", 1);
            tooltipDiv.html("<strong>" + d.value + "</strong>&nbsp;(" + d.range + " @ " + d.domain + ")")
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mouseout", function (d) {
            if (d.value == 0) {
                return;
            }
            tooltipDiv.transition()
                .duration(500)
                .style("opacity", 0);
                * */
                // var oldParent = this.parentNode;
                // var newParent = document.createElement("a");
                // newParent.href = "https://github.com/" + d3.select(this).text();
                // oldParent.replaceChild(newParent, this);
                // newParent.appendChild(this);

            });

        yaxis.selectAll("g.y.axis g.tick line")
            .style("color", "black")
            .attr("transform", "translate(0,0)") // translate the tick to be BETWEEN the actual ticks (between labels)
            .attr("x2", rangeFinder);

    }


    return svg;
};
