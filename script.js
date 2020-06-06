var data;

const cantons = ['AG', 'AI', 'AR', 'BE', 'BL', 'BS', 'FR', 'GE', 'GL', 'GR', 'JU', 'LU', 'NE', 'NW', 'OW', 'SG', 'SH', 'SO', 'SZ', 'TG', 'TI', 'UR', 'VD', 'VS', 'ZG', 'ZH', 'FL'];

const names = {
  101: "Affoltern",
  102: "Andelfingen",
  103: "Bülach",
  104: "Dielsdorf",
  105: "Hinwil",
  106: "Horgen",
  107: "Meilen",
  108: "Pfäffikon",
  109: "Uster",
  110: "Winterthur",
  111: "Dietikon",
  112: "Zürich"
};

const colors2 = ["#a6cee3","#b2df8a","#33a02c","#fb9a99","#e31a1c","#fdbf6f","#ff7f00","#cab2d6","#6a3d9a","#ffff99","#b15928","#1f78b4"];
//["#8dd3c7","#ffffb3","#bebada","#fb8072","#80b1d3","#fdb462","#b3de69","#fccde5","#d9d9d9","#bc80bd","#ccebc5","#ffed6f"]
/*
const oldColors = {
  101: "#00876c",
  102: "#479972",
  103: "#6fab79",
  104: "#94bd83",
  105: "#b9ce91",
  106: "#dcdfa1",
  107: "#fff1b5",
  108: "#f9d796",
  109: "#f4bb7b",
  110: "#ee9f67",
  111: "#e88159",
  112: "#e06152",
  113: "#d43d51" //Extra color...
};
*/
const cartesianAxesTypes = {
  LINEAR: 'linear',
  LOGARITHMIC: 'logarithmic'
};

var verbose = false;
var actualData = [];
var actualDeaths = [];
var actualHospitalisation = [];
var data = [];
Chart.defaults.global.defaultFontFamily = "IBM Plex Sans";
document.getElementById("loaded").style.display = 'none';

//setLanguageNav();

getCantonZH();
getBezirke();

function getCantonZH() {
  var url = 'https://raw.githubusercontent.com/openZH/covid_19/master/fallzahlen_kanton_total_csv_v2/COVID19_Fallzahlen_Kanton_ZH_total.csv';
  d3.csv(url, function(error, csvdata) {
    barChartZH(csvdata);
    barChartZHDeaths(csvdata);
    barChartHospitalisations('ZH', csvdata);
    document.getElementById("loadingspinner").style.display = 'none';
    document.getElementById("loaded").style.display = 'block';
  });
}

function getBezirke() {
  var url = 'https://raw.githubusercontent.com/openZH/covid_19/master/fallzahlen_bezirke/fallzahlen_kanton_ZH_bezirk.csv';
  d3.csv(url, function(error, csvdata) {
    chartBezirke(csvdata);
    chartBezirkeDeaths(csvdata)
  });
}

Chart.Tooltip.positioners.custom = function(elements, eventPosition) { //<-- custom is now the new option for the tooltip position
    /** @type {Chart.Tooltip} */
    var tooltip = this;

    /* ... */

    var half = eventPosition.x - 81 - 10;
    if(half< 81 + 60) half = 81 + 60;
    return {
        x: half,
        y: 30
    };
}

