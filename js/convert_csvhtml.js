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
            $tableHeadRow.append($("<th style='border-right: 1px solid #ddd'></th>").text("Accept"));
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
                    } else if (csvHeaderRow[colIdx].toLowerCase() === "notes") {
                        var noteKey = `note_${rowIdx}`;
                        var savedNote = localStorage.getItem(noteKey) || (row[colIdx] || "");
                        $tableBodyRowTd.html(`<input type='text' class='form-control note-input' data-row='${rowIdx}' value='${savedNote}'>`);
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

                var acceptKey = `accept_${rowIdx}`;
                var isChecked = localStorage.getItem(acceptKey) === 'true';
                var $acceptCell = $("<td style='text-align:center; border-right: 1px solid #ddd'></td>").html(
                    `<input type='checkbox' class='accept-checkbox' data-row='${rowIdx}' ${isChecked ? 'checked' : ''}>`
                );
                $tableBodyRow.append($acceptCell);
                $tableBody.append($tableBodyRow);
            }

            $table.append($tableBody);
            $table.DataTable(datatables_options);

            if (allow_download) {
                $("#download-container").html(
                    "<button id='download-xls' class='btn btn-success btn-sm'><i class='fas fa-file-excel'></i> Download Excel</button>"
                );

                $("#download-xls").on("click", function () {
                    const originalTable = document.getElementById(el + "-table");
                    const clonedTable = originalTable.cloneNode(true);

                    $(clonedTable).find("tr").each(function () {
                        const $cells = $(this).find("td, th");
                        const $acceptCell = $cells.last();
                        const checkbox = $acceptCell.find("input[type='checkbox']");
                        if (checkbox.length) {
                            $acceptCell.text(checkbox.prop("checked") ? "Yes" : "No");
                        }

                        for (let i = 0; i < $cells.length; i++) {
                            const noteInput = $cells.eq(i).find("input[type='text']");
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
            }

            // Save Notes on input
            $(document).on('input', '.note-input', function () {
                var rowId = $(this).data('row');
                localStorage.setItem(`note_${rowId}`, $(this).val());
            });

            // Save Accept checkbox on toggle
            $(document).on('change', '.accept-checkbox', function () {
                var rowId = $(this).data('row');
                localStorage.setItem(`accept_${rowId}`, $(this).is(':checked'));
            });
        });
    }
};
