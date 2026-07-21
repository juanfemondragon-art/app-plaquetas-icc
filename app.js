// ===============================
// CAPTURA DE ELEMENTOS
// ===============================

const plateForm = document.getElementById("plateForm");
const templateSelector = document.getElementById("templateSelector");
const dynamicFormFields = document.getElementById("dynamicFormFields");

const platePreview = document.getElementById("platePreview");

const loadTemplateButton = document.getElementById("loadTemplate");
const downloadSvgButton = document.getElementById("downloadSvg");
const downloadPdfButton = document.getElementById("downloadPdf");

const csvFileInput = document.getElementById("csvFile");
const processCsvButton = document.getElementById("processCsv");
const downloadAllSvgButton = document.getElementById("downloadAllSvg");
const downloadCsvPdfButton = document.getElementById("downloadCsvPdf");
const downloadCsvTemplateButton = document.getElementById("downloadCsvTemplate");

const quickTableHead = document.getElementById("quickTableHead");
const quickRowsBody = document.getElementById("quickRows");
const downloadQuickZipButton = document.getElementById("downloadQuickZip");
const downloadQuickPdfButton = document.getElementById("downloadQuickPdf");
const clearQuickTableButton = document.getElementById("clearQuickTable");

let currentTemplateKey = "shantui";
let baseSvgText = "";
let finalSvgText = "";
let csvRows = [];

// ===============================
// CONFIGURACIÓN DE PLANTILLAS
// ===============================

const templates = {
  shantui: {
    name: "Plaqueta maquinaria SHANTUI",
    svg: "plaqueta_base.svg",
    fields: [
      {
        key: "MODELO",
        label: "Modelo",
        placeholder: "Ej: SE220LC",
        aliases: ["MODELO", "MODEL"]
      },
      {
        key: "POTENCIA",
        label: "Potencia del motor",
        placeholder: "Ej: 145",
        aliases: ["POTENCIA", "POTENCIA_DEL_MOTOR", "ENGINE_POWER", "ENGINE_POWER_KW"]
      },
      {
        key: "PESO",
        label: "Peso del equipo",
        placeholder: "Ej: 22800",
        aliases: ["PESO", "PESO_DEL_EQUIPO", "MASS", "WEIGHT"]
      },
      {
        key: "CAPACIDAD",
        label: "Capacidad",
        placeholder: "Ej: 0.95",
        aliases: ["CAPACIDAD", "CAPACITY"]
      },
      {
        key: "ANIO",
        label: "Año de manufacturación",
        placeholder: "Ej: 2024",
        aliases: ["ANIO", "ANO", "AÑO", "ANIO_DE_MANUFACTURACION", "ANO_DE_MANUFACTURACION", "AÑO_DE_MANUFACTURACION", "MANUFACTURING_YEAR", "YEAR"]
      },
      {
        key: "PIN",
        label: "Número de identificación de producto",
        placeholder: "Ej: 66SE22DKNR1018769",
        aliases: ["PIN", "NUMERO_DE_IDENTIFICACION_DE_PRODUCTO", "NUMERO_IDENTIFICACION_PRODUCTO", "PRODUCT_IDENTIFICATION_NUMBER", "PRODUCT_IDENTIFICATION"]
      }
    ],
    examples: [
      {
        MODELO: "SE220LC",
        POTENCIA: "145",
        PESO: "22800",
        CAPACIDAD: "0.95",
        ANIO: "2024",
        PIN: "66SE22DKNR1018769"
      },
      {
        MODELO: "SG19",
        POTENCIA: "140",
        PESO: "15400",
        CAPACIDAD: "3.7",
        ANIO: "2026",
        PIN: "ABC123456789"
      }
    ]
  },

  equipo_frontal: {
    name: "Plaqueta equipo frontal",
    svg: "plaqueta_equipo_frontal.svg",
    fields: [
      {
        key: "PRODUCTO",
        label: "Producto",
        placeholder: "Ej: BRAZO LARGO 18M KOMATSU PC350",
        aliases: ["PRODUCTO", "PRODUCT"]
      },
      {
        key: "SERIAL",
        label: "Serial",
        placeholder: "Ej: BRL202111MP595A-1",
        aliases: ["SERIAL", "SERIE"]
      },
      {
        key: "TIPO",
        label: "Tipo",
        placeholder: "Ej: BOOM",
        aliases: ["TIPO", "TYPE"]
      }
    ],
    examples: [
      {
        PRODUCTO: "BRAZO LARGO 18M KOMATSU PC350",
        SERIAL: "BRL202111MP595A-1",
        TIPO: "BOOM"
      },
      {
        PRODUCTO: "BALDE 1.2 M3 CAT 320",
        SERIAL: "BLD202607001",
        TIPO: "BUCKET"
      }
    ]
  }
};

// ===============================
// FUNCIONES AUXILIARES
// ===============================

