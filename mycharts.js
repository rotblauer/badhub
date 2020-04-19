// https://stackoverflow.com/a/1484507/4401322
function random_color(format) {
    var rint = Math.floor(0x100000000 * Math.random());
    switch (format) {
        case 'hex':
            return '#' + ('00000' + rint.toString(16)).slice(-6).toUpperCase();
        case 'hexa':
            return '#' + ('0000000' + rint.toString(16)).slice(-8).toUpperCase();
        case 'rgb':
            return 'rgb(' + (rint & 255) + ',' + (rint >> 8 & 255) + ',' + (rint >> 16 & 255) + ')';
        case 'rgba':
            return 'rgba(' + (rint & 255) + ',' + (rint >> 8 & 255) + ',' + (rint >> 16 & 255) + ', 0.8)'; //  + (rint >> 24 & 255)/255 + ')'
        default:
            return rint;
    }
}

// Hash any string into an integer value
// Then we'll use the int and convert to hex.
function hashCode(str) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
}

// Convert an int to hexadecimal with a max length
// of six characters.
function intToARGB(i) {
    var hex = ((i>>24)&0xFF).toString(16) +
            ((i>>16)&0xFF).toString(16) +
            ((i>>8)&0xFF).toString(16) +
            (i&0xFF).toString(16);
    // Sometimes the string returned will be too short so we 
    // add zeros to pad it out, which later get removed if
    // the length is greater than six.
    hex += '000000';
    return hex.substring(0, 6);
}

// Extend the string type to allow converting to hex for quick access.
String.prototype.toHexColour = function() {
    return intToARGB(hashCode(this));
}

var assignedColors = {
    actor: {},
    repo: {},
    event: {},
};

var config = {
    type: 'bar',
    data: {
        labels: [],
        datasets: []
    },
    options: {
        legend: {
            position: 'left',
        },
        title: {
            display: true,
            text: 'EventTypes/Actors'
        },
        scales: {
            xAxes: [{
                stacked: true
            }],
            yAxes: [{
                stacked: true
            }]
        }
        // scale: {
        // 	ticks: {
        // 		beginAtZero: true
        // 	}
        // }
    }
};

var getExistingOrRandomColor = function (entityType, entity) {
    var set = assignedColors[entityType][entity];
    if (set) {
        return set;
    }
    var n = "#" + (entityType+entity).toHexColour();
    // var n = random_color("hex");
    assignedColors[entityType][entity] = n;
    return n;
};

var addEventTypeUserData = function (data) {
    var eventIndex = config.data.labels.indexOf(data.type.replace("Event", ""));
    if (eventIndex < 0) {
        config.data.labels.push(data.type.replace("Event", ""));
        eventIndex = config.data.labels.length - 1;
    }
    // get if user already has a dataset
    var userEventIndex = -1;
    for (var i = 0; i < config.data.datasets.length; i++) {
        if (config.data.datasets[i].label === data.actor.login) {
            userEventIndex = i;
            break;
        }
    }
    if (userEventIndex < 0) {
        var color = getExistingOrRandomColor("actor", data.actor.login);
        var colorLight = color;
        var colorBold = color;
        config.data.datasets.push({
            label: data.actor.login,
            backgroundColor: colorLight, // TODO
            borderColor: colorBold,
            pointBackgroundColor: colorBold,
            data: []
            // hidden: true
        })
        userEventIndex = config.data.datasets.length - 1;
    }
    for (var i = 0; i < config.data.datasets.length; i++) {
        if (config.data.labels.length > config.data.datasets[i].data.length) {
            // get length diff
            var lenDiff = config.data.labels.length - config.data.datasets[i].data.length;
            for (var j = 0; j < lenDiff; j++) {
                config.data.datasets[i].data.push(0);
            }
        }
    }
    config.data.datasets[userEventIndex].data[eventIndex]++;
    window.eventTypesActorsChart.update();
};