function barChartZH(data) {
  var place = "ZH";
  var filteredData = data.filter(function(d) { if(d.abbreviation_canton_and_fl==place) return d});
  if(!filteredData || filteredData.length<2) return;
  var moreFilteredData = filteredData.filter(function(d) { if(d.ncumul_conf!="") return d});
  var dateLabels = moreFilteredData.map(function(d) {
    var dateSplit = d.date.split("-");
    var day = parseInt(dateSplit[2]);
    var month = parseInt(dateSplit[1])-1;
    var year = parseInt(dateSplit[0]);
    var date = new Date(year,month,day);
    return date;
  });
  var div = document.getElementById("container_ZH");
  var canvas = document.getElementById("zh");
  div.scrollLeft = 1700;
  var cases = moreFilteredData.map(function(d) {return d.ncumul_conf});
  var chart = new Chart('zh', {
    type: 'line',
    options: {
      layout: {
          padding: {
              right: 20
          }
      },
      responsive: false,
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Bestätigte Fälle'
      },
      tooltips: {
        mode: 'index',
        intersect: false,
        bodyFontFamily: 'IBM Plex Mono',
        callbacks: {
          label: function(tooltipItems, data) {
            var value = tooltipItems.value;
            var index = tooltipItems.index;
            var changeStr = "";
            if(index>0) {
                var change = parseInt(value)-parseInt(cases[index-1]);
                var label = change>0 ? "+"+change : change;
                changeStr = " ("+label+")";
            }
            return value+changeStr;
          }
        }
      },
      scales: getScales(),
      plugins: {
        datalabels: getDataLabels()
      }
  },
  data: {
    labels: dateLabels,
    datasets: [
      {
        data: cases,
        fill: false,
        cubicInterpolationMode: 'monotone',
        spanGaps: true,
        borderColor: '#F15F36',
        backgroundColor: '#F15F36',
        datalabels: {
          align: 'end',
          anchor: 'end'
        }
      }
    ]
  }
});

addAxisButtons(canvas, chart);

}

function barChartZHDeaths(data) {
  var place = "ZH";
  var filteredData = data.filter(function(d) { if(d.abbreviation_canton_and_fl==place) return d});
  if(!filteredData || filteredData.length<2) return;
  var moreFilteredData = filteredData.filter(function(d) { if(d.ncumul_deceased!="") return d});
  var dateLabels = moreFilteredData.map(function(d) {
    var dateSplit = d.date.split("-");
    var day = parseInt(dateSplit[2]);
    var month = parseInt(dateSplit[1])-1;
    var year = parseInt(dateSplit[0]);
    var date = new Date(year,month,day);
    return date;
  });
  var div = document.getElementById("container_"+place);
  var canvas = document.createElement("canvas");
  canvas.id = "death"+place;
  canvas.height=250;
  div.appendChild(canvas);
  var cases = moreFilteredData.map(function(d) {return d.ncumul_deceased});
  var chart = new Chart(canvas.id, {
    type: 'line',
    options: {
      layout: {
          padding: {
              right: 20
          }
      },
      responsive: false,
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Todesfälle'
      },
      tooltips: {
        mode: 'index',
        intersect: false,
        bodyFontFamily: 'IBM Plex Mono',
        callbacks: {
          label: function(tooltipItems, data) {
            var value = tooltipItems.value;
            var index = tooltipItems.index;
            var changeStr = "";
            if(index>0) {
                var change = parseInt(value)-parseInt(cases[index-1]);
                var label = change>0 ? "+"+change : change;
                changeStr = " ("+label+")";
            }
            return value+changeStr;
          }
        }
      },
      scales: getScales(),
      plugins: {
        datalabels: getDataLabels()
      }
  },
  data: {
    labels: dateLabels,
    datasets: [
      {
        data: cases,
        fill: false,
        cubicInterpolationMode: 'monotone',
        spanGaps: true,
        borderColor: inDarkMode() ? 'rgba(150, 150, 150, 1)' : '#010101',
        backgroundColor: inDarkMode() ? 'rgba(150, 150, 150, 1)' : '#010101',
        datalabels: {
          align: 'end',
          anchor: 'end'
        }
      }
    ]
  }
});

addAxisButtons(canvas, chart);

}

