// Copyright (c) 2024, kit_management and contributors
// For license information, please see license.txt

frappe.ui.form.on("Kit Item", {
	item_code: function (frm, cdt, cdn) {
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
							
							let parent_frm = frm || cur_frm;
							if (parent_frm && parent_frm.doc.doctype === "Kit") {
								setTimeout(function() {
									parent_frm.refresh_field("items");
									parent_frm.trigger("calculate_totals");
								}, 200);
							}
						}
					);
				} else {
					frappe.model.set_value(cdt, cdn, "quantity", qty);
					frappe.model.set_value(cdt, cdn, "rate", rate);
					frappe.model.set_value(cdt, cdn, "amount", qty * rate);
					
					let parent_frm = frm || cur_frm;
					if (parent_frm && parent_frm.doc.doctype === "Kit") {
						setTimeout(function() {
							parent_frm.refresh_field("items");
							parent_frm.trigger("calculate_totals");
						}, 200);
					}
				}
			}
		);
	},

	quantity: function (frm, cdt, cdn) {
		const row = locals[cdt][cdn];
		const qty = flt(row.quantity);
		const rate = flt(row.rate);
		const amount = qty * rate;

		frappe.model.set_value(cdt, cdn, "amount", amount);

		let parent_frm = frm || cur_frm;
		if (parent_frm && parent_frm.doc.doctype === "Kit") {
			parent_frm.refresh_field("items");
			parent_frm.trigger("calculate_totals");
		}
	},

	rate: function (frm, cdt, cdn) {
		const row = locals[cdt][cdn];
		const qty = flt(row.quantity);
		const rate = flt(row.rate);
		const amount = qty * rate;

		frappe.model.set_value(cdt, cdn, "amount", amount);

		let parent_frm = frm || cur_frm;
		if (parent_frm && parent_frm.doc.doctype === "Kit") {
			parent_frm.refresh_field("items");
			parent_frm.trigger("calculate_totals");
		}
	},
});