var config2 = {
    type: 'bar',
    data: {
        labels: [],
        datasets: []
    },
    options: {
        legend: {
            position: 'top',
        },
        title: {
            display: true,
            text: 'EventTypes/Repos'
        },
        scales: {
            xAxes: [{
                stacked: true
            }],
            yAxes: [{
                stacked: true
            }]
        }
        // scale: {
        // 	ticks: {
        // 		beginAtZero: true
        // 	}
        // }
    }
};

var addEventTypeRepoData = function (data) {
    var eventIndex = config2.data.labels.indexOf(data.type.replace("Event", ""));
    if (eventIndex < 0) {
        config2.data.labels.push(data.type.replace("Event", ""));
        eventIndex = config2.data.labels.length - 1;
    }
    // get if user already has a dataset
    var userEventIndex = -1;
    for (var i = 0; i < config2.data.datasets.length; i++) {
        if (config2.data.datasets[i].label === data.repo.name) {
            userEventIndex = i;
            break;
        }
    }
    if (userEventIndex < 0) {
        var color = getExistingOrRandomColor("repo", data.repo.name);
        var colorLight = color;
        var colorBold = color;
        config2.data.datasets.push({
            label: data.repo.name,
            backgroundColor: colorLight, // TODO
            borderColor: colorBold,
            pointBackgroundColor: colorBold,
            data: [],
            hidden: data.repo.name.indexOf(data.actor.login) >= 0
        })
        userEventIndex = config2.data.datasets.length - 1;
    }
    for (var i = 0; i < config2.data.datasets.length; i++) {
        if (config2.data.labels.length > config2.data.datasets[i].data.length) {
            // get length diff
            var lenDiff = config2.data.labels.length - config2.data.datasets[i].data.length;
            for (var j = 0; j < lenDiff; j++) {
                config2.data.datasets[i].data.push(0);
            }
        }
    }
    config2.data.datasets[userEventIndex].data[eventIndex]++;
    window.eventTypesReposChart.update();
};

var config3 = {
    type: 'bar',
    data: {
        labels: [],
        datasets: []
    },
    options: {
        legend: {
            position: 'left',
        },
        title: {
            display: true,
            text: 'Actors/EventTypes'
        },
        scales: {
            xAxes: [{
                stacked: true
            }],
            yAxes: [{
                stacked: true
            }]
        }
        // scale: {
        // 	ticks: {
        // 		beginAtZero: true
        // 	}
        // }
    }
};

// addUserEventTypeData
var addUserEventTypeData = function (data) {

    var eventType = data.type.replace("Event", "");
    var actor = data.actor.login;

    var actorIndex = config3.data.labels.indexOf(actor);
    if (actorIndex < 0) {
        config3.data.labels.push(actor);
        actorIndex = config3.data.labels.length - 1;
    }

    var eventTypeIndex = -1;
    for (var i = 0; i < config3.data.datasets.length; i++) {
        if (config3.data.datasets[i].label == eventType) {
            eventTypeIndex = i;
            break;
        }
    }
    if (eventTypeIndex < 0) {
        var color = getExistingOrRandomColor("event", eventType);
        var colorLight = color;
        var colorBold = color;

        config3.data.datasets.push({
            label: eventType,
            backgroundColor: colorLight, // TODO
            borderColor: colorBold,
            pointBackgroundColor: colorBold,
            data: []
        });
        eventTypeIndex = config3.data.datasets.length - 1;
    }

    for (var i = 0; i < config3.data.datasets.length; i++) {
        if (config3.data.labels.length > config3.data.datasets[i].data.length) {
            // get length diff
            var lenDiff = config3.data.labels.length - config3.data.datasets[i].data.length;
            for (var j = 0; j < lenDiff; j++) {
                config3.data.datasets[i].data.push(0);
            }
        }
    }

    config3.data.datasets[eventTypeIndex].data[actorIndex]++;
    window.actorsEventTypesChart.update();
  };

var setupCharts = function () {
    window.eventTypesActorsChart = new Chart(document.getElementById('chart-eventType-user'), config);
    window.actorsEventTypesChart = new Chart(document.getElementById('chart-user-eventType'), config3);
    window.eventTypesReposChart = new Chart(document.getElementById('chart-eventType-repo'), config2);
};