function chartBezirke(data) {
  var place = "bezirke";
  var section = document.getElementById("detail");
  var article = document.createElement("article");
  article.id="detail_"+place;
  var h3 = document.createElement("h3");
  //h3.className = "flag "+place;
  var text = document.createTextNode("Fallzahlen Bezirke");
  h3.appendChild(text);
  var a = document.createElement("a");
  a.href = "#top";
  a.innerHTML = "&#x2191;&#xFE0E;";
  a.className = "toplink";
  h3.appendChild(a);
  article.appendChild(h3);
  var div = document.createElement("div");
  div.className = "canvas-dummy";
  div.id = "container_"+place;
  var canvas = document.createElement("canvas");
  canvas.id = place;
  canvas.height=400;
  div.appendChild(canvas);
  article.appendChild(div);
  section.appendChild(article);
  div.scrollLeft = 1700;
  var datasets = [];
  var labels;
  for(var i=101; i<=112; i++) {
    var filtered = data.filter(function(d) { if(d.DistrictId==i) return d});
    labels = filtered.map(function(d) {return d.Week});
    var cases = filtered.map(function(d) {return d.TotalConfCases});
    datasets.push({
      label: names[i],
      data: cases,
      fill: false,
      cubicInterpolationMode: 'monotone',
      spanGaps: true,
      borderColor: colors2[i-101],
      backgroundColor: colors2[i-101],
      datalabels: {
        align: 'end',
        anchor: 'end'
      }
    });
  }

  var chart = new Chart(canvas.id, {
    type: 'line',
    options: {
      responsive: false,
      layout: {
          padding: {
              right: 20
          }
      },
      legend: {
        display: true,
        position: 'bottom'
      },
      title: {
        display: true,
        text: 'Bestätigte Fälle nach Bezirk'
      },
      tooltips: {
        mode: 'index',
        intersect: false,
        bodyFontFamily: 'IBM Plex Mono',
        itemSort: (a, b, data) => b.yLabel - a.yLabel,
        callbacks: {
          label: function(tooltipItems, data) {
            var value = tooltipItems.value;
            var index = tooltipItems.index;
            var datasetIndex = tooltipItems.datasetIndex;
            var changeStr = "";
            var title = data.datasets[datasetIndex].label+": ";
            var titletabbing = 19-title.length;
            var titlepadding = " ".repeat(titletabbing);
            if(index>0) {
                var change = parseInt(value)-parseInt(data.datasets[datasetIndex].data[index-1]);
                var label = change>0 ? "+"+change : change;
                changeStr = " ("+label+")";
                if(Number.isNaN(change)) changeStr = "";
            }
            var tabbing = 4-value.length;
            var padding = " ".repeat(tabbing);
            return title+titlepadding+value+padding+changeStr;
          }
        }
      },
      scales: getWeekScales(),
      plugins: {
        datalabels: false
      }
    },
    data: {
      labels: labels,
      datasets: datasets
    }
  });

  addAxisButtons(canvas, chart);
}

