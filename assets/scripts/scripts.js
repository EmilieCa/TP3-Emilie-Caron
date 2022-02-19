//CARTE DE MONTRÉAL
const maCarte = L.map("map", { zoomControl: false, minZoom: 10 }).setView(
  [45.558, -73.699],
  10.5
);

//FOND DE CARTE 1
const grisPale = L.esri.Vector.vectorBasemapLayer("ArcGIS:LightGray", {
  apikey: cleAPI,
});
grisPale.addTo(maCarte);

//FOND DE CARTE 2
const grisFonce = L.esri.Vector.vectorBasemapLayer("ArcGIS:DarkGray", {
  apikey: cleAPI,
});

//ATTRIBUTIONS
L.control
  .attribution()
  .addAttribution(
    "Réalisé par Émilie Caron. Merci à Données Québec pour les infos sur les <a href='https://www.donneesquebec.ca/recherche/dataset/vmtl-murales/resource/d325352b-1c06-4c3a-bf5e-1e4c98e0636b' target='_blank'>murales</a> ainsi que les <a href='https://www.donneesquebec.ca/recherche/dataset/vmtl-pistes-cyclables/resource/0dc6612a-be66-406b-b2d9-59c9e1c65ebf' target='_blank'>pistes cyclables.</a> Merci à ArcGIS pour les infos sur les <a href='https://services1.arcgis.com/YiULsZbgRKmBtdZN/arcgis/rest/services/Montreal_Green_Spaces_WFL1/FeatureServer/3' target='_blank'>espaces verts.</a> "
  )
  .addTo(maCarte);

//SUIVI DE LA POSITION
L.easyButton('<img src="./assets/img/localisation.png">',  function (btn, map) {
  maCarte.locate({ watch: true, setView: true });
  maCarte.on("locationfound", trouve);
  maCarte.on("locationerror", erreur);
}).addTo(maCarte);

L.easyButton('<img src="./assets/img/arret-localisation.png">',  function (btn, map) {
  maCarte.stopLocate();
  groupeMarqueurs.clearLayers();
}).addTo(maCarte);

//icon
var personneIcon = L.icon({
  iconUrl: "./assets/img/geolocalisation.png",
  iconSize: [50, 50],
  iconAnchor: [25, 45],
});

//Groupe
let groupeMarqueurs = L.layerGroup().addTo(maCarte);

//Functions
function suiviOn() {
  maCarte.locate({ watch: true, setView: true });
  maCarte.on("locationfound", trouve);
  maCarte.on("locationerror", erreur);
}
function suiviOff() {
  maCarte.stopLocate();
  groupeMarqueurs.clearLayers();
}
function trouve(e) {
  groupeMarqueurs.clearLayers();
  let marqueur = L.marker(e.latlng, { icon: personneIcon }).addTo(
    groupeMarqueurs
  );
  L.circle(e.latlng, {
    color: "orange",
    fillOpacity: 0.2,
    radius: e.accuracy,
  }).addTo(groupeMarqueurs);
}
function erreur(error) {
  alert("Oups");
}

//CONTRÔLE DU ZOOM
L.control
  .zoom({
    zoomInTitle: "Zoom avant",
    zoomOutTitle: "Zoom arrière",
  })
  .addTo(maCarte);

// COUCHES DES MURALES - POINTS
const groupeMurales = L.layerGroup();

const muraleIcon = L.icon({
  iconUrl: "./assets/img/indicateur-murale.png",
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [-2, -2],
});

murales = L.geoJSON(murales, {
  pointToLayer: function (geoJsonPoint, latlng) {
    return L.marker(latlng, { icon: muraleIcon });
  },
}).addTo(groupeMurales);

murales.bindPopup(function (layer) {
  return `
    <figure>
      <img src="${layer.feature.properties.image}" alt="Murale réalisée par ${layer.feature.properties.artiste}"> 
      <figcaption>Par ${layer.feature.properties.artiste}<br>Située au ${layer.feature.properties.adresse}</figcaption>
    </figure>`;
});

//Avec le zoom
maCarte.on("zoomend", (e) => {
  if (maCarte.getZoom() > 13) {
    maCarte.addLayer(groupeMurales);
  } else {
    maCarte.removeLayer(groupeMurales);
  }
});

