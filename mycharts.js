
// https://stackoverflow.com/a/1484507/4401322
function random_color( format ){
	var rint = Math.floor( 0x100000000 * Math.random());
	switch( format ){
	  case 'hex':
		return '#' + ('00000'   + rint.toString(16)).slice(-6).toUpperCase();
	  case 'hexa':
		return '#' + ('0000000' + rint.toString(16)).slice(-8).toUpperCase();
	  case 'rgb':
		return 'rgb('  + (rint & 255) + ',' + (rint >> 8 & 255) + ',' + (rint >> 16 & 255) + ')';
	  case 'rgba':
		return 'rgba(' + (rint & 255) + ',' + (rint >> 8 & 255) + ',' + (rint >> 16 & 255) + ', 0.8)'; //  + (rint >> 24 & 255)/255 + ')'
	  default:
		return rint;
	}
}

var config = {
	type: 'bar',
	data: {
		labels: [
		],
		datasets: [
		]
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

var addEventTypeUserData = function (data) {
	var eventIndex = config.data.labels.indexOf(data.type.replace("Event", ""));
	if (eventIndex < 0) {
		config.data.labels.push(data.type.replace("Event", ""));
		eventIndex = config.data.labels.length-1;
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
		var color = random_color("hex");
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
		userEventIndex = config.data.datasets.length-1;
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
	window.myRadar.update();
};

var config2 = {
	type: 'bar',
	data: {
		labels: [
		],
		datasets: [
		]
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
		eventIndex = config2.data.labels.length-1;
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
		var color = random_color("hex");
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
		userEventIndex = config2.data.datasets.length-1;
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
	window.myOtherRadar.update();
};


// var config3 = {
// 	type: 'bar',
// 	data: {
// 		labels: [
// 		],
// 		datasets: [
// 		]
// 	},
// 	options: {
// 		legend: {
// 			position: 'top',
// 		},
// 		title: {
// 			display: true,
// 			text: 'Actors/Time'
// 		},
// 		scales: {
//             xAxes: [{
//                 stacked: true
//             }],
//             yAxes: [{
//                 stacked: true
//             }]
//         }
// 		// scale: {
// 		// 	ticks: {
// 		// 		beginAtZero: true
// 		// 	}
// 		// }
// 	}
// };

// var addEventTypeRepoData = function (data) {
// 	var eventIndex = config3.data.labels.indexOf(data.type.replace("Event", ""));
// 	if (eventIndex < 0) {
// 		config3.data.labels.push(data.type.replace("Event", ""));
// 		eventIndex = config3.data.labels.length-1;
// 	}
// 	// get if user already has a dataset
// 	var userEventIndex = -1;
// 	for (var i = 0; i < config3.data.datasets.length; i++) {
// 		if (config3.data.datasets[i].label === data.repo.name) {
// 			userEventIndex = i;
// 			break;
// 		}
// 	}
// 	if (userEventIndex < 0) {
// 		var color = random_color("hex");
// 		var colorLight = color;
// 		var colorBold = color;
// 		config3.data.datasets.push({
// 			label: data.repo.name,
// 			backgroundColor: colorLight, // TODO
// 			borderColor: colorBold,
// 			pointBackgroundColor: colorBold,
// 			data: [],
// 			hidden: data.repo.name.indexOf(data.actor.login) >= 0
// 		})
// 		userEventIndex = config3.data.datasets.length-1;
// 	}
// 	for (var i = 0; i < config3.data.datasets.length; i++) {
// 		if (config3.data.labels.length > config3.data.datasets[i].data.length) {
// 			// get length diff
// 			var lenDiff = config3.data.labels.length - config3.data.datasets[i].data.length;
// 			for (var j = 0; j < lenDiff; j++) {
// 				config3.data.datasets[i].data.push(0);
// 			}
// 		}
// 	}
// 	config3.data.datasets[userEventIndex].data[eventIndex]++;
// 	window.myOtherRadar.update();
// };


var setupCharts = function () {
	window.myRadar = new Chart(document.getElementById('chart-eventType-user'), config);
	window.myOtherRadar = new Chart(document.getElementById('chart-eventType-repo'), config2);
	// document.getElementById('randomizeData').addEventListener('click', function () {
	// 	config.data.datasets.forEach(function (dataset) {
	// 		dataset.data = dataset.data.map(function () {
	// 			return randomScalingFactor();
	// 		});
	// 	});

	// 	window.myRadar.update();
	// });
};

// var colorNames = Object.keys(window.chartColors);

// document.getElementById('addDataset').addEventListener('click', function () {
// 	var colorName = colorNames[config.data.datasets.length % colorNames.length];
// 	var newColor = window.chartColors[colorName];

// 	var newDataset = {
// 		label: 'Dataset ' + config.data.datasets.length,
// 		borderColor: newColor,
// 		backgroundColor: color(newColor).alpha(0.2).rgbString(),
// 		pointBorderColor: newColor,
// 		data: [],
// 	};

// 	for (var index = 0; index < config.data.labels.length; ++index) {
// 		newDataset.data.push(randomScalingFactor());
// 	}

// 	config.data.datasets.push(newDataset);
// 	window.myRadar.update();
// });

// document.getElementById('addData').addEventListener('click', function () {
// 	if (config.data.datasets.length > 0) {
// 		config.data.labels.push('dataset #' + config.data.labels.length);

// 		config.data.datasets.forEach(function (dataset) {
// 			dataset.data.push(randomScalingFactor());
// 		});

// 		window.myRadar.update();
// 	}
// });

// document.getElementById('removeDataset').addEventListener('click', function () {
// 	config.data.datasets.splice(0, 1);
// 	window.myRadar.update();
// });

// document.getElementById('removeData').addEventListener('click', function () {
// 	config.data.labels.pop(); // remove the label first

// 	config.data.datasets.forEach(function (dataset) {
// 		dataset.data.pop();
// 	});

// 	window.myRadar.update();
// });