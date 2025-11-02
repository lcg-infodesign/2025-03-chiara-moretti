let table;
let volcanoes = [];

// Dimensioni del riquadro
let boxWidth = 1200;
let boxHeight = 750;
let boxX, boxY; // Posizione del riquadro (centrato)

// Range di elevazione
let minElevation = Infinity;
let maxElevation = -Infinity;

// Range geografici
let minLat, maxLat, minLon, maxLon;

// Vulcano selezionato
let selectedVolcano = null;

function preload() {
  // Carica il file CSV
  table = loadTable('volcanoes-2025-10-27 - Es.3 - Original Data.csv', 'csv', 'header');
}

function setup() {
  // Crea una canvas a tema scuro professionale
  createCanvas(1600, 1200);
  // Sfondo scuro elegante
  background(15, 15, 20);
  
  // Processa i dati del CSV prima di calcolare la posizione
  processData();
  
  // Centra il riquadro orizzontalmente, spostato in basso per le leggende
  // Calcola la posizione Y dinamicamente in base all'altezza della legenda
  let types = getUniqueTypes();
  let legendHeight = 25 + (floor((types.length - 1) / 5) + 1) * 18; // Altezza approssimativa della legenda
  boxX = (width - boxWidth) / 2;
  boxY = 100 + legendHeight + 20; // Spazio per le leggende + margine
  
  // Ora che boxX e boxY sono definiti, mappa le coordinate dei vulcani
  mapVolcanoCoordinates();
}

function processData() {
  // Trova i valori minimi e massimi di latitudine, longitudine e elevazione
  minLat = Infinity;
  maxLat = -Infinity;
  minLon = Infinity;
  maxLon = -Infinity;
  
  // Prima passata: trova i range
  for (let row of table.rows) {
    let lat = parseFloat(row.getString('Latitude'));
    let lon = parseFloat(row.getString('Longitude'));
    let elevation = parseFloat(row.getString('Elevation (m)'));
    
    if (!isNaN(lat) && !isNaN(lon)) {
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lon < minLon) minLon = lon;
      if (lon > maxLon) maxLon = lon;
    }
    
    if (!isNaN(elevation)) {
      if (elevation < minElevation) minElevation = elevation;
      if (elevation > maxElevation) maxElevation = elevation;
    }
  }
  
  // Seconda passata: salva i vulcani con coordinate geografiche (non ancora mappate)
  for (let row of table.rows) {
    let lat = parseFloat(row.getString('Latitude'));
    let lon = parseFloat(row.getString('Longitude'));
    let elevation = parseFloat(row.getString('Elevation (m)'));
    let type = row.getString('Type');
    // Prime 3 colonne
    let volcanoNumber = row.getString('Volcano Number');
    let volcanoName = row.getString('Volcano Name');
    let country = row.getString('Country');
    // Ultime 3 colonne
    let typeCategory = row.getString('TypeCategory');
    let status = row.getString('Status');
    let lastKnownEruption = row.getString('Last Known Eruption');
    
    if (!isNaN(lat) && !isNaN(lon)) {
      volcanoes.push({
        lat: lat,
        lon: lon,
        elevation: elevation,
        type: type,
        volcanoNumber: volcanoNumber,
        volcanoName: volcanoName,
        country: country,
        typeCategory: typeCategory,
        status: status,
        lastKnownEruption: lastKnownEruption
      });
    }
  }
}

// Funzione per mappare le coordinate geografiche alle coordinate dello schermo
function mapVolcanoCoordinates() {
  for (let volcano of volcanoes) {
    // Mappa le coordinate geografiche alle coordinate del riquadro
    // Longitudine -> X (da sinistra a destra)
    // Latitudine -> Y (invertita perché Y aumenta verso il basso nello schermo)
    volcano.x = map(volcano.lon, minLon, maxLon, boxX, boxX + boxWidth);
    volcano.y = map(volcano.lat, maxLat, minLat, boxY, boxY + boxHeight);
  }
}

// Funzione per ottenere tutti i tipi unici di vulcano
function getUniqueTypes() {
  let types = new Set();
  for (let volcano of volcanoes) {
    if (volcano.type && volcano.type.trim() !== '') {
      types.add(volcano.type);
    }
  }
  // Ordina i tipi per renderli più leggibili
  return Array.from(types).sort();
}

// Funzione per disegnare la legenda dei tipi
function drawTypeLegend() {
  // Controlla se ci sono vulcani caricati
  if (volcanoes.length === 0) return;
  
  let types = getUniqueTypes();
  if (types.length === 0) return;
  
  let startY = 90; // Sotto la legenda dell'elevazione
  let spacing = 18;
  let cols = 5; // Numero di colonne
  let itemWidth = 220; // Larghezza approssimativa di ogni elemento (glifo + testo)
  let itemMargin = 15; // Margine tra gli elementi
  
  // Calcola la larghezza totale della legenda
  let legendWidth = cols * itemWidth + (cols - 1) * itemMargin;
  
  // Centra la legenda rispetto alla canvas
  let startX = (width - legendWidth) / 2;
  
  // Assicura che la legenda non vada fuori dai bordi
  let margin = 20;
  if (startX < margin) {
    startX = margin;
    // Ricalcola itemWidth se necessario per adattarsi
    legendWidth = width - (2 * margin);
    itemWidth = (legendWidth - (cols - 1) * itemMargin) / cols;
  }
  
  // Titolo - stile professionale
  textAlign(CENTER);
  textSize(15);
  fill(240, 240, 245);
  noStroke();
  textStyle(BOLD);
  text("Tipi di Vulcani", width / 2, startY);
  
  // Disegna ogni tipo con il suo glifo
  textAlign(LEFT);
  textSize(10);
  
  for (let i = 0; i < types.length; i++) {
    let type = types[i];
    if (!type || type.trim() === '') continue;
    
    let col = i % cols;
    let row = floor(i / cols);
    
    let x = startX + (col * (itemWidth + itemMargin));
    let y = startY + 25 + row * spacing;
    
    // Verifica che l'elemento sia dentro la canvas
    if (x + itemWidth > width - margin) continue;
    
    // Disegna il glifo
    push();
    let colGlyph = color(180, 180, 190); // Colore chiaro per la legenda su sfondo scuro
    fill(colGlyph);
    stroke(colGlyph);
    strokeWeight(1);
    drawVolcanoGlyph(x + 8, y, type);
    pop();
    
    // Testo del tipo
    fill(220, 220, 230);
    noStroke();
    // Tronca il testo se è troppo lungo
    let displayType = type;
    let maxTextWidth = itemWidth - 25;
    if (textWidth(displayType) > maxTextWidth) {
      while (textWidth(displayType + "...") > maxTextWidth && displayType.length > 0) {
        displayType = displayType.substring(0, displayType.length - 1);
      }
      displayType += "...";
    }
    text(displayType, x + 18, y + 4);
  }
}

