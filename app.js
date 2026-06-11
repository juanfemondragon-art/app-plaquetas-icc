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
const downloadCsvPdfButton = document.getElementById("downloadCsvPdf");
const downloadCsvTemplateButton = document.getElementById("downloadCsvTemplate");

const quickRowsBody = document.getElementById("quickRows");
const downloadQuickZipButton = document.getElementById("downloadQuickZip");
const downloadQuickPdfButton = document.getElementById("downloadQuickPdf");
const clearQuickTableButton = document.getElementById("clearQuickTable");

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
  return String(value)
    .trim()
    .replace(/[^a-zA-Z0-9-_]/g, "_");
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
// CREAR TABLA RÁPIDA DE 10 FILAS
// ===============================

function createQuickTableRows() {
  if (!quickRowsBody) return;

  quickRowsBody.innerHTML = "";

  for (let i = 1; i <= 10; i++) {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${i}</td>
      <td><input type="text" class="quick-modelo" placeholder="Ej: SG19" /></td>
      <td><input type="text" class="quick-potencia" placeholder="140" /></td>
      <td><input type="text" class="quick-peso" placeholder="15400" /></td>
      <td><input type="text" class="quick-capacidad" placeholder="3.7" /></td>
      <td><input type="text" class="quick-anio" placeholder="2026" /></td>
      <td><input type="text" class="quick-pin" placeholder="ABC123456789" /></td>
    `;

    quickRowsBody.appendChild(row);
  }
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
  createQuickTableRows();
  loadSvgTemplate(false);
});


// ===============================
// GENERAR PLAQUETA INDIVIDUAL
// ===============================

if (plateForm) {
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

    if (downloadSvgButton) {
      downloadSvgButton.disabled = false;
    }

    if (downloadPdfButton) {
      downloadPdfButton.disabled = false;
    }
  });
}


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
    "{{MODELO}}": data.modelo || "",
    "{{POTENCIA}}": data.potencia || "",
    "{{PESO}}": data.peso || "",
    "{{CAPACIDAD}}": data.capacidad || "",
    "{{ANIO}}": data.anio || "",
    "{{PIN}}": `>${data.pin || ""}<`
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

if (downloadSvgButton) {
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
}


// ===============================
// GENERAR PDF INDIVIDUAL
// ===============================

if (downloadPdfButton) {
  downloadPdfButton.addEventListener("click", function() {
    if (!finalSvgText) {
      alert("Primero genera la plaqueta.");
      return;
    }

    generateMultiPlatePdfFromSvgList([finalSvgText], "Plaqueta PDF");
  });
}


// ===============================
// DESCARGAR FORMATO CSV
// ===============================

if (downloadCsvTemplateButton) {
  downloadCsvTemplateButton.addEventListener("click", function() {
    const csvTemplate = [
      "MODELO;POTENCIA;PESO;CAPACIDAD;ANIO;PIN",
      "SG19;140;15400;3.7;2026;ABC123456789",
      "SE220LC;145;22800;0.95;2024;66SE22DKNR1018769"
    ].join("\n");

    const csvBlob = new Blob(["\uFEFF" + csvTemplate], {
      type: "text/csv;charset=utf-8"
    });

    downloadBlob(csvBlob, "formato_plaquetas_icc.csv");
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

      if (downloadCsvPdfButton) {
        downloadCsvPdfButton.disabled = false;
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
// DESCARGAR ZIP CON TODAS LAS PLAQUETAS SVG DESDE CSV
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

    downloadBlob(zipBlob, "plaquetas_generadas_csv.zip");

    alert(`ZIP generado correctamente con ${csvRows.length} plaquetas.`);
  });
}


// ===============================
// LEER TABLA RÁPIDA
// ===============================

function getQuickTableRows() {
  const rows = document.querySelectorAll("#quickRows tr");
  const data = [];

  rows.forEach(function(row, index) {
    const modeloInput = row.querySelector(".quick-modelo");
    const potenciaInput = row.querySelector(".quick-potencia");
    const pesoInput = row.querySelector(".quick-peso");
    const capacidadInput = row.querySelector(".quick-capacidad");
    const anioInput = row.querySelector(".quick-anio");
    const pinInput = row.querySelector(".quick-pin");

    if (!modeloInput || !potenciaInput || !pesoInput || !capacidadInput || !anioInput || !pinInput) {
      return;
    }

    const modelo = modeloInput.value.trim();
    const potencia = potenciaInput.value.trim();
    const peso = pesoInput.value.trim();
    const capacidad = capacidadInput.value.trim();
    const anio = anioInput.value.trim();
    const pin = pinInput.value.trim();

    const hasAnyValue = modelo || potencia || peso || capacidad || anio || pin;

    if (hasAnyValue) {
      data.push({
        modelo: modelo || "SIN_MODELO",
        potencia,
        peso,
        capacidad,
        anio,
        pin: pin || `SIN_PIN_${index + 1}`
      });
    }
  });

  return data;
}


// ===============================
// DESCARGAR ZIP DESDE TABLA RÁPIDA
// ===============================

if (downloadQuickZipButton) {
  downloadQuickZipButton.addEventListener("click", async function() {
    if (!baseSvgText) {
      alert("Primero debes cargar la plantilla SVG.");
      return;
    }

    if (typeof JSZip === "undefined") {
      alert("No se pudo cargar JSZip. Revisa tu conexión a internet.");
      return;
    }

    const quickRows = getQuickTableRows();

    if (quickRows.length === 0) {
      alert("Debes llenar al menos una fila de la tabla.");
      return;
    }

    const zip = new JSZip();

    quickRows.forEach(function(plateData, index) {
      const svgContent = insertVariableTexts(baseSvgText, plateData);

      const cleanModelo = cleanFileName(plateData.modelo);
      const cleanPin = cleanFileName(plateData.pin);

      const fileName = `plaqueta_${index + 1}_${cleanModelo}_${cleanPin}.svg`;

      zip.file(fileName, svgContent);
    });

    const zipBlob = await zip.generateAsync({
      type: "blob"
    });

    downloadBlob(zipBlob, "plaquetas_tabla_rapida.zip");

    alert(`ZIP generado correctamente con ${quickRows.length} plaquetas.`);
  });
}


// ===============================
// LIMPIAR TABLA RÁPIDA
// ===============================

if (clearQuickTableButton) {
  clearQuickTableButton.addEventListener("click", function() {
    const inputs = document.querySelectorAll("#quickRows input");

    inputs.forEach(function(input) {
      input.value = "";
    });

    alert("Tabla limpiada correctamente.");
  });
}


// ===============================
// GENERAR PDF ÚNICO CON VARIAS PLAQUETAS
// ===============================

function generateMultiPlatePdfFromSvgList(svgList, fileTitle = "Plaquetas PDF") {
  if (!svgList || svgList.length === 0) {
    alert("No hay plaquetas para generar.");
    return;
  }

  const svgPages = svgList.map(function(svgContent) {
    return `
      <section class="pdf-page">
        ${svgContent}
      </section>
    `;
  }).join("");

  const printWindow = window.open("", "_blank");

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>${fileTitle}</title>
      <style>
        @page {
          size: 115mm 70mm;
          margin: 0;
        }

        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          padding: 0;
          background: #ffffff;
        }

        .pdf-page {
          width: 115mm;
          height: 70mm;
          page-break-after: always;
          break-after: page;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .pdf-page:last-child {
          page-break-after: auto;
          break-after: auto;
        }

        svg {
          width: 115mm;
          height: 70mm;
          display: block;
        }

        @media print {
          body {
            margin: 0;
          }

          .pdf-page {
            page-break-after: always;
            break-after: page;
          }

          .pdf-page:last-child {
            page-break-after: auto;
            break-after: auto;
          }
        }
      </style>
    </head>
    <body>
      ${svgPages}

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 700);
        };
      <\/script>
    </body>
    </html>
  `);

  printWindow.document.close();
}

