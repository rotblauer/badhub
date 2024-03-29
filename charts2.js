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
            top: 200,
            // right: 300
        }
    };

    $("#all-charts").append($(`<div id="${paramsActorDates.dom}" style="margin-top:80px;"></div>`));
    buildHeatmap(paramsActorDates);

    // --------------------------------------------------------------

    var events = state.data.map(function (item, index) {
        return item.type;
    }).filter(onlyUnique);

    // get a tally of all actor-events
    var eventTallies = {};
    $.each(state.data, function (index, el) {
        eventTallies[el.type] = typeof (eventTallies[el.type]) === "undefined" ? 1 : eventTallies[el.type] + 1;
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

    $("#all-charts").append($(`<div id="${paramsActorsEventTypes.dom}" style=""></div>`));
    buildHeatmap(paramsActorsEventTypes);

    // --------------------------------------------------------------
    // repositories business

    // repositories daily for last 30 days
    // domain: repositories
    // range: last 30 days
    var repositories = state.data.map(function (data) {
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

    // Truncate repositories charted to the most active 25.
    if (repositories.length > 25) {
        repositories = repositories.slice(repositories.length - 26, repositories.length - 1)
    }

    // --------------------------------------------------------------

    var paramsRepoActor = {
        dom: "chart-repo-actor",
        title: "Individual Activity by Repository (top 25 repos)",
        data: state.data,
        domain: actors,
        dataDomainFn: function (data) {
            return data.actor.login;
        },
        range: repositories, // truncate repositories list to 25
        dataRangeFn: function (data) {
            return data.repo.name || "";
        },
        margin: {
            top: 300
        }
    };

    $("#all-charts").append($(`<div id="${paramsRepoActor.dom}"></div>`));
    buildHeatmap(paramsRepoActor);

    // --------------------------------------------------------------

    var paramsRepoEventTypes = {
        dom: "chart-repo-event-types",
        title: "Group Repository Activity by Event Types (top 25 repos)",
        data: state.data,
        domain: repositories, // truncate repositories list to 25
        dataDomainFn: function (data) {
            return data.repo.name || "";
        },
        range: events,
        dataRangeFn: function (data) {
            return data.type;
        },
        margin: {
            top: 400
        }
    };

    $("#all-charts").append($(`<div id="${paramsRepoEventTypes.dom}"></div>`));
    buildHeatmap(paramsRepoEventTypes);

    // --------------------------------------------------------------

    var paramsRepoDays = {
        dom: "chart-repo-days",
        title: "Group Repository Activity By Date (top 25 repos)",
        data: state.data,
        domain: repositories, // truncate repositories list to 25
        dataDomainFn: function (data) {
            return data.repo.name || "";
        },
        range: days,
        dataRangeFn: function (data) {
            return moment(data.created_at).format(fmt);
        },
        margin: {
            top: 400
        }
    };

    $("#all-charts").append($(`<div id="${paramsRepoDays.dom}" style="margin-top: 80px;"></div>`));
    var repoDaySVG = buildHeatmap(paramsRepoDays);
    // repoDaySVG.selectAll("g.x.axis text").attr("font-size", "0.8em");


    // --------------------------------------------------------------

    var hours = [];
    for (var i = 0; i < 24; i++) {
        hours.push(i);
    }

    // https://momentjs.com/docs/#/get-set/day/ Sunday=0, Saturday=6
    var weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].reverse();
    var paramsWeekdayHours = {
        dom: "chart-group-weekday-hours",
        title: "Group Weekday Hours, Shown in Your Local Time (UTC" + moment().utcOffset() / 60 + ")",
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

    $("#all-charts").append($(`<div id="${paramsWeekdayHours.dom}" style=""></div>`));
    buildHeatmap(paramsWeekdayHours);

    // --------------------------------------------------------------
    //

    var paramsActorHours = {
        dom: "chart-actor-hours",
        title: "Individual Workday Hours, Shown in Your Local Time (UTC" + moment().utcOffset() / 60 + ")",
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

    $("#all-charts").append($(`<div id="${paramsActorHours.dom}" style=""></div>`));
    buildHeatmap(paramsActorHours);


    // --------------------------------------------------------------

    // for each actor, get their workaday hours
    // domain: hours
    // range: weekday
    // data: user
    var individualWeedkayCalendarHolder = $("<div></div>").css({"margin-right": "100px"});
    individualWeedkayCalendarHolder.append($("<p>Individual Workday Hours</p>").css({
        "font-size": "16px",
        "font-weight": "bold",
        "margin-left": 20
    }));
    $("#all-charts").append(individualWeedkayCalendarHolder);
    for (var i = 0; i < actors.length; i++) {
        var person = actors[i];
        var personData = state.data.filter(function (val) {
            return val.actor.login == person;
        });
        var pars = {
            dom: "chart-individual-week-" + person,
            title: `${person}`,
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
        individualWeedkayCalendarHolder.append($(`<div id="${pars.dom}" class="individual-workday-pattern-chart"></div>`));
        buildHeatmap(pars);
    }

    didBuildCharts = true;
};