// Funzione per disegnare la legenda
function drawLegend() {
  let legendY = 30;
  let legendWidth = 450;
  let legendHeight = 30;
  let legendX = width / 2 - legendWidth / 2; // Centrata orizzontalmente
  
  // Testo della legenda - stile professionale
  textAlign(CENTER);
  textSize(15);
  fill(240, 240, 245);
  noStroke();
  textStyle(BOLD);
  text("Più il glifo è scuro, più il vulcano è elevato", width / 2, legendY - 10);
  
  // Disegna la barra di colori graduata
  noStroke();
  for (let i = 0; i <= legendWidth; i++) {
    let normalized = i / legendWidth;
    let col = getColorByElevation(lerp(minElevation, maxElevation, normalized));
    fill(col);
    rect(legendX + i, legendY, 1, legendHeight);
  }
  
  // Bordo della barra - stile elegante
  stroke(100, 100, 110);
  strokeWeight(1.5);
  noFill();
  rect(legendX, legendY, legendWidth, legendHeight, 4);
  
  // Etichette dei valori minimo e massimo - testo chiaro
  textAlign(LEFT);
  textSize(11);
  fill(200, 200, 210);
  noStroke();
  textStyle(NORMAL);
  text(nf(minElevation, 0, 0) + " m", legendX - 70, legendY + legendHeight / 2 + 5);
  
  textAlign(RIGHT);
  text(nf(maxElevation, 0, 0) + " m", legendX + legendWidth + 70, legendY + legendHeight / 2 + 5);
}

