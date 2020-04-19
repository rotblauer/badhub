var initCharts = function() {
    console.log("initializing charts");
};

function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}

var buildCharts = function(datas) {
    console.log("building charts, len data", datas);
    $("#debug").text(JSON.stringify(datas.slice(0,14), null, 4)).css({
        maxHeight: "80vh"
    });
    console.log(d3.version);

    // var mysvg = d3.select("#dchart")
    //     .append("svg")
    //     .attr("width", 100)
    //     .attr("height", 100);

    // mysvg.append("circle")
    //     .style("stroke", "gray")
    //     .style("fill", "white")
    //     .attr("r", 40)
    //     .attr("cx", 50)
    //     .attr("cy", 50)
    //     .on("mouseover", function(){d3.select(this).style("fill", "aliceblue");})
    //     .on("mouseout", function(){d3.select(this).style("fill", "white");});

    for (var i = 0; i < datas.length; i++) {
        var d = datas[i];
        if (eligibleActors.indexOf(d.actor.login) < 0) {
            eligibleActors.push(d.actor.login);
        }
    }
    eligibleActors = eligibleActors.filter(onlyUnique);

    // eligibleActors, dateGroups
    var dateGroups = [];
    for (var i = 0; i < 8*24; i++) {
        dateGroups.push(moment().subtract(i, 'hours').startOf('hour').format());
    }
    var myNewData = []; // items will be objects
    for (var i = 0; i < eligibleActors.length; i++) {
        myNewData.push([]);
        for (var j = 0; j < dateGroups.length; j++) {
            myNewData[i][j] = 0;
        }
    }

    // now we need to build the sums of the actors' events over the groups (day starts)
    var maxValue = 0;
    for (var i = 0; i < datas.length; i++) {

        var actor = datas[i].actor.login;
        var actorIndex = eligibleActors.indexOf(actor);

        // get index of event group (here, date)
        var at = moment(datas[i].created_at).startOf('hour').format();

        var groupIndex = dateGroups.indexOf(at);
        if (groupIndex < -1) {
            continue; // event is out of date range
        }
        myNewData[actorIndex][groupIndex]++;
        if ( myNewData[actorIndex][groupIndex] > maxValue ) {
            maxValue = myNewData[actorIndex][groupIndex];
        }
    }

    var myData = [];
    for (var i = 0; i < eligibleActors.length; i++) {
        for (var j = 0; j < dateGroups.length; j++) {
            myData.push({
                actor: eligibleActors[i],
                date: dateGroups[j],
                value: myNewData[i][j]
            });
        }
    }

    console.log("actors", eligibleActors);
    console.log("dates", dateGroups);
    console.log("mydata", myData);

    // build chart ////////////////////////////

// set the dimensions and margins of the graph
var margin = {top: 30, right: 30, bottom: 30, left: 90},
  width = window.innerWidth - margin.left - margin.right,
  height = 450 - margin.top - margin.bottom;

// append the svg object to the body of the page
var svg = d3.select("#dchart")
.append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
.append("g")
  .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

// Labels of row and columns
// var myGroups = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"] // <-- dategroups
// var myVars = ["v1", "v2", "v3", "v4", "v5", "v6", "v7", "v8", "v9", "v10"] // <-- actors

// Build X scales and axis:
var x = d3.scaleBand()
  .range([ 0, width ])
  .domain(dateGroups)
  .padding(0.01);
svg.append("g")
  .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

// Build X scales and axis:
var y = d3.scaleBand()
  .range([ height, 0 ])
  .domain(eligibleActors)
  .padding(0.01);
svg.append("g")
  .call(d3.axisLeft(y));

// Build color scale
var myColor = d3.scaleLinear()
  .range(["white", "#69b3a2"])
    .domain([0,maxValue]);

//Read the data

  svg.selectAll()
      .data(myData, function(d) {return d.date+':'+d.actor;})
      .enter()
      .append("rect")
      .attr("x", function(d) { return x(d.date) })
      .attr("y", function(d) { return y(d.actor) })
      .attr("width", x.bandwidth() )
      .attr("height", y.bandwidth() )
        .style("fill", function(d) { return myColor(d.value)} );

    //////////////////////////////////////////////

    // // set the dimensions and margins of the graph
    // var margin = {top: 30, right: 30, bottom: 30, left: 30},
    //     width = 450 - margin.left - margin.right,
    //     height = 450 - margin.top - margin.bottom;

    // var svg = d3.select("#dchart")
    //     .attr("width", width + margin.left + margin.right)
    //     .attr("height", height + margin.top + margin.bottom)
    //     .append("g")
    //     .attr("transform",
    //           "translate(" + margin.left + "," + margin.top + ")");
    // var x = d3.scaleBand()
    //     .range([ 0, width ])
    //     .domain(dateGroups)
    //     .padding(0.01);

    // svg.append("g")
    //     .attr("transform", "translate(0," + height + ")")
    //     .call(d3.axisBottom(x));

    // // Build X scales and axis:
    // var y = d3.scaleBand()
    //     .range([ height, 0 ])
    //     .domain(eligibleActors)
    //     .padding(0.01);

    // svg.append("g")
    //     .call(d3.axisLeft(y));

    // // Build color scale
    // var myColor = d3.scaleLinear()
    //     .range(["white", "#69b3a2"])
    //     .domain([1,20]);

    // svg.selectAll()
    // .data(myData)
    //     // .data(myData, function(d) {
    //     //     return d; // d.actor + ":" + d.date;
    //     // })
    //     .enter()
    //     .append("rect")
    // .attr("x", function(d) { return x(d.date); })
    // .attr("y", function(d) { return y(d.actor); })
    //     .attr("width", x.bandwidth() )
    //     .attr("height", y.bandwidth() )
    //     .style("fill", function(d) { return myColor(d.value); } );


    // svg.append("circle")
    //     .style("stroke", "gray")
    //     .style("fill", "white")
    //     .attr("r", 40)
    //     .attr("cx", 50)
    //     .attr("cy", 50)
    //     .on("mouseover", function() {
    //         d3.select(this).style("fill", "aliceblue");
    //     })
    //     .on("mouseout", function() {
    //         d3.select(this).style("fill", "white");
    //     });

};
