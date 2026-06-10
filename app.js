// ===============================
// CAPTURA DE ELEMENTOS
// ===============================

const plateForm = document.getElementById("plateForm");

const modeloInput = document.getElementById("modelo");
const potenciaInput = document.getElementById("potencia");
const pesoInput = document.getElementById("peso");
const capacidadInput = document.getElementById("capacidad");
const anioInput = document.getElementById("anio");
const pinInput = document.getElementById("pin");

const platePreview = document.getElementById("platePreview");

const loadTemplateButton = document.getElementById("loadTemplate");
const downloadSvgButton = document.getElementById("downloadSvg");
const downloadPdfButton = document.getElementById("downloadPdf");

const csvFileInput = document.getElementById("csvFile");
const processCsvButton = document.getElementById("processCsv");
const downloadAllSvgButton = document.getElementById("downloadAllSvg");

let baseSvgText = "";
let finalSvgText = "";
let csvRows = [];


// ===============================
// FUNCIONES AUXILIARES
// ===============================

function getValue(input, defaultValue) {
  const value = input.value.trim();
  return value === "" ? defaultValue : value;
}

function cleanFileName(value) {
  return String(value).replace(/[^a-zA-Z0-9-_]/g, "_");
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);

  const downloadLink = document.createElement("a");
  downloadLink.href = url;
  downloadLink.download = fileName;

  document.body.appendChild(downloadLink);
  downloadLink.click();

  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(url);
}

function normalizeHeader(header) {
  return String(header)
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function getRowValue(row, possibleKeys, defaultValue = "") {
  for (const key of possibleKeys) {
    if (row[key] !== undefined && row[key] !== "") {
      return row[key];
    }
  }

  return defaultValue;
}


// ===============================
// CARGAR PLANTILLA SVG
// ===============================

async function loadSvgTemplate(showAlert = false) {
  try {
    const response = await fetch("plaqueta_base.svg");

    if (!response.ok) {
      throw new Error("No se pudo cargar plaqueta_base.svg");
    }

    baseSvgText = await response.text();
    platePreview.innerHTML = baseSvgText;

    if (showAlert) {
      alert("Plantilla cargada correctamente.");
    }
  } catch (error) {
    console.error(error);
    alert("No se pudo cargar la plantilla. Revisa que el archivo se llame exactamente plaqueta_base.svg y esté en la misma carpeta del proyecto.");
  }
}

if (loadTemplateButton) {
  loadTemplateButton.addEventListener("click", function() {
    loadSvgTemplate(true);
  });
}

window.addEventListener("DOMContentLoaded", function() {
  loadSvgTemplate(false);
});


// ===============================
// GENERAR PLAQUETA INDIVIDUAL
// ===============================

plateForm.addEventListener("submit", function(event) {
  event.preventDefault();

  if (!baseSvgText) {
    alert("Primero debes cargar la plantilla SVG.");
    return;
  }

  const modelo = getValue(modeloInput, "SE220LC");
  const potencia = getValue(potenciaInput, "145");
  const peso = getValue(pesoInput, "22800");
  const capacidad = getValue(capacidadInput, "0.95");
  const anio = getValue(anioInput, "2024");
  const pin = getValue(pinInput, "66SE22DKNR1018769");

  finalSvgText = insertVariableTexts(baseSvgText, {
    modelo,
    potencia,
    peso,
    capacidad,
    anio,
    pin
  });

  platePreview.innerHTML = finalSvgText;

  downloadSvgButton.disabled = false;

  if (downloadPdfButton) {
    downloadPdfButton.disabled = false;
  }
});


// ===============================
// REEMPLAZAR MARCADORES Y FORZAR ARIAL NARROW
// ===============================

function insertVariableTexts(svgText, data) {
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgText, "image/svg+xml");

  const parserError = svgDoc.querySelector("parsererror");

  if (parserError) {
    alert("El SVG tiene un error de lectura. Revisa la plantilla exportada desde Illustrator.");
    return svgText;
  }

  const replacements = {
    "{{MODELO}}": data.modelo,
    "{{POTENCIA}}": data.potencia,
    "{{PESO}}": data.peso,
    "{{CAPACIDAD}}": data.capacidad,
    "{{ANIO}}": data.anio,
    "{{PIN}}": `>${data.pin}<`
  };

  const textElements = svgDoc.querySelectorAll("text, tspan");

  textElements.forEach(function(element) {
    let content = element.textContent;
    let wasReplaced = false;

    Object.keys(replacements).forEach(function(marker) {
      if (content.includes(marker)) {
        content = content.replaceAll(marker, replacements[marker]);
        wasReplaced = true;
      }
    });

    if (wasReplaced) {
      element.textContent = content;

      element.setAttribute("font-family", "Arial Narrow, Arial, sans-serif");
      element.setAttribute("font-weight", "400");

      const currentStyle = element.getAttribute("style");

      if (currentStyle) {
        let newStyle = currentStyle;

        newStyle = newStyle.replace(/font-family:[^;]+;?/g, "");
        newStyle = newStyle.replace(/font-weight:[^;]+;?/g, "");

        newStyle += ";font-family:'Arial Narrow', Arial, sans-serif;font-weight:400;";

        element.setAttribute("style", newStyle);
      } else {
        element.setAttribute("style", "font-family:'Arial Narrow', Arial, sans-serif;font-weight:400;");
      }
    }
  });

  const serializer = new XMLSerializer();
  return serializer.serializeToString(svgDoc);
}


// ===============================
// DESCARGAR SVG INDIVIDUAL
// ===============================

