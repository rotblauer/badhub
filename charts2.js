var initCharts = function() {
    console.log("initializing charts");
};

function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}

function onlyMatchQueriesEntities(value, index, self) {
    for (var i = 0; i < queryEntities.length; i++) {
        if (queryEntities[i].indexOf(value) >= 0) {
            return true;
        }
    }
    return false;
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
    }).filter(onlyUnique).filter(onlyMatchQueriesEntities);

    // 1

    var hours = [];
    for (var i = 0; i < 24; i++) {
        hours.push(i);
    }
    var paramsActorHours = {
        dom: "#dchart",
        title: "Activity Tally: Actors by Hour (shown in local time)",
        data: eligibleData,
        domain: hours,
        range: actors,
        dataDomainFn: function(data) {
            return moment(data.created_at).local().hour();
        },
        dataRangeFn: function(data) {
            return data.actor.login;
        }
    };
    buildHeatmap(paramsActorHours);

    // 2


    // https://momentjs.com/docs/#/get-set/day/ Sunday=0, Saturday=6
    var weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].reverse();
    var paramsWeekdayHours = {
        dom: "#dchart2",
        title: "Activity Tally: Weekdays by Hour (shown in local time)",
        data: eligibleData,
        domain: hours,
        range: weekdays,
        dataDomainFn: function(data) {
            return moment(data.created_at).local().hour();
        },
        dataRangeFn: function(data) {
            return weekdays[moment(data.created_at).day()];
        }
    };
    buildHeatmap(paramsWeekdayHours);

    // 3
    var days = [];
    for (var i = 30; i >= 0; i--) {
        var d = moment().subtract(i, "day").format("ddd, MMM D");
        days.push(d);
    }

    var paramsActorDates = {
        dom: "#dchart3",
        title: "Activity Tally: Actors by Date (last 30 days)",
        data: eligibleData,
        domain: days,
        range: actors,
        dataDomainFn: function(data) {
            return moment(data.created_at).format("ddd, MMM D");;
        },
        dataRangeFn: function(data) {
            return data.actor.login;
        }
    };
    buildHeatmap(paramsActorDates);

    // 4

    var uniqueEventTypes = datas.map(function(item, index) {
        return item.type;
    }).filter(onlyUnique);
    var paramsActorsEventTypes = {
        dom: "#dchart4",
        title: "Activity Tally: Actors by Event Type",
        data: eligibleData,
        domain: uniqueEventTypes,
        range: actors,
        dataDomainFn: function(data) {
            return data.type;
        },
        dataRangeFn: function(data) {
            return data.actor.login;
        }
    };
    buildHeatmap(paramsActorsEventTypes);

    didBuildCharts = true;
};