// Funzione per disegnare il glifo del vulcano in base al tipo
function drawVolcanoGlyph(x, y, type) {
  push();
  translate(x, y);
  
  // Dimensioni base del glifo
  let size = 5;
  
  switch(type) {
    case 'Stratovolcano':
      // Triangolo (forma classica di vulcano)
      triangle(0, -size, -size, size, size, size);
      break;
      
    case 'Shield volcano':
      // Semicerchio piatto
      arc(0, 0, size * 2, size * 1.5, PI, 0);
      break;
      
    case 'Cinder cone':
      // Cono piccolo appuntito
      triangle(0, -size * 1.2, -size * 0.6, size, size * 0.6, size);
      break;
      
    case 'Caldera':
      // Cerchio vuoto (anello)
      noFill();
      strokeWeight(1.5);
      ellipse(0, 0, size * 2, size * 2);
      break;
      
    case 'Lava dome':
      // Cerchio pieno
      ellipse(0, 0, size * 1.8, size * 1.8);
      break;
      
    case 'Volcanic field':
      // Punto semplice
      ellipse(0, 0, size, size);
      break;
      
    case 'Fissure vent':
      // Linea orizzontale
      line(-size * 1.5, 0, size * 1.5, 0);
      break;
      
    case 'Maar':
      // Cerchio con punto centrale - usa stroke per il cerchio esterno
      noFill();
      ellipse(0, 0, size * 2, size * 2);
      // Punto centrale - riabilita fill e disabilita stroke
      // Il fill è già impostato correttamente dalla chiamata esterna
      noStroke();
      ellipse(0, 0, size * 0.5, size * 0.5);
      // Ripristina stroke per i casi successivi
      strokeWeight(1);
      break;
      
    case 'Tuff cone':
      // Cerchio con bordo spesso
      noFill();
      strokeWeight(2);
      ellipse(0, 0, size * 1.8, size * 1.8);
      break;
      
    case 'Pyroclastic cone':
      // Stella a 4 punte
      beginShape();
      for (let i = 0; i < 8; i++) {
        let angle = (i * TWO_PI) / 8;
        let r = (i % 2 === 0) ? size * 1.2 : size * 0.6;
        vertex(r * cos(angle), r * sin(angle));
      }
      endShape(CLOSE);
      break;
      
    case 'Pumice cone':
      // Rombo
      beginShape();
      vertex(0, -size);
      vertex(size * 0.8, 0);
      vertex(0, size);
      vertex(-size * 0.8, 0);
      endShape(CLOSE);
      break;
      
    case 'Complex volcano':
      // Forma composita (triangolo con base larga)
      triangle(0, -size * 1.2, -size * 1.2, size, size * 1.2, size);
      // Piccolo cerchio sopra
      ellipse(0, -size * 1.2, size * 0.8, size * 0.8);
      break;
      
    case 'Submarine volcano':
      // Forma ondulata (onda)
      beginShape();
      curveVertex(-size * 1.5, 0);
      curveVertex(-size * 1.5, 0);
      curveVertex(-size * 0.75, -size * 0.5);
      curveVertex(0, 0);
      curveVertex(size * 0.75, size * 0.5);
      curveVertex(size * 1.5, 0);
      curveVertex(size * 1.5, 0);
      endShape();
      break;
      
    case 'Fumarole field':
      // Croce
      line(-size, 0, size, 0);
      line(0, -size, 0, size);
      break;
      
    case 'Scoria cone':
      // Quadrato
      rectMode(CENTER);
      rect(0, 0, size * 1.6, size * 1.6);
      break;
      
    case 'Scoria cones':
      // Quadrato ruotato (diamante)
      rectMode(CENTER);
      push();
      rotate(PI / 4);
      rect(0, 0, size * 1.6, size * 1.6);
      pop();
      break;
      
    case 'Pyroclastic cones':
      // Stella a 3 punte
      beginShape();
      for (let i = 0; i < 6; i++) {
        let angle = (i * TWO_PI) / 6 - HALF_PI;
        let r = (i % 2 === 0) ? size * 1.2 : size * 0.6;
        vertex(r * cos(angle), r * sin(angle));
      }
      endShape(CLOSE);
      break;
      
    case 'Explosion crater':
      // Anello con bordo esterno
      noFill();
      strokeWeight(1.5);
      ellipse(0, 0, size * 2.2, size * 2.2);
      ellipse(0, 0, size * 1.4, size * 1.4);
      break;
      
    case 'Cinder cones':
      // Triangolo invertito
      triangle(0, size, -size, -size, size, -size);
      break;
      
    case 'Compound volcano':
      // Due triangoli sovrapposti
      triangle(0, -size * 0.8, -size * 0.8, size * 0.8, size * 0.8, size * 0.8);
      triangle(0, size * 0.8, -size * 0.5, -size * 0.5, size * 0.5, -size * 0.5);
      break;
      
    case 'Cone':
      // Cono semplice appuntito
      triangle(0, -size * 1.5, -size * 0.5, size, size * 0.5, size);
      break;
      
    case 'Crater rows':
      // Tre punti in fila orizzontale
      ellipse(-size * 0.8, 0, size * 0.6, size * 0.6);
      ellipse(0, 0, size * 0.6, size * 0.6);
      ellipse(size * 0.8, 0, size * 0.6, size * 0.6);
      break;
      
    case 'Fissure vents':
      // Due linee parallele orizzontali
      line(-size * 1.5, -size * 0.3, size * 1.5, -size * 0.3);
      line(-size * 1.5, size * 0.3, size * 1.5, size * 0.3);
      break;
      
    case 'Hydrothermal field':
      // Esagono
      beginShape();
      for (let i = 0; i < 6; i++) {
        let angle = (i * TWO_PI) / 6;
        vertex(size * 1.2 * cos(angle), size * 1.2 * sin(angle));
      }
      endShape(CLOSE);
      break;
      
    case 'Lava cone':
      // Triangolo con base stretta
      triangle(0, -size * 1.3, -size * 0.4, size * 0.8, size * 0.4, size * 0.8);
      break;
      
    case 'Lava domes':
      // Due cerchi sovrapposti
      ellipse(-size * 0.4, 0, size * 1.2, size * 1.2);
      ellipse(size * 0.4, 0, size * 1.2, size * 1.2);
      break;
      
    case 'Mud volcano':
      // Forma a goccia
      beginShape();
      vertex(0, -size * 1.2);
      bezierVertex(size * 0.8, -size * 0.6, size * 0.8, size * 0.6, 0, size * 1.2);
      bezierVertex(-size * 0.8, size * 0.6, -size * 0.8, -size * 0.6, 0, -size * 1.2);
      endShape(CLOSE);
      break;
      
    case 'Not Volcanic':
      // X (cancellato)
      line(-size * 1.2, -size * 1.2, size * 1.2, size * 1.2);
      line(size * 1.2, -size * 1.2, -size * 1.2, size * 1.2);
      break;
      
    case 'Pyroclastic shield':
      // Semicerchio con base
      arc(0, 0, size * 2.2, size * 1.8, PI, 0);
      line(-size * 1.1, 0, size * 1.1, 0);
      break;
      
    case 'Shield':
      // Semicerchio semplice
      arc(0, 0, size * 2, size * 1.2, PI, 0);
      break;
      
    case 'Shield volcanoes':
      // Due semicerchi
      arc(-size * 0.5, 0, size * 1.2, size * 1, PI, 0);
      arc(size * 0.5, 0, size * 1.2, size * 1, PI, 0);
      break;
      
    case 'Somma volcano':
      // Doppio anello
      noFill();
      ellipse(0, 0, size * 2.4, size * 2.4);
      ellipse(0, 0, size * 1.6, size * 1.6);
      break;
      
    case 'Stratovolcano(es)':
    case 'Stratovolcanoes':
      // Due triangoli affiancati
      triangle(-size * 0.6, -size, -size * 1.2, size, 0, size);
      triangle(size * 0.6, -size, 0, size, size * 1.2, size);
      break;
      
    case 'Subglacial volcano':
      // Triangolo con linea ondulata alla base
      triangle(0, -size * 1.2, -size, size, size, size);
      noFill();
      beginShape();
      for (let x = -size; x <= size; x += size * 0.3) {
        let y = size + sin(x * 2) * size * 0.3;
        vertex(x, y);
      }
      endShape();
      break;
      
    case 'Submarine':
    case 'Submarine volcano?':
    case 'Submarine volcanoes':
      // Forma ondulata doppia
      beginShape();
      curveVertex(-size * 1.5, 0);
      curveVertex(-size * 1.5, 0);
      curveVertex(-size * 0.75, -size * 0.6);
      curveVertex(0, 0);
      curveVertex(size * 0.75, size * 0.6);
      curveVertex(size * 1.5, 0);
      curveVertex(size * 1.5, 0);
      endShape();
      beginShape();
      curveVertex(-size * 1.5, size * 0.5);
      curveVertex(-size * 1.5, size * 0.5);
      curveVertex(-size * 0.75, size * 1.1);
      curveVertex(0, size * 0.5);
      curveVertex(size * 0.75, size * -0.1);
      curveVertex(size * 1.5, size * 0.5);
      curveVertex(size * 1.5, size * 0.5);
      endShape();
      break;
      
    case 'Tuff rings':
      // Anelli multipli
      noFill();
      ellipse(0, 0, size * 2.2, size * 2.2);
      ellipse(0, 0, size * 1.5, size * 1.5);
      ellipse(0, 0, size * 0.8, size * 0.8);
      break;
      
    case 'Unknown':
      // Punto interrogativo stilizzato
      noFill();
      arc(0, -size * 0.3, size * 0.8, size * 0.8, 0, PI);
      line(0, 0, 0, size * 0.6);
      fill(0);
      ellipse(0, size * 1.1, size * 0.3, size * 0.3);
      break;
      
    case 'Volcanic complex':
      // Forma composita a 3 elementi
      ellipse(-size * 0.8, -size * 0.3, size * 1, size * 1);
      ellipse(size * 0.8, -size * 0.3, size * 1, size * 1);
      triangle(0, size * 0.7, -size * 0.6, -size * 0.1, size * 0.6, -size * 0.1);
      break;
      
    default:
      // Forma di default: cerchio con punto centrale
      ellipse(0, 0, size * 1.5, size * 1.5);
      ellipse(0, 0, size * 0.4, size * 0.4);
      break;
  }
  
  pop();
}

