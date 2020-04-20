var initCharts = function () {
    console.log("initializing charts");
};

function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}

function onlyMatchQueriesEntities(value, index, self) {
    for (var i = 0; i < state.queryEntities.length; i++) {
        var q = state.queryEntities[i];
        if (q.toLowerCase().includes(value.toLowerCase())) {
            return true;
        }
    }
    return false;
}

var didBuildCharts = false;

var buildCharts = function () {
    if (didBuildCharts) {
        return;
    }

    // $("#debug").text(JSON.stringify(datas.slice(0, 14), null, 4)).css({
    //     maxHeight: "80vh"
    // });

    console.log(d3.version);

    var actors = state.data
        .map(function (item, index) {
            return item.actor.login;
        })
        .filter(onlyUnique)
        .filter(onlyMatchQueriesEntities);

    // 1

    // get a tally of all actor-events
    var actorTallies = {};
    $.each(state.data, function (index, el) {
        if (typeof actorTallies[el.actor.login] === "undefined") {
            actorTallies[el.actor.login] = 1;
            return;
        }
        actorTallies[el.actor.login]++;
    });
    // so that we can sort the array by actors with the most events first
    actors = actors.sort(function (a, b) {
        return actorTallies[a] - actorTallies[b];
    });

    // --------------------------------------------------------------
    // ACTIVITY CALENDAR (Last 30 Days).

    var days = [];
    var fmt = "dddd, MMM D";
    for (var i = 30; i >= 0; i--) {
        var d = moment().subtract(i, "day").format(fmt);
        days.push(d);
    }
    var paramsActorDates = {
        dom: "chart-actor-dates",
        title: "Individual Activity by Date (last 30 days)",
        data: state.data,
        domain: actors,
        range: days,
        dataRangeFn: function (data) {
            return moment(data.created_at).format(fmt);
            ;
        },
        dataDomainFn: function (data) {
            return data.actor.login;
        },
        margin: {
            top: 200
        }
    };

    // --------------------------------------------------------------
    // 

    var hours = [];
    for (var i = 0; i < 24; i++) {
        hours.push(i);
    }
    var paramsActorHours = {
        dom: "chart-actor-hours",
        title: "Individual Workday Hours, Shown in Your Local Time (UTC" + moment().utcOffset()/60 + ")",
        data: state.data,
        domain: hours,
        range: actors,
        dataDomainFn: function (data) {
            return moment(data.created_at).local().hour();
        },
        dataRangeFn: function (data) {
            return data.actor.login;
        },
        margin: {
            top: 200
        }
    };

    // --------------------------------------------------------------

    // https://momentjs.com/docs/#/get-set/day/ Sunday=0, Saturday=6
    var weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].reverse();
    var paramsWeekdayHours = {
        dom: "chart-group-weekday-hours",
        title: "Group Weekday Hours, Shown in Your Local Time (UTC" + moment().utcOffset()/60 + ")",
        data: state.data,
        domain: hours,
        range: weekdays,
        dataDomainFn: function (data) {
            return moment(data.created_at).local().hour();
        },
        dataRangeFn: function (data) {
            return weekdays[moment(data.created_at).day()];
        },
        margin: {
            top: 200
        }
    };

    // --------------------------------------------------------------

    var events = state.data.map(function (item, index) {
        return item.type;
    }).filter(onlyUnique);

    // get a tally of all actor-events
    var eventTallies = {};
    $.each(state.data, function (index, el) {
        eventTallies[el.type] = typeof(eventTallies[el.type]) === "undefined" ? 1 : eventTallies[el.type] + 1;
        return;
    });
    // so that we can sort the array by events with the most events first
    events = events.sort(function (a, b) {
        return eventTallies[a] - eventTallies[b];
    });

    var paramsActorsEventTypes = {
        dom: "chart-individual-eventtypes",
        title: "Individual Event Types",
        data: state.data,
        range: events,
        domain: actors,
        dataRangeFn: function (data) {
            return data.type;
        },
        dataDomainFn: function (data) {
            return data.actor.login;
        },
        margin: {
            top: 200
        }
    };

    // --------------------------------------------------------------

    $("#all-charts").append($(`<div id="${paramsActorDates.dom}" style="margin-top:80px;"></div>`));
    buildHeatmap(paramsActorDates);

    $("#all-charts").append($(`<div id="${paramsActorsEventTypes.dom}" style=""></div>`));
    buildHeatmap(paramsActorsEventTypes);

    $("#all-charts").append($(`<div id="${paramsActorHours.dom}" style=""></div>`));
    buildHeatmap(paramsActorHours);

    $("#all-charts").append($(`<div id="${paramsWeekdayHours.dom}" style=""></div>`));
    buildHeatmap(paramsWeekdayHours);

    // --------------------------------------------------------------

    // for each actor, get their workaday hours
    // domain: hours
    // range: weekday
    // data: user
    for (var i = 0; i < actors.length; i++) {
        var person = actors[i];
        var personData = state.data.filter(function (val) {
            return val.actor.login == person;
        });
        var pars = {
            dom: "chart-individual-week-" + person,
            title: `Weekly: ${person}`,
            data: personData,
            range: weekdays,
            domain: hours,
            dataRangeFn: function (data) {
                return weekdays[moment(data.created_at).day()];
            },
            dataDomainFn: function (data) {
                return moment(data.created_at).local().hour();
            },
            margin: {
                top: 30,
                right: 20,
                bottom: 40,
                left: 20
            },
            xAxisDisable: true,
            yAxisDisable: true,
        };
        $("#all-charts").append($(`<div id="${pars.dom}" class="individual-workday-pattern-chart"></div>`).css({"width": "25%"}));
        buildHeatmap(pars);
    }

    // --------------------------------------------------------------
    // repositories business

    // repositories daily for last 30 days
    // domain: repositories
    // range: last 30 days
    var repositories = state.data.map(function(data) {
        if (data.repo) {
            return data.repo.name;
        }
        return;
    }).filter(onlyUnique);

    // get a tally of all repo-events
    var repoTallies = {};
    $.each(state.data, function (index, el) {
        if (!el.repo) {
            return;
        }
        if (typeof repoTallies[el.repo.name] === "undefined") {
            repoTallies[el.repo.name] = 1;
            return;
        }
        repoTallies[el.repo.name]++;
    });

    // so that we can sort the array by repos with the most events first
    repositories = repositories.sort(function (a, b) {
        return repoTallies[a] - repoTallies[b];
    });

    // --------------------------------------------------------------

    var paramsRepoDays = {
        dom: "chart-repo-days",
        title: "Repository Activity By Date (last 30 days)",
        data: state.data,
        range: days,
        domain: repositories,
        dataRangeFn: function (data) {
            return moment(data.created_at).format(fmt);
        },
        dataDomainFn: function (data) {
            return data.repo.name;
        },
        margin: {
            top: 300
        }
    };

    $("#all-charts").append($(`<div id="${paramsRepoDays.dom}" style="margin-top: 80px;"></div>`));
    var repoDaySVG = buildHeatmap(paramsRepoDays);
    repoDaySVG.selectAll("g.x.axis text").attr("font-size", "0.8em");

    // --------------------------------------------------------------

    var paramsRepoEventTypes = {
        dom: "chart-repo-event-types",
        title: "Event Type by Repository",
        data: state.data,
        domain: events,
        range: repositories,
        dataDomainFn: function (data) {
            return data.type;
        },
        dataRangeFn: function (data) {
            return data.repo.name;
        },
        margin: {
            top: 300
        }
    };

    $("#all-charts").append($(`<div id="${paramsRepoEventTypes.dom}"></div>`));
    buildHeatmap(paramsRepoEventTypes);

    // --------------------------------------------------------------

    var paramsRepoActor = {
        dom: "chart-repo-actor",
        title: "Individual Activity by Repository",
        data: state.data,
        domain: actors,
        dataDomainFn: function (data) {
            return data.actor.login;
        },
        range: repositories,
        dataRangeFn: function (data) {
            return data.repo.name || "";
        },
        margin: {
            top: 300
        }
    };

    $("#all-charts").append($(`<div id="${paramsRepoActor.dom}"></div>`));
    buildHeatmap(paramsRepoActor);

    didBuildCharts = true;
};
