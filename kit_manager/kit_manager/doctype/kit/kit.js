// Copyright (c) 2024, kit_management and contributors
// For license information, please see license.txt

// Global listener for Kit Item changes (works for both inline grid and popup form)
frappe.model.on("Kit Item", "item_code", function(fieldname, value, doc) {
	if (doc.parenttype !== "Kit" || !value || !doc.item_code) {
		return;
	}
	
	let frm = cur_frm;
	if (!frm || frm.doctype !== "Kit" || frm.doc.name !== doc.parent) {
		const forms = frappe.ui.form.get_forms();
		for (let form_name in forms) {
			const form = forms[form_name];
			if (form.doctype === "Kit" && form.doc.name === doc.parent) {
				frm = form;
				break;
			}
		}
	}
	
	if (!frm) {
		return;
	}
	
	frappe.db.get_value(
		"Item",
		doc.item_code,
		["item_name", "standard_rate", "stock_uom"],
		function (r) {
			if (!r) {
				return;
			}
			
			const cdt = doc.doctype;
			const cdn = doc.name;
			
			frappe.model.set_value(cdt, cdn, "item_name", r.item_name || "");
			frappe.model.set_value(cdt, cdn, "uom", r.stock_uom || "");
			
			let rate = flt(r.standard_rate || 0);
			const qty = flt(doc.quantity || 1);
			
			if (!rate) {
				frappe.db.get_value(
					"Item Price",
					{
						"item_code": doc.item_code,
						"price_list": "Standard Buying"
					},
					"price_list_rate",
					function(price_r) {
						let item_rate = 0;
						if (price_r && price_r.price_list_rate) {
							item_rate = flt(price_r.price_list_rate);
						}
						
						frappe.model.set_value(cdt, cdn, "quantity", qty);
						frappe.model.set_value(cdt, cdn, "rate", item_rate);
						frappe.model.set_value(cdt, cdn, "amount", qty * item_rate);
						
						setTimeout(function() {
							frm.refresh_field("items");
							frm.trigger("calculate_totals");
						}, 200);
					}
				);
			} else {
				frappe.model.set_value(cdt, cdn, "quantity", qty);
				frappe.model.set_value(cdt, cdn, "rate", rate);
				frappe.model.set_value(cdt, cdn, "amount", qty * rate);
				
				setTimeout(function() {
					frm.refresh_field("items");
					frm.trigger("calculate_totals");
				}, 200);
			}
		}
	);
});

