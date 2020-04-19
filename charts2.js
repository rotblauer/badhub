
var initCharts = function() {
    console.log("initializing charts");
};
var buildCharts = function (datas) {
    console.log("building charts, len data", datas.length);
    $(".heatmap #debug").text(JSON.stringify(datas, null, 4)).css({maxHeight: "80vh"});
};