downloadSvgButton.addEventListener("click", function() {
  if (!finalSvgText) {
    alert("Primero genera la plaqueta.");
    return;
  }

  const modelo = cleanFileName(getValue(modeloInput, "SE220LC"));
  const pin = cleanFileName(getValue(pinInput, "SIN_PIN"));

  const svgBlob = new Blob([finalSvgText], {
    type: "image/svg+xml;charset=utf-8"
  });

  downloadBlob(svgBlob, `plaqueta_${modelo}_${pin}.svg`);
});


// ===============================
// GENERAR PDF DESDE NAVEGADOR
// ===============================

if (downloadPdfButton) {
  downloadPdfButton.addEventListener("click", function() {
    if (!finalSvgText) {
      alert("Primero genera la plaqueta.");
      return;
    }

    const printWindow = window.open("", "_blank");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Plaqueta PDF</title>
        <style>
          @page {
            size: 115mm 70mm;
            margin: 0;
          }

          body {
            margin: 0;
            padding: 0;
            background: #ffffff;
          }

          .pdf-wrapper {
            width: 115mm;
            height: 70mm;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          svg {
            width: 115mm;
            height: 70mm;
            display: block;
          }
        </style>
      </head>
      <body>
        <div class="pdf-wrapper">
          ${finalSvgText}
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        <\/script>
      </body>
      </html>
    `);

    printWindow.document.close();
  });
}


// ===============================
// LEER Y PROCESAR CSV
// ===============================

if (processCsvButton) {
  processCsvButton.addEventListener("click", function() {
    if (!baseSvgText) {
      alert("Primero debes cargar la plantilla SVG.");
      return;
    }

    const file = csvFileInput.files[0];

    if (!file) {
      alert("Primero selecciona un archivo CSV.");
      return;
    }

    const reader = new FileReader();

    reader.onload = function(event) {
      const csvText = event.target.result;

      csvRows = parseCsv(csvText);

      if (csvRows.length === 0) {
        alert("El CSV no tiene datos válidos.");
        return;
      }

      if (downloadAllSvgButton) {
        downloadAllSvgButton.disabled = false;
      }

      alert(`CSV procesado correctamente. Se encontraron ${csvRows.length} plaquetas.`);

      console.table(csvRows);
    };

    reader.readAsText(file, "UTF-8");
  });
}


// ===============================
// PARSEAR CSV
// Acepta separador coma , o punto y coma ;
// ===============================

function parseCsv(csvText) {
  const cleanText = csvText.replace(/^\uFEFF/, "");

  const lines = cleanText
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line !== "");

  if (lines.length < 2) {
    return [];
  }

  const separator = lines[0].includes(";") ? ";" : ",";

  const headers = lines[0]
    .split(separator)
    .map(header => normalizeHeader(header));

  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i]
      .split(separator)
      .map(value => value.trim());

    const row = {};

    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });

    rows.push(row);
  }

  return rows;
}


// ===============================
// EXTRAER DATOS DE CADA FILA CSV
// ===============================

function getPlateDataFromRow(row, index) {
  const modelo = getRowValue(row, [
    "MODELO",
    "MODEL"
  ], "SIN_MODELO");

  const potencia = getRowValue(row, [
    "POTENCIA",
    "POTENCIA_DEL_MOTOR",
    "ENGINE_POWER",
    "ENGINE_POWER_KW"
  ], "");

  const peso = getRowValue(row, [
    "PESO",
    "PESO_DEL_EQUIPO",
    "MASS",
    "WEIGHT"
  ], "");

  const capacidad = getRowValue(row, [
    "CAPACIDAD",
    "CAPACITY"
  ], "");

  const anio = getRowValue(row, [
    "ANIO",
    "ANO",
    "AÑO",
    "ANIO_DE_MANUFACTURACION",
    "ANO_DE_MANUFACTURACION",
    "AÑO_DE_MANUFACTURACION",
    "MANUFACTURING_YEAR",
    "YEAR"
  ], "");

  const pin = getRowValue(row, [
    "PIN",
    "NUMERO_DE_IDENTIFICACION_DE_PRODUCTO",
    "NUMERO_IDENTIFICACION_PRODUCTO",
    "PRODUCT_IDENTIFICATION_NUMBER",
    "PRODUCT_IDENTIFICATION"
  ], `SIN_PIN_${index + 1}`);

  return {
    modelo,
    potencia,
    peso,
    capacidad,
    anio,
    pin
  };
}


// ===============================
// DESCARGAR ZIP CON TODAS LAS PLAQUETAS SVG
// ===============================

if (downloadAllSvgButton) {
  downloadAllSvgButton.addEventListener("click", async function() {
    if (!baseSvgText) {
      alert("Primero debes cargar la plantilla SVG.");
      return;
    }

    if (!csvRows || csvRows.length === 0) {
      alert("Primero debes procesar un CSV.");
      return;
    }

    if (typeof JSZip === "undefined") {
      alert("No se pudo cargar JSZip. Revisa tu conexión a internet o la línea CDN en index.html.");
      return;
    }

    const zip = new JSZip();

    csvRows.forEach(function(row, index) {
      const plateData = getPlateDataFromRow(row, index);

      const svgContent = insertVariableTexts(baseSvgText, plateData);

      const cleanModelo = cleanFileName(plateData.modelo);
      const cleanPin = cleanFileName(plateData.pin);

      const fileName = `plaqueta_${index + 1}_${cleanModelo}_${cleanPin}.svg`;

      zip.file(fileName, svgContent);
    });

    const zipBlob = await zip.generateAsync({
      type: "blob"
    });

    downloadBlob(zipBlob, "plaquetas_generadas.zip");

    alert(`ZIP generado correctamente con ${csvRows.length} plaquetas.`);
  });
}