frappe.ui.form.on("Kit", {
	onload: function(frm) {
		frm.set_query("kit_name", function() {
			return {
				filters: {
					"custom_kit": 1
				}
			};
		});
	},
	
	refresh: function (frm) {
		frm.set_query("kit_name", function() {
			return {
				filters: {
					"custom_kit": 1
				}
			};
		});
		
		// Add dynamic listener to grid inputs
		if (frm.fields_dict.items && frm.fields_dict.items.grid) {
			// Remove old listeners to prevent duplicates
			frm.fields_dict.items.grid.wrapper.off('blur', 'input[data-fieldname="quantity"], input[data-fieldname="rate"]');
			
			// Add blur listener (triggers when user leaves the field)
			frm.fields_dict.items.grid.wrapper.on('blur', 'input[data-fieldname="quantity"], input[data-fieldname="rate"]', function(e) {
				const $input = $(e.target);
				const fieldname = $input.attr('data-fieldname');
				const $row = $input.closest('.grid-row');
				const row_name = $row.attr('data-name');
				
				if (row_name && fieldname) {
					const row = locals["Kit Item"][row_name];
					if (row) {
						const qty = flt(row.quantity);
						const rate = flt(row.rate);
						const amount = qty * rate;
						
						frappe.model.set_value("Kit Item", row_name, "amount", amount);
						
						setTimeout(function() {
							frm.refresh_field("items");
							frm.trigger("calculate_totals");
						}, 50);
					}
				}
			});
		}
		
		if (frm.is_new()) {
			if (frm.doc.discount_percentage == null) {
				frm.set_value("discount_percentage", 0);
			}
			if ((frm.doc.items || []).length) {
				frm.trigger("calculate_totals");
			}
		}
	},
	
	items_add: function (frm) {
		// Item code event will handle when item is selected
	},

	items_remove: function (frm) {
		frm.trigger("calculate_totals");
	},
	
	items_on_form_rendered: function(frm, cdt, cdn) {
		const grid_row = frm.fields_dict.items.grid.grid_rows_by_docname[cdn];
		
		if (!grid_row) {
			return;
		}
		
		// Add listener to quantity field
		if (grid_row.fields_dict.quantity && grid_row.fields_dict.quantity.$input) {
			grid_row.fields_dict.quantity.$input.off('blur.calc_amount');
			grid_row.fields_dict.quantity.$input.on('blur.calc_amount', function() {
				const row = locals[cdt][cdn];
				const qty = flt($(this).val());
				const rate = flt(row.rate);
				const amount = qty * rate;
				
				frappe.model.set_value(cdt, cdn, "amount", amount);
				setTimeout(function() {
					frm.refresh_field("items");
					frm.trigger("calculate_totals");
				}, 50);
			});
		}
		
		// Add listener to rate field
		if (grid_row.fields_dict.rate && grid_row.fields_dict.rate.$input) {
			grid_row.fields_dict.rate.$input.off('blur.calc_amount');
			grid_row.fields_dict.rate.$input.on('blur.calc_amount', function() {
				const row = locals[cdt][cdn];
				const qty = flt(row.quantity);
				const rate = flt($(this).val());
				const amount = qty * rate;
				
				frappe.model.set_value(cdt, cdn, "amount", amount);
				setTimeout(function() {
					frm.refresh_field("items");
					frm.trigger("calculate_totals");
				}, 50);
			});
		}
	},
	
	items_quantity: function(frm, cdt, cdn) {
		const row = locals[cdt][cdn];
		const qty = flt(row.quantity);
		const rate = flt(row.rate);
		const amount = qty * rate;
		
		frappe.model.set_value(cdt, cdn, "amount", amount);
		
		setTimeout(function() {
			frm.refresh_field("items");
			frm.trigger("calculate_totals");
		}, 100);
	},
	
	items_rate: function(frm, cdt, cdn) {
		const row = locals[cdt][cdn];
		const qty = flt(row.quantity);
		const rate = flt(row.rate);
		const amount = qty * rate;
		
		frappe.model.set_value(cdt, cdn, "amount", amount);
		
		setTimeout(function() {
			frm.refresh_field("items");
			frm.trigger("calculate_totals");
		}, 100);
	},
	
	items_item_code: function (frm, cdt, cdn) {
		const row = locals[cdt][cdn];
		
		if (!row.item_code) {
			return;
		}
		
		frappe.db.get_value(
			"Item",
			row.item_code,
			["item_name", "standard_rate", "stock_uom"],
			function (r) {
				if (!r) {
					return;
				}
				
				frappe.model.set_value(cdt, cdn, "item_name", r.item_name || "");
				frappe.model.set_value(cdt, cdn, "uom", r.stock_uom || "");
				
				let rate = flt(r.standard_rate || 0);
				const qty = flt(row.quantity || 1);
				
				if (!rate) {
					frappe.db.get_value(
						"Item Price",
						{
							"item_code": row.item_code,
							"price_list": "Standard Buying"
						},
						"price_list_rate",
						function(price_r) {
							let item_rate = 0;
							if (price_r && price_r.price_list_rate) {
								item_rate = flt(price_r.price_list_rate);
							}
							
							frappe.model.set_value(cdt, cdn, "quantity", qty);
							frappe.model.set_value(cdt, cdn, "rate", item_rate);
							frappe.model.set_value(cdt, cdn, "amount", qty * item_rate);
							
							setTimeout(function() {
								frm.refresh_field("items");
								frm.trigger("calculate_totals");
							}, 200);
						}
					);
				} else {
					frappe.model.set_value(cdt, cdn, "quantity", qty);
					frappe.model.set_value(cdt, cdn, "rate", rate);
					frappe.model.set_value(cdt, cdn, "amount", qty * rate);
					
					setTimeout(function() {
						frm.refresh_field("items");
						frm.trigger("calculate_totals");
					}, 200);
				}
			}
		);
	},
	
	discount_percentage: function (frm) {
		frm.trigger("calculate_totals");
	},
	
	tax_percentage: function (frm) {
		frm.trigger("calculate_totals");
	},
	
	profit_percentage: function (frm) {
		frm.trigger("calculate_totals");
	},
	
	overhead_percentage: function (frm) {
		frm.trigger("calculate_totals");
	},
	
	labor_percentage: function (frm) {
		frm.trigger("calculate_totals");
	},
	
	yearend_bonus_percentage: function (frm) {
		frm.trigger("calculate_totals");
	},
	
	calculate_totals: function (frm) {
		let total_amount = 0;
		$.each(frm.doc.items || [], function(i, item) {
			let qty = flt(item.quantity);
			let rate = flt(item.rate);
			
			if (qty && rate) {
				item.amount = qty * rate;
				total_amount += item.amount;
			} else {
				item.amount = 0;
			}
		});
		
		frm.set_value("total_amount", total_amount);
		
		let discount_amount = 0;
		if (frm.doc.discount_percentage) {
			discount_amount = total_amount * (frm.doc.discount_percentage / 100);
		}
		frm.set_value("discount_amount", discount_amount);
		
		let amount_after_discount = total_amount - discount_amount;
		
		let tax_amount = 0;
		if (frm.doc.tax_percentage) {
			tax_amount = amount_after_discount * (frm.doc.tax_percentage / 100);
		}
		frm.set_value("tax_amount", tax_amount);
		
		let grand_total = amount_after_discount + tax_amount;
		frm.set_value("grand_total", grand_total);
		
		let base_for_additional_costs = grand_total;
		
		let profit_pct = flt(frm.doc.profit_percentage || 0);
		let profit_amount = profit_pct ? base_for_additional_costs * (profit_pct / 100) : 0;
		frm.set_value("profit_amount", profit_amount);
		
		let overhead_pct = flt(frm.doc.overhead_percentage || 0);
		let overhead_amount = overhead_pct ? base_for_additional_costs * (overhead_pct / 100) : 0;
		frm.set_value("overhead_amount", overhead_amount);
		
		let labor_pct = flt(frm.doc.labor_percentage || 0);
		let labor_amount = labor_pct ? base_for_additional_costs * (labor_pct / 100) : 0;
		frm.set_value("labor_amount", labor_amount);
		
		let yearend_bonus_pct = flt(frm.doc.yearend_bonus_percentage || 0);
		let yearend_bonus_amount = yearend_bonus_pct ? base_for_additional_costs * (yearend_bonus_pct / 100) : 0;
		frm.set_value("yearend_bonus_amount", yearend_bonus_amount);
		
		let final_total = grand_total + profit_amount + overhead_amount + labor_amount + yearend_bonus_amount;
		frm.set_value("final_total", final_total);
		frm.set_value("kit_price", final_total);
		
		frm.refresh_field("items");
		frm.refresh_field("total_amount");
		frm.refresh_field("discount_amount");
		frm.refresh_field("tax_amount");
		frm.refresh_field("grand_total");
		frm.refresh_field("profit_amount");
		frm.refresh_field("overhead_amount");
		frm.refresh_field("labor_amount");
		frm.refresh_field("yearend_bonus_amount");
		frm.refresh_field("final_total");
		frm.refresh_field("kit_price");
	}
});