function chartBezirkeDeaths(data) {
  var place = "bezirke";
  var div = document.getElementById("container_"+place);
  var canvas = document.createElement("canvas");
  canvas.id = place+"deaths";
  canvas.height=400;
  div.appendChild(canvas);
  div.scrollLeft = 1700;
  var datasets = [];
  var labels;
  for(var i=101; i<=112; i++) {
    var filtered = data.filter(function(d) { if(d.DistrictId==i) return d});
    labels = filtered.map(function(d) {return d.Week});
    var cases = filtered.map(function(d) {return d.TotalDeaths});
    datasets.push({
      label: names[i],
      data: cases,
      fill: false,
      cubicInterpolationMode: 'monotone',
      spanGaps: true,
      borderColor: colors2[i-101],
      backgroundColor: colors2[i-101],
      datalabels: {
        align: 'end',
        anchor: 'end'
      }
    });
  }

  var chart = new Chart(canvas.id, {
    type: 'line',
    options: {
      responsive: false,
      layout: {
          padding: {
              right: 20
          }
      },
      legend: {
        display: true,
        position: 'bottom'
      },
      title: {
        display: true,
        text: 'Todesfälle nach Bezirk'
      },
      tooltips: {
        mode: 'index',
        intersect: false,
        bodyFontFamily: 'IBM Plex Mono',
        itemSort: (a, b, data) => b.yLabel - a.yLabel,
        callbacks: {
          label: function(tooltipItems, data) {
            var value = tooltipItems.value;
            var index = tooltipItems.index;
            var datasetIndex = tooltipItems.datasetIndex;
            var changeStr = "";
            var title = data.datasets[datasetIndex].label+": ";
            var titletabbing = 19-title.length;
            var titlepadding = " ".repeat(titletabbing);
            if(index>0) {
                var change = parseInt(value)-parseInt(data.datasets[datasetIndex].data[index-1]);
                var label = change>0 ? "+"+change : change;
                changeStr = " ("+label+")";
                if(Number.isNaN(change)) changeStr = "";
            }
            var tabbing = 4-value.length;
            var padding = " ".repeat(tabbing);
            return title+titlepadding+value+padding+changeStr;
          }
        }
      },
      scales: getWeekScales(),
      plugins: {
        datalabels: false
      }
    },
    data: {
      labels: labels,
      datasets: datasets
    }
  });

  addAxisButtons(canvas, chart);
}

function barChartCases(place) {
  var filteredData = data.filter(function(d) { if(d.abbreviation_canton_and_fl==place) return d});
  var section = document.getElementById("detail");
  var article = document.createElement("article");
  article.id="detail_"+place;
  var h3 = document.createElement("h3");
  h3.className = "flag "+place;
  var text = document.createTextNode(_(names[place]));
  h3.appendChild(text);
  var a = document.createElement("a");
  a.href = "#top";
  a.innerHTML = "&#x2191;&#xFE0E;";
  a.className = "toplink";
  h3.appendChild(a);
  article.appendChild(h3);
  var div = document.createElement("div");
  div.className = "canvas-dummy";
  div.id = "container_"+place;
  var canvas = document.createElement("canvas");
  //canvas.className  = "myClass";
  if(filteredData.length==0) {
    div.appendChild(document.createTextNode(_("Keine Daten")));
  }
  else if(filteredData.length==1) {
    div.appendChild(document.createTextNode(_("Ein Datensatz")+": "+filteredData[0].ncumul_conf+" " + _("Fälle am")+" "+filteredData[0].date));
  }
  else {
    canvas.id = place;
    canvas.height=250;
    //canvas.width=350+filteredData.length*40;
    div.appendChild(canvas);
  }
  article.appendChild(div);
  section.appendChild(article);
  div.scrollLeft = 1700;
  if(!filteredData || filteredData.length<2) return;
  var moreFilteredData = filteredData.filter(function(d) { if(d.ncumul_conf!="") return d});
  var dateLabels = moreFilteredData.map(function(d) {
    var dateSplit = d.date.split("-");
    var day = parseInt(dateSplit[2]);
    var month = parseInt(dateSplit[1])-1;
    var year = parseInt(dateSplit[0]);
    var date = new Date(year,month,day);
    return date;
  });
  var cases = moreFilteredData.map(function(d) {return d.ncumul_conf});
  var chart = new Chart(canvas.id, {
    type: 'line',
    options: {
      layout: {
          padding: {
              right: 20
          }
      },
      responsive: false,
      legend: {
        display: false
      },
      title: {
        display: true,
        text: _('Bestätigte Fälle')
      },
      tooltips: {
        mode: 'index',
        intersect: false,
        bodyFontFamily: 'IBM Plex Mono',
        callbacks: {
          label: function(tooltipItems, data) {
            var value = tooltipItems.value;
            var index = tooltipItems.index;
            var changeStr = "";
            if(index>0) {
                var change = parseInt(value)-parseInt(cases[index-1]);
                var label = change>0 ? "+"+change : change;
                changeStr = " ("+label+")";
            }
            return value+changeStr;
          }
        }
      },
      scales: getScales(),
      plugins: {
        datalabels: getDataLabels()
      }
  },
  data: {
    labels: dateLabels,
    datasets: [
      {
        data: cases,
        fill: false,
        cubicInterpolationMode: 'monotone',
        spanGaps: true,
        borderColor: '#F15F36',
        backgroundColor: '#F15F36',
        datalabels: {
          align: 'center',
          anchor: 'center',

        }
      }
    ]
  }
});

  addAxisButtons(canvas, chart);
}