// Funzione per mappare coordinate geografiche a coordinate schermo nel riquadro
function geoToScreen(lon, lat) {
  let x = map(lon, minLon, maxLon, boxX, boxX + boxWidth);
  let y = map(lat, maxLat, minLat, boxY, boxY + boxHeight);
  return {x: x, y: y};
}

// Funzione per mappare coordinate globali a coordinate schermo (per il planisfero)
function worldGeoToScreen(lon, lat) {
  let worldMinLon = -180;
  let worldMaxLon = 180;
  let worldMinLat = -85;
  let worldMaxLat = 85;
  let x = map(lon, worldMinLon, worldMaxLon, boxX, boxX + boxWidth);
  let y = map(lat, worldMaxLat, worldMinLat, boxY, boxY + boxHeight);
  return {x: x, y: y};
}

// Funzione per disegnare una mappa del mondo realistica con solo i contorni dei continenti
function drawWorldMap() {
  push();
  
  // Stile line art: solo contorni, nessun riempimento
  noFill();
  stroke(60, 65, 70, 140); // Colore grigio scuro sottile ma più visibile
  strokeWeight(1.2);
  
  // Nord America - coordinate geografiche realistiche (Alaska -> Canada -> USA -> Messico)
  beginShape();
  let naPoints = [
    [-172, 66], [-170, 68], [-168, 70], [-165, 71], [-160, 71],
    [-155, 71], [-150, 70], [-145, 69], [-140, 68], [-135, 67],
    [-130, 66], [-125, 64], [-120, 62], [-115, 60], [-110, 58],
    [-105, 56], [-100, 54], [-95, 52], [-90, 50], [-87, 49],
    [-85, 48], [-83, 47], [-82, 46], [-81, 45], [-80.5, 44],
    [-80, 42], [-79.5, 40], [-79, 38], [-78.5, 36], [-78, 34],
    [-77.5, 32], [-77.5, 30], [-78, 28], [-79, 27], [-80, 26],
    [-82, 25.5], [-84, 25], [-86, 24.5], [-88, 24.5], [-90, 24.5],
    [-92, 24.5], [-94, 25], [-96, 25], [-98, 25], [-100, 25],
    [-102, 25], [-104, 25], [-106, 25], [-108, 25.5], [-110, 26],
    [-112, 26.5], [-114, 27], [-116, 27.5], [-118, 28], [-120, 29],
    [-122, 30], [-124, 32], [-126, 34], [-128, 37], [-130, 40],
    [-132, 43], [-134, 46], [-136, 49], [-138, 52], [-140, 55],
    [-142, 58], [-144, 60], [-146, 62], [-148, 64], [-150, 65],
    [-152, 66], [-155, 66.5], [-158, 67], [-162, 67], [-166, 67],
    [-169, 66.5]
  ];
  for (let i = 0; i < naPoints.length; i++) {
    let p = naPoints[i];
    let pt = worldGeoToScreen(p[0], p[1]);
    if (pt.x >= boxX - 150 && pt.x <= boxX + boxWidth + 150 && pt.y >= boxY - 150 && pt.y <= boxY + boxHeight + 150) {
      if (i === 0) {
        vertex(pt.x, pt.y);
      } else {
        curveVertex(pt.x, pt.y);
      }
    }
  }
  endShape(CLOSE);
  
  // Sud America - forma realistica (Venezuela -> Brasile -> Argentina -> Cile)
  beginShape();
  let saPoints = [
    [-72, 12], [-71, 11], [-70, 10], [-69, 8], [-68, 6],
    [-67, 4], [-66, 2], [-65, 0], [-64.5, -2], [-64.5, -4],
    [-65, -6], [-65.5, -8], [-66, -10], [-66.5, -12], [-67, -14],
    [-67.5, -16], [-68, -18], [-68.5, -20], [-69, -22], [-69.5, -24],
    [-70, -26], [-70.5, -28], [-71, -30], [-71.5, -32], [-72, -34],
    [-72.5, -36], [-73, -38], [-73.5, -40], [-74, -42], [-74.5, -44],
    [-75, -46], [-75.5, -48], [-76, -50], [-76.5, -52], [-77, -53.5],
    [-77, -54.5], [-76.5, -55], [-76, -55], [-75, -54.5], [-74, -53],
    [-73, -51], [-72, -48], [-71, -45], [-70, -42], [-69, -39],
    [-68, -36], [-67, -33], [-66.5, -30], [-66.5, -27], [-67, -24],
    [-67.5, -21], [-68, -18], [-68.5, -15], [-69, -12], [-69.5, -9],
    [-70, -6], [-70.5, -3], [-71, 0], [-71.5, 3], [-72, 6],
    [-72.5, 9]
  ];
  for (let i = 0; i < saPoints.length; i++) {
    let p = saPoints[i];
    let pt = worldGeoToScreen(p[0], p[1]);
    if (pt.x >= boxX - 150 && pt.x <= boxX + boxWidth + 150 && pt.y >= boxY - 150 && pt.y <= boxY + boxHeight + 150) {
      if (i === 0) {
        vertex(pt.x, pt.y);
      } else {
        curveVertex(pt.x, pt.y);
      }
    }
  }
  endShape(CLOSE);
  
  // Europa - forma realistica (Norvegia -> Russia -> Mediterraneo -> Spagna)
  beginShape();
  let euPoints = [
    [-10, 71], [-8, 71], [-5, 70.5], [-2, 70], [0, 69],
    [3, 68], [6, 67], [9, 66], [12, 65], [15, 63],
    [18, 61], [20, 59], [22, 57], [24, 55], [26, 53],
    [28, 51], [29, 49], [30, 47], [31, 45], [32, 43],
    [32.5, 41], [33, 39], [33, 37], [33, 35], [32.5, 33],
    [32, 31], [31, 29.5], [29.5, 28.5], [27.5, 28], [25, 28],
    [22, 28], [19, 28], [16, 28], [13, 28], [10, 28.5],
    [7, 29], [4, 29.5], [1, 30], [-2, 30.5], [-5, 31],
    [-7, 32], [-9, 33.5], [-10, 35], [-10.5, 37], [-10.5, 39],
    [-10.5, 41], [-10.5, 43], [-10.5, 45], [-10.5, 47], [-10.5, 49],
    [-10.5, 51], [-10.5, 53], [-10.5, 55], [-10.5, 57], [-10.5, 59],
    [-10.5, 61], [-10.5, 63], [-10.5, 65], [-10.5, 67], [-10.5, 69]
  ];
  for (let i = 0; i < euPoints.length; i++) {
    let p = euPoints[i];
    let pt = worldGeoToScreen(p[0], p[1]);
    if (pt.x >= boxX - 150 && pt.x <= boxX + boxWidth + 150 && pt.y >= boxY - 150 && pt.y <= boxY + boxHeight + 150) {
      if (i === 0) {
        vertex(pt.x, pt.y);
      } else {
        curveVertex(pt.x, pt.y);
      }
    }
  }
  endShape(CLOSE);
  
  // Africa - forma caratteristica (più larga a nord, stretta a sud)
  beginShape();
  let afPoints = [
    [-18, 37], [-17, 37], [-15, 37.5], [-13, 38], [-11, 38],
    [-9, 38], [-7, 38], [-5, 37.5], [-3, 37.5], [-1, 37],
    [1, 36.5], [3, 36], [5, 35.5], [7, 35], [9, 34],
    [11, 33], [13, 32], [15, 31], [17, 29.5], [19, 28],
    [21, 26.5], [23, 24.5], [25, 22.5], [27, 20.5], [29, 18.5],
    [30, 16.5], [31, 14.5], [31.5, 12.5], [32, 10.5], [32, 8.5],
    [32, 6.5], [32, 4.5], [32, 2.5], [31.5, 0.5], [31, -1.5],
    [30, -3.5], [28.5, -5.5], [27, -7], [25, -8], [23, -8.5],
    [21, -9], [19, -9.5], [17, -10], [15, -10.5], [13, -11],
    [11, -11.5], [9, -12], [7, -12], [5, -12], [3, -12],
    [1, -12], [-1, -12], [-3, -12], [-5, -11.5], [-7, -11],
    [-9, -10.5], [-11, -10], [-13, -9], [-15, -8], [-16.5, -6.5],
    [-17.5, -4.5], [-18, -2.5], [-18, -0.5], [-18, 1.5], [-18, 4],
    [-18, 7], [-18, 10], [-18, 13], [-18, 16], [-18, 19],
    [-18, 22], [-18, 25], [-18, 28], [-18, 31], [-18, 34]
  ];
  for (let i = 0; i < afPoints.length; i++) {
    let p = afPoints[i];
    let pt = worldGeoToScreen(p[0], p[1]);
    if (pt.x >= boxX - 100 && pt.x <= boxX + boxWidth + 100 && pt.y >= boxY - 100 && pt.y <= boxY + boxHeight + 100) {
      if (i === 0) {
        vertex(pt.x, pt.y);
      } else {
        curveVertex(pt.x, pt.y);
      }
    }
  }
  endShape(CLOSE);
  
  // Asia - forma più realistica (con penisola indiana)
  beginShape();
  let asiaPoints = [
    [40, 72], [45, 72], [50, 71.5], [55, 71], [60, 70.5],
    [65, 70], [70, 69], [75, 68], [80, 67], [85, 65],
    [90, 63], [95, 61], [100, 59], [105, 57], [110, 55],
    [115, 53], [120, 51], [125, 49], [130, 47], [135, 45],
    [138, 43], [140, 41], [142, 39], [144, 37], [146, 35],
    [148, 33], [149.5, 31], [150.5, 29], [151, 27], [151, 25],
    [151, 23], [150.5, 21], [149.5, 19], [148, 17], [146, 15],
    [144, 13.5], [141, 12], [138, 11], [135, 10.5], [132, 10],
    [129, 9.5], [126, 9.5], [123, 9.5], [120, 9.5], [117, 9.5],
    [114, 9.5], [111, 10], [108, 10.5], [105, 11], [102, 11.5],
    [99, 12.5], [96, 13.5], [93, 14.5], [90, 15.5], [87, 16.5],
    [84, 17.5], [81, 19], [78, 20.5], [75, 22.5], [72, 25],
    [69, 27.5], [66, 30.5], [63, 33.5], [60, 36.5], [57, 39.5],
    [54, 42.5], [51, 45.5], [48, 48.5], [46, 51], [45, 53.5],
    [44, 56], [43, 58.5], [42, 61], [41.5, 63.5], [41, 66],
    [40.5, 68.5], [40, 70.5]
  ];
  for (let i = 0; i < asiaPoints.length; i++) {
    let p = asiaPoints[i];
    let pt = worldGeoToScreen(p[0], p[1]);
    if (pt.x >= boxX - 100 && pt.x <= boxX + boxWidth + 100 && pt.y >= boxY - 100 && pt.y <= boxY + boxHeight + 100) {
      if (i === 0) {
        vertex(pt.x, pt.y);
      } else {
        curveVertex(pt.x, pt.y);
      }
    }
  }
  endShape(CLOSE);
  
  // Penisola indiana (India)
  beginShape();
  let indiaPoints = [
    [68, 32], [70, 28], [72, 24], [74, 20], [76, 16],
    [77, 12], [77, 8], [76, 8], [74, 10], [72, 12],
    [70, 15], [68, 18], [66, 22], [65, 26], [66, 30]
  ];
  for (let i = 0; i < indiaPoints.length; i++) {
    let p = indiaPoints[i];
    let pt = worldGeoToScreen(p[0], p[1]);
    if (pt.x >= boxX - 100 && pt.x <= boxX + boxWidth + 100 && pt.y >= boxY - 100 && pt.y <= boxY + boxHeight + 100) {
      if (i === 0) {
        vertex(pt.x, pt.y);
      } else {
        curveVertex(pt.x, pt.y);
      }
    }
  }
  endShape(CLOSE);
  
  // Australia - forma più realistica
  beginShape();
  let ausPoints = [
    [113, -10], [115, -11], [118, -12.5], [121, -14], [124, -15.5],
    [127, -17], [130, -18.5], [133, -20], [136, -21.5], [138, -23],
    [140, -24.5], [142, -26], [144, -27.5], [146, -29], [147, -30.5],
    [148, -32], [148.5, -33.5], [148.5, -35], [148, -36.5], [147, -37.5],
    [145.5, -38], [143.5, -37.5], [141, -37], [138.5, -36], [136, -34.5],
    [133.5, -33], [131, -31.5], [128.5, -30], [126, -28.5], [123.5, -27],
    [121, -25.5], [118.5, -24], [116, -22.5], [114.5, -20.5], [113.5, -18],
    [113, -15]
  ];
  for (let i = 0; i < ausPoints.length; i++) {
    let p = ausPoints[i];
    let pt = worldGeoToScreen(p[0], p[1]);
    if (pt.x >= boxX - 100 && pt.x <= boxX + boxWidth + 100 && pt.y >= boxY - 100 && pt.y <= boxY + boxHeight + 100) {
      if (i === 0) {
        vertex(pt.x, pt.y);
      } else {
        curveVertex(pt.x, pt.y);
      }
    }
  }
  endShape(CLOSE);
  
  // Groenlandia - forma più realistica
  beginShape();
  let grPoints = [
    [-73, 60], [-70, 61], [-67, 62], [-64, 63],
    [-60, 63], [-56, 64], [-52, 64], [-48, 64],
    [-44, 65], [-40, 65], [-36, 64], [-32, 64],
    [-28, 63], [-26, 62], [-25, 61], [-25, 60],
    [-26, 59], [-28, 58], [-32, 57], [-36, 57],
    [-40, 56], [-44, 56], [-48, 56], [-52, 56],
    [-56, 57], [-60, 57], [-64, 58], [-68, 59]
  ];
  for (let i = 0; i < grPoints.length; i++) {
    let p = grPoints[i];
    let pt = worldGeoToScreen(p[0], p[1]);
    if (pt.x >= boxX - 100 && pt.x <= boxX + boxWidth + 100 && pt.y >= boxY - 100 && pt.y <= boxY + boxHeight + 100) {
      if (i === 0) {
        vertex(pt.x, pt.y);
      } else {
        curveVertex(pt.x, pt.y);
      }
    }
  }
  endShape(CLOSE);
  
  // Giappone - forma più realistica
  beginShape();
  let jpPoints = [
    [129, 32], [130, 33], [131, 34], [132, 35],
    [133, 35], [134, 36], [135, 36], [136, 37],
    [137, 37], [138, 36], [139, 35], [140, 34],
    [141, 33], [141, 32], [141, 31], [140, 30],
    [139, 29], [138, 28], [137, 28], [136, 27],
    [135, 27], [134, 27], [133, 28], [132, 29],
    [131, 30], [130, 31]
  ];
  for (let i = 0; i < jpPoints.length; i++) {
    let p = jpPoints[i];
    let pt = worldGeoToScreen(p[0], p[1]);
    if (pt.x >= boxX - 100 && pt.x <= boxX + boxWidth + 100 && pt.y >= boxY - 100 && pt.y <= boxY + boxHeight + 100) {
      if (i === 0) {
        vertex(pt.x, pt.y);
      } else {
        curveVertex(pt.x, pt.y);
      }
    }
  }
  endShape(CLOSE);
  
  // Italia - forma dettagliata (stivale)
  beginShape();
  let itPoints = [
    [6, 44], [7, 44], [8, 44], [9, 43],
    [10, 43], [11, 42], [12, 42], [12.5, 41.5],
    [13, 41], [13, 40.5], [13, 40], [12.5, 39.5],
    [12, 39], [11, 38.5], [10, 38], [9, 37.5],
    [8, 37], [7, 37], [6, 37], [5.5, 37.5],
    [5, 38], [5, 39], [5, 40], [5, 41],
    [5, 42], [5.5, 43]
  ];
  for (let i = 0; i < itPoints.length; i++) {
    let p = itPoints[i];
    let pt = worldGeoToScreen(p[0], p[1]);
    if (pt.x >= boxX - 100 && pt.x <= boxX + boxWidth + 100 && pt.y >= boxY - 100 && pt.y <= boxY + boxHeight + 100) {
      if (i === 0) {
        vertex(pt.x, pt.y);
      } else {
        curveVertex(pt.x, pt.y);
      }
    }
  }
  endShape(CLOSE);
  
  // Regno Unito - forma più realistica
  beginShape();
  let ukPoints = [
    [-8, 51], [-7.5, 51], [-7, 51.5], [-6, 52],
    [-5, 52], [-4, 52.5], [-3, 53], [-2, 53],
    [-1.5, 53], [-1, 53], [-1, 53.5], [-1.5, 54],
    [-2, 54.5], [-3, 55], [-4, 55], [-5, 55],
    [-6, 54.5], [-7, 54], [-8, 53.5], [-8.5, 53],
    [-9, 52.5], [-9, 52], [-8.5, 51.5]
  ];
  for (let i = 0; i < ukPoints.length; i++) {
    let p = ukPoints[i];
    let pt = worldGeoToScreen(p[0], p[1]);
    if (pt.x >= boxX - 100 && pt.x <= boxX + boxWidth + 100 && pt.y >= boxY - 100 && pt.y <= boxY + boxHeight + 100) {
      if (i === 0) {
        vertex(pt.x, pt.y);
      } else {
        curveVertex(pt.x, pt.y);
      }
    }
  }
  endShape(CLOSE);
  
  // Penisola iberica
  beginShape();
  let ibPoints = [
    [-10, 40], [-9, 40], [-8, 40], [-7, 40],
    [-6, 41], [-6, 42], [-7, 43], [-8, 44],
    [-9, 44.5], [-10, 44], [-10, 43], [-10, 42]
  ];
  for (let i = 0; i < ibPoints.length; i++) {
    let p = ibPoints[i];
    let pt = worldGeoToScreen(p[0], p[1]);
    if (pt.x >= boxX - 100 && pt.x <= boxX + boxWidth + 100 && pt.y >= boxY - 100 && pt.y <= boxY + boxHeight + 100) {
      if (i === 0) {
        vertex(pt.x, pt.y);
      } else {
        curveVertex(pt.x, pt.y);
      }
    }
  }
  endShape(CLOSE);
  
  // Indonesia/Malesia
  beginShape();
  let idPoints = [
    [95, 6], [98, 5], [102, 4], [105, 3],
    [108, 2], [111, 1], [114, 0], [116, -1],
    [118, -2], [119, -3], [119, -5], [118, -6],
    [116, -7], [114, -8], [111, -8], [108, -7],
    [105, -7], [102, -6], [99, -5], [96, -4],
    [95, -2], [95, 0], [95, 3]
  ];
  for (let i = 0; i < idPoints.length; i++) {
    let p = idPoints[i];
    let pt = worldGeoToScreen(p[0], p[1]);
    if (pt.x >= boxX - 100 && pt.x <= boxX + boxWidth + 100 && pt.y >= boxY - 100 && pt.y <= boxY + boxHeight + 100) {
      if (i === 0) {
        vertex(pt.x, pt.y);
      } else {
        curveVertex(pt.x, pt.y);
      }
    }
  }
  endShape(CLOSE);
  
  // Madagascar
  beginShape();
  let mgPoints = [
    [46, -12], [47, -12], [48, -13], [48, -14],
    [48, -16], [47, -17], [46, -18], [45, -18],
    [44, -17], [44, -15], [44, -13], [45, -12]
  ];
  for (let i = 0; i < mgPoints.length; i++) {
    let p = mgPoints[i];
    let pt = worldGeoToScreen(p[0], p[1]);
    if (pt.x >= boxX - 100 && pt.x <= boxX + boxWidth + 100 && pt.y >= boxY - 100 && pt.y <= boxY + boxHeight + 100) {
      if (i === 0) {
        vertex(pt.x, pt.y);
      } else {
        curveVertex(pt.x, pt.y);
      }
    }
  }
  endShape(CLOSE);
  
  pop();
}