function getCurrentTemplate() {
  return templates[currentTemplateKey];
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

function getFieldFallback(fieldKey, index = 0, isFirstField = false) {
  const key = String(fieldKey).toUpperCase();

  if (key.includes("PIN") || key.includes("SERIAL")) {
    return `SIN_${key}_${index + 1}`;
  }

  if (isFirstField) {
    return `SIN_${key}`;
  }

  return "";
}

function buildOutputFileName(plateData, index = null, extension = "svg") {
  const template = getCurrentTemplate();
  const firstField = template.fields[0]?.key || "ARCHIVO";
  const secondField = template.fields[1]?.key || "";

  const firstValue = cleanFileName(plateData[firstField] || "SIN_DATO");
  const secondValue = secondField ? cleanFileName(plateData[secondField] || "") : "";

  const indexPart = index !== null ? `${index + 1}_` : "";
  const secondPart = secondValue ? `_${secondValue}` : "";

  return `plaqueta_${currentTemplateKey}_${indexPart}${firstValue}${secondPart}.${extension}`;
}

function resetGeneratedState() {
  finalSvgText = "";
  csvRows = [];

  if (downloadSvgButton) downloadSvgButton.disabled = true;
  if (downloadPdfButton) downloadPdfButton.disabled = true;
  if (downloadAllSvgButton) downloadAllSvgButton.disabled = true;
  if (downloadCsvPdfButton) downloadCsvPdfButton.disabled = true;

  if (csvFileInput) {
    csvFileInput.value = "";
  }
}

// ===============================
// RENDER DE FORMULARIO DINÁMICO
// ===============================

function renderIndividualFields() {
  const template = getCurrentTemplate();

  dynamicFormFields.innerHTML = "";

  template.fields.forEach(function(field) {
    const wrapper = document.createElement("div");
    wrapper.className = "dynamic-field";

    wrapper.innerHTML = `
      <label for="input_${field.key}">${field.label}</label>
      <input
        type="text"
        id="input_${field.key}"
        data-field-key="${field.key}"
        placeholder="${field.placeholder}"
      />
    `;

    dynamicFormFields.appendChild(wrapper);
  });
}

function collectIndividualFormData() {
  const template = getCurrentTemplate();
  const firstExample = template.examples[0] || {};
  const data = {};

  template.fields.forEach(function(field, index) {
    const input = document.getElementById(`input_${field.key}`);
    const fallback = firstExample[field.key] || getFieldFallback(field.key, 0, index === 0);
    const value = input ? input.value.trim() : "";

    data[field.key] = value === "" ? fallback : value;
  });

  return data;
}

// ===============================
// TABLA RÁPIDA DINÁMICA
// ===============================

function renderQuickTable() {
  const template = getCurrentTemplate();

  quickTableHead.innerHTML = "";
  quickRowsBody.innerHTML = "";

  const headRow = document.createElement("tr");
  headRow.innerHTML = `<th>#</th>` + template.fields.map(field => `<th>${field.label}</th>`).join("");
  quickTableHead.appendChild(headRow);

  for (let i = 1; i <= 10; i++) {
    const row = document.createElement("tr");

    const cells = template.fields.map(function(field) {
      return `
        <td>
          <input
            type="text"
            data-field-key="${field.key}"
            placeholder="${field.placeholder}"
          />
        </td>
      `;
    }).join("");

    row.innerHTML = `<td>${i}</td>${cells}`;
    quickRowsBody.appendChild(row);
  }
}

function getQuickTableRows() {
  const template = getCurrentTemplate();
  const rows = document.querySelectorAll("#quickRows tr");
  const data = [];

  rows.forEach(function(row, rowIndex) {
    const plateData = {};
    let hasAnyValue = false;

    template.fields.forEach(function(field, fieldIndex) {
      const input = row.querySelector(`input[data-field-key="${field.key}"]`);
      const value = input ? input.value.trim() : "";

      if (value !== "") {
        hasAnyValue = true;
      }

      plateData[field.key] = value;
    });

    if (hasAnyValue) {
      template.fields.forEach(function(field, fieldIndex) {
        if (plateData[field.key] === "") {
          plateData[field.key] = getFieldFallback(field.key, rowIndex, fieldIndex === 0);
        }
      });

      data.push(plateData);
    }
  });

  return data;
}

// ===============================
// CARGAR PLANTILLA SVG
// ===============================

async function loadSvgTemplate(showAlert = false) {
  try {
    const template = getCurrentTemplate();
    const response = await fetch(template.svg);

    if (!response.ok) {
      throw new Error(`No se pudo cargar ${template.svg}`);
    }

    baseSvgText = await response.text();
    platePreview.innerHTML = baseSvgText;

    if (showAlert) {
      alert(`Plantilla cargada correctamente: ${template.name}`);
    }
  } catch (error) {
    console.error(error);
    alert("No se pudo cargar la plantilla SVG seleccionada. Revisa que el archivo exista en la raíz del proyecto.");
  }
}

function applyTemplate(templateKey, showAlert = false) {
  currentTemplateKey = templateKey;

  renderIndividualFields();
  renderQuickTable();
  resetGeneratedState();
  loadSvgTemplate(showAlert);
}

// ===============================
// REEMPLAZAR MARCADORES EN SVG
// ===============================

function insertVariableTexts(svgText, data) {
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgText, "image/svg+xml");

  const parserError = svgDoc.querySelector("parsererror");

  if (parserError) {
    alert("El SVG tiene un error de lectura. Revisa la plantilla exportada desde Illustrator.");
    return svgText;
  }

  const template = getCurrentTemplate();
  const replacements = {};

  template.fields.forEach(function(field) {
    let value = data[field.key] || "";

    if (field.key === "PIN") {
      value = `>${value}<`;
    }

    replacements[`{{${field.key}}}`] = value;
  });

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
// GENERAR PLAQUETA INDIVIDUAL
// ===============================

if (plateForm) {
  plateForm.addEventListener("submit", function(event) {
    event.preventDefault();

    if (!baseSvgText) {
      alert("Primero debes cargar la plantilla SVG.");
      return;
    }

    const plateData = collectIndividualFormData();

    finalSvgText = insertVariableTexts(baseSvgText, plateData);
    platePreview.innerHTML = finalSvgText;

    if (downloadSvgButton) downloadSvgButton.disabled = false;
    if (downloadPdfButton) downloadPdfButton.disabled = false;
  });
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

    const plateData = collectIndividualFormData();
    const fileName = buildOutputFileName(plateData, null, "svg");

    const svgBlob = new Blob([finalSvgText], {
      type: "image/svg+xml;charset=utf-8"
    });

    downloadBlob(svgBlob, fileName);
  });
}

