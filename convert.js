
html
Copy
Edit
<script>
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    const formattedDate = `${dd}-${mm}-${yyyy}`;

    document.title = `${window.CsvViewerConfig.pageTitle} - ${formattedDate}`;
    document.querySelector("#page-title-header").textContent = `${window.CsvViewerConfig.pageTitle} - ${formattedDate}`;

    Csv2Html2Excel.init({
        csv_path: window.CsvViewerConfig.csvFilePath,
        element: "table-container",
        allow_download: true,
        csv_options: {
            separator: ",",
            delimiter: '"'
        },
        datatables_options: {
            paging: false
        },
        custom_formatting: []
    });

    //Add this just below init()
    $(document).on("click", "#show-exclusion", function () {
        const includedColumns = window.ExclusionTableConfig.includedColumns;
        const $rows = $("#table-container-table tbody tr").filter(function () {
            return $(this).find(".exclude-checkbox").is(":checked");
        });

        let html = "<table class='table table-sm table-bordered'><thead><tr>";
        includedColumns.forEach(idx => {
            const header = $("#table-container-table thead th").eq(idx).text();
            html += `<th>${header}</th>`;
        });
        html += "</tr></thead><tbody>";

        $rows.each(function () {
            html += "<tr>";
            includedColumns.forEach(idx => {
                const cell = $(this).find("td").eq(idx).html();
                html += `<td>${cell}</td>`;
            });
            html += "</tr>";
        });

        html += "</tbody></table>";
        $("#exclusion-modal-body").html(html);
        $("#exclusionModal").modal("show");
    });
</script>

Just before the closing </body> tag in index.html:

html
Copy
Edit
<!-- Exclusion Modal -->
<div class="modal fade" id="exclusionModal" tabindex="-1" role="dialog">
  <div class="modal-dialog modal-lg" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Excluded Rows</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body" id="exclusion-modal-body">
        <!-- Content will be populated by JS -->
      </div>
    </div>
  </div>
</div>
