// Create chart instance
var chart = am4core.create("chartdiv", am4charts.XYChart);

// Initialize data
chart.data = [{
    "name": "",
    "value": 0,
    "color": chart.colors.next(),
    "bullet": ""
}, {
    "name": "",
    "value": 0,
    "color": chart.colors.next(),
    "bullet": ""
}, {
    "name": "",
    "value": 0,
    "color": chart.colors.next(),
    "bullet": ""
}, {
    "name": "",
    "value": 0,
    "color": chart.colors.next(),
    "bullet": ""
},{
    "name": "",
    "value": 0,
    "color": chart.colors.next(),
    "bullet": ""
}];

// Create axes
var categoryAxis = chart.xAxes.push(new am4charts.CategoryAxis());
categoryAxis.dataFields.category = "name";
categoryAxis.renderer.grid.template.disabled = true;
categoryAxis.renderer.minGridDistance = 30;
categoryAxis.renderer.inside = false;
categoryAxis.renderer.labels.template.fill = am4core.color("#000");
categoryAxis.renderer.labels.template.fontSize = 12;

var valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
valueAxis.renderer.grid.template.strokeDasharray = "4,4";
valueAxis.renderer.labels.template.disabled = false;
valueAxis.min = 0;
valueAxis.max = DEFAULT_MAX;

// Do not crop bullets
chart.maskBullets = false;

// Remove padding
chart.paddingBottom = 0;

// Create series
var series = chart.series.push(new am4charts.ColumnSeries());
series.dataFields.valueY = "value";
series.dataFields.categoryX = "name";
series.columns.template.propertyFields.fill = "color";
series.columns.template.propertyFields.stroke = "color";
series.columns.template.column.cornerRadiusTopLeft = 15;
series.columns.template.column.cornerRadiusTopRight = 15;
series.columns.template.tooltipText = "{categoryX}: [bold]{valueY}[/b]";


// Add bullets
var bullet = series.bullets.push(new am4charts.Bullet());
var image = bullet.createChild(am4core.Image);
image.horizontalCenter = "middle";
image.verticalCenter = "bottom";
image.dy = 20;
image.y = am4core.percent(100);
image.propertyFields.href = "bullet";
image.tooltipText = series.columns.template.tooltipText;
image.propertyFields.fill = "color";
image.filters.push(new am4core.DropShadowFilter());

chart.tapToActivate = false;