function generateMultiPlatePdf(platesData, fileTitle = "Plaquetas PDF") {
  if (!baseSvgText) {
    alert("Primero debes cargar la plantilla SVG.");
    return;
  }

  if (!platesData || platesData.length === 0) {
    alert("No hay plaquetas para generar.");
    return;
  }

  const svgList = platesData.map(function(plateData) {
    return insertVariableTexts(baseSvgText, plateData);
  });

  generateMultiPlatePdfFromSvgList(svgList, fileTitle);
}


// ===============================
// PDF ÚNICO DESDE TABLA RÁPIDA
// ===============================

if (downloadQuickPdfButton) {
  downloadQuickPdfButton.addEventListener("click", function() {
    const quickRows = getQuickTableRows();

    if (quickRows.length === 0) {
      alert("Debes llenar al menos una fila de la tabla.");
      return;
    }

    generateMultiPlatePdf(quickRows, "Plaquetas desde tabla rápida");
  });
}


// ===============================
// PDF ÚNICO DESDE CSV
// ===============================

if (downloadCsvPdfButton) {
  downloadCsvPdfButton.addEventListener("click", function() {
    if (!csvRows || csvRows.length === 0) {
      alert("Primero debes procesar un CSV.");
      return;
    }

    const platesData = csvRows.map(function(row, index) {
      return getPlateDataFromRow(row, index);
    });

    generateMultiPlatePdf(platesData, "Plaquetas desde CSV");
  });
}