function barChartHospitalisations(place, data) {
  var filteredData = data.filter(function(d) { if(d.abbreviation_canton_and_fl==place) return d});
  var hospitalFiltered = filteredData.filter(function(d) { if(d.current_hosp!="") return d});
  if(hospitalFiltered.length==0) return;
  var div = document.getElementById("container_"+place);
  var canvas = document.createElement("canvas");
  //canvas.className  = "myClass";
  if(filteredData.length==1) {
    var text = filteredData[0].date+": "+filteredData[0].current_hosp+" hospitalisiert";
    if(filteredData[0].current_icu!="") text+=" , "+filteredData[0].current_icu+" in Intensivbehandlung";
    if(filteredData[0].current_vent!="") text+=" , "+filteredData[0].current_vent+" künstlich beatmet";
    div.appendChild(document.createElement("br"));
    div.appendChild(document.createTextNode(text));
  }
  else {
    canvas.id = "hosp"+place;
    canvas.height=250;
    div.appendChild(canvas);
    //canvas.width=350+filteredData.length*40;
  }
  if(!filteredData || filteredData.length<2) return;
  var moreFilteredData = filteredData; //.filter(function(d) { if(d.ncumul_conf!="") return d});
  var dateLabels = moreFilteredData.map(function(d) {
    var dateSplit = d.date.split("-");
    var day = parseInt(dateSplit[2]);
    var month = parseInt(dateSplit[1])-1;
    var year = parseInt(dateSplit[0]);
    var date = new Date(year,month,day);
    return date;
  });
  var datasets = [];
  var casesHosp = moreFilteredData.map(function(d) {if(d.current_hosp=="") return null; return d.current_hosp});
  datasets.push({
    label: 'Hospitalisiert',
    data: casesHosp,
    fill: false,
    cubicInterpolationMode: 'monotone',
    spanGaps: true,
    borderColor: '#CCCC00',
    backgroundColor: '#CCCC00',
    datalabels: {
      align: 'end',
      anchor: 'end'
    }
  });
  var filteredForICU = moreFilteredData.filter(function(d) { if(d.current_icu!="") return d});
  if(filteredForICU.length>0) {
    var casesICU = moreFilteredData.map(function(d) {if(d.current_icu=="") return null; return d.current_icu});
    datasets.push({
      label: 'In Intensivbehandlung',
      data: casesICU,
      fill: false,
      cubicInterpolationMode: 'monotone',
      spanGaps: true,
      borderColor: '#CF5F5F',
      backgroundColor: '#CF5F5F',
      datalabels: {
        align: 'end',
        anchor: 'end'
      }
    });
  }
  var filteredForVent = moreFilteredData.filter(function(d) { if(d.current_vent!="") return d});
  if(filteredForVent.length>0) {
    var casesVent = moreFilteredData.map(function(d) {if(d.current_vent=="") return null; return d.current_vent});
    datasets.push({
      label: 'Künstlich beatmet',
      data: casesVent,
      fill: false,
      cubicInterpolationMode: 'monotone',
      spanGaps: true,
      borderColor: '#115F5F',
      backgroundColor: '#115F5F',
      datalabels: {
        align: 'end',
        anchor: 'end'
      }
    });
  }
  var filteredForIsolated = moreFilteredData.filter(function(d) { if(d.current_isolated!="") return d});
  if(filteredForIsolated.length>0) {
    var casesIsolated = moreFilteredData.map(function(d) {if(d.current_isolated=="") return null; return d.current_isolated});
    datasets.push({
      label: 'In Isolation',
      data: casesIsolated,
      fill: false,
      cubicInterpolationMode: 'monotone',
      spanGaps: true,
      borderColor: '#AF5500',
      backgroundColor: '#AF5500',
      datalabels: {
        align: 'end',
        anchor: 'end'
      }
    });
  }
  var filteredForQuarantined = moreFilteredData.filter(function(d) { if(d.current_quarantined!="") return d});
  if(filteredForQuarantined.length>0) {
    var casesQuarantined = moreFilteredData.map(function(d) {if(d.current_quarantined=="") return null; return d.current_quarantined});
    datasets.push({
      label: 'In Quarantäne',
      data: casesQuarantined,
      fill: false,
      cubicInterpolationMode: 'monotone',
      spanGaps: true,
      borderColor: '#3333AA',
      backgroundColor: '#3333AA',
      datalabels: {
        align: 'end',
        anchor: 'end'
      }
    });
  }
  var chart = new Chart(canvas.id, {
    type: 'line',
    options: {
      responsive: false,
      layout: {
          padding: {
              right: 20
          }
      },
      legend: {
        display: true,
        position: 'bottom'
      },
      title: {
        display: true,
        text: 'Hospitalisierte Fälle'
      },
      tooltips: {
        mode: 'index',
        intersect: false,
        bodyFontFamily: 'IBM Plex Mono',
        callbacks: {
          label: function(tooltipItems, data) {
            var value = tooltipItems.value;
            var index = tooltipItems.index;
            var datasetIndex = tooltipItems.datasetIndex;
            var changeStr = "";
            var title = data.datasets[datasetIndex].label+": ";
            var titletabbing = 19-title.length;
            var titlepadding = " ".repeat(titletabbing);
            if(index>0) {
                var change = parseInt(value)-parseInt(data.datasets[datasetIndex].data[index-1]);
                var label = change>0 ? "+"+change : change;
                changeStr = " ("+label+")";
                if(Number.isNaN(change)) changeStr = "";
            }
            var tabbing = 3-value.length;
            var padding = " ".repeat(tabbing);
            return title+titlepadding+value+padding+changeStr;
          }
        }
      },
      scales: getScales(),
      plugins: {
        datalabels: false
      }
    },
    data: {
      labels: dateLabels,
      datasets: datasets
    }
  });

  addAxisButtons(canvas, chart);
}

