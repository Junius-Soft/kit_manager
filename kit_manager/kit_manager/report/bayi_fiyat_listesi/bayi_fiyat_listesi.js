// Copyright (c) 2024, kit_management and contributors
// For license information, please see license.txt

frappe.query_reports["Bayi Fiyat Listesi"] = {
	"filters": [
		{
			"fieldname": "item_code",
			"label": __("Ürün Kodu"),
			"fieldtype": "Link",
			"options": "Item",
			"default": "",
			"description": __("Ürün kodu ile filtrele")
		},
		{
			"fieldname": "item_name",
			"label": __("Ürün Adı"),
			"fieldtype": "Link",
			"options": "Item",
			"default": "",
			"description": __("Ürün adı ile filtrele"),
			"get_query": function() {
				return {
					filters: {
						"disabled": 0
					}
				};
			}
		},
		{
			"fieldname": "item_group",
			"label": __("Ürün Grubu"),
			"fieldtype": "Link",
			"options": "Item Group",
			"default": "",
			"description": __("Ürün grubu ile filtrele")
		},
		{
			"fieldname": "kit",
			"label": __("Kit"),
			"fieldtype": "Check",
			"default": 0,
			"description": __("Sadece kit ürünlerini göster")
		}
	],
	
	"formatter": function(value, row, column, data, default_formatter) {
		value = default_formatter(value, row, column, data);
		return value;
	},
	
	"get_datatable_options": function(options) {
		const baseOptions = options || {};
		const columnDefs = baseOptions.columnDefs || [];
		
		// İlk 4 sütunu (Ürün Kodu, Ürün Adı, Ürün Grubu, Birim) sola yasla
		// Column index'leri: 0, 1, 2, 3 (row number hariç)
		columnDefs.push({ 
			targets: [1, 2, 3, 4], // Row number (0) hariç, sonraki 4 sütun
			className: 'text-left'
		});
		
		return Object.assign(baseOptions, {
			columnDefs: columnDefs
		});
	}
};

// Sütun hizalamasını uygula
function applyColumnAlignment(report) {
	if (!report || !report.$result) return;
	
	// Tablo başlıklarını ve hücrelerini bul
	const $table = report.$result.find("table");
	if ($table.length === 0) return;
	
	// İlk 4 sütunu (Ürün Kodu, Ürün Adı, Ürün Grubu, Birim) sola yasla
	// Row number sütunu (0) hariç, sonraki 4 sütun (1, 2, 3, 4)
	const leftAlignIndices = [1, 2, 3, 4];
	
	// Başlıkları hizala
	$table.find("thead th").each(function(index) {
		if (leftAlignIndices.includes(index)) {
			$(this).addClass("text-left").removeClass("text-right");
		}
	});
	
	// Hücreleri hizala
	$table.find("tbody tr").each(function() {
		$(this).find("td").each(function(index) {
			if (leftAlignIndices.includes(index)) {
				$(this).addClass("text-left").removeClass("text-right").css("text-align", "left");
			}
		});
	});
}

