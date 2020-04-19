var initCharts = function() {
    console.log("initializing charts");
};

function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}

var didBuildCharts = false;

var buildCharts = function() {
    if (didBuildCharts) {
        return;
    }

    // references the global
    var datas = eligibleData;

    // $("#debug").text(JSON.stringify(datas.slice(0, 14), null, 4)).css({
    //     maxHeight: "80vh"
    // });

    console.log(d3.version);

    var actors = datas.map(function(item, index) {
        return item.actor.login;
    }).filter(onlyUnique);

    // 1

    var hours = [];
    for (var i = 0; i < 24; i++) {
        hours.push(i);
    }

    buildHeatmap("#dchart", "Activity Tally: Actors by Hour (shown in local time)", datas, hours, actors, function(data) {
        return moment(data.created_at).local().hour();
    }, function(data) {
        return data.actor.login;
    });

    // 2

    // https://momentjs.com/docs/#/get-set/day/ Sunday=0, Saturday=6
    var weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].reverse();
    buildHeatmap("#dchart2", "Activity Tally: Weekdays by Hours (shown in local time)", datas, hours, weekdays, function(data) {
        return moment(data.created_at).local().hour();
    }, function(data) {
        return weekdays[moment(data.created_at).day()];
    });

    var days = [];
    for (var i = 30; i >= 0; i--) {
        var d = moment().subtract(i, "day").format("ddd, MMM D");
        days.push(d);
    }
    buildHeatmap("#dchart3", "Activity Tally: Actors by Dates (last 30 days)", datas, days, actors, function(data) {
        return moment(data.created_at).format("ddd, MMM D");;
    }, function(data) {
        return data.actor.login;
    });


    var uniqueEventTypes = datas.map(function(item, index) {
        return item.type;
    }).filter(onlyUnique);
    buildHeatmap("#dchart4", "Activity Tally: Actors by Event Types", datas, uniqueEventTypes, actors, function(data) {
        return data.type;
    }, function(data) {
        return data.actor.login;
    });

    didBuildCharts = true;
};