//COUCHE DU RÉSEAU CYCLABLE - LIGNES
reseauCyclable = L.geoJSON(reseauCyclable, {
  style: function (feature) {
    let couleur;
    switch (feature.properties.SAISONS4) {
      case "OUI":
        couleur = "#0e7988";
        break;
      case "NON":
        couleur = "#4bbdcd";
        break;
      default:
        couleur = "white";
    }
    return { color: couleur };
  },
}).bindPopup(function (layer) {
  return `Cette piste fait ${layer.feature.properties.LONGUEUR.toString()} km et se situe dans le quartier ${layer.feature.properties.NOM_ARR_VI}`;
});

//COUCHES DES ESPACES VERTS - POLYGONES
const urlEspacesVerts =
  "https://services1.arcgis.com/YiULsZbgRKmBtdZN/arcgis/rest/services/Montreal_Green_Spaces_WFL1/FeatureServer/3";

espacesVerts = L.esri
  .featureLayer({
    url: urlEspacesVerts,
    style: function (feature) {
      let couleur;
      const petitParc = feature.properties.Shape__Area < 100000;
      const moyenParc = feature.properties.Shape__Area >= 100000 &&
      feature.properties.Shape__Area < 1000000;
      const grandParc = feature.properties.Shape__Area >= 1000000;

      if (petitParc) {
        couleur = "#80c599";
      } else if (
        moyenParc
      ) {
        couleur = "#3d8256";
      } else {
        couleur = "#0f4e26";
      }
      return { color: couleur, fillOpacity: 1, weight: 0 };
    },
  })
  .bindPopup(function (layer) {
    return `<p>Parc ${layer.feature.properties.Nom}<br> Superficie: ${layer.feature.properties.Shape__Area.toFixed()} mètres<sup>2</sup></p>`;
  })
  .addTo(maCarte);

//REQUÊTE PARC
const requeteParc = document.getElementById('requete_parc');
requeteParc.addEventListener("change", () =>
  espacesVerts.setWhere(requete_parc.value)
);

//CONTROLES DES COUCHES
let baseLayers = {
  "Gris Pâle": grisPale,
  "Gris Foncé": grisFonce,
};
let overlays = {
  "Murales": murales,
  "Pistes Cyclables": reseauCyclable,
  "Espaces verts": espacesVerts,
};
L.control.layers(baseLayers, overlays).addTo(maCarte);

// ÉCHELLE
L.control
  .scale({
    position: "bottomright",
    imperial: false,
    maxWidth: 200,
  })
  .addTo(maCarte);

//BARRE DE RECHERCHE
const couchePoints = L.layerGroup();
couchePoints.addTo(maCarte);

const searchControl = L.esri.Geocoding.geosearch({
  position: "topright",
  placeholder: "Entrer une adresse",
  useMapBounds: false,
  providers: [
    L.esri.Geocoding.arcgisOnlineProvider({
      apikey: cleAPI,
      nearby: {
        lat: 46,
        lng: -74,
      },
    }),
  ],
}).addTo(maCarte);

searchControl.on("results", (data) => {
  for (let i = 0; i < data.results.length; i++) {
    couchePoints.clearLayers();
    let marqueur = L.marker(data.results[i].latlng);
    marqueur.bindPopup(data.results[i].text).openPopup();
    marqueur.addTo(couchePoints);
  }
});

//OPEN WEATHER
const urlMeteo =
  "https://api.openweathermap.org/data/2.5/weather?q=montreal&units=metric&lang=fr&appid=53bb13394bb3b784140f82ac42afcd50";

const groupe = L.layerGroup();
groupe.addTo(maCarte);

let xhttp = new XMLHttpRequest();

xhttp.onreadystatechange = function () {
  if (xhttp.readyState == 4 && this.status == 200) {
    let fichierJSON = JSON.parse(xhttp.responseText);
    afficheMeteo({
      temperature: fichierJSON.main.temp,
      temps_ressenti: fichierJSON.main.feels_like,
      description: fichierJSON.weather[0].description,
      urlIcon: `http://openweathermap.org/img/w/${fichierJSON.weather[0].icon}.png`,
    });
  }
};
xhttp.open("GET", urlMeteo);
xhttp.send();

const containerMeteo = document.getElementById("meteo");

maCarte.on("load", afficheMeteo);

function afficheMeteo(objMeteo) {
  containerMeteo.innerHTML = 
  `<div class="meteo">
    <img src="${objMeteo.urlIcon}" title="${objMeteo.description}" class="meteoIcon">
    <p class="meteo-titre">${objMeteo.description}</p>
    <p>${objMeteo.temperature.toFixed()}&nbsp;C&deg;</p>
    <p>Temps ress. ${objMeteo.temps_ressenti.toFixed()}&nbsp;C&deg;</p>
  </div>`;
}
