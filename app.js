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