function getWeekScales() {
  return {
    xAxes: [{
      /*type: 'time',
      time: {
        tooltipFormat: 'DD.MM.YYYY',
        unit: 'day',
        displayFormats: {
          day: 'DD.MM'
        }
      },
      ticks: {
        min: new Date("2020-02-24T23:00:00"),
        max: new Date(),
      },
      */
      gridLines: {
          color: inDarkMode() ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'
      }

    }],
    yAxes: [{
      type: cartesianAxesTypes.LINEAR,
      position: 'right',
      ticks: {
        beginAtZero: true,
        suggestedMax: 10,
      },
      gridLines: {
          color: inDarkMode() ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'
      }
    }]
  };
}

function getScales() {
  return {
    xAxes: [{
      type: 'time',
      time: {
        tooltipFormat: 'DD.MM.YYYY',
        unit: 'day',
        displayFormats: {
          day: 'DD.MM'
        }
      },
      ticks: {
        min: new Date("2020-02-24T23:00:00"),
        max: new Date(),
      },
      gridLines: {
          color: inDarkMode() ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'
      }
    }],
    yAxes: [{
      type: cartesianAxesTypes.LINEAR,
      position: 'right',
      ticks: {
        beginAtZero: true,
        suggestedMax: 10,
      },
      gridLines: {
          color: inDarkMode() ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'
      }
    }]
  };
}