// ===============================
// PDF ÚNICO / INDIVIDUAL
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
// DESCARGAR FORMATO CSV DINÁMICO
// ===============================

if (downloadCsvTemplateButton) {
  downloadCsvTemplateButton.addEventListener("click", function() {
    const template = getCurrentTemplate();
    const headers = template.fields.map(field => field.key).join(";");

    const rows = template.examples.map(function(example) {
      return template.fields.map(field => example[field.key] || "").join(";");
    });

    const csvTemplate = [headers, ...rows].join("\n");

    const csvBlob = new Blob(["\uFEFF" + csvTemplate], {
      type: "text/csv;charset=utf-8"
    });

    downloadBlob(csvBlob, `formato_${currentTemplateKey}.csv`);
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

      if (downloadAllSvgButton) downloadAllSvgButton.disabled = false;
      if (downloadCsvPdfButton) downloadCsvPdfButton.disabled = false;

      alert(`CSV procesado correctamente. Se encontraron ${csvRows.length} plaquetas.`);
      console.table(csvRows);
    };

    reader.readAsText(file, "UTF-8");
  });
}

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

function getPlateDataFromRow(row, index) {
  const template = getCurrentTemplate();
  const plateData = {};

  template.fields.forEach(function(field, fieldIndex) {
    plateData[field.key] = getRowValue(
      row,
      field.aliases || [field.key],
      getFieldFallback(field.key, index, fieldIndex === 0)
    );
  });

  return plateData;
}

// ===============================
// DESCARGAR ZIP DESDE CSV
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
      alert("No se pudo cargar JSZip.");
      return;
    }

    const zip = new JSZip();

    csvRows.forEach(function(row, index) {
      const plateData = getPlateDataFromRow(row, index);
      const svgContent = insertVariableTexts(baseSvgText, plateData);
      const fileName = buildOutputFileName(plateData, index, "svg");

      zip.file(fileName, svgContent);
    });

    const zipBlob = await zip.generateAsync({
      type: "blob"
    });

    downloadBlob(zipBlob, `plaquetas_${currentTemplateKey}_csv.zip`);

    alert(`ZIP generado correctamente con ${csvRows.length} plaquetas.`);
  });
}

// ===============================
// ZIP DESDE TABLA RÁPIDA
// ===============================

if (downloadQuickZipButton) {
  downloadQuickZipButton.addEventListener("click", async function() {
    if (!baseSvgText) {
      alert("Primero debes cargar la plantilla SVG.");
      return;
    }

    if (typeof JSZip === "undefined") {
      alert("No se pudo cargar JSZip.");
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
      const fileName = buildOutputFileName(plateData, index, "svg");

      zip.file(fileName, svgContent);
    });

    const zipBlob = await zip.generateAsync({
      type: "blob"
    });

    downloadBlob(zipBlob, `plaquetas_${currentTemplateKey}_tabla.zip`);

    alert(`ZIP generado correctamente con ${quickRows.length} plaquetas.`);
  });
}

// ===============================
// PDF DESDE TABLA RÁPIDA
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
// PDF DESDE CSV
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
// EVENTOS DE CAMBIO DE PLANTILLA
// ===============================

if (templateSelector) {
  templateSelector.addEventListener("change", function() {
    applyTemplate(templateSelector.value, true);
  });
}

if (loadTemplateButton) {
  loadTemplateButton.addEventListener("click", function() {
    loadSvgTemplate(true);
  });
}

// ===============================
// INICIO
// ===============================

window.addEventListener("DOMContentLoaded", function() {
  if (templateSelector) {
    currentTemplateKey = templateSelector.value;
  }

  renderIndividualFields();
  renderQuickTable();
  loadSvgTemplate(false);
});
