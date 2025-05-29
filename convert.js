var Csv2Html2Excel = Csv2Html2Excel || {};

Csv2Html2Excel = {
    init: function (options) {
        options = options || {};
        var csv_path = options.csv_path || "";
        var el = options.element || "table-container";
        var allow_download = options.allow_download || false;
        var csv_options = options.csv_options || {};
        var datatables_options = options.datatables_options || {};

        var compare_col1 = window.CsvViewerConfig.compareCol1 || 2;
        var compare_col2 = window.CsvViewerConfig.compareCol2 || 3;
        var highlight_target_col = window.CsvViewerConfig.highlightTargetCol || compare_col2;
        var deprecatedLabel = window.CsvViewerConfig.deprecatedLabel || "DPRCTD";
        var newLabel = window.CsvViewerConfig.newLabel || "NEW";

        var custom_formatting = options.custom_formatting || [];
        var customTemplates = {};
        $.each(custom_formatting, function (i, v) {
            var colIdx = v[0];
            var func = v[1];
            customTemplates[colIdx] = func;
        });

        var $table = $("<table class='table table-striped table-condensed' id='" + el + "-table'></table>");
        var $containerElement = $("#" + el);
        $containerElement.empty().append($table);

        $.when($.get(csv_path)).then(function (data) {
            var csvData = $.csv.toArrays(data, csv_options);

            var $tableHead = $("<thead></thead>");
            var csvHeaderRow = csvData[0];
            var $tableHeadRow = $("<tr></tr>");
            $tableHeadRow.append($("<th></th>").text("S. No."));
            for (var headerIdx = 0; headerIdx < csvHeaderRow.length; headerIdx++) {
                $tableHeadRow.append($("<th></th>").text(csvHeaderRow[headerIdx]));
            }
            $tableHeadRow.append($("<th></th>").text("Notes"));
            $tableHeadRow.append($("<th></th>").text("Accept"));
            $tableHeadRow.append($("<th></th>").text("Exclude"));
            $tableHead.append($tableHeadRow);
            $table.append($tableHead);

            var $tableBody = $("<tbody></tbody>");
            for (var rowIdx = 1; rowIdx < csvData.length; rowIdx++) {
                var $tableBodyRow = $("<tr></tr>");
                var row = csvData[rowIdx];

                $tableBodyRow.append($("<td></td>").text(rowIdx));

                for (var colIdx = 0; colIdx < csvHeaderRow.length; colIdx++) {
                    var $tableBodyRowTd = $("<td></td>");

                    if (colIdx === compare_col1 && row[compare_col2]?.trim() === "") {
                        var value = row[colIdx] || "";
                        $tableBodyRowTd.html(value + " <span style='color:red'>(" + deprecatedLabel + ")</span>");
                    } else if (colIdx === compare_col2 && row[compare_col1]?.trim() === "") {
                        var value = row[colIdx] || "";
                        $tableBodyRowTd.html(value + " <span style='color:green'>(" + newLabel + ")</span>");
                    } else if (colIdx === highlight_target_col && row.length > Math.max(compare_col1, compare_col2)) {
                        var compareValue = row[compare_col2] || "";
                        if (compareValue.trim() === "") {
                            $tableBodyRowTd.html("");
                        } else {
                            var diff = Diff.diffWords(row[compare_col1], row[compare_col2]);
                            var formatted = "";
                            diff.forEach(function (part) {
                                if (part.added) {
                                    formatted += "<span style='color:green; font-weight:bold'>" + part.value + "</span>";
                                } else if (part.removed) {
                                    formatted += "<span style='color:red; text-decoration:line-through; font-weight:bold'>" + part.value + "</span>";
                                } else {
                                    formatted += part.value;
                                }
                            });
                            $tableBodyRowTd.html(formatted);
                        }
                    } else {
                        var cellTemplateFunc = customTemplates[colIdx];
                        if (cellTemplateFunc) {
                            $tableBodyRowTd.html(cellTemplateFunc(row[colIdx]));
                        } else {
                            $tableBodyRowTd.text(row[colIdx]);
                        }
                    }
                    $tableBodyRow.append($tableBodyRowTd);
                }

                var noteKey = `note_${rowIdx}`;
                var savedNote = localStorage.getItem(noteKey) || "";
                var $noteCell = $("<td></td>").html(`<textarea class='form-control note-input' rows='1' data-row='${rowIdx}'>${savedNote}</textarea>`);
                $tableBodyRow.append($noteCell);

                var acceptKey = `accept_${rowIdx}`;
                var isChecked = localStorage.getItem(acceptKey) === 'true';
                var $acceptCell = $("<td style='text-align:center;'></td>").html(
                    `<input type='checkbox' class='accept-checkbox' data-row='${rowIdx}' ${isChecked ? 'checked' : ''}>`
                );
                $tableBodyRow.append($acceptCell);

                var excludeKey = `exclude_${rowIdx}`;
                var isExcluded = localStorage.getItem(excludeKey) === 'true';
                var $excludeCell = $("<td style='text-align:center;'></td>").html(
                    `<input type='checkbox' class='exclude-checkbox' data-row='${rowIdx}' ${isExcluded ? 'checked' : ''}>`
                );
                $tableBodyRow.append($excludeCell);

                $tableBody.append($tableBodyRow);
            }

            $table.append($tableBody);
            $table.DataTable(datatables_options);

            if (allow_download) {
                $("#download-container").html(`
                    <button id='download-xls' class='btn btn-success btn-sm mr-2'><i class='fas fa-file-excel'></i> Download Excel</button>
                    <button id='show-exclusion' class='btn btn-warning btn-sm'><i class='fas fa-table'></i> Exclusion Table</button>
                `);

                $("#download-xls").on("click", function () {
                    const originalTable = document.getElementById(el + "-table");
                    const clonedTable = originalTable.cloneNode(true);

                    $(clonedTable).find("tr").each(function () {
                        const $cells = $(this).find("td, th");
                        const $acceptCell = $cells.eq(-2);
                        const $excludeCell = $cells.last();

                        const checkboxAccept = $acceptCell.find("input[type='checkbox']");
                        const checkboxExclude = $excludeCell.find("input[type='checkbox']");

                        if (checkboxAccept.length) $acceptCell.text(checkboxAccept.prop("checked") ? "Yes" : "No");
                        if (checkboxExclude.length) $excludeCell.text(checkboxExclude.prop("checked") ? "Yes" : "No");

                        for (let i = 0; i < $cells.length; i++) {
                            const noteInput = $cells.eq(i).find("textarea");
                            if (noteInput.length) {
                                $cells.eq(i).text(noteInput.val());
                                break;
                            }
                        }
                    });

                    const tableHtml = clonedTable.outerHTML;
                    const blob = new Blob([`
                        <html xmlns:x="urn:schemas-microsoft-com:office:excel">
                            <head>
                                <!--[if gte mso 9]><xml>
                                    <x:ExcelWorkbook>
                                        <x:ExcelWorksheets>
                                            <x:ExcelWorksheet>
                                                <x:Name>Sheet1</x:Name>
                                                <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
                                            </x:ExcelWorksheet>
                                        </x:ExcelWorksheets>
                                    </x:ExcelWorkbook>
                                </xml><![endif]-->
                            </head>
                            <body>${tableHtml}</body>
                        </html>
                    `], { type: "application/vnd.ms-excel" });

                    const link = document.createElement("a");
                    link.href = URL.createObjectURL(blob);
                    const title = document.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                    link.download = `${title}.xls`;
                    link.click();
                });

                $("#show-exclusion").on("click", function () {
                    const includedColumns = window.ExclusionTableConfig?.includedColumns || [];

                    let exclusionRows = [];
                    $("#" + el + "-table tbody tr").each(function () {
                        const $row = $(this);
                        const rowId = $row.find(".exclude-checkbox").data("row");
                        const isExcluded = localStorage.getItem(`exclude_${rowId}`) === "true";
                        if (isExcluded) {
                            let cells = [];
                            $row.find("td").each(function (i, td) {
                                if (includedColumns.includes(i)) {
                                    cells.push($(td).text().trim());
                                }
                            });
                            exclusionRows.push(cells);
                        }
                    });

                    if (exclusionRows.length === 0) {
                        alert("No excluded rows found.");
                        return;
                    }

                    let html = "<table class='table table-bordered mt-3'><thead><tr>";
                    includedColumns.forEach(i => {
                        const header = $("#" + el + "-table thead th").eq(i).text();
                        html += `<th>${header}</th>`;
                    });
                    html += "</tr></thead><tbody>";
                    exclusionRows.forEach(row => {
                        html += "<tr>" + row.map(cell => `<td>${cell}</td>`).join("") + "</tr>";
                    });
                    html += "</tbody></table>";

                    const $modal = $("<div class='modal fade' tabindex='-1'><div class='modal-dialog modal-lg'><div class='modal-content'><div class='modal-header'><h5 class='modal-title'>Exclusion Table</h5><button type='button' class='btn-close' data-bs-dismiss='modal'></button></div><div class='modal-body'>" + html + "</div></div></div></div>");
                    $("body").append($modal);
                    const bsModal = new bootstrap.Modal($modal[0]);
                    bsModal.show();

                    $modal.on('hidden.bs.modal', function () {
                        $(this).remove();
                    });
                });
            }

            $(document).on('input', '.note-input', function () {
                var rowId = $(this).data('row');
                localStorage.setItem(`note_${rowId}`, $(this).val());
            });

            $(document).on('change', '.accept-checkbox', function () {
                var rowId = $(this).data('row');
                localStorage.setItem(`accept_${rowId}`, $(this).is(':checked'));
            });

            $(document).on('change', '.exclude-checkbox', function () {
                var rowId = $(this).data('row');
                localStorage.setItem(`exclude_${rowId}`, $(this).is(':checked'));
            });
        });
    }
};