function getDataLabels() {
  //return false;
  //if(getDeviceState()==2) return false;
  return {
      color: inDarkMode() ? '#ccc' : 'black',
      font: {
        weight: 'bold'
      },
      formatter: function(value, context) {
        var index = context.dataIndex;
        if(index==0) return "";
        var lastValue = context.dataset.data[index-1];
        var percentageChange = value/lastValue - 1;
        var rounded = Math.round(percentageChange * 100);
        var label = ""+rounded;
        if(rounded >= 0) label = "+"+label+"%";
        else label = "-"+label+"%";

        var change = value-lastValue;
        var label = change>0 ? "+"+change : change;
        return label;
      }
  };
}

// Create the state-indicator element
var indicator = document.createElement('div');
indicator.className = 'state-indicator';
document.body.appendChild(indicator);

// Create a method which returns device state
function getDeviceState() {
    return parseInt(window.getComputedStyle(indicator).getPropertyValue('z-index'), 10);
}

var language;
function setLanguageNav() {
  var lang = window.navigator.userLanguage || window.navigator.language;
  var langParameter = getParameterValue("lang");
  if (langParameter != "") lang = langParameter;
  lang = lang.split("-")[0]; //not interested in de-CH de-DE etc.
  switch(lang) {
    case 'de':
    case 'fr':
    case 'it':
      break;
    default:
      lang = 'en';
  }
  language = lang;
  var href;
  var ul = document.getElementsByTagName("ul")[0];
  var li = document.createElement("li");
  if(lang=="de") {
    li.className = "here";
    href = "#"
  }
  else {
    href = "index.html?lang=de";
  }
  li.innerHTML = '<a href="'+href+'">DE</a>';
  ul.appendChild(li);
  li = document.createElement("li");
  if(lang=="fr") {
    li.className = "here";
    href = "#"
  }
  else {
    href = "index.html?lang=fr";
  }
  li.innerHTML = '<a href="'+href+'">FR</a>';
  ul.appendChild(li);
  li = document.createElement("li");
  if(lang=="it") {
    li.className = "here";
    href = "#"
  }
  else {
    href = "index.html?lang=it";
  }
  li.innerHTML = '<a href="'+href+'">IT</a>';
  ul.appendChild(li);
  li = document.createElement("li");
  if(lang=="en") {
    li.className = "here";
    href = "#"
  }
  else {
    href = "index.html?lang=en";
  }
  li.innerHTML = '<a href="'+href+'">EN</a>';
  ul.appendChild(li);
}

function addAxisButtons(elementAfter, chart) {
  var div = document.createElement('div');
  div.className = "chartButtons";
  addAxisButton(div, chart, 'Logarithmisch', cartesianAxesTypes.LOGARITHMIC, false);
  addAxisButton(div, chart, 'Linear', cartesianAxesTypes.LINEAR, true);
  elementAfter.before(div);
}

function addAxisButton(container, chart, name, cartesianAxisType, isActive) {
  var button = document.createElement('button');
  button.className = "chartButton";
  if (isActive) button.classList.add('active');
  button.innerHTML = name;
  button.addEventListener('click', function() {
    this.classList.add('active');
    getSiblings(this, '.chartButton.active').forEach(element => element.classList.remove('active'));

    chart.options.scales.yAxes[0].type = cartesianAxisType;
    chart.update();
  });
  container.append(button);
}

function getSiblings(element, selector) {
	var siblings = [];
  var sibling = element.parentNode.firstChild;

	while (sibling) {
		if (sibling.nodeType === 1 && sibling !== element && sibling.matches(selector)) {
			siblings.push(sibling);
		}
		sibling = sibling.nextSibling
	}

	return siblings;
}

function inDarkMode() {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return true;
  }
  return false;
}