// Funzione per ottenere il colore in base all'elevazione
function getColorByElevation(elevation) {
  if (isNaN(elevation) || minElevation === maxElevation) {
    return color(200, 100, 50); // Colore di default se non ci sono dati
  }
  
  // Normalizza l'elevazione tra 0 e 1
  let normalized = map(elevation, minElevation, maxElevation, 0, 1);
  normalized = constrain(normalized, 0, 1);
  
  // Gradiente: arancione -> marrone
  // Arancione: rgb(255, 140, 0)
  // Marrone: rgb(101, 67, 33)
  
  // Interpolazione diretta da arancione a marrone
  let r = lerp(255, 101, normalized);
  let g = lerp(140, 67, normalized);
  let b = lerp(0, 33, normalized);
  
  return color(r, g, b);
}

function draw() {
  // Sfondo scuro elegante
  background(15, 15, 20);
  
  // Disegna la legenda dell'elevazione in alto
  drawLegend();
  
  // Disegna la legenda dei tipi
  drawTypeLegend();
  
  // Assicurati che boxX e boxY siano definiti
  if (typeof boxX === 'undefined' || typeof boxY === 'undefined') {
    boxX = (width - boxWidth) / 2;
    boxY = 350;
  }
  
  // Disegna il riquadro con sfondo scuro elegante e bordo sottile
  fill(22, 22, 28);
  stroke(70, 70, 80);
  strokeWeight(2);
  rect(boxX, boxY, boxWidth, boxHeight, 6);
  
  // Ombra interna sottile per profondità
  noFill();
  stroke(10, 10, 15);
  strokeWeight(1);
  rect(boxX + 1, boxY + 1, boxWidth - 2, boxHeight - 2, 6);
  
  // Disegna il planisfero di sfondo all'interno del riquadro
  drawWorldMap();
  
  // Disegna i glifi per ogni vulcano alle coordinate geografiche (lat/lon mappate)
  // con colori basati sull'elevazione
  for (let volcano of volcanoes) {
    // Verifica che il vulcano sia dentro il riquadro
    if (volcano.x >= boxX && volcano.x <= boxX + boxWidth &&
        volcano.y >= boxY && volcano.y <= boxY + boxHeight) {
      
      // Colore basato sull'elevazione (da rosso chiaro a marrone scuro)
      let col = getColorByElevation(volcano.elevation);
      fill(col);
      stroke(col);
      strokeWeight(1);
      
      // Disegna il glifo unico in base al tipo di vulcano
      // alle coordinate mappate da lat/lon
      if (volcano.type) {
        // Evidenzia il vulcano selezionato
        if (volcano === selectedVolcano) {
          push();
          strokeWeight(2.5);
          stroke(255, 180, 50); // Bordo arancione/ambra per il selezionato su sfondo scuro
          drawVolcanoGlyph(volcano.x, volcano.y, volcano.type);
          pop();
        } else {
          drawVolcanoGlyph(volcano.x, volcano.y, volcano.type);
        }
      }
    }
  }
  
  // Disegna la legenda con i dati del vulcano selezionato
  if (selectedVolcano) {
    drawVolcanoInfo(selectedVolcano);
  }
}

// Funzione per rilevare il click su un vulcano
function mousePressed() {
  selectedVolcano = null;
  
  // Controlla se il click è dentro il riquadro
  if (mouseX >= boxX && mouseX <= boxX + boxWidth &&
      mouseY >= boxY && mouseY <= boxY + boxHeight) {
    
    // Cerca il vulcano più vicino al punto del click
    let minDistance = Infinity;
    let closestVolcano = null;
    let clickRadius = 15; // Raggio di click in pixel
    
    for (let volcano of volcanoes) {
      if (volcano.x && volcano.y) {
        let distance = dist(mouseX, mouseY, volcano.x, volcano.y);
        if (distance < clickRadius && distance < minDistance) {
          minDistance = distance;
          closestVolcano = volcano;
        }
      }
    }
    
    if (closestVolcano) {
      selectedVolcano = closestVolcano;
    }
  }
}

// Funzione per disegnare le informazioni del vulcano selezionato
function drawVolcanoInfo(volcano) {
  let infoWidth = 250;
  let infoHeight = 180; // Aumentata per le ultime 3 colonne
  let padding = 12;
  let margin = 15;
  let offset = 20; // Offset dalla posizione del vulcano
  
  // Calcola la posizione accanto al vulcano
  // Prova prima a destra
  let infoX = volcano.x + offset;
  let infoY = volcano.y - infoHeight / 2;
  
  // Se va fuori a destra, posiziona a sinistra
  if (infoX + infoWidth > width - margin) {
    infoX = volcano.x - infoWidth - offset;
  }
  
  // Se va fuori a sinistra, posiziona in alto o in basso
  if (infoX < margin) {
    infoX = volcano.x - infoWidth / 2;
    infoY = volcano.y - infoHeight - offset;
    
    // Se va fuori in alto, posiziona in basso
    if (infoY < margin) {
      infoY = volcano.y + offset;
    }
  }
  
  // Se va fuori in basso, posiziona in alto
  if (infoY + infoHeight > height - margin) {
    infoY = volcano.y - infoHeight - offset;
  }
  
  // Verifica finali che non vada fuori dai bordi
  if (infoX < margin) infoX = margin;
  if (infoY < margin) infoY = margin;
  if (infoX + infoWidth > width - margin) infoX = width - infoWidth - margin;
  if (infoY + infoHeight > height - margin) infoY = height - infoHeight - margin;
  
  // Sfondo semi-trasparente scuro elegante
  fill(32, 32, 38, 240);
  stroke(90, 90, 100, 220);
  strokeWeight(1.5);
  rect(infoX, infoY, infoWidth, infoHeight, 8); // Angoli arrotondati
  
  // Ombra sottile per profondità
  fill(10, 10, 15, 180);
  noStroke();
  rect(infoX + 2, infoY + 2, infoWidth, infoHeight, 8);
  
  // Titolo - testo chiaro
  fill(245, 245, 250);
  noStroke();
  textAlign(LEFT);
  textSize(13);
  textStyle(BOLD);
  text("Vulcano Selezionato", infoX + padding, infoY + 18);
  
  // Linea separatrice elegante
  stroke(100, 100, 110, 200);
  strokeWeight(1);
  line(infoX + padding, infoY + 25, infoX + infoWidth - padding, infoY + 25);
  noStroke();
  
  // Dati delle prime 3 colonne
  textStyle(NORMAL);
  textSize(10);
  
  // Volcano Number
  fill(160, 160, 170);
  text("Numero:", infoX + padding, infoY + 42);
  fill(240, 240, 250);
  let numText = volcano.volcanoNumber || "N/A";
  if (numText.length > 18) {
    numText = numText.substring(0, 15) + "...";
  }
  text(numText, infoX + padding + 65, infoY + 42);
  
  // Volcano Name
  fill(160, 160, 170);
  text("Nome:", infoX + padding, infoY + 58);
  fill(240, 240, 250);
  let name = volcano.volcanoName || "N/A";
  // Tronca il nome se è troppo lungo
  if (name.length > 18) {
    name = name.substring(0, 15) + "...";
  }
  text(name, infoX + padding + 65, infoY + 58);
  
  // Country
  fill(160, 160, 170);
  text("Paese:", infoX + padding, infoY + 74);
  fill(240, 240, 250);
  let country = volcano.country || "N/A";
  // Tronca il paese se è troppo lungo
  if (country.length > 18) {
    country = country.substring(0, 15) + "...";
  }
  text(country, infoX + padding + 65, infoY + 74);
  
  // Tipo di vulcano
  fill(160, 160, 170);
  text("Tipo:", infoX + padding, infoY + 90);
  fill(240, 240, 250);
  let type = volcano.type || "N/A";
  if (type.length > 18) {
    type = type.substring(0, 15) + "...";
  }
  text(type, infoX + padding + 65, infoY + 90);
  
  // Linea separatrice per le ultime 3 colonne
  stroke(100, 100, 110, 200);
  strokeWeight(1);
  line(infoX + padding, infoY + 108, infoX + infoWidth - padding, infoY + 108);
  noStroke();
  
  // Ultime 3 colonne
  // TypeCategory
  fill(160, 160, 170);
  text("Categoria:", infoX + padding, infoY + 126);
  fill(240, 240, 250);
  let typeCat = volcano.typeCategory || "N/A";
  if (typeCat.length > 18) {
    typeCat = typeCat.substring(0, 15) + "...";
  }
  text(typeCat, infoX + padding + 65, infoY + 126);
  
  // Status
  fill(160, 160, 170);
  text("Stato:", infoX + padding, infoY + 142);
  fill(240, 240, 250);
  let status = volcano.status || "N/A";
  if (status.length > 18) {
    status = status.substring(0, 15) + "...";
  }
  text(status, infoX + padding + 65, infoY + 142);
  
  // Last Known Eruption
  fill(160, 160, 170);
  text("Ultima eruzione:", infoX + padding, infoY + 158);
  fill(240, 240, 250);
  let lastEruption = volcano.lastKnownEruption || "N/A";
  if (lastEruption.length > 15) {
    lastEruption = lastEruption.substring(0, 12) + "...";
  }
  text(lastEruption, infoX + padding + 85, infoY + 158);
  
  // Istruzione per chiudere (discreta)
  fill(140, 140, 150);
  textSize(8);
  text("Click per deselezionare", infoX + padding, infoY + infoHeight - 6);
}
